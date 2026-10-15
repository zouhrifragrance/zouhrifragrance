import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listerToutesCategoriesAdmin } from "@/services/categories";
import { ActionsCategorieLigne } from "@/components/admin/actions-categorie-ligne";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Catégories" };

export default async function PageCategoriesAdmin() {
  const categories = await listerToutesCategoriesAdmin();
  const noms = new Map(categories.map((c) => [c.id, c.nom]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">Catégories</h1>
          <p className="mt-1 text-sm text-gris">{categories.length} catégorie(s).</p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/nouveau">
            <Plus className="h-4 w-4" />
            Nouvelle catégorie
          </Link>
        </Button>
      </div>

      {categories.length === 0 ? (
        <Alert variant="info">Aucune catégorie. Créez-en une pour organiser vos produits.</Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bordure bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-bordure bg-ivoire/50 text-left text-xs uppercase tracking-wider text-gris">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Parente</th>
                <th className="px-4 py-3 font-medium">Ordre</th>
                <th className="px-4 py-3 font-medium">État</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((categorie) => (
                <tr key={categorie.id} className="border-b border-bordure/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-noir">{categorie.nom}</p>
                    <p className="text-xs text-gris">{categorie.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gris">
                    {categorie.categorie_parente_id
                      ? noms.get(categorie.categorie_parente_id) ?? "—"
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gris">{categorie.ordre_affichage}</td>
                  <td className="px-4 py-3">
                    {categorie.est_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="neutral">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ActionsCategorieLigne
                      categorieId={categorie.id}
                      estActive={categorie.est_active}
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
