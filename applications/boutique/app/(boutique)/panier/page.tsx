import type { Metadata } from "next";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { ContenuPanier } from "@/components/commande/contenu-panier";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Votre panier",
  description: "Consultez et modifiez les articles de votre panier ZOUHRI FRAGRANCE.",
  robots: { index: false, follow: true },
};

export default function PagePanier() {
  return (
    <div className="container-luxe py-8 sm:py-10">
      <FilAriane elements={[{ libelle: "Accueil", href: "/" }, { libelle: "Panier" }]} />
      <h1 className="mt-6 font-serif text-3xl sm:text-4xl">Votre panier</h1>
      <p className="mt-2 text-sm text-gris">
        Vérifiez vos articles, puis passez commande sans créer de compte.
      </p>
      <div className="mt-8">
        <ContenuPanier />
      </div>
    </div>
  );
}
