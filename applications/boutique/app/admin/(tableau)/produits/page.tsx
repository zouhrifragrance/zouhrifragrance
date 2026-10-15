import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listerProduitsAdmin } from "@/services/admin";
import { listerCategories } from "@/services/categories";
import { ActionsProduitLigne } from "@/components/admin/actions-produit-ligne";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatMontant } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Produits" };

export default async function PageProduitsAdmin() {
  const [produits, categories] = await Promise.all([
    listerProduitsAdmin(),
    listerCategories(),
  ]);
  const nomsCategories = new Map(categories.map((categorie) => [categorie.id, categorie.nom]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">Produits</h1>
          <p className="mt-1 text-sm text-gris">{produits.length} produit(s) au catalogue.</p>
        </div>
        <Button asChild>
          <Link href="/admin/produits/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      {produits.length === 0 ? (
        <Alert variant="info">
          Aucun produit pour l&apos;instant. Créez votre premier produit pour alimenter la boutique.
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bordure bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-bordure bg-ivoire/50 text-left text-xs uppercase tracking-wider text-gris">
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">État</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {produits.map((produit) => {
                const stockFaible = produit.quantite_stock <= produit.seuil_stock_faible;
                return (
                  <tr key={produit.id} className="border-b border-bordure/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-noir">{produit.nom}</p>
                      <p className="text-xs text-gris">{produit.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-gris">
                      {produit.categorie_id ? nomsCategories.get(produit.categorie_id) ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {formatMontant(produit.prix_vente, produit.devise)}
                      {produit.prix_promotionnel ? (
                        <span className="ml-2 text-xs text-emerald-700">
                          {formatMontant(produit.prix_promotionnel, produit.devise)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={stockFaible ? "text-amber-600" : "text-noir"}>
                        {produit.quantite_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {produit.est_publie ? (
                        <Badge variant="success">Publié</Badge>
                      ) : (
                        <Badge variant="neutral">Brouillon</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionsProduitLigne produitId={produit.id} estPublie={produit.est_publie} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
