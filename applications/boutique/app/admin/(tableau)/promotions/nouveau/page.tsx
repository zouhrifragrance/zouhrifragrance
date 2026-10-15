import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listerCategories } from "@/services/categories";
import { listerProduitsAdmin } from "@/services/admin";
import { FormulairePromotion } from "@/components/admin/formulaire-promotion";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nouvelle promotion" };

export default async function PageNouvellePromotion() {
  const [categories, produits] = await Promise.all([listerCategories(), listerProduitsAdmin()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Retour aux promotions">
          <Link href="/admin/promotions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Nouvelle promotion</h1>
      </div>
      <FormulairePromotion
        categories={categories.map((c) => ({ id: c.id, nom: c.nom }))}
        produits={produits.map((p) => ({ id: p.id, nom: p.nom }))}
      />
    </div>
  );
}
