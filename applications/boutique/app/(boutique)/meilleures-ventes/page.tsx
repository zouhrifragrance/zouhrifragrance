import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { GrilleProduits } from "@/components/boutique/grille-produits";
import { EtatVide } from "@/components/ui/etat-vide";
import { listerMeilleuresVentes } from "@/services/produits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meilleures ventes",
  description:
    "Les produits les plus appréciés de nos clients chez ZOUHRI FRAGRANCE, classés par ventes réelles.",
  alternates: { canonical: "/meilleures-ventes" },
};

export default async function PageMeilleuresVentes() {
  const produits = await listerMeilleuresVentes(12);

  return (
    <div className="container-luxe py-8 sm:py-10">
      <FilAriane
        elements={[{ libelle: "Accueil", href: "/" }, { libelle: "Meilleures ventes" }]}
      />
      <div className="mt-3 space-y-2">
        <span className="eyebrow inline-flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Les préférées
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl">Meilleures ventes</h1>
        <p className="max-w-2xl text-sm text-gris">
          Classement établi à partir des quantités réellement commandées.
        </p>
      </div>

      <div className="mt-8">
        {produits.length === 0 ? (
          <EtatVide
            icon={TrendingUp}
            titre="Pas encore de classement"
            description="Le classement apparaîtra dès les premières commandes confirmées."
          />
        ) : (
          <GrilleProduits produits={produits} />
        )}
      </div>
    </div>
  );
}
