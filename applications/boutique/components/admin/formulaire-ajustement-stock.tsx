"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { actionAjusterStock } from "@/app/actions/admin-stock";
import type { EtatActionAdmin } from "@/app/actions/admin-commandes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

const ETAT_INITIAL: EtatActionAdmin = { ok: true, message: "" };

export function FormulaireAjustementStock({
  produits,
}: {
  produits: { id: string; nom: string; quantite_stock: number }[];
}) {
  const [etat, action, enCours] = useActionState(actionAjusterStock, ETAT_INITIAL);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-bordure bg-white p-5">
      <h2 className="font-serif text-lg">Ajuster le stock</h2>

      {etat.message ? <Alert variant={etat.ok ? "success" : "danger"}>{etat.message}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="produit_id">Produit</Label>
          <select
            id="produit_id"
            name="produit_id"
            required
            className="h-11 w-full rounded-md border border-bordure bg-white px-3 text-sm focus-visible:border-or focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            <option value="">Sélectionner un produit</option>
            {produits.map((produit) => (
              <option key={produit.id} value={produit.id}>
                {produit.nom} — stock : {produit.quantite_stock}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type_mouvement">Type de mouvement</Label>
          <select
            id="type_mouvement"
            name="type_mouvement"
            className="h-11 w-full rounded-md border border-bordure bg-white px-3 text-sm focus-visible:border-or focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            <option value="ENTREE">Entrée (+)</option>
            <option value="SORTIE">Sortie (−)</option>
            <option value="RETOUR">Retour (+)</option>
            <option value="AJUSTEMENT">Ajustement (valeur exacte)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quantite">Quantité</Label>
          <Input id="quantite" name="quantite" type="number" min={0} defaultValue={0} required />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="motif">Motif</Label>
          <Input id="motif" name="motif" placeholder="Inventaire, réception, casse…" />
        </div>
      </div>

      <Button type="submit" disabled={enCours}>
        {enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Enregistrer le mouvement
      </Button>
    </form>
  );
}
