import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listerCategories } from "@/services/categories";
import { obtenirCategorieAdmin } from "@/services/admin";
import { FormulaireCategorie } from "@/components/admin/formulaire-categorie";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Modifier une catégorie" };

export default async function PageModifierCategorie({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categorie, categories] = await Promise.all([
    obtenirCategorieAdmin(id),
    listerCategories(),
  ]);

  if (!categorie) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Retour aux catégories">
          <Link href="/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Modifier la catégorie</h1>
      </div>
      <FormulaireCategorie
        categories={categories.map((c) => ({ id: c.id, nom: c.nom }))}
        categorie={categorie}
      />
    </div>
  );
}
