import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listerPromotionsAdmin } from "@/services/admin";
import { ActionsPromotionLigne } from "@/components/admin/actions-promotion-ligne";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatDate, formatMontant } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Promotions" };

export default async function PagePromotionsAdmin() {
  const promotions = await listerPromotionsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">Promotions</h1>
          <p className="mt-1 text-sm text-gris">{promotions.length} code(s) promotionnel(s).</p>
        </div>
        <Button asChild>
          <Link href="/admin/promotions/nouveau">
            <Plus className="h-4 w-4" />
            Nouvelle promotion
          </Link>
        </Button>
      </div>

      {promotions.length === 0 ? (
        <Alert variant="info">
          Aucune promotion. Créez un code pour offrir des réductions à vos clients.
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bordure bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-bordure bg-ivoire/50 text-left text-xs uppercase tracking-wider text-gris">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Réduction</th>
                <th className="px-4 py-3 font-medium">Utilisations</th>
                <th className="px-4 py-3 font-medium">Période</th>
                <th className="px-4 py-3 font-medium">État</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {promotions.map((promotion) => (
                <tr key={promotion.id} className="border-b border-bordure/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-noir">{promotion.code}</p>
                    <p className="text-xs text-gris">{promotion.nom}</p>
                  </td>
                  <td className="px-4 py-3">
                    {promotion.type_reduction === "POURCENTAGE"
                      ? `${promotion.valeur} %`
                      : formatMontant(promotion.valeur)}
                    {promotion.montant_minimum > 0 ? (
                      <span className="block text-xs text-gris">
                        dès {formatMontant(promotion.montant_minimum)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gris">
                    {promotion.nombre_utilisations}
                    {promotion.limite_utilisation ? ` / ${promotion.limite_utilisation}` : " / ∞"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gris">
                    {formatDate(promotion.date_debut)}
                    <br />
                    {promotion.date_fin ? formatDate(promotion.date_fin) : "sans fin"}
                  </td>
                  <td className="px-4 py-3">
                    {promotion.est_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="neutral">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ActionsPromotionLigne
                      promotionId={promotion.id}
                      estActive={promotion.est_active}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
