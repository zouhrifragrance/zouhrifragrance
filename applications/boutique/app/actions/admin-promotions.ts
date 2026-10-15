"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { exigerNiveau } from "@/lib/auth-admin";
import { promotionSchema } from "@/schemas";
import type { EtatActionAdmin } from "./admin-commandes";

export interface EtatPromotionAdmin extends EtatActionAdmin {
  promotionId?: string;
}

function messageErreur(brut: string): string {
  if (brut.includes("duplicate") || brut.includes("unique")) {
    return "Ce code promotionnel existe déjà.";
  }
  return "L'enregistrement a échoué. Vérifiez les informations saisies.";
}

export async function actionEnregistrerPromotion(
  _precedent: EtatPromotionAdmin,
  formData: FormData,
): Promise<EtatPromotionAdmin> {
  await exigerNiveau("GESTIONNAIRE");

  const promotionId = String(formData.get("promotion_id") ?? "").trim();
  const donneesBrutes = String(formData.get("donnees") ?? "");

  let json: unknown;
  try {
    json = JSON.parse(donneesBrutes);
  } catch {
    return { ok: false, message: "Données du formulaire illisibles." };
  }

  const resultat = promotionSchema.safeParse(json);
  if (!resultat.success) {
    const premier = resultat.error.issues[0];
    return {
      ok: false,
      message: premier ? `${premier.path.join(".")} : ${premier.message}` : "Formulaire invalide.",
    };
  }

  const donnees = resultat.data;
  const supabase = await creerClientServeur();
  if (!supabase) return { ok: false, message: "Base de données indisponible." };

  const champs = {
    code: donnees.code,
    nom: donnees.nom,
    type_reduction: donnees.type_reduction,
    valeur: donnees.valeur,
    montant_minimum: donnees.montant_minimum,
    limite_utilisation: donnees.limite_utilisation,
    categories_ids: donnees.categories_ids,
    produits_ids: donnees.produits_ids,
    date_debut: donnees.date_debut,
    date_fin: donnees.date_fin,
    est_active: donnees.est_active,
  };

  let id = promotionId;
  if (id) {
    const { error } = await supabase.from("promotions").update(champs).eq("id", id);
    if (error) return { ok: false, message: messageErreur(error.message) };
  } else {
    const { data, error } = await supabase.from("promotions").insert(champs).select("id").single();
    if (error || !data) return { ok: false, message: messageErreur(error?.message ?? "") };
    id = data.id;
  }

  revalidatePath("/admin/promotions");
  return { ok: true, message: "Promotion enregistrée.", promotionId: id };
}

export async function actionBasculerActivationPromotion(formData: FormData): Promise<void> {
  await exigerNiveau("GESTIONNAIRE");
  const promotionId = String(formData.get("promotion_id") ?? "");
  const valeur = String(formData.get("valeur") ?? "") === "true";
  if (!promotionId) return;

  const supabase = await creerClientServeur();
  if (!supabase) return;
  await supabase.from("promotions").update({ est_active: valeur }).eq("id", promotionId);
  revalidatePath("/admin/promotions");
}

export async function actionSupprimerPromotion(formData: FormData): Promise<void> {
  await exigerNiveau("GESTIONNAIRE");
  const promotionId = String(formData.get("promotion_id") ?? "");
  if (!promotionId) return;

  const supabase = await creerClientServeur();
  if (!supabase) return;
  await supabase.from("promotions").delete().eq("id", promotionId);
  revalidatePath("/admin/promotions");
}
