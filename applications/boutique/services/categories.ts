import { cache } from "react";
import { creerClientServeur } from "@/lib/supabase/server";
import { env, supabaseConfiguree } from "@/lib/env";
import { categoriesDemo } from "@/lib/donnees-demo";
import type { Categorie, CategorieAvecEnfants } from "@/types";

export function donneesDemoActives(): boolean {
  return env.demoMode || !supabaseConfiguree;
}

export async function listerCategories(): Promise<Categorie[]> {
  if (donneesDemoActives()) {
    return [...categoriesDemo].sort((a, b) => a.ordre_affichage - b.ordre_affichage);
  }
  const supabase = await creerClientServeur();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("est_active", true)
    .order("ordre_affichage", { ascending: true })
    .order("nom", { ascending: true });

  if (error) {
    console.error("listerCategories:", error.message);
    return [];
  }
  return data ?? [];
}

export async function listerToutesCategoriesAdmin(): Promise<Categorie[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("ordre_affichage", { ascending: true })
    .order("nom", { ascending: true });
  if (error) {
    console.error("listerToutesCategoriesAdmin:", error.message);
    return [];
  }
  return data ?? [];
}

export function construireArbre(categories: Categorie[]): CategorieAvecEnfants[] {
  const parId = new Map<string, CategorieAvecEnfants>();
  categories.forEach((c) => parId.set(c.id, { ...c, enfants: [] }));

  const racines: CategorieAvecEnfants[] = [];
  parId.forEach((cat) => {
    if (cat.categorie_parente_id && parId.has(cat.categorie_parente_id)) {
      parId.get(cat.categorie_parente_id)!.enfants.push(cat);
    } else {
      racines.push(cat);
    }
  });

  const trier = (liste: CategorieAvecEnfants[]) => {
    liste.sort((a, b) => a.ordre_affichage - b.ordre_affichage || a.nom.localeCompare(b.nom));
    liste.forEach((c) => trier(c.enfants));
  };
  trier(racines);
  return racines;
}

export const rechercherCategorieParSlug = cache(async (slug: string): Promise<Categorie | null> => {
  if (donneesDemoActives()) {
    return categoriesDemo.find((c) => c.slug === slug) ?? null;
  }
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("est_active", true)
    .maybeSingle();
  if (error) {
    console.error("rechercherCategorieParSlug:", error.message);
    return null;
  }
  return data;
});

/** Retourne la categorie et l'ensemble de ses descendants actifs. */
export async function resoudreIdsCategorieEtDescendants(
  categorieId: string,
): Promise<{ categorie: Categorie; ids: string[] } | null> {
  const toutes = await listerCategories();
  const categorie = toutes.find((c) => c.id === categorieId);
  if (!categorie) return null;

  const ids = new Set<string>([categorieId]);
  let ajout = true;
  while (ajout) {
    ajout = false;
    for (const c of toutes) {
      if (c.categorie_parente_id && ids.has(c.categorie_parente_id) && !ids.has(c.id)) {
        ids.add(c.id);
        ajout = true;
      }
    }
  }
  return { categorie, ids: [...ids] };
}

export async function listerCategorieIdsParSlug(slug: string): Promise<string[] | null> {
  const categorie = await rechercherCategorieParSlug(slug);
  if (!categorie) return null;
  const resolution = await resoudreIdsCategorieEtDescendants(categorie.id);
  return resolution?.ids ?? [categorie.id];
}

export async function listerCategoriesAvecComptes(): Promise<
  { categorie: Categorie; nombre_produits: number }[]
> {
  const categories = await listerCategories();
  if (donneesDemoActives()) {
    return categories.map((categorie) => ({ categorie, nombre_produits: 0 }));
  }
  const supabase = await creerClientServeur();
  if (!supabase) return categories.map((categorie) => ({ categorie, nombre_produits: 0 }));

  const { data } = await supabase
    .from("produits")
    .select("categorie_id")
    .eq("est_publie", true);

  const comptes = new Map<string, number>();
  (data ?? []).forEach((p) => {
    if (p.categorie_id) comptes.set(p.categorie_id, (comptes.get(p.categorie_id) ?? 0) + 1);
  });

  return categories.map((categorie) => ({
    categorie,
    nombre_produits: comptes.get(categorie.id) ?? 0,
  }));
}
