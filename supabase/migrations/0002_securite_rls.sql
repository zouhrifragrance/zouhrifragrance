-- =============================================================================
-- ZOUHRI FRAGRANCE - Migration 0002 : Securite (RLS), roles et profils
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Fonctions utilitaires de verification des droits
-- SECURITY DEFINER : elles lisent profils_utilisateurs en contournant RLS,
-- ce qui evite les recursions de politiques.
-- -----------------------------------------------------------------------------
create or replace function est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profils_utilisateurs
    where id = auth.uid()
      and est_actif = true
      and role = 'ADMIN'
  );
$$;

create or replace function est_gestionnaire()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profils_utilisateurs
    where id = auth.uid()
      and est_actif = true
      and role in ('ADMIN', 'GESTIONNAIRE')
  );
$$;

-- Lecture reservee au personnel (tout role actif)
create or replace function est_personnel()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profils_utilisateurs
    where id = auth.uid()
      and est_actif = true
  );
$$;

grant execute on function est_admin() to authenticated, anon;
grant execute on function est_gestionnaire() to authenticated, anon;
grant execute on function est_personnel() to authenticated, anon;

-- -----------------------------------------------------------------------------
-- Creation automatique du profil lors de la creation d'un compte Auth
-- Le role est fourni dans les metadonnees (raw_user_meta_data.role).
-- -----------------------------------------------------------------------------
create or replace function creer_profil_utilisateur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_demande text;
begin
  role_demande := coalesce(new.raw_user_meta_data ->> 'role', 'LECTEUR');
  if role_demande not in ('ADMIN', 'GESTIONNAIRE', 'LECTEUR') then
    role_demande := 'LECTEUR';
  end if;

  insert into profils_utilisateurs (id, nom_complet, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nom_complet', new.email, ''),
    role_demande::role_utilisateur
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_creer_profil on auth.users;
create trigger trg_auth_creer_profil
  after insert on auth.users
  for each row execute function creer_profil_utilisateur();

-- -----------------------------------------------------------------------------
-- Activation de RLS sur toutes les tables metier
-- -----------------------------------------------------------------------------
alter table roles_utilisateurs enable row level security;
alter table profils_utilisateurs enable row level security;
alter table categories enable row level security;
alter table produits enable row level security;
alter table images_produits enable row level security;
alter table variantes_produit enable row level security;
alter table commandes enable row level security;
alter table lignes_commande enable row level security;
alter table historique_statuts_commande enable row level security;
alter table jetons_suivi_commande enable row level security;
alter table mouvements_stock enable row level security;
alter table promotions enable row level security;
alter table utilisations_promotions enable row level security;
alter table inscriptions_newsletter enable row level security;
alter table parametres_boutique enable row level security;
alter table journaux_activite_administration enable row level security;

-- -----------------------------------------------------------------------------
-- Profils utilisateurs : chaque utilisateur lit son profil ; l'admin lit tout.
-- -----------------------------------------------------------------------------
create policy "profils_lecture_soi" on profils_utilisateurs
  for select using (id = auth.uid() or est_admin());

create policy "profils_maj_admin" on profils_utilisateurs
  for update using (est_admin()) with check (est_admin());

create policy "profils_insert_admin" on profils_utilisateurs
  for insert with check (est_admin());

-- -----------------------------------------------------------------------------
-- Roles : consultation par le personnel
-- -----------------------------------------------------------------------------
create policy "roles_lecture_personnel" on roles_utilisateurs
  for select using (est_personnel());

create policy "roles_admin" on roles_utilisateurs
  for all using (est_admin()) with check (est_admin());

-- -----------------------------------------------------------------------------
-- Categories : lecture publique des categories actives ; ecriture gestionnaire.
-- -----------------------------------------------------------------------------
create policy "categories_lecture_publique" on categories
  for select using (est_active = true or est_personnel());

create policy "categories_ecriture_gestionnaire" on categories
  for all using (est_gestionnaire()) with check (est_gestionnaire());

-- -----------------------------------------------------------------------------
-- Produits : lecture publique des produits publies ; ecriture gestionnaire.
-- -----------------------------------------------------------------------------
create policy "produits_lecture_publique" on produits
  for select using (est_publie = true or est_personnel());

create policy "produits_ecriture_gestionnaire" on produits
  for all using (est_gestionnaire()) with check (est_gestionnaire());

-- -----------------------------------------------------------------------------
-- Images de produits : liees a la visibilite du produit.
-- -----------------------------------------------------------------------------
create policy "images_lecture_publique" on images_produits
  for select using (
    est_personnel()
    or exists (
      select 1 from produits p
      where p.id = images_produits.produit_id and p.est_publie = true
    )
  );

create policy "images_ecriture_gestionnaire" on images_produits
  for all using (est_gestionnaire()) with check (est_gestionnaire());

-- -----------------------------------------------------------------------------
-- Variantes : liees a la visibilite du produit.
-- -----------------------------------------------------------------------------
create policy "variantes_lecture_publique" on variantes_produit
  for select using (
    est_personnel()
    or exists (
      select 1 from produits p
      where p.id = variantes_produit.produit_id and p.est_publie = true
    )
  );

create policy "variantes_ecriture_gestionnaire" on variantes_produit
  for all using (est_gestionnaire()) with check (est_gestionnaire());

-- -----------------------------------------------------------------------------
-- Commandes : AUCUN acces public en lecture directe.
-- La creation passe exclusivement par la fonction RPC creer_commande.
-- -----------------------------------------------------------------------------
create policy "commandes_lecture_personnel" on commandes
  for select using (est_personnel());

create policy "commandes_maj_gestionnaire" on commandes
  for update using (est_gestionnaire()) with check (est_gestionnaire());

create policy "commandes_suppression_admin" on commandes
  for delete using (est_admin());

-- -----------------------------------------------------------------------------
-- Lignes de commande, historique, jetons : personnel uniquement.
-- -----------------------------------------------------------------------------
create policy "lignes_lecture_personnel" on lignes_commande
  for select using (est_personnel());

create policy "historique_lecture_personnel" on historique_statuts_commande
  for select using (est_personnel());

create policy "historique_ecriture_gestionnaire" on historique_statuts_commande
  for insert with check (est_gestionnaire());

create policy "jetons_aucun_acces" on jetons_suivi_commande
  for select using (false);

-- -----------------------------------------------------------------------------
-- Mouvements de stock : personnel.
-- -----------------------------------------------------------------------------
create policy "mouvements_lecture_personnel" on mouvements_stock
  for select using (est_personnel());

create policy "mouvements_ecriture_gestionnaire" on mouvements_stock
  for insert with check (est_gestionnaire());

-- -----------------------------------------------------------------------------
-- Promotions : gestionnaire uniquement (validation publique via RPC).
-- -----------------------------------------------------------------------------
create policy "promotions_gestionnaire" on promotions
  for all using (est_gestionnaire()) with check (est_gestionnaire());

create policy "utilisations_promotions_personnel" on utilisations_promotions
  for select using (est_personnel());

create policy "utilisations_promotions_gestionnaire" on utilisations_promotions
  for insert with check (est_gestionnaire());

-- -----------------------------------------------------------------------------
-- Newsletter : inscription publique, consultation personnel.
-- -----------------------------------------------------------------------------
create policy "newsletter_inscription_publique" on inscriptions_newsletter
  for insert to anon, authenticated
  with check (true);

create policy "newsletter_lecture_personnel" on inscriptions_newsletter
  for select using (est_personnel());

-- -----------------------------------------------------------------------------
-- Parametres boutique : lecture publique (configuration non sensible),
-- ecriture administrateur.
-- -----------------------------------------------------------------------------
create policy "parametres_lecture_publique" on parametres_boutique
  for select using (true);

create policy "parametres_ecriture_admin" on parametres_boutique
  for all using (est_admin()) with check (est_admin());

-- -----------------------------------------------------------------------------
-- Journal d'activite : personnel.
-- -----------------------------------------------------------------------------
create policy "journaux_lecture_personnel" on journaux_activite_administration
  for select using (est_personnel());

create policy "journaux_insert_gestionnaire" on journaux_activite_administration
  for insert with check (est_gestionnaire());
