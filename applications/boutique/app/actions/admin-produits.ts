"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { exigerNiveau } from "@/lib/auth-admin";
import { produitSchema } from "@/schemas";
import type { EtatActionAdmin } from "./admin-commandes";

function messageErreur(brut: string): string {
  if (brut.includes("duplicate") && brut.includes("slug")) {
    return "Ce slug est déjà utilisé par un autre produit.";
  }
  if (brut.includes("duplicate") || brut.includes("unique")) {
    return "Une valeur unique est déjà utilisée (slug ou référence).";
  }
  if (brut.includes("Acces") || brut.includes("Accès") || brut.includes("refus")) {
    return "Vous n'avez pas les droits nécessaires.";
  }
  return "L'enregistrement a échoué. Vérifiez les informations saisies.";
}

export interface EtatProduitAdmin extends EtatActionAdmin {
  produitId?: string;
}

export async function actionEnregistrerProduit(
  _precedent: EtatProduitAdmin,
  formData: FormData,
): Promise<EtatProduitAdmin> {
  await exigerNiveau("GESTIONNAIRE");

  const produitId = String(formData.get("produit_id") ?? "").trim();
  const donneesBrutes = String(formData.get("donnees") ?? "");

  let json: unknown;
  try {
    json = JSON.parse(donneesBrutes);
  } catch {
    return { ok: false, message: "Données du formulaire illisibles." };
  }

  const resultat = produitSchema.safeParse(json);
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
    description_courte: donnees.description_courte,
    description: donnees.description,
    categorie_id: donnees.categorie_id,
    reference_sku: donnees.reference_sku,
    prix_vente: donnees.prix_vente,
    prix_promotionnel: donnees.prix_promotionnel,
    devise: donnees.devise,
    seuil_stock_faible: donnees.seuil_stock_faible,
    est_mis_en_avant: donnees.est_mis_en_avant,
    est_publie: donnees.est_publie,
    titre_seo: donnees.titre_seo,
    description_seo: donnees.description_seo,
  };

  let id = produitId;

  if (id) {
    const { error } = await supabase.from("produits").update(champs).eq("id", id);
    if (error) {
      console.error("actionEnregistrerProduit update:", error.message);
      return { ok: false, message: messageErreur(error.message) };
    }
  } else {
    const { data, error } = await supabase
      .from("produits")
      .insert({ ...champs, quantite_stock: donnees.quantite_stock })
      .select("id")
      .single();
    if (error || !data) {
      console.error("actionEnregistrerProduit insert:", error?.message);
      return { ok: false, message: messageErreur(error?.message ?? "") };
    }
    id = data.id;

    if (donnees.quantite_stock > 0) {
      await supabase.from("mouvements_stock").insert({
        produit_id: id,
        type_mouvement: "ENTREE",
        quantite: donnees.quantite_stock,
        motif: "Stock initial à la création du produit",
      });
    }
  }

  await supabase.from("images_produits").delete().eq("produit_id", id);
  if (donnees.images.length > 0) {
    await supabase.from("images_produits").insert(
      donnees.images.map((image, index) => ({
        produit_id: id as string,
        url: image.url,
        texte_alt: image.texte_alt,
        est_principale: image.est_principale || index === 0,
        ordre_affichage: image.ordre_affichage || index,
      })),
    );
  }

  await supabase.from("variantes_produit").delete().eq("produit_id", id);
  if (donnees.variantes.length > 0) {
    await supabase.from("variantes_produit").insert(
      donnees.variantes.map((variante, index) => ({
        produit_id: id as string,
        nom: variante.nom,
        contenance: variante.contenance,
        reference_sku: variante.reference_sku,
        prix_vente: variante.prix_vente,
        prix_promotionnel: variante.prix_promotionnel,
        quantite_stock: variante.quantite_stock,
        seuil_stock_faible: variante.seuil_stock_faible,
        est_active: variante.est_active,
        ordre_affichage: variante.ordre_affichage || index,
      })),
    );
  }

  revalidatePath("/admin/produits");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Produit enregistré.", produitId: id };
}

export async function actionBasculerPublicationProduit(formData: FormData): Promise<void> {
  await exigerNiveau("GESTIONNAIRE");

  const produitId = String(formData.get("produit_id") ?? "");
  const valeur = String(formData.get("valeur") ?? "") === "true";

  const supabase = await creerClientServeur();
  if (!supabase) return;

  await supabase.from("produits").update({ est_publie: valeur }).eq("id", produitId);

  revalidatePath("/admin/produits");
}

export async function actionSupprimerProduit(formData: FormData): Promise<void> {
  await exigerNiveau("GESTIONNAIRE");

  const produitId = String(formData.get("produit_id") ?? "");
  if (!produitId) return;

  const supabase = await creerClientServeur();
  if (!supabase) return;

  await supabase.from("produits").delete().eq("id", produitId);

  revalidatePath("/admin/produits");
  revalidatePath("/admin", "layout");
}
