const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

/**
 * Indique si la connexion Supabase est configuree.
 * En l'absence de configuration, l'application degrade proprement vers des
 * etats vides ou des donnees de demonstration (mode developpement uniquement).
 */
export const supabaseConfiguree = Boolean(url && anonKey);

export const env = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(/\/$/, ""),
  devise: process.env.NEXT_PUBLIC_DEVISE?.trim() || "MAD",
  fraisLivraison: Number(process.env.NEXT_PUBLIC_FRAIS_LIVRAISON ?? 30),
  seuilLivraisonGratuite: Number(process.env.NEXT_PUBLIC_SEUIL_LIVRAISON_GRATUITE ?? 500),
  whatsappNumero: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO?.trim() || null,
  whatsappMessage:
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE?.trim() ||
    "Bonjour ZOUHRI FRAGRANCE, je souhaite des informations.",
  paiementAReception: process.env.NEXT_PUBLIC_PAIEMENT_A_RECEPTION !== "false",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "1",
  stockReservationHeures: Number(process.env.STOCK_RESERVATION_HEURES ?? 48),
} as const;
