# Architecture

## Vue d'ensemble

ZOUHRI FRAGRANCE est une application **Next.js 15 App Router** adossée à
**Supabase / PostgreSQL**. Elle expose deux surfaces dans une même application :

- la **boutique publique** (`app/(boutique)`), sans authentification client ;
- l'**administration** (`app/admin`), protégée par Supabase Auth et des rôles.

Les données sont lues et écrites via deux chemins complémentaires :

- des **services** (`services/*`) pour la lecture (Server Components) ;
- des **Server Actions** (`app/actions/*`) pour les mutations.

## Arborescence applicative

```
applications/boutique/
├── app/
│   ├── (boutique)/            # Route group public (layout avec en-tête/pied)
│   │   ├── page.tsx           # Accueil
│   │   ├── boutique/          # Catalogue + filtres
│   │   ├── categories/[slug]/ # Page catégorie
│   │   ├── produits/[slug]/   # Fiche produit
│   │   ├── nouveautes/ meilleures-ventes/
│   │   ├── panier/ commande/ suivi-commande/
│   │   ├── contact/           # Formulaire WhatsApp / e-mail
│   │   └── notre-histoire/ conditions-generales/ confidentialite/ livraison-retours/
│   ├── admin/
│   │   ├── layout.tsx         # Metadata noindex (pas de garde)
│   │   ├── connexion/         # Connexion (hors garde)
│   │   └── (tableau)/         # Zone protégée + CoquilleAdmin
│   │       ├── page.tsx       # Tableau de bord
│   │       ├── commandes/ produits/ categories/ stocks/ promotions/ parametres/
│   ├── actions/               # Server Actions (commande, newsletter, admin-*)
│   ├── sitemap.ts robots.ts   # SEO technique
│   ├── not-found.tsx loading.tsx error.tsx
│   └── layout.tsx globals.css
├── components/
│   ├── ui/                    # Primitives (button, input, alert, badge…)
│   ├── layout/                # entete, pied-de-page, tiroir-panier
│   ├── brand/                 # logo, image-produit
│   ├── boutique/              # cartes, grilles, filtres, galerie…
│   ├── commande/              # contenu-panier, formulaire-commande
│   ├── contact/ contenu/      # formulaire contact, pages éditoriales
│   └── admin/                 # formulaires et composants d'administration
├── hooks/use-panier.tsx       # Contexte panier + persistance localStorage
├── lib/
│   ├── supabase/              # client navigateur, serveur, service_role
│   ├── auth-admin.ts          # Gardes de rôle
│   ├── env.ts site.ts         # Configuration
│   ├── panier.ts utils.ts     # Logique panier, helpers
│   └── donnees-demo.ts        # Jeu de données de démonstration
├── schemas/                   # Schémas Zod (commande, produit, catégorie)
├── services/                  # Accès données (Supabase / démo)
├── types/                     # Types métier + types de la base
└── tests/                     # unit/ (Vitest), e2e/ (Playwright)
```

## Flux de données

### Lecture (public)

Les Server Components appellent les fonctions de `services/*`. Chaque service :

1. vérifie si le mode démo est actif (`donneesDemoActives()`) ;
2. sinon crée un client Supabase **serveur** (clé anon + cookies) ;
3. interroge PostgreSQL — les politiques RLS limitent les données visibles.

Les réponses sont mises en cache via `React.cache` lorsque pertinent.

### Écriture (Server Actions)

Les mutations passent par des Server Actions :

- `app/actions/commande.ts` — création de commande (RPC `creer_commande`) ;
- `app/actions/newsletter.ts` — inscription newsletter ;
- `app/actions/admin-*.ts` — administration, précédées d'une garde de rôle.

Les fonctions utilisées avec `useActionState` ont la signature
`(étatPrécédent, formData) => Promise<État>` et **ne modifient pas l'ordre des
arguments** (voir la note sur les actions admin réutilisées).

## Authentification et rôles

- L'administration utilise **Supabase Auth**. `middleware.ts` (racine de
  `applications/boutique`) intercepte `/admin` et redirige vers
  `/admin/connexion` si Supabase n'est pas configuré ou si la session est absente.
- Les Server Components/actions appellent les gardes de `lib/auth-admin.ts` :
  - `exigerUtilisateurAdmin()` — exige une session ;
  - `exigerNiveau(role)` — exige un niveau minimal ;
  - `peutGerer(role)` — test booléen.
- Hiérarchie : `LECTEUR` (1) < `GESTIONNAIRE` (2) < `ADMIN` (3).

## Panier

Le panier vit **côté client** (`hooks/use-panier.tsx`) et est persisté dans
`localStorage`. La logique pure (calculs, fusion de lignes, contrôle de stock)
est isolée dans `lib/panier.ts`, ce qui la rend testable sans navigateur.

La commande valide le panier côté serveur au moment de la création : les prix et
stocks sont rechargés depuis la base, jamais trustés depuis le client.

## Composants UI

Les primitives de `components/ui/` suivent le modèle shadcn (Radix + Tailwind).
Variantes notables :

- `Alert` : `info | success | warning | danger` (prop `titre`) ;
- `Badge` : `default | neutral | success | warning | danger | solid`.

## Mode démo

Lorsque Supabase n'est pas configuré (ou `NEXT_PUBLIC_DEMO_MODE=1`),
`services/*` retournent les données de `lib/donnees-demo.ts`. Le mode démo :

- permet d'exécuter l'application et les tests e2e sans base ;
- utilise des images provisoires (`public/images/*-provisoire.svg`) ;
- n'introduit **aucune fausse photo de produit ni faux avis client**.

## Tests

- **Unitaire (Vitest, jsdom)** : `lib/panier`, `lib/utils`, schémas Zod.
- **e2e (Playwright)** : parcours public + vérification responsive sur 7
  viewports (320×568 → 1920×1080), contrôle d'absence de débordement horizontal.
