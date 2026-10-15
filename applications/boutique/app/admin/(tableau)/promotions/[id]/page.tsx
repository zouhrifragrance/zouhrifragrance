import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listerCategories } from "@/services/categories";
import { listerProduitsAdmin, obtenirPromotionAdmin } from "@/services/admin";
import { FormulairePromotion } from "@/components/admin/formulaire-promotion";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Modifier une promotion" };

export default async function PageModifierPromotion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [promotion, categories, produits] = await Promise.all([
    obtenirPromotionAdmin(id),
    listerCategories(),
    listerProduitsAdmin(),
  ]);

  if (!promotion) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Retour aux promotions">
          <Link href="/admin/promotions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Modifier la promotion</h1>
      </div>
      <FormulairePromotion
        categories={categories.map((c) => ({ id: c.id, nom: c.nom }))}
        produits={produits.map((p) => ({ id: p.id, nom: p.nom }))}
        promotion={promotion}
      />
    </div>
  );
}
