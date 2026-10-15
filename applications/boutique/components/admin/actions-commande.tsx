"use client";

import { useActionState } from "react";
import { Loader2, PackageMinus, RefreshCw } from "lucide-react";
import {
  actionChangerStatutCommande,
  actionLibererStock,
  type EtatActionAdmin,
} from "@/app/actions/admin-commandes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { LIBELLES_STATUT_COMMANDE, statutsSuivantsPossibles, type StatutCommande } from "@/types";

const ETAT_INITIAL: EtatActionAdmin = { ok: true, message: "" };

export function ActionsCommande({
  commandeId,
  statutActuel,
  stockLibere,
  peutGerer,
}: {
  commandeId: string;
  statutActuel: StatutCommande;
  stockLibere: boolean;
  peutGerer: boolean;
}) {
  const [etatStatut, actionStatut, enCoursStatut] = useActionState(
    actionChangerStatutCommande,
    ETAT_INITIAL,
  );
  const [etatStock, actionStock, enCoursStock] = useActionState(actionLibererStock, ETAT_INITIAL);

  const transitions = statutsSuivantsPossibles(statutActuel);

  if (!peutGerer) {
    return (
      <Alert variant="info">
        Votre profil est en lecture seule. Seuls les gestionnaires peuvent modifier les commandes.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-bordure bg-white p-5">
        <h2 className="flex items-center gap-2 font-serif text-lg">
          <RefreshCw className="h-4 w-4 text-or" />
          Changer le statut
        </h2>

        {transitions.length === 0 ? (
          <p className="mt-3 text-sm text-gris">
            Aucune transition n&apos;est possible depuis le statut actuel.
          </p>
        ) : (
          <form action={actionStatut} className="mt-4 space-y-4">
            <input type="hidden" name="commande_id" value={commandeId} />
            <div className="space-y-1.5">
              <Label htmlFor="statut">Nouveau statut</Label>
              <select
                id="statut"
                name="statut"
                required
                className="h-11 w-full rounded-md border border-bordure bg-white px-3 text-sm focus-visible:border-or focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
              >
                {transitions.map((statut) => (
                  <option key={statut} value={statut}>
                    {LIBELLES_STATUT_COMMANDE[statut]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commentaire">Commentaire (facultatif)</Label>
              <Textarea id="commentaire" name="commentaire" className="min-h-20" />
            </div>

            {etatStatut.message ? (
              <Alert variant={etatStatut.ok ? "success" : "danger"}>{etatStatut.message}</Alert>
            ) : null}

            <Button type="submit" disabled={enCoursStatut}>
              {enCoursStatut ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Mettre à jour le statut
            </Button>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-bordure bg-white p-5">
        <h2 className="flex items-center gap-2 font-serif text-lg">
          <PackageMinus className="h-4 w-4 text-or" />
          Stock réservé
        </h2>
        <p className="mt-2 text-sm text-gris">
          {stockLibere
            ? "Le stock de cette commande a déjà été libéré."
            : "Le stock est actuellement réservé pour cette commande."}
        </p>

        {!stockLibere ? (
          <form action={actionStock} className="mt-4 space-y-4">
            <input type="hidden" name="commande_id" value={commandeId} />
            <div className="space-y-1.5">
              <Label htmlFor="motif">Motif de la libération</Label>
              <Input id="motif" name="motif" placeholder="Annulation, expiration…" />
            </div>

            {etatStock.message ? (
              <Alert variant={etatStock.ok ? "success" : "danger"}>{etatStock.message}</Alert>
            ) : null}

            <Button type="submit" variant="outline" disabled={enCoursStock}>
              {enCoursStock ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Libérer le stock
            </Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
