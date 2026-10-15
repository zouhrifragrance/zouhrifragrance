import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { listerProduitsAdmin, listerMouvementsStockAdmin } from "@/services/admin";
import { FormulaireAjustementStock } from "@/components/admin/formulaire-ajustement-stock";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDateHeure } from "@/lib/utils";
import type { TypeMouvementStock } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Stocks" };

const LIBELLES_MOUVEMENT: Record<TypeMouvementStock, string> = {
  ENTREE: "Entrée",
  SORTIE: "Sortie",
  RESERVATION: "Réservation",
  LIBERATION: "Libération",
  AJUSTEMENT: "Ajustement",
  RETOUR: "Retour",
};

const COULEUR_MOUVEMENT: Record<TypeMouvementStock, "success" | "danger" | "neutral" | "warning"> = {
  ENTREE: "success",
  RETOUR: "success",
  SORTIE: "danger",
  RESERVATION: "warning",
  LIBERATION: "neutral",
  AJUSTEMENT: "neutral",
};

export default async function PageStocksAdmin() {
  const [produits, mouvements] = await Promise.all([
    listerProduitsAdmin(),
    listerMouvementsStockAdmin(60),
  ]);

  const faibles = produits.filter((p) => p.quantite_stock <= p.seuil_stock_faible);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Stocks</h1>
        <p className="mt-1 text-sm text-gris">
          Suivez et ajustez le stock de vos produits. Chaque mouvement est tracé.
        </p>
      </div>

      {faibles.length > 0 ? (
        <Alert variant="warning" titre="Produits en stock faible">
          <ul className="list-disc space-y-1 pl-4">
            {faibles.map((produit) => (
              <li key={produit.id}>
                {produit.nom} — {produit.quantite_stock} restant(s) (seuil {produit.seuil_stock_faible})
              </li>
            ))}
          </ul>
        </Alert>
      ) : (
        <Alert variant="success">Aucun produit sous le seuil d&apos;alerte.</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <FormulaireAjustementStock
          produits={produits.map((p) => ({ id: p.id, nom: p.nom, quantite_stock: p.quantite_stock }))}
        />

        <section className="rounded-xl border border-bordure bg-white p-5">
          <h2 className="flex items-center gap-2 font-serif text-lg">
            <AlertTriangle className="h-4 w-4 text-or" />
            Derniers mouvements
          </h2>
          {mouvements.length === 0 ? (
            <p className="mt-4 text-sm text-gris">Aucun mouvement enregistré.</p>
          ) : (
            <div className="mt-4 max-h-[460px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-bordure text-left text-xs uppercase tracking-wider text-gris">
                    <th className="pb-2 pr-3 font-medium">Date</th>
                    <th className="pb-2 pr-3 font-medium">Produit</th>
                    <th className="pb-2 pr-3 font-medium">Type</th>
                    <th className="pb-2 font-medium">Qté</th>
                  </tr>
                </thead>
                <tbody>
                  {mouvements.map((mouvement) => (
                    <tr key={mouvement.id} className="border-b border-bordure/60 last:border-0">
                      <td className="py-2 pr-3 text-xs text-gris">
                        {formatDateHeure(mouvement.date_creation)}
                      </td>
                      <td className="py-2 pr-3 text-noir">{mouvement.produit_nom ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={COULEUR_MOUVEMENT[mouvement.type_mouvement]}>
                          {LIBELLES_MOUVEMENT[mouvement.type_mouvement]}
                        </Badge>
                      </td>
                      <td className="py-2 font-medium">
                        {mouvement.quantite > 0 ? `+${mouvement.quantite}` : mouvement.quantite}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
