"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { exigerNiveau } from "@/lib/auth-admin";
import { categorieSchema } from "@/schemas";
import type { EtatActionAdmin } from "./admin-commandes";

export interface EtatCategorieAdmin extends EtatActionAdmin {
  categorieId?: string;
}

function messageErreur(brut: string): string {
  if (brut.includes("duplicate") || brut.includes("unique")) {
    return "Ce slug est déjà utilisé par une autre catégorie.";
  }
  if (brut.includes("cycle") || brut.includes("parente")) {
    return "La catégorie parente choisie créerait une boucle.";
  }
  return "L'enregistrement a échoué. Vérifiez les informations saisies.";
}

export async function actionEnregistrerCategorie(
  _precedent: EtatCategorieAdmin,
  formData: FormData,
): Promise<EtatCategorieAdmin> {
  await exigerNiveau("GESTIONNAIRE");

  const categorieId = String(formData.get("categorie_id") ?? "").trim();
  const donneesBrutes = String(formData.get("donnees") ?? "");

  let json: unknown;
  try {
    json = JSON.parse(donneesBrutes);
  } catch {
    return { ok: false, message: "Données du formulaire illisibles." };
  }

  const resultat = categorieSchema.safeParse(json);
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
    nom: donnees.nom,
    slug: donnees.slug,
    description: donnees.description,
    image_url: donnees.image_url,
    categorie_parente_id: donnees.categorie_parente_id,
    ordre_affichage: donnees.ordre_affichage,
    est_active: donnees.est_active,
    titre_seo: donnees.titre_seo,
    description_seo: donnees.description_seo,
  };

  let id = categorieId;
  if (id) {
    const { error } = await supabase.from("categories").update(champs).eq("id", id);
    if (error) return { ok: false, message: messageErreur(error.message) };
  } else {
    const { data, error } = await supabase.from("categories").insert(champs).select("id").single();
    if (error || !data) return { ok: false, message: messageErreur(error?.message ?? "") };
    id = data.id;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Catégorie enregistrée.", categorieId: id };
}

export async function actionSupprimerCategorie(formData: FormData): Promise<void> {
  await exigerNiveau("GESTIONNAIRE");
  const categorieId = String(formData.get("categorie_id") ?? "");
  if (!categorieId) return;

  const supabase = await creerClientServeur();
  if (!supabase) return;
  await supabase.from("categories").delete().eq("id", categorieId);
  revalidatePath("/admin/categories");
  revalidatePath("/admin", "layout");
}

export async function actionBasculerActivationCategorie(formData: FormData): Promise<void> {
  await exigerNiveau("GESTIONNAIRE");
  const categorieId = String(formData.get("categorie_id") ?? "");
  const valeur = String(formData.get("valeur") ?? "") === "true";
  if (!categorieId) return;

  const supabase = await creerClientServeur();
  if (!supabase) return;
  await supabase.from("categories").update({ est_active: valeur }).eq("id", categorieId);
  revalidatePath("/admin/categories");
}
