import { describe, it, expect } from "vitest";
import {
  commandeSchema,
  contactSchema,
  newsletterSchema,
  telephoneMaroc,
} from "@/schemas/commande";
import { promotionSchema, categorieSchema } from "@/schemas/categorie";

const UUID_PRODUIT = "11111111-1111-1111-1111-111111111111";

function commandeValide(partiel: Record<string, unknown> = {}) {
  return {
    nom_client: "Ayoub Zouhri",
    telephone_client: "0612345678",
    email_client: "",
    ville_livraison: "Casablanca",
    adresse_livraison: "12 rue des Roses, quartier Gauthier",
    complement_adresse: "",
    instructions_livraison: "",
    code_promotion: "bienvenue10",
    articles: [{ produitId: UUID_PRODUIT, varianteId: null, quantite: 2 }],
    accepter_conditions: true,
    ...partiel,
  };
}

describe("telephoneMaroc", () => {
  it("accepte un numéro local valide", () => {
    expect(telephoneMaroc.safeParse("0612345678").success).toBe(true);
  });

  it("accepte un numéro international valide", () => {
    expect(telephoneMaroc.safeParse("+212612345678").success).toBe(true);
  });

  it("refuse un numéro invalide", () => {
    expect(telephoneMaroc.safeParse("12345").success).toBe(false);
  });
});

describe("commandeSchema", () => {
  it("valide une commande complète et normalise le code promo", () => {
    const resultat = commandeSchema.safeParse(commandeValide());
    expect(resultat.success).toBe(true);
    if (resultat.success) {
      expect(resultat.data.code_promotion).toBe("BIENVENUE10");
      expect(resultat.data.email_client).toBeNull();
    }
  });

  it("exige l'acceptation des conditions", () => {
    expect(commandeSchema.safeParse(commandeValide({ accepter_conditions: false })).success).toBe(
      false,
    );
  });

  it("refuse un panier vide", () => {
    expect(commandeSchema.safeParse(commandeValide({ articles: [] })).success).toBe(false);
  });

  it("refuse une quantité supérieure à 50", () => {
    const resultat = commandeSchema.safeParse(
      commandeValide({ articles: [{ produitId: UUID_PRODUIT, quantite: 51 }] }),
    );
    expect(resultat.success).toBe(false);
  });

  it("refuse un nom trop court", () => {
    expect(commandeSchema.safeParse(commandeValide({ nom_client: "A" })).success).toBe(false);
  });

  it("refuse une adresse trop courte", () => {
    expect(commandeSchema.safeParse(commandeValide({ adresse_livraison: "rue" })).success).toBe(
      false,
    );
  });
});

describe("contactSchema", () => {
  it("valide un message correct", () => {
    const resultat = contactSchema.safeParse({
      nom: "Sara",
      telephone: "0612345678",
      email: "",
      message: "Bonjour, je souhaite des informations.",
    });
    expect(resultat.success).toBe(true);
  });

  it("refuse un message trop court", () => {
    const resultat = contactSchema.safeParse({
      nom: "Sara",
      telephone: "0612345678",
      message: "court",
    });
    expect(resultat.success).toBe(false);
  });
});

describe("newsletterSchema", () => {
  it("accepte un e-mail valide", () => {
    expect(newsletterSchema.safeParse({ email: "test@exemple.ma" }).success).toBe(true);
  });

  it("refuse un e-mail invalide", () => {
    expect(newsletterSchema.safeParse({ email: "pas-un-email" }).success).toBe(false);
  });
});

describe("promotionSchema", () => {
  const base = {
    code: "promo10",
    nom: "Promo de bienvenue",
    type_reduction: "POURCENTAGE" as const,
    valeur: 10,
    montant_minimum: 0,
    limite_utilisation: null,
    categories_ids: [],
    produits_ids: [],
    date_debut: "2024-01-01",
    date_fin: "",
    est_active: true,
  };

  it("met le code en majuscules", () => {
    const resultat = promotionSchema.safeParse(base);
    expect(resultat.success).toBe(true);
    if (resultat.success) expect(resultat.data.code).toBe("PROMO10");
  });

  it("refuse un pourcentage supérieur à 100", () => {
    expect(promotionSchema.safeParse({ ...base, valeur: 150 }).success).toBe(false);
  });

  it("refuse une date de fin antérieure au début", () => {
    expect(
      promotionSchema.safeParse({ ...base, date_debut: "2024-06-01", date_fin: "2024-01-01" }).success,
    ).toBe(false);
  });

  it("refuse une valeur négative", () => {
    expect(promotionSchema.safeParse({ ...base, valeur: -5 }).success).toBe(false);
  });
});

describe("categorieSchema", () => {
  it("valide une catégorie correcte", () => {
    const resultat = categorieSchema.safeParse({
      nom: "Parfums femme",
      slug: "parfums-femme",
      ordre_affichage: 1,
      est_active: true,
    });
    expect(resultat.success).toBe(true);
  });

  it("refuse un slug avec majuscules ou espaces", () => {
    expect(categorieSchema.safeParse({ nom: "Test", slug: "Mon Slug" }).success).toBe(false);
  });
});
