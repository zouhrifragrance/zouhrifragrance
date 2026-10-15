import { creerClientServeur } from "@/lib/supabase/server";
import type {
  Categorie,
  Commande,
  MouvementStock,
  Produit,
  Promotion,
  StatutCommande,
} from "@/types";

export interface StatistiquesTableauDeBord {
  compteurs: {
    en_attente: number;
    confirmees: number;
    en_preparation: number;
    expediees: number;
    livrees: number;
    annulees: number;
    total: number;
  };
  montant_en_attente: number;
  chiffre_affaires_confirme: number;
  ventes_30_jours: { jour: string; total: number }[];
  produits_plus_vendus: { nom: string; quantite: number }[];
  stock_faible: { nom: string; stock: number; seuil: number }[];
  commandes_recentes: {
    id: string;
    numero_commande: string;
    nom_client: string;
    montant_total: number;
    statut_commande: StatutCommande;
    date_creation: string;
  }[];
}

export async function obtenirStatistiquesTableauDeBord(): Promise<StatistiquesTableauDeBord | null> {
  const supabase = await creerClientServeur();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("statistiques_tableau_de_bord");
  if (error) {
    console.error("obtenirStatistiquesTableauDeBord:", error.message);
    return null;
  }
  return data as unknown as StatistiquesTableauDeBord;
}

/** Nombre de commandes en attente de confirmation (pour alerter l'admin). */
export async function compterCommandesEnAttente(): Promise<number> {
  const supabase = await creerClientServeur();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("commandes")
    .select("id", { count: "exact", head: true })
    .eq("statut_commande", "EN_ATTENTE_CONFIRMATION");

  if (error) {
    console.error("compterCommandesEnAttente:", error.message);
    return 0;
  }
  return count ?? 0;
}

export interface FiltresCommandesAdmin {
  statut?: StatutCommande | "";
  recherche?: string;
}

export async function listerCommandesAdmin(
  filtres: FiltresCommandesAdmin = {},
): Promise<Commande[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];

  let requete = supabase
    .from("commandes")
    .select("*")
    .order("date_creation", { ascending: false })
    .limit(200);

  if (filtres.statut) {
    requete = requete.eq("statut_commande", filtres.statut);
  }
  if (filtres.recherche) {
    const terme = `%${filtres.recherche}%`;
    requete = requete.or(
      `numero_commande.ilike.${terme},nom_client.ilike.${terme},telephone_client.ilike.${terme}`,
    );
  }

  const { data, error } = await requete;
  if (error) {
    console.error("listerCommandesAdmin:", error.message);
    return [];
  }
  return data ?? [];
}

export async function listerProduitsAdmin(): Promise<Produit[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("produits")
    .select("*")
    .order("date_modification", { ascending: false });

  if (error) {
    console.error("listerProduitsAdmin:", error.message);
    return [];
  }
  return data ?? [];
}

export interface ProduitAdminComplet extends Produit {
  images: {
    url: string;
    texte_alt: string | null;
    est_principale: boolean;
  }[];
  variantes: {
    nom: string;
    contenance: string | null;
    reference_sku: string | null;
    prix_vente: number | null;
    prix_promotionnel: number | null;
    quantite_stock: number;
    seuil_stock_faible: number;
    est_active: boolean;
  }[];
}

export async function obtenirProduitAdmin(id: string): Promise<ProduitAdminComplet | null> {
  const supabase = await creerClientServeur();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("produits")
    .select("*, images_produits(*), variantes_produit(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("obtenirProduitAdmin:", error.message);
    return null;
  }

  const brut = data as unknown as Produit & {
    images_produits: {
      url: string;
      texte_alt: string | null;
      est_principale: boolean;
      ordre_affichage: number;
    }[];
    variantes_produit: {
      nom: string;
      contenance: string | null;
      reference_sku: string | null;
      prix_vente: number | null;
      prix_promotionnel: number | null;
      quantite_stock: number;
      seuil_stock_faible: number;
      est_active: boolean;
      ordre_affichage: number;
    }[];
  };

  const images = [...(brut.images_produits ?? [])]
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage)
    .map((image) => ({
      url: image.url,
      texte_alt: image.texte_alt,
      est_principale: image.est_principale,
    }));

  const variantes = [...(brut.variantes_produit ?? [])]
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage)
    .map((variante) => ({
      nom: variante.nom,
      contenance: variante.contenance,
      reference_sku: variante.reference_sku,
      prix_vente: variante.prix_vente,
      prix_promotionnel: variante.prix_promotionnel,
      quantite_stock: variante.quantite_stock,
      seuil_stock_faible: variante.seuil_stock_faible,
      est_active: variante.est_active,
    }));

  return { ...brut, images, variantes };
}

export async function obtenirCategorieAdmin(id: string): Promise<Categorie | null> {
  const supabase = await creerClientServeur();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("obtenirCategorieAdmin:", error.message);
    return null;
  }
  return data;
}

export async function listerPromotionsAdmin(): Promise<Promotion[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("date_creation", { ascending: false });

  if (error) {
    console.error("listerPromotionsAdmin:", error.message);
    return [];
  }
  return data ?? [];
}

export async function obtenirPromotionAdmin(id: string): Promise<Promotion | null> {
  const supabase = await creerClientServeur();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("obtenirPromotionAdmin:", error.message);
    return null;
  }
  return data;
}

export interface MouvementStockDetaille extends MouvementStock {
  produit_nom: string | null;
}

export async function listerMouvementsStockAdmin(
  limite = 100,
): Promise<MouvementStockDetaille[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("mouvements_stock")
    .select("*, produits(nom)")
    .order("date_creation", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("listerMouvementsStockAdmin:", error.message);
    return [];
  }

  return (data ?? []).map((ligne) => {
    const enregistrement = ligne as unknown as MouvementStock & {
      produits: { nom: string } | null;
    };
    const { produits, ...mouvement } = enregistrement;
    return { ...mouvement, produit_nom: produits?.nom ?? null };
  });
}

export interface ProduitStockFaible {
  id: string;
  nom: string;
  quantite_stock: number;
  seuil_stock_faible: number;
  est_publie: boolean;
}

export async function listerProduitsStockFaible(): Promise<ProduitStockFaible[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("produits")
    .select("id, nom, quantite_stock, seuil_stock_faible, est_publie")
    .order("quantite_stock", { ascending: true });

  if (error) {
    console.error("listerProduitsStockFaible:", error.message);
    return [];
  }
  return (data ?? []).filter((p) => p.quantite_stock <= p.seuil_stock_faible);
}
