import { z } from "zod";

const optionnelTexte = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((valeur) => (valeur ? valeur : null));

export const categorieSchema = z.object({
  nom: z.string().trim().min(2, "Le nom de la catégorie est obligatoire.").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Le slug est obligatoire.")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Le slug ne peut contenir que des minuscules, chiffres et tirets.",
    }),
  description: optionnelTexte(1000),
  image_url: z
    .union([z.string().trim().url("URL d'image invalide."), z.literal("")])
    .optional()
    .transform((valeur) => (valeur ? valeur : null)),
  categorie_parente_id: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((valeur) => (valeur ? valeur : null)),
  ordre_affichage: z.coerce.number().int().min(0).default(0),
  est_active: z.boolean().default(true),
  titre_seo: optionnelTexte(70),
  description_seo: optionnelTexte(180),
});

export type DonneesCategorie = z.input<typeof categorieSchema>;
export type DonneesCategorieValidees = z.output<typeof categorieSchema>;

export const promotionSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Le code doit contenir au moins 3 caractères.")
      .max(40)
      .transform((valeur) => valeur.toUpperCase()),
    nom: z.string().trim().min(2, "Le nom de la promotion est obligatoire.").max(120),
    type_reduction: z.enum(["POURCENTAGE", "MONTANT_FIXE"], {
      errorMap: () => ({ message: "Type de réduction invalide." }),
    }),
    valeur: z.coerce
      .number({ invalid_type_error: "Valeur invalide." })
      .positive("La valeur doit être positive."),
    montant_minimum: z.coerce.number().min(0).default(0),
    limite_utilisation: z
      .union([z.coerce.number().int().positive(), z.null()])
      .optional()
      .transform((valeur) => (valeur === undefined ? null : valeur)),
    categories_ids: z.array(z.string().uuid()).default([]),
    produits_ids: z.array(z.string().uuid()).default([]),
    date_debut: z.string().min(1, "La date de début est obligatoire."),
    date_fin: z
      .union([z.string().min(1), z.literal("")])
      .optional()
      .transform((valeur) => (valeur ? valeur : null)),
    est_active: z.boolean().default(true),
  })
  .superRefine((donnees, ctx) => {
    if (donnees.type_reduction === "POURCENTAGE" && donnees.valeur > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valeur"],
        message: "Une réduction en pourcentage ne peut pas dépasser 100 %.",
      });
    }
    if (
      donnees.date_fin &&
      new Date(donnees.date_fin).getTime() < new Date(donnees.date_debut).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_fin"],
        message: "La date de fin doit être postérieure à la date de début.",
      });
    }
  });

export type DonneesPromotion = z.input<typeof promotionSchema>;
export type DonneesPromotionValidees = z.output<typeof promotionSchema>;

export const parametresBoutiqueSchema = z.object({
  nom_boutique: z.string().trim().min(2).max(120),
  slogan: z.string().trim().max(160).optional().or(z.literal("")),
  email_contact: z.string().trim().email("Adresse e-mail invalide.").optional().or(z.literal("")),
  telephone_contact: z.string().trim().max(40).optional().or(z.literal("")),
  whatsapp_numero: z.string().trim().max(40).optional().or(z.literal("")),
  adresse: z.string().trim().max(240).optional().or(z.literal("")),
  ville: z.string().trim().max(80).optional().or(z.literal("")),
  pays: z.string().trim().max(80).default("Maroc"),
  frais_livraison: z.coerce.number().min(0).default(30),
  seuil_livraison_gratuite: z.coerce.number().min(0).default(500),
  villes_livraison: z.array(z.string().trim().min(1)).default([]),
  paiement_a_reception: z.boolean().default(true),
  stock_reservation_heures: z.coerce.number().int().min(1).max(720).default(48),
  seuil_stock_faible: z.coerce.number().int().min(0).default(5),
  banniere_active: z.boolean().default(false),
  banniere_texte: z.string().trim().max(240).optional().or(z.literal("")),
  banniere_lien: z.string().trim().max(240).optional().or(z.literal("")),
  seo_titre_defaut: z.string().trim().max(120).optional().or(z.literal("")),
  seo_description_defaut: z.string().trim().max(200).optional().or(z.literal("")),
  instagram: z.string().trim().url("URL invalide.").optional().or(z.literal("")),
  facebook: z.string().trim().url("URL invalide.").optional().or(z.literal("")),
  tiktok: z.string().trim().url("URL invalide.").optional().or(z.literal("")),
});

export type DonneesParametresBoutique = z.input<typeof parametresBoutiqueSchema>;
