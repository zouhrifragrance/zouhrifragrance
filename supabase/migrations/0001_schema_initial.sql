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
