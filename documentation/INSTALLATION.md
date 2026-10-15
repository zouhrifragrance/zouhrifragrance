# Installation

Ce guide décrit la mise en place complète de ZOUHRI FRAGRANCE en local et en
production.

## Prérequis

- **Node.js ≥ 20.9** (testé avec Node 24)
- **npm ≥ 10**
- Un projet **Supabase** (cloud ou auto-hébergé) — ou l'application en mode démo
- La **CLI Supabase** (uniquement pour appliquer les migrations) :
  `npm install -g supabase` ou via `npx supabase`

## 1. Récupérer le projet et installer les dépendances

```bash
git clone <url-du-depot> zouhri-fragrance
cd zouhri-fragrance
npm install
```

Le projet est un **monorepo npm workspaces**. Le code applicatif se trouve dans
`applications/boutique`.

## 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Renseigner dans `.env.local` :

| Variable                            | Obligatoire | Description                                             |
| ----------------------------------- | ----------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`          | oui\*       | URL du projet Supabase                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | oui\*       | Clé publique `anon` (protégée par RLS)                  |
| `SUPABASE_SERVICE_ROLE_KEY`         | non         | Clé serveur pour scripts d'admin (ne jamais exposer)    |
| `NEXT_PUBLIC_SITE_URL`              | oui         | URL publique du site (metadata, sitemap, Open Graph)    |
| `NEXT_PUBLIC_DEVISE`                | non         | Devise affichée (défaut `MAD`)                          |
| `NEXT_PUBLIC_FRAIS_LIVRAISON`       | non         | Frais de livraison par défaut                           |
| `NEXT_PUBLIC_SEUIL_LIVRAISON_GRATUITE` | non      | Seuil de gratuité de la livraison                       |
| `NEXT_PUBLIC_WHATSAPP_NUMERO`       | non         | Numéro WhatsApp professionnel (format international)    |
| `NEXT_PUBLIC_PAIEMENT_A_RECEPTION`  | non         | Activer le paiement à la réception (`true`/`false`)     |
| `STOCK_RESERVATION_HEURES`          | non         | Durée de réservation du stock (défaut 48 h)             |
| `NEXT_PUBLIC_DEMO_MODE`             | non         | `1` force le mode démonstration                         |

\* Sans ces deux variables, l'application démarre en mode démo.

## 3. Base de données Supabase

### 3.1 Appliquer les migrations

```bash
# Lier le projet local à votre projet Supabase
supabase link --project-ref <votre-ref>

# Appliquer les migrations (dossier supabase/migrations)
npm run db:migrate
```

Les migrations sont idempotentes et doivent être appliquées dans l'ordre :

| Fichier                          | Contenu                                        |
| -------------------------------- | ---------------------------------------------- |
| `0001_schema_initial.sql`        | Tables, enums, index, triggers de dates        |
| `0002_securite_rls.sql`          | Row Level Security et politiques d'accès       |
| `0003_fonctions_metier.sql`      | RPC métier (commandes, promotions, stats)      |
| `0004_stockage_medias.sql`       | Bucket Storage `medias` + politiques           |
| `0005_catalogue_aide.sql`        | Vues/fonctions d'aide catalogue                |

### 3.2 Données initiales

```bash
# Option A : via la CLI (exécute supabase/seed.sql)
supabase db reset        # ⚠ réinitialise complètement la base

# Option B : coller le contenu de supabase/seed.sql
# dans l'éditeur SQL de Supabase
```

Le seed crée les catégories de base, quelques produits de démonstration et les
paramètres de la boutique.

### 3.3 Créer le premier administrateur

Un trigger (`trg_auth_creer_profil`) crée automatiquement une ligne dans
`profils_utilisateurs` à chaque création de compte Auth, en lisant le rôle dans
les métadonnées de l'utilisateur (`raw_user_meta_data.role`, défaut `LECTEUR`).

Méthode recommandée :

1. Dans Supabase → **Authentication**, créer un utilisateur, en renseignant les
   métadonnées `{ "role": "ADMIN", "nom_complet": "Nom Prénom" }`.
2. Le trigger crée alors le profil avec le rôle `ADMIN`.
3. L'utilisateur peut se connecter sur `/admin/connexion`.

Alternative : créer l'utilisateur normalement puis, depuis l'éditeur SQL
(qui s'exécute avec un rôle de service), promouvoir le profil :

```sql
update profils_utilisateurs
set role = 'ADMIN'
where id = '<uuid-de-l-utilisateur>';
```

Les rôles disponibles sont `ADMIN`, `GESTIONNAIRE` et `LECTEUR`.

## 4. Lancer le projet

```bash
# Développement
npm run dev            # http://localhost:3000

# Vérifications
npm run typecheck
npm run lint
npm test               # tests unitaires
npm run test:e2e       # tests end-to-end (nécessite les navigateurs Playwright)

# Production
npm run build
npm run start
```

### Navigateurs Playwright

Au premier lancement des tests e2e :

```bash
npx playwright install --with-deps chromium
```

Les tests e2e suppose un rendu **mode démo** lorsque `PLAYWRIGHT_BASE_URL` n'est
pas défini : la configuration démarre automatiquement `npm run dev`.

## 5. Déploiement (Vercel recommandé)

1. Importer le dépôt dans Vercel.
2. Définir le **Root Directory** sur `applications/boutique` (ou utiliser les
   scripts workspaces à la racine).
3. Renseigner les variables d'environnement de production.
4. Définir `NEXT_PUBLIC_SITE_URL` sur l'URL publique finale.
5. Déployer.

> La clé `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être exposée au navigateur ni
> préfixée par `NEXT_PUBLIC_`.
