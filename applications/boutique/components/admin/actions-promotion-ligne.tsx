"use client";

import Link from "next/link";
import {
  actionBasculerActivationPromotion,
  actionSupprimerPromotion,
} from "@/app/actions/admin-promotions";
import { Button } from "@/components/ui/button";

export function ActionsPromotionLigne({
  promotionId,
  estActive,
}: {
  promotionId: string;
  estActive: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/promotions/${promotionId}`}>Modifier</Link>
      </Button>
      <form action={actionBasculerActivationPromotion}>
        <input type="hidden" name="promotion_id" value={promotionId} />
        <input type="hidden" name="valeur" value={String(!estActive)} />
        <Button type="submit" variant="ghost" size="sm">
          {estActive ? "Désactiver" : "Activer"}
        </Button>
      </form>
      <form
        action={actionSupprimerPromotion}
        onSubmit={(evenement) => {
          if (!window.confirm("Supprimer cette promotion ?")) evenement.preventDefault();
        }}
      >
        <input type="hidden" name="promotion_id" value={promotionId} />
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
