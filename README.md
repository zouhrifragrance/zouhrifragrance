# ZOUHRI FRAGRANCE

Boutique e-commerce de parfums et cosmétiques au Maroc. Application complète et
fonctionnelle basée sur **Next.js 15 (App Router)** et **Supabase / PostgreSQL**.

Le parcours d'achat est volontairement simple : pas de compte obligatoire, pas de
paiement en ligne. Le client commande, le personnel confirme manuellement la
commande, puis coordonne la livraison avec paiement à la réception.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Scripts](#scripts)
- [Structure du projet](#structure-du-projet)
- [Documentation](#documentation)
- [Mode démo](#mode-démo)

## Fonctionnalités

### Boutique publique

- Catalogue dynamique : catégories et sous-catégories extensibles sans modifier le
  code, variantes de produits (contenance, prix, stock).
- Fiche produit avec galerie, sélecteur de variante, produits similaires et
  données structurées Schema.org (`Product`).
- Recherche / filtres catalogue, tri, pagination.
- Panier persistant (localStorage) avec contrôle de stock.
- Commande sans compte : nom, téléphone, ville, adresse. Aucun paiement en ligne.
- Suivi de commande par jeton sécurisé (le jeton en clair n'est jamais stocké :
  seul son hachage SHA-256 est conservé).
- Pages éditoriales : notre histoire, livraison & retours, CGV, confidentialité.
- Formulaire de contact (WhatsApp / e-mail).

### Administration

- Authentification par rôles : `ADMIN`, `GESTIONNAIRE`, `LECTEUR`.
- Tableau de bord : statistiques 30 jours, stock faible, commandes récentes,
  meilleures ventes.
- Commandes : liste filtrable, détail, changement de statut, libération de stock.
- Produits : CRUD complet, variantes, images, publication.
- Catégories : CRUD, hiérarchie, activation.
- Stocks : alertes de stock faible, ajustements tracés par mouvements.
- Promotions : codes de réduction (pourcentage / montant fixe), ciblage catégories
  ou produits, limites et dates.
- Paramètres boutique : coordonnées, livraison, stock, bannière, SEO, réseaux.

## Stack technique

| Domaine        | Choix                                             |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 15 (App Router, Server Actions)           |
| UI             | React 19, Tailwind CSS 3.4, Radix UI, Lucide      |
| Animations     | Framer Motion                                     |
| Formulaires    | react-hook-form + Zod                             |
| Base de données| Supabase (PostgreSQL) + Row Level Security        |
| Auth           | Supabase Auth (côté administration)               |
| Tests          | Vitest (unitaire) + Playwright (e2e, 7 viewports) |

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
#   puis renseigner NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Appliquer les migrations Supabase (CLI requise)
npm run db:migrate

# 4. Lancer le serveur de développement
npm run dev
```

Sans configuration Supabase, l'application démarre en **mode démo** (voir plus bas).
Pour l'installation détaillée, consulter [documentation/INSTALLATION.md](documentation/INSTALLATION.md).

## Scripts

| Commande                | Description                                  |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Serveur de développement                     |
| `npm run build`         | Build de production                          |
| `npm run start`         | Serveur de production                        |
| `npm run lint`          | Lint ESLint                                  |
| `npm run typecheck`     | Vérification TypeScript                      |
| `npm test`              | Tests unitaires (Vitest)                     |
| `npm run test:e2e`      | Tests end-to-end (Playwright)                |
| `npm run db:migrate`    | Applique les migrations (`supabase db push`) |
| `npm run db:reset`      | Réinitialise la base (`supabase db reset`)   |

## Structure du projet

```
zouhri-fragrance/
├── applications/
│   └── boutique/                 # Application Next.js
│       ├── app/                  # App Router (public + admin)
│       ├── components/           # UI, boutique, commande, admin
│       ├── hooks/                # use-panier (contexte + localStorage)
│       ├── lib/                  # utils, env, panier, auth-admin, supabase
│       ├── schemas/              # Schémas Zod
│       ├── services/             # Accès aux données (Supabase / démo)
│       ├── tests/                # Tests unitaires et e2e
│       └── types/                # Types TS + types de la base
├── supabase/
│   ├── migrations/               # 0001 → 0005
│   ├── seed.sql                  # Catégories, produits, paramètres de base
│   └── config.toml
├── documentation/                # Documentation du projet
└── .env.example
```

## Documentation

- [Installation](documentation/INSTALLATION.md)
- [Architecture](documentation/ARCHITECTURE.md)
- [Base de données](documentation/BASE_DE_DONNEES.md)
- [Sécurité](documentation/SECURITE.md)
- [SEO](documentation/SEO.md)

## Mode démo

Quand `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` ne sont pas
renseignés (ou que `NEXT_PUBLIC_DEMO_MODE=1`), l'application affiche un jeu de
données de démonstration (`lib/donnees-demo.ts`) avec des images provisoires.
Aucune fausse photo de produit ni faux avis client n'est utilisé. Le mode démo
sert au développement et aux tests : il ne dépend d'aucune base de données.
