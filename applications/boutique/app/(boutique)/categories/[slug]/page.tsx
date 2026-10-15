import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { GrilleProduits } from "@/components/boutique/grille-produits";
import { Pagination } from "@/components/boutique/pagination";
import { SelecteurTri } from "@/components/boutique/selecteur-tri";
import { EtatVide } from "@/components/ui/etat-vide";
import {
  construireArbre,
  listerCategories,
  rechercherCategorieParSlug,
  resoudreIdsCategorieEtDescendants,
} from "@/services/categories";
import { listerProduits, type TriCatalogue } from "@/services/produits";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function premier(valeur: string | string[] | undefined): string {
  if (Array.isArray(valeur)) return valeur[0] ?? "";
  return valeur ?? "";
}

async function resoudreCategorie(slug: string) {
  const categorie = await rechercherCategorieParSlug(slug);
  if (!categorie) return null;
  const resolution = await resoudreIdsCategorieEtDescendants(categorie.id);
  return { categorie, ids: resolution?.ids ?? [categorie.id] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categorie = await rechercherCategorieParSlug(slug);
  if (!categorie) return { title: "Catégorie introuvable", robots: { index: false } };
  const titre = categorie.titre_seo || categorie.nom;
  return {
    title: titre,
    description:
      categorie.description_seo ||
      categorie.description ||
      `Découvrez notre catégorie ${categorie.nom}.`,
    alternates: { canonical: `/categories/${categorie.slug}` },
    openGraph: categorie.image_url ? { images: [{ url: categorie.image_url }] } : undefined,
  };
}

export default async function PageCategorie({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tri = (premier(sp.tri) || "nouveautes") as TriCatalogue;
  const page = Math.max(1, Number(premier(sp.page)) || 1);

  const resolution = await resoudreCategorie(slug);
  if (!resolution) notFound();

  const { categorie, ids } = resolution;
  const resultat = await listerProduits({
    categorieIds: ids,
    tri: ["nouveautes", "prix_asc", "prix_desc", "popularite"].includes(tri)
      ? tri
      : "nouveautes",
    page,
    parPage: 12,
  });

  const arbre = construireArbre(await listerCategories());
  const noeuds = arbre.flatMap((c) => [c, ...c.enfants]);
  const enfants = noeuds.filter((c) => c.categorie_parente_id === categorie.id);

  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: categorie.nom,
    url: `${env.siteUrl}/categories/${categorie.slug}`,
    ...(categorie.description ? { description: categorie.description } : {}),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: resultat.produits.map((p, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${env.siteUrl}/produits/${p.slug}`,
        name: p.nom,
      })),
    },
  };

  return (
    <div className="container-luxe py-8 sm:py-10">
      <FilAriane
        elements={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Boutique", href: "/boutique" },
          { libelle: categorie.nom },
        ]}
      />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">{categorie.nom}</h1>
          {categorie.description ? (
            <p className="mt-2 max-w-2xl text-sm text-gris">{categorie.description}</p>
          ) : null}
        </div>
        <SelecteurTri valeur={tri} />
      </div>

      {enfants.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {enfants.map((enfant) => (
            <Link
              key={enfant.id}
              href={`/categories/${enfant.slug}`}
              className="rounded-full border border-bordure bg-white px-4 py-2 text-sm text-noir transition-colors hover:border-or/50 hover:text-or-fonce"
            >
              {enfant.nom}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {resultat.produits.length === 0 ? (
          <EtatVide
            icon={PackageSearch}
            titre="Aucun produit dans cette catégorie"
            description="Revenez bientôt, de nouveaux produits arrivent régulièrement."
          />
        ) : (
          <>
            <GrilleProduits produits={resultat.produits} />
            <Pagination
              chemin={`/categories/${categorie.slug}`}
              page={resultat.page}
              totalPages={resultat.totalPages}
              parametres={sp}
            />
          </>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />
    </div>
  );
}
