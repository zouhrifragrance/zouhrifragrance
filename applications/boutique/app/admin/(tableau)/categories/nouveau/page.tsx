import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listerCategories } from "@/services/categories";
import { FormulaireCategorie } from "@/components/admin/formulaire-categorie";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nouvelle catégorie" };

export default async function PageNouvelleCategorie() {
  const categories = await listerCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Retour aux catégories">
          <Link href="/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Nouvelle catégorie</h1>
      </div>
      <FormulaireCategorie categories={categories.map((c) => ({ id: c.id, nom: c.nom }))} />
    </div>
  );
}
