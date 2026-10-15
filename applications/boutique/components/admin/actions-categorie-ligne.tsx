"use client";

import Link from "next/link";
import {
  actionBasculerActivationCategorie,
  actionSupprimerCategorie,
} from "@/app/actions/admin-categories";
import { Button } from "@/components/ui/button";

export function ActionsCategorieLigne({
  categorieId,
  estActive,
}: {
  categorieId: string;
  estActive: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/categories/${categorieId}`}>Modifier</Link>
      </Button>
      <form action={actionBasculerActivationCategorie}>
        <input type="hidden" name="categorie_id" value={categorieId} />
        <input type="hidden" name="valeur" value={String(!estActive)} />
        <Button type="submit" variant="ghost" size="sm">
          {estActive ? "Désactiver" : "Activer"}
        </Button>
      </form>
      <form
        action={actionSupprimerCategorie}
        onSubmit={(evenement) => {
          if (!window.confirm("Supprimer cette catégorie ?")) evenement.preventDefault();
        }}
      >
        <input type="hidden" name="categorie_id" value={categorieId} />
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
