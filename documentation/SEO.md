# SEO

Le référencement est pris en charge nativement par le **Metadata API** de Next.js,
complété par des **données structurées Schema.org**, un sitemap et un
`robots.txt`.

## Métadonnées globales

Définies dans `app/layout.tsx` :

- `metadataBase` basé sur `NEXT_PUBLIC_SITE_URL` ;
- `title.default` + `title.template` (`%s | ZOUHRI FRAGRANCE`) ;
- `description`, `keywords`, `authors`, `category` ;
- **Open Graph** (`type: website`, locale `fr_MA`, image `logo-zouhri.png`) ;
- **Twitter Card** (`summary_large_image`) ;
- `robots` (index + follow, `max-image-preview: large`) ;
- icônes (favicon + apple) ;
- `viewport` (`width=device-width`, `themeColor` or `#B58A3A`).

Chaque page définit ensuite son propre `metadata` (titre, description, canonical).
Le template de `lib/site.ts` centralise nom, slogan, description et mots-clés.

## Données structurées (JSON-LD)

| Emplacement                          | Type Schema.org                          |
| ------------------------------------ | ---------------------------------------- |
| `app/(boutique)/layout.tsx`          | `Organization` + `WebSite` (avec `SearchAction`) |
| `app/(boutique)/produits/[slug]`     | `Product` (offre, prix, devise, disponibilité, marque, image) |
| `app/(boutique)/categories/[slug]`   | `ItemList` / collection                  |
| `components/boutique/fil-ariane.tsx` | `BreadcrumbList`                          |

Les blocs sont injectés via `<script type="application/ld+json">`.

## Sitemap

`app/sitemap.ts` génère dynamiquement le sitemap (`revalidate = 3600`) :

- pages statiques (accueil, boutique, nouveautés, meilleures ventes, contenu
  éditorial) avec `priority` et `changeFrequency` ;
- pages catégories et pages produits (avec `lastModified` réel).

En mode démo ou si la base est indisponible, les listes sont catchées pour ne
jamais casser la génération.

## robots.txt

`app/robots.ts` autorise tout le site sauf :

```
Disallow: /admin
Disallow: /commande
Disallow: /panier
Disallow: /api
Disallow: /suivi-commande
```

Il référence le sitemap (`/sitemap.xml`) et déclare l'hôte.

## Pages non indexées

- L'administration (`app/admin/layout.tsx`) définit `robots: { index: false }`.
- Les pages de commande, panier et suivi de commande sont exclues de
  l'indexation via `robots.txt` (et ne présentent pas d'intérêt éditorial).

## Bonnes pratiques appliquées

- Une seule balise `canonical` par page (vérifiée par un test e2e).
- Structure de titres cohérente (`h1` unique par page).
- `alt` renseigné sur les images (`texte_alt` en base).
- URLs lisibles et stables : slugs en minuscules avec tirets
  (contrainte SQL `slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`).
- Contenu en français (`lang="fr"`), locale `fr_MA`.
- Performance : Server Components, `next/font` (Cormorant Garamond + Inter en
  `display: swap`), images optimisées via `next/image`.

## Champs SEO administrables

- Produits : `titre_seo`, `description_seo`.
- Catégories : `titre_seo`, `description_seo`.
- Paramètres boutique : titre et description par défaut.
