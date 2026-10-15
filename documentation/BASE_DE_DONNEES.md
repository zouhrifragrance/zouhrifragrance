# Base de données

Base **PostgreSQL** hébergée par Supabase. Toutes les tables et colonnes métier
sont nommées **en français, en `snake_case`, sans accents**.

## Enums

| Enum                  | Valeurs                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| `role_utilisateur`    | `ADMIN`, `GESTIONNAIRE`, `LECTEUR`                                                       |
| `statut_commande`     | `EN_ATTENTE_CONFIRMATION`, `CONFIRMEE`, `EN_PREPARATION`, `EXPEDIEE`, `LIVREE`, `ANNULEE`, `RETOURNEE` |
| `statut_paiement`     | `NON_PAYE`, `A_PAYER_LIVRAISON`, `PAYE`, `REMBOURSE`                                     |
| `type_mouvement_stock`| `ENTREE`, `SORTIE`, `RESERVATION`, `LIBERATION`, `AJUSTEMENT`, `RETOUR`                  |
| `type_reduction`      | `POURCENTAGE`, `MONTANT_FIXE`                                                            |

## Tables

### Administration

| Table                             | Rôle                                                             |
| --------------------------------- | --------------------------------------------------------------- |
| `roles_utilisateurs`              | Référentiel des rôles (code, libellé).                          |
| `profils_utilisateurs`            | Profil applicatif lié à `auth.users` (`nom_complet`, `role`, `est_actif`). |
| `journaux_activite_administration`| Journal des actions d'administration.                           |

### Catalogue

| Table              | Rôle                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| `categories`       | Catégories et sous-catégories (`categorie_parente_id`, slug unique, ordre, SEO). Anti-cycle garanti par trigger. |
| `produits`         | Produit (`prix_vente`, `prix_promotionnel`, `quantite_stock`, `seuil_stock_faible`, `est_publie`, `est_mis_en_avant`, SEO). |
| `images_produits`  | Images d'un produit ; une seule principale par produit (index partiel unique).       |
| `variantes_produit`| Déclinaisons (contenance, SKU, prix, stock). Le stock du produit sert de repli.       |

### Commandes

| Table                           | Rôle                                                                 |
| ------------------------------- | -------------------------------------------------------------------- |
| `commandes`                     | Commande client : coordonnées, statuts, montants, `cle_idempotence` unique, `reservation_expire_le`, `stock_libere`. |
| `lignes_commande`               | Instantané des articles (nom, SKU, prix unitaire, quantité, montant).|
| `historique_statuts_commande`   | Journal des transitions de statut (précédent → nouveau, commentaire, acteur). |
| `jetons_suivi_commande`         | Jetons de suivi : `empreinte_jeton` (SHA-256, unique), expiration, révocation. Le secret en clair n'est **jamais** stocké. |
| `mouvements_stock`              | Tracé complet des mouvements (`type_mouvement`, `quantite` signée, motif, commande, utilisateur). |

### Promotions et marketing

| Table                    | Rôle                                                                              |
| ------------------------ | --------------------------------------------------------------------------------- |
| `promotions`             | Codes promo (type, valeur, minimum, limite, ciblage `categories_ids`/`produits_ids`, dates, activation). |
| `utilisations_promotions`| Consommation d'une promotion par commande (unicité `promotion_id` + `commande_id`).|
| `inscriptions_newsletter`| E-mails newsletter (type `citext`, unique).                                        |
| `parametres_boutique`    | Paramètres clé/valeur JSONB (`identite`, `livraison`, `stock`, `banniere`, `seo`, `reseaux`). |

## Triggers principaux

- `maj_date_modification()` : met à jour `date_modification` sur `update` (profils,
  catégories, produits, variantes, commandes, promotions…).
- `empecher_cycle_categorie()` : interdit les cycles dans la hiérarchie des catégories.
- `creer_profil_utilisateur()` (sur `auth.users`, `SECURITY DEFINER`) : crée le
  profil à l'inscription, avec le rôle lu dans `raw_user_meta_data.role`.

## Fonctions métier (RPC)

Toutes les fonctions sensibles sont `SECURITY DEFINER` avec `search_path = public`.

| Fonction                                             | Accès                   | Description                                                        |
| ---------------------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| `creer_commande(donnees jsonb, cle_idempotence text)`| `anon`, `authenticated` | Crée la commande de façon atomique, réserve le stock, calcule les montants, génère le numéro et le jeton de suivi. |
| `suivre_commande(jeton text)`                        | `anon`, `authenticated` | Renvoie le suivi d'une commande à partir du jeton (haché puis comparé). |
| `valider_promotion(code text, sous_total numeric, articles jsonb)` | `anon`, `authenticated` | Valide un code promo et calcule la réduction.        |
| `changer_statut_commande(id uuid, statut statut_commande, commentaire text)` | `authenticated` | Change le statut en respectant les transitions autorisées. |
| `confirmer_commande(id uuid, commentaire text)`      | `authenticated`         | Raccourci de confirmation.                                         |
| `liberer_stock_commande(id uuid, motif text)`        | `authenticated`         | Libère le stock réservé (annulation/expiration).                   |
| `statistiques_tableau_de_bord()`                     | `authenticated`         | KPIs du tableau de bord (réservé au personnel).                    |
| `transitions_autorisees(statut)` / `transition_valide(depuis, vers)` | `authenticated` | Helpers de validation des transitions.              |
| `produits_meilleures_ventes(limite integer)`         | `anon`, `authenticated` | Produits les plus vendus (agrégat, SECURITY DEFINER).              |
| `est_admin()`, `est_gestionnaire()`, `est_personnel()`| `authenticated`, `anon`| Helpers utilisés par les politiques RLS.                          |

### Transitions de statut

```
EN_ATTENTE_CONFIRMATION → CONFIRMEE | ANNULEE
CONFIRMEE               → EN_PREPARATION | ANNULEE
EN_PREPARATION          → EXPEDIEE | ANNULEE
EXPEDIEE                → LIVREE | RETOURNEE
LIVREE                  → RETOURNEE
```

## Stockage (Storage)

Un bucket **`medias`** (public en lecture) est créé par la migration `0004`.
L'écriture est réservée au personnel (`est_gestionnaire()`), en lecture publique.
Les fichiers de produits (visuels) y sont stockés.

## Numérotation et jetons

- `sequence_numero_commande` démarre à 1000. Le numéro de commande suit le format
  `ZF-YYYYMMDD-000123-XXXXXX`.
- Le jeton de suivi est un secret de 32 octets (hexadécimal) ; seul son
  **SHA-256** est stocké dans `empreinte_jeton`. Il possède une date d'expiration
  et un flag de révocation.

## Migrations

| Fichier                     | Objet                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| `0001_schema_initial.sql`   | Tables, enums, index, triggers, contraintes.                     |
| `0002_securite_rls.sql`     | RLS, politiques, helpers de rôle, trigger de création de profil. |
| `0003_fonctions_metier.sql` | RPC commandes, promotions, transitions, statistiques.            |
| `0004_stockage_medias.sql`  | Bucket `medias` et politiques Storage.                           |
| `0005_catalogue_aide.sql`   | `produits_meilleures_ventes`.                                    |

Le fichier `supabase/seed.sql` insère des catégories, produits et paramètres de
base pour démarrer rapidement.
