"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { exigerNiveau } from "@/lib/auth-admin";
import { parametresBoutiqueSchema } from "@/schemas";
import type { Json } from "@/types/database";
import type { EtatActionAdmin } from "./admin-commandes";

function decouperVilles(valeur: string): string[] {
  return valeur
    .split(/[\n,]+/)
    .map((element) => element.trim())
    .filter(Boolean);
}

export async function actionEnregistrerParametres(
  _precedent: EtatActionAdmin,
  formData: FormData,
): Promise<EtatActionAdmin> {
  await exigerNiveau("ADMIN");

  const brut = {
    nom_boutique: String(formData.get("nom_boutique") ?? ""),
    slogan: String(formData.get("slogan") ?? ""),
    email_contact: String(formData.get("email_contact") ?? ""),
    telephone_contact: String(formData.get("telephone_contact") ?? ""),
    whatsapp_numero: String(formData.get("whatsapp_numero") ?? ""),
    adresse: String(formData.get("adresse") ?? ""),
    ville: String(formData.get("ville") ?? ""),
    pays: String(formData.get("pays") ?? "Maroc"),
    frais_livraison: String(formData.get("frais_livraison") ?? "30"),
    seuil_livraison_gratuite: String(formData.get("seuil_livraison_gratuite") ?? "500"),
    villes_livraison: decouperVilles(String(formData.get("villes_livraison") ?? "")),
    paiement_a_reception: formData.get("paiement_a_reception") === "on",
    stock_reservation_heures: String(formData.get("stock_reservation_heures") ?? "48"),
    seuil_stock_faible: String(formData.get("seuil_stock_faible") ?? "5"),
    banniere_active: formData.get("banniere_active") === "on",
    banniere_texte: String(formData.get("banniere_texte") ?? ""),
    banniere_lien: String(formData.get("banniere_lien") ?? ""),
    seo_titre_defaut: String(formData.get("seo_titre_defaut") ?? ""),
    seo_description_defaut: String(formData.get("seo_description_defaut") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    facebook: String(formData.get("facebook") ?? ""),
    tiktok: String(formData.get("tiktok") ?? ""),
  };

  const resultat = parametresBoutiqueSchema.safeParse(brut);
  if (!resultat.success) {
    const premier = resultat.error.issues[0];
    return {
      ok: false,
      message: premier ? `${premier.path.join(".")} : ${premier.message}` : "Formulaire invalide.",
    };
  }

  const d = resultat.data;
  const supabase = await creerClientServeur();
  if (!supabase) return { ok: false, message: "Base de données indisponible." };

  const lignes: { cle: string; valeur: Json }[] = [
    {
      cle: "identite",
      valeur: {
        nom_boutique: d.nom_boutique,
        slogan: d.slogan || "",
        email_contact: d.email_contact || "",
        telephone_contact: d.telephone_contact || "",
        whatsapp_numero: d.whatsapp_numero || "",
        adresse: d.adresse || "",
        ville: d.ville || "",
        pays: d.pays || "Maroc",
      },
    },
    {
      cle: "livraison",
      valeur: {
        frais_livraison: d.frais_livraison,
        seuil_livraison_gratuite: d.seuil_livraison_gratuite,
        villes_livraison: d.villes_livraison,
        paiement_a_reception: d.paiement_a_reception,
      },
    },
    {
      cle: "stock",
      valeur: {
        reservation_heures: d.stock_reservation_heures,
        seuil_stock_faible: d.seuil_stock_faible,
      },
    },
    {
      cle: "banniere",
      valeur: {
        active: d.banniere_active,
        texte: d.banniere_texte || "",
        lien: d.banniere_lien || "",
      },
    },
    {
      cle: "seo",
      valeur: {
        titre_defaut: d.seo_titre_defaut || "",
        description_defaut: d.seo_description_defaut || "",
      },
    },
    {
      cle: "reseaux",
      valeur: {
        instagram: d.instagram || "",
        facebook: d.facebook || "",
        tiktok: d.tiktok || "",
      },
    },
  ];

  const { error } = await supabase
    .from("parametres_boutique")
    .upsert(lignes, { onConflict: "cle" });

  if (error) {
    console.error("actionEnregistrerParametres:", error.message);
    return { ok: false, message: "Enregistrement des paramètres impossible." };
  }

  revalidatePath("/admin/parametres");
  revalidatePath("/", "layout");
  return { ok: true, message: "Paramètres enregistrés." };
}
