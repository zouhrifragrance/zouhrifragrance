import type { Metadata } from "next";
import { exigerNiveau } from "@/lib/auth-admin";
import { obtenirParametresBoutique } from "@/services/parametres";
import { FormulaireParametres } from "@/components/admin/formulaire-parametres";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Paramètres" };

export default async function PageParametresAdmin() {
  await exigerNiveau("ADMIN");
  const parametres = await obtenirParametresBoutique();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Paramètres de la boutique</h1>
        <p className="mt-1 text-sm text-gris">
          Coordonnées, livraison, stock, bannière, SEO et réseaux sociaux.
        </p>
      </div>
      <FormulaireParametres parametres={parametres} />
    </div>
  );
}
