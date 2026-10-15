import type { LignePanier } from "@/types";

export const CLES_PANIER = "zouhri.panier.v1";

export function calculerSousTotal(lignes: LignePanier[]): number {
  return arrondir(
    lignes.reduce((total, ligne) => total + ligne.prixUnitaire * ligne.quantite, 0),
  );
}

export function quantiteTotale(lignes: LignePanier[]): number {
  return lignes.reduce((total, ligne) => total + ligne.quantite, 0);
}

export function calculerFraisLivraison(
  sousTotal: number,
  frais: number,
  seuilGratuit: number,
): number {
  if (sousTotal <= 0) return 0;
  if (seuilGratuit > 0 && sousTotal >= seuilGratuit) return 0;
  return frais;
}

export function calculerTotal(
  sousTotal: number,
  reduction: number,
  fraisLivraison: number,
): number {
  return arrondir(Math.max(0, sousTotal - reduction + fraisLivraison));
}

export function cleLigne(ligne: Pick<LignePanier, "produitId" | "varianteId">): string {
  return `${ligne.produitId}::${ligne.varianteId ?? "sans-variante"}`;
}

export function ajouterLigne(
  lignes: LignePanier[],
  nouvelle: LignePanier,
): LignePanier[] {
  const cle = cleLigne(nouvelle);
  const existante = lignes.find((l) => cleLigne(l) === cle);
  if (existante) {
    return lignes.map((l) =>
      cleLigne(l) === cle
        ? {
            ...l,
            quantite: Math.min(l.quantite + nouvelle.quantite, Math.max(1, l.stockDisponible)),
          }
        : l,
    );
  }
  return [...lignes, nouvelle];
}

export function modifierQuantite(
  lignes: LignePanier[],
  cle: string,
  quantite: number,
): LignePanier[] {
  if (quantite <= 0) return retirerLigne(lignes, cle);
  return lignes.map((l) =>
    cleLigne(l) === cle
      ? { ...l, quantite: Math.min(Math.max(1, quantite), Math.max(1, l.stockDisponible)) }
      : l,
  );
}

export function retirerLigne(lignes: LignePanier[], cle: string): LignePanier[] {
  return lignes.filter((l) => cleLigne(l) !== cle);
}

export function arrondir(valeur: number): number {
  return Math.round((valeur + Number.EPSILON) * 100) / 100;
}

/** Revalide les lignes par rapport aux stocks connus. */
export function detecterProblemesStock(
  lignes: LignePanier[],
): { cle: string; nom: string; probleme: string }[] {
  const problemes: { cle: string; nom: string; probleme: string }[] = [];
  for (const ligne of lignes) {
    if (ligne.stockDisponible <= 0) {
      problemes.push({
        cle: cleLigne(ligne),
        nom: ligne.nomVariante ? `${ligne.nom} (${ligne.nomVariante})` : ligne.nom,
        probleme: "Produit en rupture de stock.",
      });
    } else if (ligne.quantite > ligne.stockDisponible) {
      problemes.push({
        cle: cleLigne(ligne),
        nom: ligne.nomVariante ? `${ligne.nom} (${ligne.nomVariante})` : ligne.nom,
        probleme: `Quantité limitée à ${ligne.stockDisponible} en stock.`,
      });
    }
  }
  return problemes;
}

export function serialiserPanier(lignes: LignePanier[]): string {
  return JSON.stringify({ version: 1, lignes });
}

export function deserialiserPanier(brut: string | null): LignePanier[] {
  if (!brut) return [];
  try {
    const donnees = JSON.parse(brut) as { version?: number; lignes?: LignePanier[] };
    if (!donnees || !Array.isArray(donnees.lignes)) return [];
    return donnees.lignes.filter(
      (l) => l && typeof l.produitId === "string" && typeof l.quantite === "number",
    );
  } catch {
    return [];
  }
}
