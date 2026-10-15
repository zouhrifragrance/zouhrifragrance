import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listerCategories } from "@/services/categories";
import { obtenirProduitAdmin } from "@/services/admin";
import { FormulaireProduit } from "@/components/admin/formulaire-produit";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Modifier un produit" };

export default async function PageModifierProduit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [produit, categories] = await Promise.all([
    obtenirProduitAdmin(id),
    listerCategories(),
  ]);

  if (!produit) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Retour aux produits">
          <Link href="/admin/produits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl">Modifier le produit</h1>
          <p className="text-xs text-gris">{produit.nom}</p>
        </div>
      </div>
      <FormulaireProduit
        categories={categories.map((c) => ({ id: c.id, nom: c.nom }))}
        produit={produit}
      />
    </div>
  );
}
