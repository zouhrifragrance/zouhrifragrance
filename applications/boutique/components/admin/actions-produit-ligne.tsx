"use client";

import Link from "next/link";
import { actionBasculerPublicationProduit, actionSupprimerProduit } from "@/app/actions/admin-produits";
import { Button } from "@/components/ui/button";

export function ActionsProduitLigne({
  produitId,
  estPublie,
}: {
  produitId: string;
  estPublie: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/produits/${produitId}`}>Modifier</Link>
      </Button>
      <form action={actionBasculerPublicationProduit}>
        <input type="hidden" name="produit_id" value={produitId} />
        <input type="hidden" name="valeur" value={String(!estPublie)} />
        <Button type="submit" variant="ghost" size="sm">
          {estPublie ? "Dépublier" : "Publier"}
        </Button>
      </form>
      <form
        action={actionSupprimerProduit}
        onSubmit={(evenement) => {
          if (!window.confirm("Supprimer définitivement ce produit ?")) {
            evenement.preventDefault();
          }
        }}
      >
        <input type="hidden" name="produit_id" value={produitId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Supprimer
        </Button>
      </form>
    </div>
  );
}
