import { z } from "zod";

const prixSchema = z
  .number({ invalid_type_error: "Le prix est invalide." })
  .min(0, "Le prix ne peut pas être négatif.")
  .max(1_000_000, "Le prix est trop élevé.");

const optionnelTexte = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((valeur) => (valeur ? valeur : null));

export const varianteSchema = z.object({
  id: z.string().uuid().optional(),
  nom: z.string().trim().min(1, "Le nom de la variante est obligatoire.").max(80),
  contenance: optionnelTexte(60),
  reference_sku: optionnelTexte(60),
  prix_vente: z
    .union([prixSchema, z.null()])
    .optional()
    .transform((valeur) => (valeur === undefined ? null : valeur)),
  prix_promotionnel: z
    .union([prixSchema, z.null()])
    .optional()
    .transform((valeur) => (valeur === undefined ? null : valeur)),
  quantite_stock: z.coerce
    .number({ invalid_type_error: "Stock invalide." })
    .int("Le stock doit être un entier.")
    .min(0, "Le stock ne peut pas être négatif."),
  seuil_stock_faible: z.coerce
    .number()
    .int()
    .min(0)
    .default(5),
  est_active: z.boolean().default(true),
  ordre_affichage: z.coerce.number().int().min(0).default(0),
});

export const produitSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(2, "Le nom du produit est obligatoire.")
      .max(120),
    slug: z
      .string()
      .trim()
      .min(2, "Le slug est obligatoire.")
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: "Le slug ne peut contenir que des minuscules, chiffres et tirets.",
      }),
    description_courte: optionnelTexte(280),
    description: optionnelTexte(8000),
    categorie_id: z
      .union([z.string().uuid(), z.literal("")])
      .optional()
      .transform((valeur) => (valeur ? valeur : null)),
    reference_sku: optionnelTexte(60),
    prix_vente: prixSchema,
    prix_promotionnel: z
      .union([prixSchema, z.null()])
      .optional()
      .transform((valeur) => (valeur === undefined ? null : valeur)),
    devise: z.string().trim().min(1).max(8).default("MAD"),
    quantite_stock: z.coerce
      .number({ invalid_type_error: "Stock invalide." })
      .int()
      .min(0, "Le stock ne peut pas être négatif.")
      .default(0),
    seuil_stock_faible: z.coerce.number().int().min(0).default(5),
    est_mis_en_avant: z.boolean().default(false),
    est_publie: z.boolean().default(false),
    titre_seo: optionnelTexte(70),
    description_seo: optionnelTexte(180),
    images: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          url: z.string().trim().url("URL d'image invalide."),
          texte_alt: optionnelTexte(160),
          est_principale: z.boolean().default(false),
          ordre_affichage: z.coerce.number().int().min(0).default(0),
        }),
      )
      .max(8, "Maximum 8 images par produit.")
      .default([]),
    variantes: z.array(varianteSchema).max(30).default([]),
  })
  .superRefine((donnees, ctx) => {
    if (
      donnees.prix_promotionnel !== null &&
      donnees.prix_promotionnel !== undefined &&
      donnees.prix_promotionnel >= donnees.prix_vente
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prix_promotionnel"],
        message: "Le prix promotionnel doit être inférieur au prix de vente.",
      });
    }
  });

export type DonneesProduit = z.input<typeof produitSchema>;
export type DonneesProduitValidees = z.output<typeof produitSchema>;
