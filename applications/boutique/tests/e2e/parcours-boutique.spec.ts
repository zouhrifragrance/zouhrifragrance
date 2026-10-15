import { test, expect } from "@playwright/test";

test.describe("Parcours boutique (mode démo)", () => {
  test("la page d'accueil présente la marque", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ZOUHRI/);
    await expect(page.getByRole("link", { name: /Boutique/i }).first()).toBeVisible();
  });

  test("la boutique liste des produits", async ({ page }) => {
    await page.goto("/boutique");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href^="/produits/"]').first()).toBeVisible();
  });

  test("la boutique expose des métadonnées SEO", async ({ page }) => {
    await page.goto("/boutique");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    const jsonLd = page.locator('script[type="application/ld+json"]');
    expect(await jsonLd.count()).toBeGreaterThan(0);
  });

  test("ajout au panier puis affichage dans le panier", async ({ page }) => {
    await page.goto("/produits/huile-precieuse-argan");
    await expect(page.getByRole("heading", { name: /Argan/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /Ajouter au panier/i }).click();
    await page.goto("/panier");
    await expect(page.getByRole("heading", { name: /Votre panier/i })).toBeVisible();
    await expect(page.getByText(/Argan/i).first()).toBeVisible();
  });

  test("le suivi de commande affiche le formulaire de jeton", async ({ page }) => {
    await page.goto("/suivi-commande");
    await expect(page.getByRole("heading", { name: /Suivi de commande/i })).toBeVisible();
    await expect(page.locator('input[name="jeton"]')).toBeVisible();
  });

  test("la page contact affiche le formulaire", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /Nous contacter/i })).toBeVisible();
    await expect(page.locator('input[name="nom"]')).toBeVisible();
  });

  test("les pages éditoriales sont accessibles", async ({ page }) => {
    for (const chemin of ["/notre-histoire", "/confidentialite", "/conditions-generales", "/livraison-retours"]) {
      const reponse = await page.goto(chemin);
      expect(reponse?.status(), chemin).toBeLessThan(400);
    }
  });

  test("une page inconnue affiche la 404 personnalisée", async ({ page }) => {
    const reponse = await page.goto("/page-inexistante-xyz");
    expect(reponse?.status()).toBe(404);
  });
});
