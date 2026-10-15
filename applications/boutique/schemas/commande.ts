import { z } from "zod";

export const TELEPHONE_MAROC_REGEX = /^(?:\+212|0)[5-7]\d{8}$/;

export const telephoneMaroc = z
  .string()
  .trim()
  .min(1, { message: "Le numéro de téléphone est obligatoire." })
  .refine(
    (valeur) => TELEPHONE_MAROC_REGEX.test(valeur.replace(/[\s().-]/g, "")),
    {
      message:
        "Numéro marocain invalide. Exemple : 0612345678 ou +212612345678.",
    },
  );

export const articleCommandeSchema = z.object({
  produitId: z.string().uuid({ message: "Produit invalide." }),
  varianteId: z.string().uuid({ message: "Variante invalide." }).nullable().optional().default(null),
  quantite: z
    .number({ invalid_type_error: "Quantité invalide." })
    .int("La quantité doit être un nombre entier.")
    .min(1, "La quantité minimale est 1.")
    .max(50, "La quantité maximale est 50."),
});

export const commandeSchema = z.object({
  nom_client: z
    .string()
    .trim()
    .min(2, { message: "Veuillez indiquer votre nom complet." })
    .max(80, { message: "Le nom est trop long." }),
  telephone_client: telephoneMaroc,
  email_client: z
    .union([z.string().trim().email({ message: "Adresse e-mail invalide." }), z.literal("")])
    .optional()
    .transform((valeur) => (valeur ? valeur : null)),
  ville_livraison: z
    .string()
    .trim()
    .min(2, { message: "Veuillez indiquer votre ville." })
    .max(80),
  adresse_livraison: z
    .string()
    .trim()
    .min(5, { message: "Veuillez indiquer une adresse de livraison complète." })
    .max(240),
  complement_adresse: z
    .string()
    .trim()
    .max(240)
    .optional()
    .transform((valeur) => (valeur ? valeur : null)),
  instructions_livraison: z
    .string()
    .trim()
    .max(500, { message: "Les instructions sont trop longues." })
    .optional()
    .transform((valeur) => (valeur ? valeur : null)),
  code_promotion: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((valeur) => (valeur ? valeur.toUpperCase() : null)),
  articles: z
    .array(articleCommandeSchema)
    .min(1, { message: "Votre panier est vide." }),
  accepter_conditions: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez accepter les conditions générales.",
    }),
  }),
});

export type DonneesCommande = z.input<typeof commandeSchema>;
export type DonneesCommandeValidees = z.output<typeof commandeSchema>;

export const contactSchema = z.object({
  nom: z.string().trim().min(2, "Veuillez indiquer votre nom.").max(80),
  telephone: telephoneMaroc,
  email: z
    .union([z.string().trim().email("Adresse e-mail invalide."), z.literal("")])
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, "Votre message doit contenir au moins 10 caractères.")
    .max(1000, "Votre message est trop long."),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email({ message: "Adresse e-mail invalide." }).max(160),
});

export const suiviCommandeSchema = z.object({
  jeton: z
    .string()
    .trim()
    .min(20, { message: "Jeton de suivi invalide." })
    .max(128, { message: "Jeton de suivi invalide." }),
});
