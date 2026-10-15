import { describe, it, expect } from "vitest";
import {
  ajouterLigne,
  arrondir,
  calculerFraisLivraison,
  calculerSousTotal,
  calculerTotal,
  cleLigne,
  detecterProblemesStock,
  deserialiserPanier,
  modifierQuantite,
  quantiteTotale,
  retirerLigne,
  serialiserPanier,
} from "@/lib/panier";
import type { LignePanier } from "@/types";

function ligne(partiel: Partial<LignePanier> = {}): LignePanier {
  return {
    produitId: "p1",
    varianteId: null,
    slug: "produit-1",
    nom: "Produit 1",
    nomVariante: null,
    contenance: null,
    prixUnitaire: 100,
    prixBarre: null,
    imageUrl: null,
    quantite: 1,
    stockDisponible: 10,
    referenceSku: null,
    ...partiel,
  };
}

describe("cleLigne", () => {
  it("distingue les variantes", () => {
    expect(cleLigne(ligne())).toBe("p1::sans-variante");
    expect(cleLigne(ligne({ varianteId: "v1" }))).toBe("p1::v1");
  });
});

describe("calculerSousTotal", () => {
  it("additionne prix × quantité", () => {
    expect(calculerSousTotal([ligne({ prixUnitaire: 100, quantite: 2 }), ligne({ prixUnitaire: 50 })])).toBe(250);
  });

  it("arrondit au centime", () => {
    expect(calculerSousTotal([ligne({ prixUnitaire: 0.1, quantite: 3 })])).toBe(0.3);
  });

  it("vaut 0 pour un panier vide", () => {
    expect(calculerSousTotal([])).toBe(0);
  });
});

describe("quantiteTotale", () => {
  it("cumule les quantités", () => {
    expect(quantiteTotale([ligne({ quantite: 2 }), ligne({ quantite: 3 })])).toBe(5);
  });
});

describe("calculerFraisLivraison", () => {
  it("gratuit au-dessus du seuil", () => {
    expect(calculerFraisLivraison(600, 30, 500)).toBe(0);
  });

  it("facture en dessous du seuil", () => {
    expect(calculerFraisLivraison(200, 30, 500)).toBe(30);
  });

  it("aucun frais pour un panier vide", () => {
    expect(calculerFraisLivraison(0, 30, 500)).toBe(0);
  });

  it("seuil 0 désactive la gratuité", () => {
    expect(calculerFraisLivraison(1000, 30, 0)).toBe(30);
  });
});

describe("calculerTotal", () => {
  it("soustrait la réduction et ajoute la livraison", () => {
    expect(calculerTotal(300, 50, 30)).toBe(280);
  });

  it("ne descend jamais sous 0", () => {
    expect(calculerTotal(100, 500, 0)).toBe(0);
  });
});

describe("arrondir", () => {
  it("arrondit à 2 décimales", () => {
    expect(arrondir(1.234)).toBe(1.23);
    expect(arrondir(1.235)).toBe(1.24);
    expect(arrondir(2.674)).toBe(2.67);
  });
});

describe("ajouterLigne", () => {
  it("ajoute une nouvelle ligne", () => {
    const resultat = ajouterLigne([], ligne());
    expect(resultat).toHaveLength(1);
    expect(resultat[0]?.quantite).toBe(1);
  });

  it("fusionne les lignes identiques", () => {
    const resultat = ajouterLigne([ligne({ quantite: 2 })], ligne({ quantite: 3 }));
    expect(resultat).toHaveLength(1);
    expect(resultat[0]?.quantite).toBe(5);
  });

  it("ne dépasse pas le stock disponible", () => {
    const resultat = ajouterLigne([ligne({ quantite: 9, stockDisponible: 10 })], ligne({ quantite: 5 }));
    expect(resultat[0]?.quantite).toBe(10);
  });

  it("traite les variantes séparément", () => {
    const resultat = ajouterLigne([ligne()], ligne({ varianteId: "v1" }));
    expect(resultat).toHaveLength(2);
  });
});

describe("modifierQuantite", () => {
  it("met à jour la quantité", () => {
    const resultat = modifierQuantite([ligne()], "p1::sans-variante", 4);
    expect(resultat[0]?.quantite).toBe(4);
  });

  it("borne à la quantité maximale du stock", () => {
    const resultat = modifierQuantite([ligne({ stockDisponible: 3 })], "p1::sans-variante", 99);
    expect(resultat[0]?.quantite).toBe(3);
  });

  it("retire la ligne si quantité <= 0", () => {
    expect(modifierQuantite([ligne()], "p1::sans-variante", 0)).toHaveLength(0);
  });
});

describe("retirerLigne", () => {
  it("supprime la ligne ciblée", () => {
    expect(retirerLigne([ligne(), ligne({ produitId: "p2" })], "p1::sans-variante")).toHaveLength(1);
  });
});

describe("detecterProblemesStock", () => {
  it("signale une rupture", () => {
    const problemes = detecterProblemesStock([ligne({ stockDisponible: 0 })]);
    expect(problemes).toHaveLength(1);
    expect(problemes[0]?.probleme).toContain("rupture");
  });

  it("signale une quantité supérieure au stock", () => {
    const problemes = detecterProblemesStock([ligne({ quantite: 5, stockDisponible: 3 })]);
    expect(problemes[0]?.probleme).toContain("3");
  });

  it("ne signale rien si tout est bon", () => {
    expect(detecterProblemesStock([ligne({ quantite: 2, stockDisponible: 5 })])).toHaveLength(0);
  });
});

describe("serialiserPanier / deserialiserPanier", () => {
  it("fait un aller-retour", () => {
    const lignes = [ligne({ quantite: 2 })];
    expect(deserialiserPanier(serialiserPanier(lignes))).toEqual(lignes);
  });

  it("renvoie un tableau vide pour une chaîne invalide", () => {
    expect(deserialiserPanier("pas du json")).toEqual([]);
    expect(deserialiserPanier(null)).toEqual([]);
  });

  it("filtre les lignes malformées", () => {
    const brut = JSON.stringify({ version: 1, lignes: [ligne(), { produitId: 42 }] });
    expect(deserialiserPanier(brut)).toHaveLength(1);
  });
});
