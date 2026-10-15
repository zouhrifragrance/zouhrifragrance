import { creerClientServeur } from "@/lib/supabase/server";
import { donneesDemoActives } from "./categories";
import type { LignePanier } from "@/types";

export interface ResultatPromotion {
  valide: boolean;
  montant_reduction: number;
  promotion_id?: string;
  code?: string;
  libelle?: string;
  message: string;
}

export async function validerCodePromotion(
  code: string,
  sousTotal: number,
  lignes: LignePanier[],
): Promise<ResultatPromotion> {
  if (donneesDemoActives()) {
    if (code.trim().toUpperCase() === "BIENVENUE10" && sousTotal >= 300) {
      return {
        valide: true,
        montant_reduction: Math.round(sousTotal * 0.1 * 100) / 100,
        code: "BIENVENUE10",
        libelle: "Bienvenue - 10 %",
        message: "Code appliqué.",
      };
    }
    return { valide: false, montant_reduction: 0, message: "Code promotionnel inconnu ou conditions non remplies." };
  }

  const supabase = await creerClientServeur();
  if (!supabase) {
    return { valide: false, montant_reduction: 0, message: "Service indisponible." };
  }

  const { data, error } = await supabase.rpc("valider_promotion", {
    p_code: code,
    p_sous_total: sousTotal,
    p_lignes: lignes.map((l) => ({
      produit_id: l.produitId,
      prix_unitaire: l.prixUnitaire,
      quantite: l.quantite,
    })),
  });

  if (error || !data) {
    console.error("validerCodePromotion:", error?.message);
    return { valide: false, montant_reduction: 0, message: "Impossible de vérifier ce code." };
  }

  return data as unknown as ResultatPromotion;
}
