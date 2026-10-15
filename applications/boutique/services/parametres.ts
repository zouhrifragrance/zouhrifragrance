import { cache } from "react";
import { creerClientServeur } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { donneesDemoActives } from "./categories";
import { parametresDemo } from "@/lib/donnees-demo";
import type { Json } from "@/types/database";

export interface ParametresBoutique {
  identite: {
    nom_boutique: string;
    slogan: string;
    email_contact: string;
    telephone_contact: string;
    whatsapp_numero: string;
    adresse: string;
    ville: string;
    pays: string;
  };
  livraison: {
    frais_livraison: number;
    seuil_livraison_gratuite: number;
    villes_livraison: string[];
    paiement_a_reception: boolean;
  };
  stock: { reservation_heures: number; seuil_stock_faible: number };
  banniere: { active: boolean; texte: string; lien: string };
  seo: { titre_defaut: string; description_defaut: string };
  reseaux: { instagram: string; facebook: string; tiktok: string };
}

export const PARAMETRES_PAR_DEFAUT: ParametresBoutique = {
  identite: {
    nom_boutique: "ZOUHRI FRAGRANCE",
    slogan: "L'art du parfum, à la marocaine",
    email_contact: "",
    telephone_contact: "",
    whatsapp_numero: env.whatsappNumero ?? "",
    adresse: "",
    ville: "",
    pays: "Maroc",
  },
  livraison: {
    frais_livraison: env.fraisLivraison,
    seuil_livraison_gratuite: env.seuilLivraisonGratuite,
    villes_livraison: [],
    paiement_a_reception: env.paiementAReception,
  },
  stock: { reservation_heures: env.stockReservationHeures, seuil_stock_faible: 5 },
  banniere: { active: false, texte: "", lien: "" },
  seo: {
    titre_defaut: "ZOUHRI FRAGRANCE — Parfums et cosmétiques au Maroc",
    description_defaut:
      "Boutique de parfums et cosmétiques au Maroc. Fragrances pour homme, femme et mixte, livrées partout au Maroc.",
  },
  reseaux: { instagram: "", facebook: "", tiktok: "" },
};

type LigneParametre = { cle: string; valeur: Json };

function fusionner(lignes: LigneParametre[]): ParametresBoutique {
  const resultat: ParametresBoutique = JSON.parse(JSON.stringify(PARAMETRES_PAR_DEFAUT));
  for (const ligne of lignes) {
    const cible = resultat as unknown as Record<string, Record<string, unknown>>;
    if (ligne.valeur && typeof ligne.valeur === "object" && !Array.isArray(ligne.valeur)) {
      cible[ligne.cle] = { ...(cible[ligne.cle] ?? {}), ...(ligne.valeur as Record<string, unknown>) };
    }
  }
  return resultat;
}

export const obtenirParametresBoutique = cache(async (): Promise<ParametresBoutique> => {
  if (donneesDemoActives()) {
    return fusionner([
      { cle: "identite", valeur: parametresDemo.identite as unknown as Json },
      { cle: "livraison", valeur: parametresDemo.livraison as unknown as Json },
    ]);
  }
  const supabase = await creerClientServeur();
  if (!supabase) return PARAMETRES_PAR_DEFAUT;

  const { data, error } = await supabase.from("parametres_boutique").select("cle, valeur");
  if (error) {
    console.error("obtenirParametresBoutique:", error.message);
    return PARAMETRES_PAR_DEFAUT;
  }
  return fusionner((data ?? []) as LigneParametre[]);
});

export function calculerFraisLivraison(
  sousTotal: number,
  parametres: ParametresBoutique,
): number {
  const { frais_livraison, seuil_livraison_gratuite } = parametres.livraison;
  if (seuil_livraison_gratuite > 0 && sousTotal >= seuil_livraison_gratuite) return 0;
  if (sousTotal <= 0) return 0;
  return frais_livraison;
}
