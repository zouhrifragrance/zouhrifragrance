import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { listerCategories } from "@/services/categories";
import { listerTousSlugsProduits } from "@/services/produits";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const maintenant = new Date();

  const statiques: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: maintenant, changeFrequency: "daily", priority: 1 },
    { url: `${base}/boutique`, lastModified: maintenant, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/nouveautes`, lastModified: maintenant, changeFrequency: "daily", priority: 0.8 },
    {
      url: `${base}/meilleures-ventes`,
      lastModified: maintenant,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/notre-histoire`,
      lastModified: maintenant,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    { url: `${base}/contact`, lastModified: maintenant, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${base}/conditions-generales`,
      lastModified: maintenant,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/confidentialite`,
      lastModified: maintenant,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/livraison-retours`,
      lastModified: maintenant,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [categories, produits] = await Promise.all([
    listerCategories().catch(() => []),
    listerTousSlugsProduits().catch(() => []),
  ]);

  const pagesCategories: MetadataRoute.Sitemap = categories.map((categorie) => ({
    url: `${base}/categories/${categorie.slug}`,
    lastModified: maintenant,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const pagesProduits: MetadataRoute.Sitemap = produits.map((produit) => ({
    url: `${base}/produits/${produit.slug}`,
    lastModified: produit.date_modification ? new Date(produit.date_modification) : maintenant,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...statiques, ...pagesCategories, ...pagesProduits];
}
