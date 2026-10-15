import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listerCategories } from "@/services/categories";
import { FormulaireProduit } from "@/components/admin/formulaire-produit";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nouveau produit" };

export default async function PageNouveauProduit() {
  const categories = await listerCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Retour aux produits">
          <Link href="/admin/produits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Nouveau produit</h1>
      </div>
      <FormulaireProduit categories={categories.map((c) => ({ id: c.id, nom: c.nom }))} />
    </div>
  );
}
