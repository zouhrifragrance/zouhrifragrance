import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { FiltresCatalogue } from "@/components/boutique/filtres-catalogue";
import { SelecteurTri } from "@/components/boutique/selecteur-tri";
import { GrilleProduits } from "@/components/boutique/grille-produits";
import { Pagination } from "@/components/boutique/pagination";
import { EtatVide } from "@/components/ui/etat-vide";
import { Badge } from "@/components/ui/badge";
import { listerCategories, listerCategorieIdsParSlug } from "@/services/categories";
import { listerProduits, type TriCatalogue } from "@/services/produits";
import { formatNombre } from "@/lib/utils";
import { compteurFiltresActifs, type ValeursFiltres } from "@/lib/filtres";

export const dynamic = "force-dynamic";

const TITRES: Record<TriCatalogue, string> = {
  nouveautes: "Nouveautés",
  prix_asc: "Prix croissant",
  prix_desc: "Prix décroissant",
  popularite: "Popularité",
};

function premier(valeur: string | string[] | undefined): string {
  if (Array.isArray(valeur)) return valeur[0] ?? "";
  return valeur ?? "";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const recherche = premier(params.recherche);
  const titre = recherche ? `Recherche : ${recherche}` : "Boutique";
  const description = recherche
    ? `Résultats de recherche pour « ${recherche} » dans la boutique ZOUHRI FRAGRANCE.`
    : "Découvrez tous nos parfums et cosmétiques au Maroc. Filtrez par catégorie et par prix.";
  return {
    title: titre,
    description,
    alternates: { canonical: "/boutique" },
    robots: recherche ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function PageBoutique({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const recherche = premier(params.recherche);
  const tri = (premier(params.tri) || "nouveautes") as TriCatalogue;
  const page = Math.max(1, Number(premier(params.page)) || 1);
  const prixMin = premier(params.prix_min);
  const prixMax = premier(params.prix_max);
  const categoriesSlugs = Array.isArray(params.categorie)
    ? params.categorie
    : params.categorie
      ? [params.categorie]
      : [];

  const [categories, ...listesIds] = await Promise.all([
    listerCategories(),
    ...categoriesSlugs.map((slug) => listerCategorieIdsParSlug(slug)),
  ]);

  const categorieIds = [...new Set(listesIds.flatMap((ids) => ids ?? []))];

  const resultat = await listerProduits({
    recherche: recherche || undefined,
    categorieIds: categorieIds.length > 0 ? categorieIds : undefined,
    prixMin: prixMin ? Number(prixMin) : undefined,
    prixMax: prixMax ? Number(prixMax) : undefined,
    tri: Object.keys(TITRES).includes(tri) ? tri : "nouveautes",
    page,
    parPage: 12,
  });

  const valeurs: ValeursFiltres = {
    recherche,
    categories: categoriesSlugs,
    prixMin,
    prixMax,
    tri,
  };
  const filtresActifs = compteurFiltresActifs(valeurs);

  return (
    <div className="container-luxe py-8 sm:py-10">
      <div className="mb-6">
        <FilAriane elements={[{ libelle: "Accueil", href: "/" }, { libelle: "Boutique" }]} />
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl">Notre boutique</h1>
        <p className="mt-2 max-w-2xl text-sm text-gris">
          Parfums et cosmétiques sélectionnés avec soin. Utilisez les filtres pour
          trouver le produit qui vous convient.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <FiltresCatalogue
          categories={categories}
          valeurs={valeurs}
          nombreResultats={resultat.total}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gris">
                <span className="font-medium text-noir">{formatNombre(resultat.total)}</span>{" "}
                produit{resultat.total > 1 ? "s" : ""}
              </p>
              {filtresActifs > 0 ? (
                <Badge variant="neutral">{filtresActifs} filtre(s) actif(s)</Badge>
              ) : null}
            </div>
            <SelecteurTri valeur={tri} />
          </div>

          {recherche ? (
            <p className="mb-5 text-sm text-gris">
              Résultats pour <span className="font-medium text-noir">« {recherche} »</span>
            </p>
          ) : null}

          {resultat.produits.length === 0 ? (
            <EtatVide
              icon={PackageSearch}
              titre="Aucun produit ne correspond"
              description="Essayez de modifier vos filtres ou votre recherche."
            />
          ) : (
            <>
              <GrilleProduits produits={resultat.produits} />
              <Pagination
                chemin="/boutique"
                page={resultat.page}
                totalPages={resultat.totalPages}
                parametres={params}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
