"use client";

import { useActionState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  actionInscriptionNewsletter,
  type EtatFormulaire,
} from "@/app/actions/newsletter";

const etatInitial: EtatFormulaire = { ok: false, message: "" };

export function FormulaireNewsletter() {
  const [etat, action, enCours] = useActionState(
    actionInscriptionNewsletter,
    etatInitial,
  );

  if (etat.ok) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {etat.message}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" />
          <Input
            type="email"
            name="email"
            required
            placeholder="Votre adresse e-mail"
            aria-label="Adresse e-mail pour la newsletter"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={enCours}>
          {enCours ? "…" : "S'inscrire"}
        </Button>
      </div>
      {etat.message ? (
        <p className="text-sm text-red-600" role="alert">
          {etat.message}
        </p>
      ) : (
        <p className="text-xs text-gris">
          Inscription facultative. Désinscription possible à tout moment.
        </p>
      )}
    </form>
  );
}
