import { cache } from "react";
import { creerClientServeur } from "@/lib/supabase/server";
import { donneesDemoActives } from "./categories";
import { produitsDemo, imagesDemo, variantesDemo } from "@/lib/donnees-demo";
import type { ProduitCarte, ProduitComplet } from "@/types";

export type TriCatalogue = "nouveautes" | "prix_asc" | "prix_desc" | "popularite";

export interface FiltresCatalogue {
  recherche?: string;
  categorieIds?: string[];
  prixMin?: number;
  prixMax?: number;
  tri?: TriCatalogue;
  page?: number;
  parPage?: number;
  misEnAvantSeulement?: boolean;
  exclureIds?: string[];
}

export interface ResultatCatalogue {
  produits: ProduitCarte[];
  total: number;
  page: number;
  parPage: number;
  totalPages: number;
}

const CHAMPS_CARTE =
  "id, nom, slug, description_courte, description, categorie_id, reference_sku, prix_vente, prix_promotionnel, devise, quantite_stock, seuil_stock_faible, est_mis_en_avant, est_publie, titre_seo, description_seo, date_creation, date_modification, images_produits(url, texte_alt, est_principale), categories(id, nom, slug)";

export const PAR_PAGE_DEFAUT = 12;

export async function listerProduits(filtres: FiltresCatalogue = {}): Promise<ResultatCatalogue> {
  const page = Math.max(1, filtres.page ?? 1);
  const parPage = Math.min(48, Math.max(1, filtres.parPage ?? PAR_PAGE_DEFAUT));

  if (donneesDemoActives()) {
    return filtrerDemo(filtres, page, parPage);
  }

  const supabase = await creerClientServeur();
  if (!supabase) {
    return { produits: [], total: 0, page, parPage, totalPages: 0 };
  }

  let requete = supabase
    .from("produits")
    .select(CHAMPS_CARTE, { count: "exact" })
    .eq("est_publie", true);

  if (filtres.misEnAvantSeulement) requete = requete.eq("est_mis_en_avant", true);
  if (filtres.categorieIds && filtres.categorieIds.length > 0) {
    requete = requete.in("categorie_id", filtres.categorieIds);
  }
  if (filtres.exclureIds && filtres.exclureIds.length > 0) {
    requete = requete.not("id", "in", `(${filtres.exclureIds.join(",")})`);
  }
  if (typeof filtres.prixMin === "number") {
    requete = requete.gte("prix_vente", filtres.prixMin);
  }
  if (typeof filtres.prixMax === "number") {
    requete = requete.lte("prix_vente", filtres.prixMax);
  }
  if (filtres.recherche && filtres.recherche.trim()) {
    const terme = filtres.recherche.trim().replace(/[%,]/g, " ").slice(0, 60);
    requete = requete.or(
      `nom.ilike.%${terme}%,description_courte.ilike.%${terme}%,reference_sku.ilike.%${terme}%`,
    );
  }

  switch (filtres.tri) {
    case "prix_asc":
      requete = requete.order("prix_vente", { ascending: true });
      break;
    case "prix_desc":
      requete = requete.order("prix_vente", { ascending: false });
      break;
    case "popularite":
      requete = requete
        .order("est_mis_en_avant", { ascending: false })
        .order("date_creation", { ascending: false });
      break;
    default:
      requete = requete.order("date_creation", { ascending: false });
  }

  const debut = (page - 1) * parPage;
  const { data, count, error } = await requete.range(debut, debut + parPage - 1);

  if (error) {
    console.error("listerProduits:", error.message);
    return { produits: [], total: 0, page, parPage, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    produits: (data ?? []) as unknown as ProduitCarte[],
    total,
    page,
    parPage,
    totalPages: Math.ceil(total / parPage),
  };
}

export const obtenirProduitParSlug = cache(
  async (slug: string): Promise<ProduitComplet | null> => {
    if (donneesDemoActives()) {
      const produit = produitsDemo.find((p) => p.slug === slug && p.est_publie);
      if (!produit) return null;
      return {
        ...produit,
        images_produits: imagesDemo.filter((i) => i.produit_id === produit.id),
        variantes_produit: variantesDemo.filter(
          (v) => v.produit_id === produit.id && v.est_active,
        ),
        categories: null,
      };
    }

    const supabase = await creerClientServeur();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("produits")
      .select(
        "*, categories(id, nom, slug), images_produits(id, produit_id, url, texte_alt, est_principale, ordre_affichage, date_creation), variantes_produit(id, produit_id, nom, contenance, reference_sku, prix_vente, prix_promotionnel, quantite_stock, seuil_stock_faible, est_active, ordre_affichage, date_creation, date_modification)",
      )
      .eq("slug", slug)
      .eq("est_publie", true)
      .maybeSingle();

    if (error) {
      console.error("obtenirProduitParSlug:", error.message);
      return null;
    }
    return data as unknown as ProduitComplet | null;
  },
);

export async function listerProduitsMisEnAvant(limite = 4): Promise<ProduitCarte[]> {
  const resultat = await listerProduits({
    misEnAvantSeulement: true,
    parPage: limite,
    tri: "nouveautes",
  });
  if (resultat.produits.length > 0) return resultat.produits;
  const secours = await listerProduits({ parPage: limite, tri: "nouveautes" });
  return secours.produits;
}

export async function listerNouveautes(limite = 8): Promise<ProduitCarte[]> {
  const resultat = await listerProduits({ tri: "nouveautes", parPage: limite });
  return resultat.produits;
}

export async function listerMeilleuresVentes(limite = 8): Promise<ProduitCarte[]> {
  if (donneesDemoActives()) {
    const resultat = await listerProduits({ parPage: limite, tri: "popularite" });
    return resultat.produits;
  }
  const supabase = await creerClientServeur();
  if (!supabase) return [];

  const { data: ventes } = await supabase.rpc("produits_meilleures_ventes", {
    p_limite: limite,
  });

  const ids = (ventes ?? []).map((v) => v.produit_id).filter(Boolean) as string[];
  if (ids.length === 0) {
    const resultat = await listerProduits({ parPage: limite, tri: "nouveautes" });
    return resultat.produits;
  }

  const { data, error } = await supabase
    .from("produits")
    .select(CHAMPS_CARTE)
    .in("id", ids)
    .eq("est_publie", true);

  if (error || !data) return [];
  const liste = data as unknown as ProduitCarte[];
  const ordre = new Map(ids.map((id, index) => [id, index]));
  return liste.sort((a, b) => (ordre.get(a.id) ?? 0) - (ordre.get(b.id) ?? 0));
}

export async function listerProduitsSimilaires(
  produit: { id: string; categorie_id: string | null },
  limite = 4,
): Promise<ProduitCarte[]> {
  const resultat = await listerProduits({
    categorieIds: produit.categorie_id ? [produit.categorie_id] : undefined,
    exclureIds: [produit.id],
    parPage: limite,
    tri: "nouveautes",
  });
  if (resultat.produits.length > 0) return resultat.produits;
  const secours = await listerProduits({
    exclureIds: [produit.id],
    parPage: limite,
    tri: "nouveautes",
  });
  return secours.produits;
}

export async function listerTousSlugsProduits(): Promise<
  { slug: string; date_modification: string }[]
> {
  if (donneesDemoActives()) {
    return produitsDemo.map((p) => ({ slug: p.slug, date_modification: p.date_modification }));
  }
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("produits")
    .select("slug, date_modification")
    .eq("est_publie", true);
  if (error) return [];
  return data ?? [];
}

function filtrerDemo(
  filtres: FiltresCatalogue,
  page: number,
  parPage: number,
): ResultatCatalogue {
  let liste = produitsDemo.filter((p) => p.est_publie);

  if (filtres.misEnAvantSeulement) liste = liste.filter((p) => p.est_mis_en_avant);
  if (filtres.categorieIds?.length) {
    liste = liste.filter((p) => p.categorie_id && filtres.categorieIds!.includes(p.categorie_id));
  }
  if (filtres.exclureIds?.length) {
    liste = liste.filter((p) => !filtres.exclureIds!.includes(p.id));
  }
  if (typeof filtres.prixMin === "number") liste = liste.filter((p) => p.prix_vente >= filtres.prixMin!);
  if (typeof filtres.prixMax === "number") liste = liste.filter((p) => p.prix_vente <= filtres.prixMax!);
  if (filtres.recherche?.trim()) {
    const terme = filtres.recherche.trim().toLowerCase();
    liste = liste.filter(
      (p) =>
        p.nom.toLowerCase().includes(terme) ||
        (p.description_courte ?? "").toLowerCase().includes(terme),
    );
  }

  if (filtres.tri === "prix_asc") liste.sort((a, b) => a.prix_vente - b.prix_vente);
  else if (filtres.tri === "prix_desc") liste.sort((a, b) => b.prix_vente - a.prix_vente);
  else if (filtres.tri === "popularite") {
    liste.sort(
      (a, b) =>
        Number(b.est_mis_en_avant) - Number(a.est_mis_en_avant) ||
        b.date_creation.localeCompare(a.date_creation),
    );
  } else liste.sort((a, b) => b.date_creation.localeCompare(a.date_creation));

  const total = liste.length;
  const debut = (page - 1) * parPage;
  const pageItems = liste.slice(debut, debut + parPage).map((p) => ({
    ...p,
    images_produits: imagesDemo
      .filter((i) => i.produit_id === p.id)
      .map((i) => ({ url: i.url, texte_alt: i.texte_alt, est_principale: i.est_principale })),
    categories: null,
  }));

  return {
    produits: pageItems,
    total,
    page,
    parPage,
    totalPages: Math.ceil(total / parPage),
  };
}
