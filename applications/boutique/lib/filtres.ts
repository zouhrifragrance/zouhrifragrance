export interface ValeursFiltres {
  recherche: string;
  categories: string[];
  prixMin: string;
  prixMax: string;
  tri: string;
}

export function compteurFiltresActifs(valeurs: ValeursFiltres): number {
  return (
    valeurs.categories.length +
    (valeurs.prixMin ? 1 : 0) +
    (valeurs.prixMax ? 1 : 0) +
    (valeurs.recherche ? 1 : 0)
  );
}
