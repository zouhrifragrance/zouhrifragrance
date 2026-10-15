import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { GrilleProduits } from "@/components/boutique/grille-produits";
import { Pagination } from "@/components/boutique/pagination";
import { EtatVide } from "@/components/ui/etat-vide";
import { listerProduits } from "@/services/produits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nouveautés",
  description:
    "Découvrez les dernières nouveautés ZOUHRI FRAGRANCE : parfums et cosmétiques récemment ajoutés.",
  alternates: { canonical: "/nouveautes" },
};

function premier(valeur: string | string[] | undefined): string {
  if (Array.isArray(valeur)) return valeur[0] ?? "";
  return valeur ?? "";
}

export default async function PageNouveautes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(premier(params.page)) || 1);
  const resultat = await listerProduits({ tri: "nouveautes", page, parPage: 12 });

  return (
    <div className="container-luxe py-8 sm:py-10">
      <FilAriane
        elements={[{ libelle: "Accueil", href: "/" }, { libelle: "Nouveautés" }]}
      />
      <div className="mt-3 space-y-2">
        <span className="eyebrow inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Arrivages
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl">Nouveautés</h1>
        <p className="max-w-2xl text-sm text-gris">
          Les derniers produits ajoutés à notre boutique.
        </p>
      </div>

      <div className="mt-8">
        {resultat.produits.length === 0 ? (
          <EtatVide
            icon={Sparkles}
            titre="Aucune nouveauté pour le moment"
            description="De nouveaux produits seront bientôt disponibles."
          />
        ) : (
          <>
            <GrilleProduits produits={resultat.produits} />
            <Pagination
              chemin="/nouveautes"
              page={resultat.page}
              totalPages={resultat.totalPages}
              parametres={params}
            />
          </>
        )}
      </div>
    </div>
  );
}
