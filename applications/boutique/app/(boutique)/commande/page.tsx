import type { Metadata } from "next";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { FormulaireCommande } from "@/components/commande/formulaire-commande";
import { obtenirParametresBoutique } from "@/services/parametres";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Commande",
  description:
    "Finalisez votre commande ZOUHRI FRAGRANCE sans compte. Aucun paiement en ligne, confirmation par notre équipe.",
  robots: { index: false, follow: false },
};

export default async function PageCommande() {
  const parametres = await obtenirParametresBoutique();

  return (
    <div className="container-luxe py-8 sm:py-10">
      <FilAriane
        elements={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Panier", href: "/panier" },
          { libelle: "Commande" },
        ]}
      />
      <h1 className="mt-6 font-serif text-3xl sm:text-4xl">Finaliser ma commande</h1>
      <p className="mt-2 text-sm text-gris">
        Renseignez vos coordonnées de livraison. Aucun compte ni paiement en ligne ne sont requis.
      </p>
      <div className="mt-8">
        <FormulaireCommande parametres={parametres} />
      </div>
    </div>
  );
}
