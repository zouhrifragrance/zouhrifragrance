import { env } from "./env";

export const siteConfig = {
  nom: "ZOUHRI FRAGRANCE",
  nomCourt: "ZOUHRI",
  slogan: "L'art du parfum, à la marocaine",
  description:
    "ZOUHRI FRAGRANCE, boutique de parfums et de cosmétiques au Maroc. Découvrez nos fragrances soigneusement sélectionnées pour homme, femme et mixte. Commande simple, sans compte, livraison partout au Maroc.",
  url: env.siteUrl,
  locale: "fr_MA",
  langue: "fr",
  pays: "MA",
  devise: env.devise,
  logo: "/logo-zouhri.png",
  whatsappNumero: env.whatsappNumero,
  whatsappMessage: env.whatsappMessage,
  reseaux: {
    instagram: null as string | null,
    facebook: null as string | null,
    tiktok: null as string | null,
  },
  motClePrincipaux: [
    "parfums au Maroc",
    "boutique de parfums au Maroc",
    "parfum homme",
    "parfum femme",
    "cosmétiques Maroc",
    "ZOUHRI FRAGRANCE",
  ],
} as const;

export const NAVIGATION_PUBLIQUE = [
  { libelle: "Accueil", href: "/" },
  { libelle: "Boutique", href: "/boutique" },
  { libelle: "Nouveautés", href: "/nouveautes" },
  { libelle: "Meilleures ventes", href: "/meilleures-ventes" },
  { libelle: "Notre histoire", href: "/notre-histoire" },
  { libelle: "Suivi de commande", href: "/suivi-commande" },
  { libelle: "Contact", href: "/contact" },
] as const;
