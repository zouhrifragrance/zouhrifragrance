"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { exigerNiveau } from "@/lib/auth-admin";
import type { TypeMouvementStock } from "@/types";
import type { EtatActionAdmin } from "./admin-commandes";

const TYPES_ENTREE: TypeMouvementStock[] = ["ENTREE", "RETOUR"];

export async function actionAjusterStock(
  _precedent: EtatActionAdmin,
  formData: FormData,
): Promise<EtatActionAdmin> {
  await exigerNiveau("GESTIONNAIRE");

  const produitId = String(formData.get("produit_id") ?? "");
  const type = String(formData.get("type_mouvement") ?? "ENTREE") as TypeMouvementStock;
  const quantite = Number(formData.get("quantite") ?? 0);
  const motif = String(formData.get("motif") ?? "").trim() || "Ajustement manuel";

  if (!produitId || !Number.isInteger(quantite) || quantite < 0) {
    return { ok: false, message: "Produit ou quantité invalide." };
  }

  const supabase = await creerClientServeur();
  if (!supabase) return { ok: false, message: "Base de données indisponible." };

  const { data: produit, error: erreurLecture } = await supabase
    .from("produits")
    .select("quantite_stock")
    .eq("id", produitId)
    .maybeSingle();

  if (erreurLecture || !produit) {
    return { ok: false, message: "Produit introuvable." };
  }

  let nouvelleQuantite: number;
  let quantiteMouvement: number;

  if (type === "AJUSTEMENT") {
    nouvelleQuantite = quantite;
    quantiteMouvement = quantite - produit.quantite_stock;
  } else if (TYPES_ENTREE.includes(type)) {
    nouvelleQuantite = produit.quantite_stock + quantite;
    quantiteMouvement = quantite;
  } else {
    if (quantite > produit.quantite_stock) {
      return { ok: false, message: "Quantité supérieure au stock disponible." };
    }
    nouvelleQuantite = produit.quantite_stock - quantite;
    quantiteMouvement = -quantite;
  }

  const { error: erreurMaj } = await supabase
    .from("produits")
    .update({ quantite_stock: nouvelleQuantite })
    .eq("id", produitId);

  if (erreurMaj) {
    console.error("actionAjusterStock update:", erreurMaj.message);
    return { ok: false, message: "Mise à jour du stock impossible." };
  }

  await supabase.from("mouvements_stock").insert({
    produit_id: produitId,
    type_mouvement: type,
    quantite: quantiteMouvement,
    motif,
  });

  revalidatePath("/admin/stocks");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Stock mis à jour." };
}
