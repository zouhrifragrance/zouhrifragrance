-- ## FICHIER : 0001_schema_initial.sql

-- =============================================================================
-- ZOUHRI FRAGRANCE - Migration 0001 : Schema initial
-- Toutes les tables metier et colonnes personnalisees sont en francais,
-- sans accents, en snake_case.
-- =============================================================================

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;

-- -----------------------------------------------------------------------------
-- Types enumeres metier
-- -----------------------------------------------------------------------------
create type role_utilisateur as enum ('ADMIN', 'GESTIONNAIRE', 'LECTEUR');

create type statut_commande as enum (
  'EN_ATTENTE_CONFIRMATION',
  'CONFIRMEE',
  'EN_PREPARATION',
  'EXPEDIEE',
  'LIVREE',
  'ANNULEE',
  'RETOURNEE'
);

create type statut_paiement as enum ('NON_PAYE', 'A_PAYER_LIVRAISON', 'PAYE', 'REMBOURSE');

create type type_mouvement_stock as enum (
  'ENTREE',
  'SORTIE',
  'RESERVATION',
  'LIBERATION',
  'AJUSTEMENT',
  'RETOUR'
);

create type type_reduction as enum ('POURCENTAGE', 'MONTANT_FIXE');

-- -----------------------------------------------------------------------------
-- Fonction generique : mise a jour de date_modification
-- -----------------------------------------------------------------------------
create or replace function maj_date_modification()
returns trigger
language plpgsql
as $$
begin
  new.date_modification := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Roles et profils d'administration
-- -----------------------------------------------------------------------------
create table roles_utilisateurs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  libelle text not null,
  description text,
  date_creation timestamptz not null default now()
);

comment on table roles_utilisateurs is 'Referentiel des roles administratifs.';

create table profils_utilisateurs (
  id uuid primary key references auth.users (id) on delete cascade,
  nom_complet text not null default '',
  role role_utilisateur not null default 'LECTEUR',
  est_actif boolean not null default true,
  date_creation timestamptz not null default now(),
  date_modification timestamptz not null default now()
);

comment on table profils_utilisateurs is 'Profil applicatif associe a un compte Supabase Auth (administration uniquement).';

create trigger trg_profils_maj
  before update on profils_utilisateurs
  for each row execute function maj_date_modification();

-- -----------------------------------------------------------------------------
-- Categories (hierarchie autorisee, extensible sans modification de code)
-- -----------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  slug text not null unique,
  description text,
  image_url text,
  categorie_parente_id uuid references categories (id) on delete set null,
  ordre_affichage integer not null default 0,
  est_active boolean not null default true,
  titre_seo text,
  description_seo text,
  date_creation timestamptz not null default now(),
  date_modification timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_pas_auto_parent check (categorie_parente_id is null or categorie_parente_id <> id)
);

comment on table categories is 'Categories et sous-categories de produits.';

create index idx_categories_parent on categories (categorie_parente_id);
create index idx_categories_active on categories (est_active);
create index idx_categories_ordre on categories (ordre_affichage);

create trigger trg_categories_maj
  before update on categories
  for each row execute function maj_date_modification();

-- Empeche les cycles dans la hierarchie des categories
create or replace function empecher_cycle_categorie()
returns trigger
language plpgsql
as $$
declare
  ancetre uuid;
  profondeur integer := 0;
begin
  ancetre := new.categorie_parente_id;
  while ancetre is not null loop
    if ancetre = new.id then
      raise exception 'Hierarchie invalide : une categorie ne peut pas etre son propre ancetre.';
    end if;
    profondeur := profondeur + 1;
    if profondeur > 50 then
      raise exception 'Profondeur de categorie excessive.';
    end if;
    select categorie_parente_id into ancetre from categories where id = ancetre;
  end loop;
  return new;
end;
$$;

create trigger trg_categories_cycle
  before insert or update of categorie_parente_id on categories
  for each row execute function empecher_cycle_categorie();

-- -----------------------------------------------------------------------------
-- Produits
-- -----------------------------------------------------------------------------
create table produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  slug text not null unique,
  description_courte text,
  description text,
  categorie_id uuid references categories (id) on delete set null,
  reference_sku text,
  prix_vente numeric(12, 2) not null check (prix_vente >= 0),
  prix_promotionnel numeric(12, 2) check (prix_promotionnel >= 0),
  devise text not null default 'MAD',
  quantite_stock integer not null default 0 check (quantite_stock >= 0),
  seuil_stock_faible integer not null default 5 check (seuil_stock_faible >= 0),
  est_mis_en_avant boolean not null default false,
  est_publie boolean not null default false,
  titre_seo text,
  description_seo text,
  date_creation timestamptz not null default now(),
  date_modification timestamptz not null default now(),
  constraint produits_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint produits_prix_promo_coherent check (
    prix_promotionnel is null or prix_promotionnel < prix_vente
  )
);

comment on table produits is 'Catalogue produits. Le stock global est le repli lorsque le produit n''a pas de variantes.';

create index idx_produits_categorie on produits (categorie_id);
create index idx_produits_publie on produits (est_publie);
create index idx_produits_mis_en_avant on produits (est_mis_en_avant) where est_mis_en_avant;
create index idx_produits_date_creation on produits (date_creation desc);
create index idx_produits_nom_recherche on produits using gin (to_tsvector('french', nom || ' ' || coalesce(description_courte, '')));

create trigger trg_produits_maj
  before update on produits
  for each row execute function maj_date_modification();

-- -----------------------------------------------------------------------------
-- Images de produits
-- -----------------------------------------------------------------------------
create table images_produits (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid not null references produits (id) on delete cascade,
  url text not null,
  texte_alt text,
  est_principale boolean not null default false,
  ordre_affichage integer not null default 0,
  date_creation timestamptz not null default now()
);

create index idx_images_produit on images_produits (produit_id, ordre_affichage);
create unique index idx_images_principale_unique
  on images_produits (produit_id)
  where est_principale;

-- -----------------------------------------------------------------------------
-- Variantes de produits (contenance, configuration, etc.)
-- -----------------------------------------------------------------------------
create table variantes_produit (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid not null references produits (id) on delete cascade,
  nom text not null,
  contenance text,
  reference_sku text,
  prix_vente numeric(12, 2) check (prix_vente is null or prix_vente >= 0),
  prix_promotionnel numeric(12, 2) check (prix_promotionnel is null or prix_promotionnel >= 0),
  quantite_stock integer not null default 0 check (quantite_stock >= 0),
  seuil_stock_faible integer not null default 5 check (seuil_stock_faible >= 0),
  est_active boolean not null default true,
  ordre_affichage integer not null default 0,
  date_creation timestamptz not null default now(),
  date_modification timestamptz not null default now(),
  constraint variantes_prix_promo_coherent check (
    prix_promotionnel is null or prix_vente is null or prix_promotionnel < prix_vente
  )
);

create index idx_variantes_produit on variantes_produit (produit_id, ordre_affichage);
create index idx_variantes_sku on variantes_produit (reference_sku);

create trigger trg_variantes_maj
  before update on variantes_produit
  for each row execute function maj_date_modification();

-- -----------------------------------------------------------------------------
-- Commandes (achat sans compte client)
-- -----------------------------------------------------------------------------
create sequence sequence_numero_commande start 1000;

create table commandes (
  id uuid primary key default gen_random_uuid(),
  numero_commande text not null unique,
  nom_client text not null,
  telephone_client text not null,
  email_client text,
  ville_livraison text not null,
  adresse_livraison text not null,
  complement_adresse text,
  instructions_livraison text,
  statut_commande statut_commande not null default 'EN_ATTENTE_CONFIRMATION',
  statut_paiement statut_paiement not null default 'NON_PAYE',
  sous_total numeric(12, 2) not null default 0 check (sous_total >= 0),
  montant_reduction numeric(12, 2) not null default 0 check (montant_reduction >= 0),
  frais_livraison numeric(12, 2) not null default 0 check (frais_livraison >= 0),
  montant_total numeric(12, 2) not null default 0 check (montant_total >= 0),
  devise text not null default 'MAD',
  cle_idempotence text not null unique,
  code_promotion text,
  reservation_expire_le timestamptz,
  stock_libere boolean not null default false,
  date_creation timestamptz not null default now(),
  date_modification timestamptz not null default now()
);

comment on table commandes is 'Commandes client. Aucun paiement en ligne : le reglement se fait hors site.';

create index idx_commandes_statut on commandes (statut_commande);
create index idx_commandes_date on commandes (date_creation desc);
create index idx_commandes_telephone on commandes (telephone_client);
create index idx_commandes_numero on commandes (numero_commande);

create trigger trg_commandes_maj
  before update on commandes
  for each row execute function maj_date_modification();

-- -----------------------------------------------------------------------------
-- Lignes de commande (instantane des donnees achetees)
-- -----------------------------------------------------------------------------
create table lignes_commande (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references commandes (id) on delete cascade,
  produit_id uuid references produits (id) on delete set null,
  variante_id uuid references variantes_produit (id) on delete set null,
  nom_produit text not null,
  nom_variante text,
  reference_sku text,
  prix_unitaire numeric(12, 2) not null check (prix_unitaire >= 0),
  quantite integer not null check (quantite > 0),
  montant_ligne numeric(12, 2) not null check (montant_ligne >= 0),
  date_creation timestamptz not null default now()
);

create index idx_lignes_commande on lignes_commande (commande_id);
create index idx_lignes_produit on lignes_commande (produit_id);

-- -----------------------------------------------------------------------------
-- Historique des statuts de commande
-- -----------------------------------------------------------------------------
create table historique_statuts_commande (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references commandes (id) on delete cascade,
  statut_precedent statut_commande,
  statut_nouveau statut_commande not null,
  commentaire text,
  acteur text,
  date_creation timestamptz not null default now()
);

create index idx_historique_commande on historique_statuts_commande (commande_id, date_creation);

-- -----------------------------------------------------------------------------
-- Jetons de suivi de commande (empreinte uniquement, jamais le secret en clair)
-- -----------------------------------------------------------------------------
create table jetons_suivi_commande (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references commandes (id) on delete cascade,
  empreinte_jeton text not null unique,
  date_creation timestamptz not null default now(),
  date_expiration timestamptz not null,
  est_revoque boolean not null default false
);

create index idx_jetons_commande on jetons_suivi_commande (commande_id);

-- -----------------------------------------------------------------------------
-- Mouvements de stock
-- -----------------------------------------------------------------------------
create table mouvements_stock (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid references produits (id) on delete set null,
  variante_id uuid references variantes_produit (id) on delete set null,
  type_mouvement type_mouvement_stock not null,
  quantite integer not null,
  motif text,
  commande_id uuid references commandes (id) on delete set null,
  utilisateur_id uuid references auth.users (id) on delete set null,
  date_creation timestamptz not null default now()
);

create index idx_mouvements_produit on mouvements_stock (produit_id, date_creation desc);
create index idx_mouvements_variante on mouvements_stock (variante_id, date_creation desc);
create index idx_mouvements_commande on mouvements_stock (commande_id);

-- -----------------------------------------------------------------------------
-- Promotions
-- -----------------------------------------------------------------------------
create table promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nom text not null,
  type_reduction type_reduction not null,
  valeur numeric(12, 2) not null check (valeur > 0),
  montant_minimum numeric(12, 2) not null default 0 check (montant_minimum >= 0),
  limite_utilisation integer check (limite_utilisation is null or limite_utilisation > 0),
  nombre_utilisations integer not null default 0 check (nombre_utilisations >= 0),
  categories_ids uuid[] not null default '{}',
  produits_ids uuid[] not null default '{}',
  date_debut timestamptz not null default now(),
  date_fin timestamptz,
  est_active boolean not null default true,
  date_creation timestamptz not null default now(),
  date_modification timestamptz not null default now(),
  constraint promotions_pourcentage_max check (
    type_reduction <> 'POURCENTAGE' or valeur <= 100
  )
);

create index idx_promotions_active on promotions (est_active);

create trigger trg_promotions_maj
  before update on promotions
  for each row execute function maj_date_modification();

create table utilisations_promotions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references promotions (id) on delete cascade,
  commande_id uuid not null references commandes (id) on delete cascade,
  date_creation timestamptz not null default now(),
  unique (promotion_id, commande_id)
);

-- -----------------------------------------------------------------------------
-- Newsletter
-- -----------------------------------------------------------------------------
create table inscriptions_newsletter (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  est_actif boolean not null default true,
  date_creation timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Parametres de la boutique (cle / valeur JSONB)
-- -----------------------------------------------------------------------------
create table parametres_boutique (
  cle text primary key,
  valeur jsonb not null,
  description text,
  date_modification timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Journal d'activite administration
-- -----------------------------------------------------------------------------
create table journaux_activite_administration (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references auth.users (id) on delete set null,
  action text not null,
  table_cible text,
  enregistrement_id text,
  details jsonb,
  date_creation timestamptz not null default now()
);

create index idx_journaux_date on journaux_activite_administration (date_creation desc);

-- -----------------------------------------------------------------------------
-- Generation du numero de commande (unique, difficile a deviner)
-- -----------------------------------------------------------------------------
create or replace function generer_numero_commande()
returns text
language plpgsql
set search_path = public, extensions
as $$
declare
  alea text;
begin
  alea := upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 6));
  return 'ZF-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('sequence_numero_commande')::text, 6, '0') || '-' || alea;
end;
$$;

-- ## FICHIER : 0002_securite_rls.sql

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

-- ## FICHIER : 0003_fonctions_metier.sql

-- =============================================================================
-- ZOUHRI FRAGRANCE - Migration 0003 : Fonctions RPC metier (transactions)
-- Toutes les operations sensibles passent par ces fonctions SECURITY DEFINER.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Transitions de statut autorisees
-- -----------------------------------------------------------------------------
create or replace function transitions_autorisees(p_statut statut_commande)
returns statut_commande[]
language sql
immutable
as $$
  select case p_statut
    when 'EN_ATTENTE_CONFIRMATION' then array['CONFIRMEE', 'ANNULEE']::statut_commande[]
    when 'CONFIRMEE' then array['EN_PREPARATION', 'ANNULEE']::statut_commande[]
    when 'EN_PREPARATION' then array['EXPEDIEE', 'ANNULEE']::statut_commande[]
    when 'EXPEDIEE' then array['LIVREE', 'RETOURNEE']::statut_commande[]
    when 'LIVREE' then array['RETOURNEE']::statut_commande[]
    else array[]::statut_commande[]
  end;
$$;

create or replace function transition_valide(p_depuis statut_commande, p_vers statut_commande)
returns boolean
language sql
immutable
as $$
  select p_vers = any (transitions_autorisees(p_depuis));
$$;

-- -----------------------------------------------------------------------------
-- Validation d'une promotion (appelable publiquement, securisee)
-- -----------------------------------------------------------------------------
create or replace function valider_promotion(
  p_code text,
  p_sous_total numeric,
  p_lignes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  promo promotions%rowtype;
  montant numeric := 0;
  base numeric := p_sous_total;
  ligne jsonb;
  produit_id uuid;
  categorie_id uuid;
  correspond boolean;
  total_correspondant numeric := 0;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Aucun code fourni.');
  end if;

  select * into promo from promotions
  where upper(code) = upper(trim(p_code))
  limit 1;

  if not found then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Code promotionnel inconnu.');
  end if;

  if not promo.est_active then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Ce code promotionnel n''est plus actif.');
  end if;

  if now() < promo.date_debut then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Ce code n''est pas encore valide.');
  end if;

  if promo.date_fin is not null and now() > promo.date_fin then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Ce code promotionnel a expirÃ©.');
  end if;

  if promo.limite_utilisation is not null and promo.nombre_utilisations >= promo.limite_utilisation then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Ce code a atteint sa limite d''utilisation.');
  end if;

  -- Restrictions par produit ou categorie : on ne retient que les lignes eligibles.
  if array_length(promo.produits_ids, 1) is not null or array_length(promo.categories_ids, 1) is not null then
    for ligne in select * from jsonb_array_elements(coalesce(p_lignes, '[]'::jsonb))
    loop
      produit_id := nullif(ligne ->> 'produit_id', '')::uuid;
      select categorie_id into categorie_id from produits where id = produit_id;
      correspond := (produit_id = any (promo.produits_ids)) or (categorie_id = any (promo.categories_ids));
      if correspond then
        total_correspondant := total_correspondant + (coalesce((ligne ->> 'prix_unitaire')::numeric, 0) * coalesce((ligne ->> 'quantite')::int, 0));
      end if;
    end loop;
    base := total_correspondant;
    if base <= 0 then
      return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Aucun article de ce panier n''est Ã©ligible Ã  ce code.');
    end if;
  end if;

  if p_sous_total < promo.montant_minimum then
    return jsonb_build_object(
      'valide', false,
      'montant_reduction', 0,
      'message', 'Ce code est valable pour un minimum de ' || to_char(promo.montant_minimum, 'FM999999990D00') || ' MAD d''achat.'
    );
  end if;

  if promo.type_reduction = 'POURCENTAGE' then
    montant := round((base * promo.valeur / 100)::numeric, 2);
  else
    montant := least(promo.valeur, base);
  end if;

  return jsonb_build_object(
    'valide', true,
    'montant_reduction', montant,
    'promotion_id', promo.id,
    'code', promo.code,
    'libelle', promo.nom,
    'message', 'Code appliquÃ©.'
  );
end;
$$;

grant execute on function valider_promotion(text, numeric, jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Creation d'une commande (guest). Idempotente et transactionnelle.
-- Le stock est reserve de maniere atomique avec verrouillage des lignes.
-- -----------------------------------------------------------------------------
create or replace function creer_commande(
  p_payload jsonb,
  p_cle_idempotence text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_variable
declare
  commande_existante commandes%rowtype;
  nouvelle_commande commandes%rowtype;
  article jsonb;
  produit produits%rowtype;
  variante variantes_produit%rowtype;
  a_variante boolean;
  quantite_demandee integer;
  prix_base numeric;
  prix_promo numeric;
  prix_unitaire numeric;
  v_sous_total numeric := 0;
  reduction numeric := 0;
  frais numeric := 0;
  seuil_gratuit numeric := 0;
  total numeric := 0;
  jeton text;
  empreinte text;
  resultat_promotion jsonb;
  lignes_json jsonb := '[]'::jsonb;
  lignes_pour_promo jsonb := '[]'::jsonb;
  params jsonb;
  reservation_heures integer := 48;
  numero text;
begin
  -- Idempotence : renvoyer la commande deja creee pour une meme cle.
  select * into commande_existante from commandes where cle_idempotence = p_cle_idempotence limit 1;
  if found then
    select empreinte_jeton into empreinte from jetons_suivi_commande
    where commande_id = commande_existante.id and est_revoque = false
    order by date_creation desc limit 1;
    return jsonb_build_object(
      'id', commande_existante.id,
      'numero_commande', commande_existante.numero_commande,
      'statut_commande', commande_existante.statut_commande,
      'montant_total', commande_existante.montant_total,
      'sous_total', commande_existante.sous_total,
      'montant_reduction', commande_existante.montant_reduction,
      'frais_livraison', commande_existante.frais_livraison,
      'devise', commande_existante.devise,
      'date_creation', commande_existante.date_creation,
      'deja_existante', true,
      'jeton_suivi', null
    );
  end if;

  if p_payload -> 'articles' is null or jsonb_array_length(p_payload -> 'articles') = 0 then
    raise exception 'Le panier est vide.' using errcode = '22000';
  end if;

  -- Parametres boutique (frais de livraison, seuil, duree de reservation).
  select valeur into params from parametres_boutique where cle = 'livraison';
  if found then
    frais := coalesce((params ->> 'frais_livraison')::numeric, 30);
    seuil_gratuit := coalesce((params ->> 'seuil_livraison_gratuite')::numeric, 0);
  else
    frais := 30;
    seuil_gratuit := 500;
  end if;

  select valeur into params from parametres_boutique where cle = 'stock';
  if found then
    reservation_heures := coalesce((params ->> 'reservation_heures')::int, 48);
  end if;

  numero := generer_numero_commande();

  -- Insertion de l'entete (le total definitif est calcule plus bas).
  insert into commandes (
    numero_commande, nom_client, telephone_client, email_client,
    ville_livraison, adresse_livraison, complement_adresse, instructions_livraison,
    cle_idempotence, code_promotion, reservation_expire_le
  ) values (
    numero,
    trim(p_payload ->> 'nom_client'),
    trim(p_payload ->> 'telephone_client'),
    nullif(trim(coalesce(p_payload ->> 'email_client', '')), ''),
    trim(p_payload ->> 'ville_livraison'),
    trim(p_payload ->> 'adresse_livraison'),
    nullif(trim(coalesce(p_payload ->> 'complement_adresse', '')), ''),
    nullif(trim(coalesce(p_payload ->> 'instructions_livraison', '')), ''),
    p_cle_idempotence,
    nullif(upper(trim(coalesce(p_payload ->> 'code_promotion', ''))), ''),
    now() + make_interval(hours => reservation_heures)
  ) returning * into nouvelle_commande;

  -- Parcours des articles : verrouillage, verification, reservation du stock.
  for article in select * from jsonb_array_elements(p_payload -> 'articles')
  loop
    quantite_demandee := coalesce((article ->> 'quantite')::int, 0);
    if quantite_demandee <= 0 or quantite_demandee > 50 then
      raise exception 'QuantitÃ© invalide.' using errcode = '22000';
    end if;

    a_variante := nullif(article ->> 'variante_id', '') is not null;

    select * into produit from produits
    where id = (article ->> 'produit_id')::uuid
    for update;

    if not found then
      raise exception 'Produit introuvable.' using errcode = 'P0002';
    end if;
    if produit.est_publie = false then
      raise exception 'Le produit % n''est plus disponible.', produit.nom using errcode = '22000';
    end if;

    if a_variante then
      select * into variante from variantes_produit
      where id = (article ->> 'variante_id')::uuid and produit_id = produit.id
      for update;

      if not found then
        raise exception 'Variante introuvable.' using errcode = 'P0002';
      end if;
      if variante.est_active = false then
        raise exception 'La variante % n''est plus disponible.', variante.nom using errcode = '22000';
      end if;
      if variante.quantite_stock < quantite_demandee then
        raise exception 'Stock insuffisant pour %. Disponible : %.', produit.nom || ' - ' || variante.nom, variante.quantite_stock using errcode = '22000';
      end if;

      update variantes_produit
        set quantite_stock = quantite_stock - quantite_demandee
        where id = variante.id;

      insert into mouvements_stock (produit_id, variante_id, type_mouvement, quantite, motif, commande_id)
      values (produit.id, variante.id, 'RESERVATION', -quantite_demandee, 'RÃ©servation Ã  la crÃ©ation de commande', nouvelle_commande.id);

      prix_base := coalesce(variante.prix_vente, produit.prix_vente);
      prix_promo := coalesce(variante.prix_promotionnel, produit.prix_promotionnel);
      if prix_promo is not null and prix_promo >= prix_base then
        prix_promo := null;
      end if;
      prix_unitaire := coalesce(prix_promo, prix_base);

      lignes_json := lignes_json || jsonb_build_object(
        'produit_id', produit.id,
        'variante_id', variante.id,
        'nom_produit', produit.nom,
        'nom_variante', variante.nom,
        'reference_sku', coalesce(variante.reference_sku, produit.reference_sku),
        'prix_unitaire', prix_unitaire,
        'quantite', quantite_demandee
      );
    else
      if produit.quantite_stock < quantite_demandee then
        raise exception 'Stock insuffisant pour %. Disponible : %.', produit.nom, produit.quantite_stock using errcode = '22000';
      end if;

      update produits
        set quantite_stock = quantite_stock - quantite_demandee
        where id = produit.id;

      insert into mouvements_stock (produit_id, type_mouvement, quantite, motif, commande_id)
      values (produit.id, 'RESERVATION', -quantite_demandee, 'RÃ©servation Ã  la crÃ©ation de commande', nouvelle_commande.id);

      prix_unitaire := coalesce(produit.prix_promotionnel, produit.prix_vente);

      lignes_json := lignes_json || jsonb_build_object(
        'produit_id', produit.id,
        'variante_id', null,
        'nom_produit', produit.nom,
        'nom_variante', null,
        'reference_sku', produit.reference_sku,
        'prix_unitaire', prix_unitaire,
        'quantite', quantite_demandee
      );
    end if;

    v_sous_total := v_sous_total + (prix_unitaire * quantite_demandee);
    lignes_pour_promo := lignes_pour_promo || jsonb_build_object(
      'produit_id', produit.id,
      'prix_unitaire', prix_unitaire,
      'quantite', quantite_demandee
    );
  end loop;

  -- Insertion des lignes de commande (instantane).
  for article in select * from jsonb_array_elements(lignes_json)
  loop
    insert into lignes_commande (
      commande_id, produit_id, variante_id, nom_produit, nom_variante,
      reference_sku, prix_unitaire, quantite, montant_ligne
    ) values (
      nouvelle_commande.id,
      (article ->> 'produit_id')::uuid,
      nullif(article ->> 'variante_id', '')::uuid,
      article ->> 'nom_produit',
      nullif(article ->> 'nom_variante', ''),
      nullif(article ->> 'reference_sku', ''),
      (article ->> 'prix_unitaire')::numeric,
      (article ->> 'quantite')::int,
      (article ->> 'prix_unitaire')::numeric * (article ->> 'quantite')::int
    );
  end loop;

  -- Promotion appliquee cote serveur uniquement.
  if nouvelle_commande.code_promotion is not null then
    resultat_promotion := valider_promotion(nouvelle_commande.code_promotion, v_sous_total, lignes_pour_promo);
    if (resultat_promotion ->> 'valide')::boolean then
      reduction := (resultat_promotion ->> 'montant_reduction')::numeric;
      insert into utilisations_promotions (promotion_id, commande_id)
      values ((resultat_promotion ->> 'promotion_id')::uuid, nouvelle_commande.id);
      update promotions
        set nombre_utilisations = nombre_utilisations + 1
        where id = (resultat_promotion ->> 'promotion_id')::uuid;
    end if;
  end if;

  frais := case when seuil_gratuit > 0 and (v_sous_total - reduction) >= seuil_gratuit then 0 else frais end;
  total := v_sous_total - reduction + frais;
  if total < 0 then
    total := 0;
  end if;

  update commandes
    set sous_total = v_sous_total,
        montant_reduction = reduction,
        frais_livraison = frais,
        montant_total = total
    where id = nouvelle_commande.id
    returning * into nouvelle_commande;

  insert into historique_statuts_commande (commande_id, statut_precedent, statut_nouveau, commentaire, acteur)
  values (nouvelle_commande.id, null, 'EN_ATTENTE_CONFIRMATION', 'Commande crÃ©Ã©e par le client.', 'CLIENT');

  -- Jeton de suivi : seul le hachage est conserve.
  jeton := encode(gen_random_bytes(32), 'hex');
  empreinte := encode(digest(jeton, 'sha256'), 'hex');
  insert into jetons_suivi_commande (commande_id, empreinte_jeton, date_expiration)
  values (nouvelle_commande.id, empreinte, now() + interval '180 days');

  return jsonb_build_object(
    'id', nouvelle_commande.id,
    'numero_commande', nouvelle_commande.numero_commande,
    'statut_commande', nouvelle_commande.statut_commande,
    'sous_total', nouvelle_commande.sous_total,
    'montant_reduction', nouvelle_commande.montant_reduction,
    'frais_livraison', nouvelle_commande.frais_livraison,
    'montant_total', nouvelle_commande.montant_total,
    'devise', nouvelle_commande.devise,
    'date_creation', nouvelle_commande.date_creation,
    'deja_existante', false,
    'jeton_suivi', jeton
  );
end;
$$;

grant execute on function creer_commande(jsonb, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Suivi public d'une commande par jeton (informations limitees uniquement)
-- -----------------------------------------------------------------------------
create or replace function suivre_commande(p_jeton text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  empreinte text;
  commande commandes%rowtype;
  historique jsonb;
begin
  if p_jeton is null or length(p_jeton) < 32 then
    return jsonb_build_object('trouve', false, 'message', 'Jeton de suivi invalide.');
  end if;

  empreinte := encode(digest(p_jeton, 'sha256'), 'hex');

  select c.* into commande
  from jetons_suivi_commande j
  join commandes c on c.id = j.commande_id
  where j.empreinte_jeton = empreinte
    and j.est_revoque = false
    and j.date_expiration > now()
  limit 1;

  if not found then
    return jsonb_build_object('trouve', false, 'message', 'Aucune commande trouvÃ©e pour ce lien de suivi.');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'statut', statut_nouveau,
    'date', date_creation
  ) order by date_creation), '[]'::jsonb) into historique
  from historique_statuts_commande
  where commande_id = commande.id;

  return jsonb_build_object(
    'trouve', true,
    'numero_commande', commande.numero_commande,
    'statut_commande', commande.statut_commande,
    'date_creation', commande.date_creation,
    'montant_total', commande.montant_total,
    'devise', commande.devise,
    'historique', historique
  );
end;
$$;

grant execute on function suivre_commande(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Suivi public d'une commande par numero + telephone (sans lien de suivi)
-- Utilise lorsque le client a perdu son lien / quitte le navigateur.
-- -----------------------------------------------------------------------------
create or replace function suivre_commande_par_contact(
  p_numero text,
  p_telephone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  commande commandes%rowtype;
  telephone_digits text;
  historique jsonb;
begin
  if p_numero is null or length(trim(p_numero)) < 6 then
    return jsonb_build_object('trouve', false, 'message', 'Numero de commande invalide.');
  end if;

  telephone_digits := regexp_replace(coalesce(p_telephone, ''), '[^0-9]', '', 'g');
  if length(telephone_digits) < 8 then
    return jsonb_build_object('trouve', false, 'message', 'Numero de telephone invalide.');
  end if;

  select * into commande
  from commandes
  where upper(trim(numero_commande)) = upper(trim(p_numero))
    and regexp_replace(telephone_client, '[^0-9]', '', 'g') = telephone_digits
  limit 1;

  if not found then
    return jsonb_build_object(
      'trouve', false,
      'message', 'Aucune commande ne correspond a ce numero et ce telephone.'
    );
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'statut', statut_nouveau,
    'date', date_creation
  ) order by date_creation), '[]'::jsonb) into historique
  from historique_statuts_commande
  where commande_id = commande.id;

  return jsonb_build_object(
    'trouve', true,
    'numero_commande', commande.numero_commande,
    'statut_commande', commande.statut_commande,
    'date_creation', commande.date_creation,
    'montant_total', commande.montant_total,
    'devise', commande.devise,
    'historique', historique
  );
end;
$$;

grant execute on function suivre_commande_par_contact(text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Liberation du stock d'une commande (une seule fois)
-- -----------------------------------------------------------------------------
create or replace function liberer_stock_commande(
  p_commande_id uuid,
  p_motif text default 'Annulation de commande'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ligne lignes_commande%rowtype;
  commande commandes%rowtype;
begin
  select * into commande from commandes where id = p_commande_id for update;
  if not found then
    raise exception 'Commande introuvable.' using errcode = 'P0002';
  end if;

  if commande.stock_libere then
    return jsonb_build_object('libere', false, 'message', 'Stock dÃ©jÃ  libÃ©rÃ©.');
  end if;

  for ligne in select * from lignes_commande where commande_id = p_commande_id
  loop
    if ligne.variante_id is not null then
      update variantes_produit
        set quantite_stock = quantite_stock + ligne.quantite
        where id = ligne.variante_id;
      insert into mouvements_stock (produit_id, variante_id, type_mouvement, quantite, motif, commande_id)
      values (ligne.produit_id, ligne.variante_id, 'LIBERATION', ligne.quantite, p_motif, p_commande_id);
    elsif ligne.produit_id is not null then
      update produits
        set quantite_stock = quantite_stock + ligne.quantite
        where id = ligne.produit_id;
      insert into mouvements_stock (produit_id, type_mouvement, quantite, motif, commande_id)
      values (ligne.produit_id, 'LIBERATION', ligne.quantite, p_motif, p_commande_id);
    end if;
  end loop;

  update commandes set stock_libere = true where id = p_commande_id;

  return jsonb_build_object('libere', true, 'message', 'Stock libÃ©rÃ©.');
end;
$$;

revoke all on function liberer_stock_commande(uuid, text) from anon;
grant execute on function liberer_stock_commande(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Changement de statut d'une commande (respect des transitions)
-- -----------------------------------------------------------------------------
create or replace function changer_statut_commande(
  p_commande_id uuid,
  p_nouveau_statut statut_commande,
  p_commentaire text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  commande commandes%rowtype;
begin
  if not est_gestionnaire() then
    raise exception 'AccÃ¨s refusÃ©.' using errcode = '42501';
  end if;

  select * into commande from commandes where id = p_commande_id for update;
  if not found then
    raise exception 'Commande introuvable.' using errcode = 'P0002';
  end if;

  if commande.statut_commande = p_nouveau_statut then
    return jsonb_build_object('succes', true, 'statut', p_nouveau_statut, 'message', 'Statut inchangÃ©.');
  end if;

  if not transition_valide(commande.statut_commande, p_nouveau_statut) then
    raise exception 'Transition de statut non autorisÃ©e : % vers %.', commande.statut_commande, p_nouveau_statut using errcode = '22000';
  end if;

  update commandes set statut_commande = p_nouveau_statut where id = p_commande_id;

  if p_nouveau_statut = 'ANNULEE' then
    perform liberer_stock_commande(p_commande_id, 'LibÃ©ration suite Ã  annulation');
  end if;

  if p_nouveau_statut = 'RETOURNEE' then
    perform liberer_stock_commande(p_commande_id, 'RÃ©intÃ©gration suite Ã  retour');
  end if;

  insert into historique_statuts_commande (commande_id, statut_precedent, statut_nouveau, commentaire, acteur)
  values (p_commande_id, commande.statut_commande, p_nouveau_statut, p_commentaire, auth.uid()::text);

  return jsonb_build_object(
    'succes', true,
    'statut', p_nouveau_statut,
    'ancien_statut', commande.statut_commande,
    'message', 'Statut mis Ã  jour.'
  );
end;
$$;

revoke all on function changer_statut_commande(uuid, statut_commande, text) from anon;
grant execute on function changer_statut_commande(uuid, statut_commande, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Confirmation explicite d'une commande
-- -----------------------------------------------------------------------------
create or replace function confirmer_commande(
  p_commande_id uuid,
  p_commentaire text default 'Commande confirmÃ©e par l''administration'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return changer_statut_commande(p_commande_id, 'CONFIRMEE', p_commentaire);
end;
$$;

revoke all on function confirmer_commande(uuid, text) from anon;
grant execute on function confirmer_commande(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Statistiques du tableau de bord (donnees reelles, aucun chiffre invente)
-- -----------------------------------------------------------------------------
create or replace function statistiques_tableau_de_bord()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  resultat jsonb;
  en_attente integer;
  confirmees integer;
  preparation integer;
  expediees integer;
  livrees integer;
  annulees integer;
  montant_attente numeric;
  ca_confirme numeric;
  ventes_jour jsonb;
  top_produits jsonb;
  stock_faible jsonb;
  commandes_recentes jsonb;
begin
  if not est_personnel() then
    raise exception 'AccÃ¨s refusÃ©.' using errcode = '42501';
  end if;

  select count(*) into en_attente from commandes where statut_commande = 'EN_ATTENTE_CONFIRMATION';
  select count(*) into confirmees from commandes where statut_commande = 'CONFIRMEE';
  select count(*) into preparation from commandes where statut_commande = 'EN_PREPARATION';
  select count(*) into expediees from commandes where statut_commande = 'EXPEDIEE';
  select count(*) into livrees from commandes where statut_commande = 'LIVREE';
  select count(*) into annulees from commandes where statut_commande = 'ANNULEE';

  select coalesce(sum(montant_total), 0) into montant_attente
  from commandes where statut_commande = 'EN_ATTENTE_CONFIRMATION';

  select coalesce(sum(montant_total), 0) into ca_confirme
  from commandes where statut_commande in ('CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE');

  select coalesce(jsonb_agg(jsonb_build_object('jour', jour, 'total', total) order by jour), '[]'::jsonb)
  into ventes_jour
  from (
    select to_char(date_creation::date, 'YYYY-MM-DD') as jour, sum(montant_total) as total
    from commandes
    where date_creation >= now() - interval '30 days'
      and statut_commande not in ('ANNULEE', 'RETOURNEE')
    group by date_creation::date
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object('nom', nom_produit, 'quantite', quantite) order by quantite desc), '[]'::jsonb)
  into top_produits
  from (
    select nom_produit, sum(quantite) as quantite
    from lignes_commande lc
    join commandes c on c.id = lc.commande_id
    where c.statut_commande not in ('ANNULEE', 'RETOURNEE')
    group by nom_produit
    order by quantite desc
    limit 5
  ) t;

  select coalesce(jsonb_agg(jsonb_build_object('nom', nom, 'stock', stock, 'seuil', seuil)), '[]'::jsonb)
  into stock_faible
  from (
    select nom, quantite_stock as stock, seuil_stock_faible as seuil
    from produits
    where quantite_stock <= seuil_stock_faible
    order by quantite_stock asc
    limit 10
  ) sf;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'numero_commande', numero_commande,
    'nom_client', nom_client,
    'montant_total', montant_total,
    'statut_commande', statut_commande,
    'date_creation', date_creation
  ) order by date_creation desc), '[]'::jsonb)
  into commandes_recentes
  from (select * from commandes order by date_creation desc limit 8) cr;

  resultat := jsonb_build_object(
    'compteurs', jsonb_build_object(
      'en_attente', en_attente,
      'confirmees', confirmees,
      'en_preparation', preparation,
      'expediees', expediees,
      'livrees', livrees,
      'annulees', annulees,
      'total', en_attente + confirmees + preparation + expediees + livrees + annulees
    ),
    'montant_en_attente', montant_attente,
    'chiffre_affaires_confirme', ca_confirme,
    'ventes_30_jours', ventes_jour,
    'produits_plus_vendus', top_produits,
    'stock_faible', stock_faible,
    'commandes_recentes', commandes_recentes
  );

  return resultat;
end;
$$;

revoke all on function statistiques_tableau_de_bord() from anon;
grant execute on function statistiques_tableau_de_bord() to authenticated;

-- ## FICHIER : 0004_stockage_medias.sql

-- =============================================================================
-- ZOUHRI FRAGRANCE - Migration 0004 : Stockage des medias
-- Bucket public en lecture, ecriture reservee au personnel autorise.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medias',
  'medias',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "medias_lecture_publique"
  on storage.objects for select
  using (bucket_id = 'medias');

create policy "medias_insertion_personnel"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'medias' and est_gestionnaire());

create policy "medias_maj_personnel"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'medias' and est_gestionnaire())
  with check (bucket_id = 'medias' and est_gestionnaire());

create policy "medias_suppression_personnel"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'medias' and est_gestionnaire());

-- ## FICHIER : 0005_catalogue_aide.sql

-- =============================================================================
-- ZOUHRI FRAGRANCE - Migration 0005 : Vues et fonctions d'aide au catalogue
-- =============================================================================

-- Produits les plus vendus, calcules sur les commandes non annulees/retournees.
-- SECURITY DEFINER car lignes_commande n'est pas lisible par le public ;
-- seuls un identifiant produit et une quantite agregee sont exposes.
create or replace function produits_meilleures_ventes(p_limite integer default 8)
returns table (produit_id uuid, total_vendu bigint)
language sql
stable
security definer
set search_path = public
as $$
  select lc.produit_id, sum(lc.quantite)::bigint as total_vendu
  from lignes_commande lc
  join commandes c on c.id = lc.commande_id
  where c.statut_commande not in ('ANNULEE', 'RETOURNEE')
    and lc.produit_id is not null
  group by lc.produit_id
  order by total_vendu desc
  limit greatest(p_limite, 1);
$$;

grant execute on function produits_meilleures_ventes(integer) to anon, authenticated;

-- ## FICHIER : seed.sql

-- =============================================================================
-- ZOUHRI FRAGRANCE - Donnees de demonstration (environnement de developpement)
-- Ces donnees sont FICTIVES et servent uniquement au developpement.
-- Les images sont des visuels provisoires, pas de vraies photos produits.
-- Ne pas executer tel quel en production.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Roles d'administration
-- -----------------------------------------------------------------------------
insert into roles_utilisateurs (code, libelle, description) values
  ('ADMIN', 'Administrateur', 'Acces complet, y compris les paramÃ¨tres sensibles.'),
  ('GESTIONNAIRE', 'Gestionnaire', 'Gestion des produits, catÃ©gories, commandes et stocks.'),
  ('LECTEUR', 'Lecteur', 'Consultation des donnÃ©es sans modification.')
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- Parametres de la boutique (valeurs par defaut, modifiables dans l'admin)
-- -----------------------------------------------------------------------------
insert into parametres_boutique (cle, valeur, description) values
  ('identite', jsonb_build_object(
    'nom_boutique', 'ZOUHRI FRAGRANCE',
    'slogan', 'L''art du parfum, Ã  la marocaine',
    'email_contact', '',
    'telephone_contact', '',
    'whatsapp_numero', '',
    'adresse', '',
    'ville', '',
    'pays', 'Maroc'
  ), 'IdentitÃ© commerciale de la boutique (Ã  complÃ©ter).'),
  ('livraison', jsonb_build_object(
    'frais_livraison', 30,
    'seuil_livraison_gratuite', 500,
    'villes_livraison', jsonb_build_array('Casablanca', 'Rabat', 'Marrakech', 'FÃ¨s', 'Tanger'),
    'paiement_a_reception', true
  ), 'RÃ¨gles de livraison et paiement Ã  la rÃ©ception.'),
  ('stock', jsonb_build_object(
    'reservation_heures', 48,
    'seuil_stock_faible', 5
  ), 'ParamÃ¨tres de gestion du stock.'),
  ('banniere', jsonb_build_object(
    'active', false,
    'texte', '',
    'lien', ''
  ), 'BanniÃ¨re promotionnelle de la page d''accueil.'),
  ('seo', jsonb_build_object(
    'titre_defaut', 'ZOUHRI FRAGRANCE â€” Parfums et cosmÃ©tiques au Maroc',
    'description_defaut', 'Boutique de parfums et cosmÃ©tiques au Maroc. Fragrances pour homme, femme et mixte, livrÃ©es partout au Maroc.'
  ), 'MÃ©tadonnÃ©es SEO globales.'),
  ('reseaux', jsonb_build_object(
    'instagram', '',
    'facebook', '',
    'tiktok', ''
  ), 'RÃ©seaux sociaux (liens Ã  complÃ©ter).')
on conflict (cle) do nothing;

-- -----------------------------------------------------------------------------
-- Categories (parfums + emplacements pour de futures cosmÃ©tiques)
-- -----------------------------------------------------------------------------
insert into categories (id, nom, slug, description, categorie_parente_id, ordre_affichage, est_active, titre_seo, description_seo) values
  ('11111111-1111-1111-1111-111111111111', 'Parfums', 'parfums', 'Nos parfums pour homme, femme et mixte.', null, 1, true, 'Parfums au Maroc', 'DÃ©couvrez notre sÃ©lection de parfums au Maroc.'),
  ('11111111-1111-1111-1111-111111111112', 'Parfums pour homme', 'parfums-homme', 'Des fragrances masculines affirmÃ©es et Ã©lÃ©gantes.', '11111111-1111-1111-1111-111111111111', 1, true, 'Parfums pour homme au Maroc', 'Parfums pour homme, tenue longue durÃ©e.'),
  ('11111111-1111-1111-1111-111111111113', 'Parfums pour femme', 'parfums-femme', 'Des fragrances fÃ©minines raffinÃ©es.', '11111111-1111-1111-1111-111111111111', 2, true, 'Parfums pour femme au Maroc', 'Parfums pour femme, Ã©lÃ©gance et caractÃ¨re.'),
  ('11111111-1111-1111-1111-111111111114', 'Parfums mixtes', 'parfums-mixtes', 'Des fragrances unisexes intemporelles.', '11111111-1111-1111-1111-111111111111', 3, true, 'Parfums mixtes au Maroc', 'Parfums mixtes Ã  porter sans distinction.'),
  ('11111111-1111-1111-1111-111111111115', 'CosmÃ©tiques', 'cosmetiques', 'Soins et beautÃ© (catÃ©gorie Ã©volutive).', null, 2, true, 'CosmÃ©tiques au Maroc', 'Soins et cosmÃ©tiques sÃ©lectionnÃ©s.'),
  ('11111111-1111-1111-1111-111111111116', 'Soins du visage', 'soins-du-visage', 'Soins pour le visage.', '11111111-1111-1111-1111-111111111115', 1, true, 'Soins du visage au Maroc', 'Soins du visage hydratants et nourrissants.'),
  ('11111111-1111-1111-1111-111111111117', 'Coffrets cadeaux', 'coffrets-cadeaux', 'Des coffrets prÃªts Ã  offrir.', null, 3, true, 'Coffrets cadeaux parfums au Maroc', 'Coffrets cadeaux parfums et cosmÃ©tiques.')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Produits de demonstration
-- -----------------------------------------------------------------------------
insert into produits (id, nom, slug, description_courte, description, categorie_id, reference_sku, prix_vente, prix_promotionnel, quantite_stock, seuil_stock_faible, est_mis_en_avant, est_publie, titre_seo, description_seo) values
  ('22222222-2222-2222-2222-222222222221', 'Oud Royal', 'oud-royal', 'Un oud profond et boisÃ©, signature de la maison.', 'Oud Royal est une fragrance boisÃ©e et orientale construite autour d''un oud noble, rÃ©chauffÃ© par des notes d''Ã©pices et de cuir. IdÃ©ale pour les grandes occasions.', '11111111-1111-1111-1111-111111111112', 'ZF-OUD-001', 690, 590, 24, 5, true, true, 'Oud Royal â€” Parfum boisÃ© | ZOUHRI FRAGRANCE', 'Oud Royal, parfum boisÃ© et oriental pour homme. Tenue longue durÃ©e. Commande simple au Maroc.'),
  ('22222222-2222-2222-2222-222222222222', 'Fleur de Maroc', 'fleur-de-maroc', 'Un floral lumineux inspirÃ© des jardins marocains.', 'Fleur de Maroc associe la rose, le jasmin et une touche d''agrumes pour un sillage frais et fÃ©minin, parfait au quotidien.', '11111111-1111-1111-1111-111111111113', 'ZF-FLR-002', 550, null, 30, 5, true, true, 'Fleur de Maroc â€” Parfum floral | ZOUHRI FRAGRANCE', 'Fleur de Maroc, parfum floral pour femme. FraÃ®cheur et Ã©lÃ©gance au quotidien.'),
  ('22222222-2222-2222-2222-222222222223', 'Ambre Nuit', 'ambre-nuit', 'Ambre chaud et vanillÃ© pour les soirÃ©es.', 'Ambre Nuit est une fragrance gourmande et enveloppante, mÃªlant ambre, vanille et bois prÃ©cieux. Un parfum mixte pour les soirÃ©es.', '11111111-1111-1111-1111-111111111114', 'ZF-AMB-003', 620, 540, 18, 5, true, true, 'Ambre Nuit â€” Parfum mixte ambrÃ© | ZOUHRI FRAGRANCE', 'Ambre Nuit, parfum mixte ambrÃ© et vanillÃ©. Pour homme et femme.'),
  ('22222222-2222-2222-2222-222222222224', 'Brise Atlantique', 'brise-atlantique', 'Une eau fraÃ®che aux notes marines.', 'Brise Atlantique Ã©voque les embruns : notes marines, bergamote et bois flottÃ©. Une fragrance mixte idÃ©ale en journÃ©e.', '11111111-1111-1111-1111-111111111114', 'ZF-BRI-004', 480, null, 40, 8, false, true, 'Brise Atlantique â€” Eau fraÃ®che mixte | ZOUHRI FRAGRANCE', 'Brise Atlantique, eau fraÃ®che aux notes marines, mixte.'),
  ('22222222-2222-2222-2222-222222222225', 'Huile prÃ©cieuse d''Argan', 'huile-precieuse-argan', 'Huile d''argan vierge pour la peau et les cheveux.', 'Huile d''argan pressÃ©e Ã  froid, riche en vitamine E. Nourrit la peau et sublime les cheveux. Flacon pompe de 100 ml.', '11111111-1111-1111-1111-111111111116', 'ZF-ARG-005', 220, null, 50, 10, false, true, 'Huile prÃ©cieuse d''Argan | ZOUHRI FRAGRANCE', 'Huile d''argan vierge pressÃ©e Ã  froid, soin naturel pour la peau et les cheveux.'),
  ('22222222-2222-2222-2222-222222222226', 'Coffret DÃ©couverte', 'coffret-decouverte', 'Trois miniatures pour dÃ©couvrir la maison.', 'Le Coffret DÃ©couverte rÃ©unit trois formats de voyage : Oud Royal, Fleur de Maroc et Ambre Nuit. IdÃ©al pour offrir.', '11111111-1111-1111-1111-111111111117', 'ZF-COF-006', 350, 299, 12, 4, true, true, 'Coffret DÃ©couverte â€” Trio de parfums | ZOUHRI FRAGRANCE', 'Coffret DÃ©couverte : trois miniatures de parfums ZOUHRI FRAGRANCE Ã  offrir.')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Images de produits (visuels provisoires)
-- -----------------------------------------------------------------------------
insert into images_produits (produit_id, url, texte_alt, est_principale, ordre_affichage) values
  ('22222222-2222-2222-2222-222222222221', '/images/produit-provisoire.svg', 'Visuel provisoire â€” Oud Royal', true, 0),
  ('22222222-2222-2222-2222-222222222222', '/images/produit-provisoire.svg', 'Visuel provisoire â€” Fleur de Maroc', true, 0),
  ('22222222-2222-2222-2222-222222222223', '/images/produit-provisoire.svg', 'Visuel provisoire â€” Ambre Nuit', true, 0),
  ('22222222-2222-2222-2222-222222222224', '/images/produit-provisoire.svg', 'Visuel provisoire â€” Brise Atlantique', true, 0),
  ('22222222-2222-2222-2222-222222222225', '/images/produit-provisoire.svg', 'Visuel provisoire â€” Huile d''Argan', true, 0),
  ('22222222-2222-2222-2222-222222222226', '/images/produit-provisoire.svg', 'Visuel provisoire â€” Coffret DÃ©couverte', true, 0)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Variantes (contenances) pour les parfums
-- -----------------------------------------------------------------------------
insert into variantes_produit (produit_id, nom, contenance, reference_sku, prix_vente, quantite_stock, seuil_stock_faible, ordre_affichage) values
  ('22222222-2222-2222-2222-222222222221', '50 ml', '50 ml', 'ZF-OUD-001-50', 420, 14, 4, 1),
  ('22222222-2222-2222-2222-222222222221', '100 ml', '100 ml', 'ZF-OUD-001-100', 690, 10, 4, 2),
  ('22222222-2222-2222-2222-222222222222', '50 ml', '50 ml', 'ZF-FLR-002-50', 350, 18, 4, 1),
  ('22222222-2222-2222-2222-222222222222', '100 ml', '100 ml', 'ZF-FLR-002-100', 550, 12, 4, 2),
  ('22222222-2222-2222-2222-222222222223', '50 ml', '50 ml', 'ZF-AMB-003-50', 380, 11, 4, 1),
  ('22222222-2222-2222-2222-222222222223', '100 ml', '100 ml', 'ZF-AMB-003-100', 620, 7, 4, 2)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Promotion de demonstration
-- -----------------------------------------------------------------------------
insert into promotions (code, nom, type_reduction, valeur, montant_minimum, limite_utilisation, date_debut, date_fin, est_active) values
  ('BIENVENUE10', 'Bienvenue - 10 %', 'POURCENTAGE', 10, 300, 100, now() - interval '1 day', now() + interval '90 days', true)
on conflict (code) do nothing;

