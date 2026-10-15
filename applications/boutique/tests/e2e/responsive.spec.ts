import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/boutique",
  "/nouveautes",
  "/meilleures-ventes",
  "/panier",
  "/commande",
  "/suivi-commande",
  "/contact",
  "/notre-histoire",
  "/produits/huile-precieuse-argan",
  "/categories/parfums-femme",
  "/conditions-generales",
];

test.describe("Responsive : absence de débordement horizontal", () => {
  for (const route of ROUTES) {
    test(`pas de scroll horizontal sur ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      const debordement = await page.evaluate(() => {
        const racine = document.documentElement;
        return racine.scrollWidth - racine.clientWidth;
      });
      expect(debordement, `Débordement de ${debordement}px sur ${route}`).toBeLessThanOrEqual(1);
    });
  }
});
