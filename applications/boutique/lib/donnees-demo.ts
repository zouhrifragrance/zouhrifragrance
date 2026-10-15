import type { Categorie, Produit, ImageProduit, VarianteProduit } from "@/types";

/**
 * Donnees de DEMONSTRATION uniquement.
 * Elles ne sont utilisees que si NEXT_PUBLIC_DEMO_MODE=1 ou si Supabase n'est
 * pas configure. Elles ne representent pas des donnees reelles de la boutique.
 * Les images sont des visuels provisoires.
 */

const maintenant = new Date().toISOString();

export const categoriesDemo: Categorie[] = [
  { id: "11111111-1111-1111-1111-111111111111", nom: "Parfums", slug: "parfums", description: "Nos parfums pour homme, femme et mixte.", image_url: "/images/categorie-provisoire.svg", categorie_parente_id: null, ordre_affichage: 1, est_active: true, titre_seo: "Parfums au Maroc", description_seo: "Découvrez notre sélection de parfums.", date_creation: maintenant, date_modification: maintenant },
  { id: "11111111-1111-1111-1111-111111111112", nom: "Parfums pour homme", slug: "parfums-homme", description: "Fragrances masculines affirmées.", image_url: "/images/categorie-provisoire.svg", categorie_parente_id: "11111111-1111-1111-1111-111111111111", ordre_affichage: 1, est_active: true, titre_seo: "Parfums pour homme", description_seo: null, date_creation: maintenant, date_modification: maintenant },
  { id: "11111111-1111-1111-1111-111111111113", nom: "Parfums pour femme", slug: "parfums-femme", description: "Fragrances féminines raffinées.", image_url: "/images/categorie-provisoire.svg", categorie_parente_id: "11111111-1111-1111-1111-111111111111", ordre_affichage: 2, est_active: true, titre_seo: "Parfums pour femme", description_seo: null, date_creation: maintenant, date_modification: maintenant },
  { id: "11111111-1111-1111-1111-111111111114", nom: "Parfums mixtes", slug: "parfums-mixtes", description: "Fragrances unisexes intemporelles.", image_url: "/images/categorie-provisoire.svg", categorie_parente_id: "11111111-1111-1111-1111-111111111111", ordre_affichage: 3, est_active: true, titre_seo: "Parfums mixtes", description_seo: null, date_creation: maintenant, date_modification: maintenant },
  { id: "11111111-1111-1111-1111-111111111115", nom: "Cosmétiques", slug: "cosmetiques", description: "Soins et beauté.", image_url: "/images/categorie-provisoire.svg", categorie_parente_id: null, ordre_affichage: 2, est_active: true, titre_seo: "Cosmétiques", description_seo: null, date_creation: maintenant, date_modification: maintenant },
  { id: "11111111-1111-1111-1111-111111111117", nom: "Coffrets cadeaux", slug: "coffrets-cadeaux", description: "Coffrets prêts à offrir.", image_url: "/images/categorie-provisoire.svg", categorie_parente_id: null, ordre_affichage: 3, est_active: true, titre_seo: "Coffrets cadeaux", description_seo: null, date_creation: maintenant, date_modification: maintenant },
];

function image(produitId: string): ImageProduit {
  return { id: `img-${produitId}`, produit_id: produitId, url: "/images/produit-provisoire.svg", texte_alt: "Visuel provisoire", est_principale: true, ordre_affichage: 0, date_creation: maintenant };
}

export const produitsDemo: Produit[] = [
  { id: "22222222-2222-2222-2222-222222222221", nom: "Oud Royal", slug: "oud-royal", description_courte: "Un oud profond et boisé, signature de la maison.", description: "Oud Royal est une fragrance boisée et orientale construite autour d'un oud noble.", categorie_id: "11111111-1111-1111-1111-111111111112", reference_sku: "ZF-OUD-001", prix_vente: 690, prix_promotionnel: 590, devise: "MAD", quantite_stock: 24, seuil_stock_faible: 5, est_mis_en_avant: true, est_publie: true, titre_seo: "Oud Royal — Parfum boisé", description_seo: "Oud Royal, parfum boisé et oriental pour homme.", date_creation: maintenant, date_modification: maintenant },
  { id: "22222222-2222-2222-2222-222222222222", nom: "Fleur de Maroc", slug: "fleur-de-maroc", description_courte: "Un floral lumineux inspiré des jardins marocains.", description: "Fleur de Maroc associe la rose, le jasmin et une touche d'agrumes.", categorie_id: "11111111-1111-1111-1111-111111111113", reference_sku: "ZF-FLR-002", prix_vente: 550, prix_promotionnel: null, devise: "MAD", quantite_stock: 30, seuil_stock_faible: 5, est_mis_en_avant: true, est_publie: true, titre_seo: "Fleur de Maroc — Parfum floral", description_seo: "Parfum floral pour femme.", date_creation: maintenant, date_modification: maintenant },
  { id: "22222222-2222-2222-2222-222222222223", nom: "Ambre Nuit", slug: "ambre-nuit", description_courte: "Ambre chaud et vanillé pour les soirées.", description: "Fragrance gourmande et enveloppante.", categorie_id: "11111111-1111-1111-1111-111111111114", reference_sku: "ZF-AMB-003", prix_vente: 620, prix_promotionnel: 540, devise: "MAD", quantite_stock: 18, seuil_stock_faible: 5, est_mis_en_avant: true, est_publie: true, titre_seo: "Ambre Nuit — Parfum mixte", description_seo: "Parfum mixte ambré et vanillé.", date_creation: maintenant, date_modification: maintenant },
  { id: "22222222-2222-2222-2222-222222222224", nom: "Brise Atlantique", slug: "brise-atlantique", description_courte: "Une eau fraîche aux notes marines.", description: "Notes marines, bergamote et bois flotté.", categorie_id: "11111111-1111-1111-1111-111111111114", reference_sku: "ZF-BRI-004", prix_vente: 480, prix_promotionnel: null, devise: "MAD", quantite_stock: 40, seuil_stock_faible: 8, est_mis_en_avant: false, est_publie: true, titre_seo: "Brise Atlantique — Eau fraîche", description_seo: "Eau fraîche aux notes marines.", date_creation: maintenant, date_modification: maintenant },
  { id: "22222222-2222-2222-2222-222222222225", nom: "Huile précieuse d'Argan", slug: "huile-precieuse-argan", description_courte: "Huile d'argan vierge pour la peau et les cheveux.", description: "Huile d'argan pressée à froid, riche en vitamine E.", categorie_id: "11111111-1111-1111-1111-111111111115", reference_sku: "ZF-ARG-005", prix_vente: 220, prix_promotionnel: null, devise: "MAD", quantite_stock: 50, seuil_stock_faible: 10, est_mis_en_avant: false, est_publie: true, titre_seo: "Huile d'Argan", description_seo: "Soin naturel pour la peau et les cheveux.", date_creation: maintenant, date_modification: maintenant },
  { id: "22222222-2222-2222-2222-222222222226", nom: "Coffret Découverte", slug: "coffret-decouverte", description_courte: "Trois miniatures pour découvrir la maison.", description: "Oud Royal, Fleur de Maroc et Ambre Nuit en format voyage.", categorie_id: "11111111-1111-1111-1111-111111111117", reference_sku: "ZF-COF-006", prix_vente: 350, prix_promotionnel: 299, devise: "MAD", quantite_stock: 12, seuil_stock_faible: 4, est_mis_en_avant: true, est_publie: true, titre_seo: "Coffret Découverte", description_seo: "Trio de parfums à offrir.", date_creation: maintenant, date_modification: maintenant },
];

export const imagesDemo: ImageProduit[] = produitsDemo.map((p) => image(p.id));

export const variantesDemo: VarianteProduit[] = [
  { id: "33333333-3333-3333-3333-333333333301", produit_id: "22222222-2222-2222-2222-222222222221", nom: "50 ml", contenance: "50 ml", reference_sku: "ZF-OUD-001-50", prix_vente: 420, prix_promotionnel: null, quantite_stock: 14, seuil_stock_faible: 4, est_active: true, ordre_affichage: 1, date_creation: maintenant, date_modification: maintenant },
  { id: "33333333-3333-3333-3333-333333333302", produit_id: "22222222-2222-2222-2222-222222222221", nom: "100 ml", contenance: "100 ml", reference_sku: "ZF-OUD-001-100", prix_vente: 690, prix_promotionnel: null, quantite_stock: 10, seuil_stock_faible: 4, est_active: true, ordre_affichage: 2, date_creation: maintenant, date_modification: maintenant },
  { id: "33333333-3333-3333-3333-333333333303", produit_id: "22222222-2222-2222-2222-222222222222", nom: "50 ml", contenance: "50 ml", reference_sku: "ZF-FLR-002-50", prix_vente: 350, prix_promotionnel: null, quantite_stock: 18, seuil_stock_faible: 4, est_active: true, ordre_affichage: 1, date_creation: maintenant, date_modification: maintenant },
  { id: "33333333-3333-3333-3333-333333333304", produit_id: "22222222-2222-2222-2222-222222222222", nom: "100 ml", contenance: "100 ml", reference_sku: "ZF-FLR-002-100", prix_vente: 550, prix_promotionnel: null, quantite_stock: 12, seuil_stock_faible: 4, est_active: true, ordre_affichage: 2, date_creation: maintenant, date_modification: maintenant },
];

export const parametresDemo = {
  identite: { nom_boutique: "ZOUHRI FRAGRANCE", slogan: "L'art du parfum, à la marocaine" },
  livraison: { frais_livraison: 30, seuil_livraison_gratuite: 500, paiement_a_reception: true },
};
