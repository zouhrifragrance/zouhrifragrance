import { describe, it, expect } from "vitest";
import {
  formatMontant,
  formatDate,
  lienWhatsApp,
  normaliserTelephone,
  slugifier,
  tronquer,
} from "@/lib/utils";

describe("slugifier", () => {
  it("retire les accents et normalise les espaces", () => {
    expect(slugifier("Parfum Homme Élégant")).toBe("parfum-homme-elegant");
  });

  it("supprime la ponctuation", () => {
    expect(slugifier("Eau de toilette (100 ml) !")).toBe("eau-de-toilette-100-ml");
  });

  it("nettoie les tirets aux extrémités", () => {
    expect(slugifier("  --Test--  ")).toBe("test");
  });
});

describe("formatMontant", () => {
  it("formate un montant en MAD", () => {
    expect(formatMontant(300)).toBe("300,00 MAD");
  });

  it("accepte une chaîne numérique", () => {
    expect(formatMontant("49.9")).toBe("49,90 MAD");
  });

  it("gère les valeurs nulles", () => {
    expect(formatMontant(null)).toBe("0,00 MAD");
  });

  it("accepte une devise personnalisée", () => {
    expect(formatMontant(10, "EUR")).toBe("10,00 EUR");
  });
});

describe("formatDate", () => {
  it("formate une date en français", () => {
    expect(formatDate("2024-01-15T12:00:00Z")).toBe("15 janvier 2024");
  });

  it("renvoie un tiret pour une date absente", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("renvoie un tiret pour une date invalide", () => {
    expect(formatDate("nimportequoi")).toBe("—");
  });
});

describe("normaliserTelephone", () => {
  it("convertit le format local", () => {
    expect(normaliserTelephone("0612345678")).toBe("+212612345678");
  });

  it("accepte le préfixe international", () => {
    expect(normaliserTelephone("+212 612 345 678")).toBe("+212612345678");
  });

  it("accepte le préfixe sans +", () => {
    expect(normaliserTelephone("212612345678")).toBe("+212612345678");
  });

  it("refuse un numéro invalide", () => {
    expect(normaliserTelephone("12345")).toBeNull();
    expect(normaliserTelephone("0412345678")).toBeNull();
  });
});

describe("tronquer", () => {
  it("laisse le texte court intact", () => {
    expect(tronquer("court", 10)).toBe("court");
  });

  it("coupe et ajoute une ellipsis", () => {
    expect(tronquer("un texte trop long", 7)).toBe("un text…");
  });
});

describe("lienWhatsApp", () => {
  it("construit un lien wa.me", () => {
    expect(lienWhatsApp("+212 612 345 678", "Bonjour")).toBe(
      "https://wa.me/212612345678?text=Bonjour",
    );
  });

  it("renvoie null sans numéro", () => {
    expect(lienWhatsApp(null, "Bonjour")).toBeNull();
  });
});
