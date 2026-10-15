import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { GalerieProduit } from "@/components/boutique/galerie-produit";
import { SelecteurAchat } from "@/components/boutique/selecteur-achat";
import { TitreSection } from "@/components/boutique/titre-section";
import { GrilleProduits } from "@/components/boutique/grille-produits";
import { obtenirProduitParSlug, listerProduitsSimilaires } from "@/services/produits";
import { obtenirParametresBoutique } from "@/services/parametres";
import { env } from "@/lib/env";
import { formatMontant } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const produit = await obtenirProduitParSlug(slug);
  if (!produit) return { title: "Produit introuvable", robots: { index: false } };

  const image = produit.images_produits.find((i) => i.est_principale) ?? produit.images_produits[0];
  return {
    title: produit.titre_seo || produit.nom,
    description:
      produit.description_seo || produit.description_courte || `Découvrez ${produit.nom}.`,
    alternates: { canonical: `/produits/${produit.slug}` },
    openGraph: {
      title: produit.nom,
      description: produit.description_courte ?? undefined,
      type: "website",
      ...(image ? { images: [{ url: image.url, alt: image.texte_alt ?? produit.nom }] } : {}),
    },
  };
}

export default async function PageProduit({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const produit = await obtenirProduitParSlug(slug);
  if (!produit) notFound();

  const [similaires, parametres] = await Promise.all([
    listerProduitsSimilaires(
      { id: produit.id, categorie_id: produit.categorie_id },
      4,
    ),
    obtenirParametresBoutique(),
  ]);

  const imagePrincipale =
    produit.images_produits.find((i) => i.est_principale) ?? produit.images_produits[0];
  const enStock = produit.quantite_stock > 0 || produit.variantes_produit.some((v) => v.quantite_stock > 0);
  const prixAffiche = produit.prix_promotionnel ?? produit.prix_vente;

  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produit.nom,
    description: produit.description_courte ?? produit.description ?? produit.nom,
    sku: produit.reference_sku ?? produit.id,
    ...(produit.categories?.nom ? { category: produit.categories.nom } : {}),
    ...(imagePrincipale ? { image: [`${imagePrincipale.url.startsWith("http") ? "" : env.siteUrl}${imagePrincipale.url}`] } : {}),
    brand: { "@type": "Brand", name: "ZOUHRI FRAGRANCE" },
    offers: {
      "@type": "Offer",
      url: `${env.siteUrl}/produits/${produit.slug}`,
      priceCurrency: produit.devise,
      price: prixAffiche,
      availability: enStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: parametres.identite.nom_boutique },
    },
  };

  return (
    <div className="container-luxe py-8 sm:py-10">
      <FilAriane
        elements={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Boutique", href: "/boutique" },
          ...(produit.categories
            ? [{ libelle: produit.categories.nom, href: `/categories/${produit.categories.slug}` }]
            : []),
          { libelle: produit.nom },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <GalerieProduit
          images={produit.images_produits.map((i) => ({
            id: i.id,
            url: i.url,
            texte_alt: i.texte_alt,
          }))}
          nom={produit.nom}
        />

        <div className="space-y-6">
          <div className="space-y-3">
            {produit.categories ? (
              <Link
                href={`/categories/${produit.categories.slug}`}
                className="eyebrow hover:text-or"
              >
                {produit.categories.nom}
              </Link>
            ) : null}
            <h1 className="font-serif text-3xl sm:text-4xl">{produit.nom}</h1>
            {produit.description_courte ? (
              <p className="text-sm leading-relaxed text-gris sm:text-base">
                {produit.description_courte}
              </p>
            ) : null}
            {produit.reference_sku ? (
              <p className="text-xs text-gris">Référence : {produit.reference_sku}</p>
            ) : null}
          </div>

          <SelecteurAchat produit={produit} />

          <dl className="grid gap-3 rounded-xl border border-bordure bg-white p-4 text-sm sm:p-5">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-or" />
              <div>
                <dt className="font-medium text-noir">Livraison</dt>
                <dd className="text-gris">
                  Partout au Maroc. Frais {formatMontant(parametres.livraison.frais_livraison)} ·
                  offerte dès {formatMontant(parametres.livraison.seuil_livraison_gratuite)}.
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-or" />
              <div>
                <dt className="font-medium text-noir">Commande</dt>
                <dd className="text-gris">
                  Sans compte. Aucun paiement en ligne. Notre équipe confirme votre commande.
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-or" />
              <div>
                <dt className="font-medium text-noir">Retours</dt>
                <dd className="text-gris">
                  Voir notre page{" "}
                  <Link href="/livraison-retours" className="text-or-fonce underline">
                    Livraison & retours
                  </Link>
                  .
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {produit.description ? (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-serif text-2xl">Description</h2>
          <span className="mt-3 block h-px w-14 bg-or" />
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-noir/85 sm:text-base">
            {produit.description.split("\n").map((paragraphe, index) => (
              <p key={index}>{paragraphe}</p>
            ))}
          </div>
        </section>
      ) : null}

      {similaires.length > 0 ? (
        <section className="mt-14">
          <TitreSection eyebrow="Vous aimerez aussi" titre="Produits similaires" alignement="gauche" />
          <GrilleProduits produits={similaires} />
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />
    </div>
  );
}
