"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { exigerNiveau } from "@/lib/auth-admin";
import type { StatutCommande } from "@/types";

export interface EtatActionAdmin {
  ok: boolean;
  message: string;
}

function messageErreur(brut: string): string {
  const correspondance = brut.match(/message:\s*(.+)$/i);
  if (correspondance?.[1]) return correspondance[1].trim();
  if (brut.includes("Acces") || brut.includes("Accès") || brut.includes("refus"))
    return "Vous n'avez pas les droits nécessaires.";
  return "L'opération a échoué. Veuillez réessayer.";
}

export async function actionChangerStatutCommande(
  _precedent: EtatActionAdmin,
  formData: FormData,
): Promise<EtatActionAdmin> {
  await exigerNiveau("GESTIONNAIRE");

  const commandeId = String(formData.get("commande_id") ?? "");
  const nouveauStatut = String(formData.get("statut") ?? "") as StatutCommande;
  const commentaire = String(formData.get("commentaire") ?? "").trim() || undefined;

  if (!commandeId || !nouveauStatut) {
    return { ok: false, message: "Commande ou statut manquant." };
  }

  const supabase = await creerClientServeur();
  if (!supabase) return { ok: false, message: "Base de données indisponible." };

  const { error } = await supabase.rpc("changer_statut_commande", {
    p_commande_id: commandeId,
    p_nouveau_statut: nouveauStatut,
    p_commentaire: commentaire,
  });

  if (error) {
    console.error("actionChangerStatutCommande:", error.message);
    return { ok: false, message: messageErreur(error.message) };
  }

  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/commandes/${commandeId}`);
  return { ok: true, message: "Statut mis à jour avec succès." };
}

export async function actionLibererStock(
  _precedent: EtatActionAdmin,
  formData: FormData,
): Promise<EtatActionAdmin> {
  await exigerNiveau("GESTIONNAIRE");

  const commandeId = String(formData.get("commande_id") ?? "");
  const motif = String(formData.get("motif") ?? "").trim() || "Libération manuelle";

  if (!commandeId) return { ok: false, message: "Commande manquante." };

  const supabase = await creerClientServeur();
  if (!supabase) return { ok: false, message: "Base de données indisponible." };

  const { error } = await supabase.rpc("liberer_stock_commande", {
    p_commande_id: commandeId,
    p_motif: motif,
  });

  if (error) {
    console.error("actionLibererStock:", error.message);
    return { ok: false, message: messageErreur(error.message) };
  }

  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/commandes/${commandeId}`);
  return { ok: true, message: "Stock libéré pour cette commande." };
}
