# Sécurité

## Principes

1. **Aucun secret côté client.** La clé `service_role` n'est utilisée que par des
   scripts d'administration serveur et n'est jamais préfixée `NEXT_PUBLIC_`.
2. **Défense en profondeur.** L'interface masque ce qui n'est pas permis, mais la
   vérité est dans les politiques **Row Level Security (RLS)** et les gardes de
   rôle côté serveur.
3. **Moindre privilège.** Les rôles `ADMIN`, `GESTIONNAIRE`, `LECTEUR` sont
   hiérarchisés et filtrent l'accès aux données comme aux écrans.

## Row Level Security

RLS est activée sur **toutes** les tables métier (`0002_securite_rls.sql`).
Politiques principales :

| Table                         | Lecture                                        | Écriture                          |
| ----------------------------- | ---------------------------------------------- | --------------------------------- |
| `categories`                  | publique si `est_active`                       | gestionnaire                      |
| `produits`                    | publique si `est_publie`                       | gestionnaire                      |
| `images_produits` / `variantes_produit` | publique (produit publié)         | gestionnaire                      |
| `commandes`                   | personnel uniquement                           | création via RPC, gestionnaire pour le reste |
| `lignes_commande`             | personnel uniquement                           | via RPC                            |
| `jetons_suivi_commande`       | personnel uniquement                           | via RPC                            |
| `mouvements_stock`            | personnel                                      | gestionnaire (insertion)          |
| `promotions`                  | gestionnaire                                   | gestionnaire                      |
| `inscriptions_newsletter`     | personnel                                      | insertion publique (RPC/action)   |
| `parametres_boutique`         | publique (valeurs non sensibles)               | admin                             |
| `profils_utilisateurs`        | soi-même ou admin                              | admin                             |
| `roles_utilisateurs`          | authentifié                                    | admin                             |
| `journaux_activite_administration` | admin                                     | système                           |

Les helpers `est_admin()`, `est_gestionnaire()` et `est_personnel()` sont
`SECURITY DEFINER` : ils lisent `profils_utilisateurs` en contournant RLS pour
éviter toute récursion de politique.

## Accès anonyme contrôlé

Le parcours d'achat ne nécessite **aucun compte**. Les seules opérations
anonymes autorisées passent par des RPC `SECURITY DEFINER` qui valident et
recalculent tout côté serveur :

- `creer_commande(...)` — recharge les prix et stocks depuis la base, ne fait
  jamais confiance aux montants envoyés par le client ;
- `suivre_commande(jeton)` — exige un jeton valide, non expiré et non révoqué ;
- `valider_promotion(...)` — vérifie les règles de la promotion.

## Authentification administrateur

- Supabase Auth (e-mail + mot de passe).
- `middleware.ts` protège le préfixe `/admin` : redirection vers
  `/admin/connexion` si la session est absente (ou vers `?configuration=1` si
  Supabase n'est pas configuré).
- Les Server Components/Actions re-vérifient systématiquement le rôle via
  `lib/auth-admin.ts` (`exigerUtilisateurAdmin`, `exigerNiveau`, `peutGerer`).
  Le middleware ne suffit jamais à lui seul.
- Le rôle est attribué à la création du compte via les métadonnées
  `raw_user_meta_data.role` (défaut `LECTEUR`) et contrôlé par le trigger
  `creer_profil_utilisateur`.

## Jetons de suivi de commande

- Secret aléatoire de 32 octets (hexadécimal).
- Seul le **SHA-256** du jeton est stocké (`empreinte_jeton`, unique).
- Chaque jeton a une date d'expiration et peut être révoqué
  (`est_revoque`).
- Le jeton transite par l'URL de suivi (`/suivi-commande?jeton=...`) ; les pages
  concernées sont en `noindex`.

## Intégrité des commandes

- `cle_idempotence` unique : une même tentative de commande ne peut pas créer de
  doublon (protection contre les doubles clics / retries réseau).
- Le stock est **réservé** à la création via `mouvements_stock` de type
  `RESERVATION` ; il est **libéré** (`LIBERATION`) via `liberer_stock_commande`
  en cas d'annulation, d'expiration ou d'action manuelle.
- Les transitions de statut sont contraintes (`transition_valide`) : impossible
  de passer d'un statut arbitraire à un autre.

## Bonnes pratiques appliquées

- Validation systématique des entrées avec **Zod** (côté client et serveur).
- Aucune donnée sensible dans les journaux : les erreurs Supabase sont
  journalisées via `console.error` sans exposer de secrets.
- En-têtes de sécurité et redirections gérés par Next.js ; `robots.txt` exclut
  l'administration et les pages de commande.
- `.env.local` ignoré par Git (`.gitignore`) ; seul `.env.example` est versionné.

## Signaler une faille

Merci de ne pas ouvrir d'issue publique pour une vulnérabilité. Contacter
directement l'équipe ZOUHRI FRAGRANCE avec une description et, si possible, une
reproduction.
