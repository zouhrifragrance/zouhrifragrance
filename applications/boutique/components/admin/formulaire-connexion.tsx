"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { actionConnexion, type EtatAuthAdmin } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

const ETAT_INITIAL: EtatAuthAdmin = {};

export function FormulaireConnexion({ redirection }: { redirection?: string }) {
  const [etat, action, enCours] = useActionState(actionConnexion, ETAT_INITIAL);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="redirection" value={redirection ?? "/admin"} />
      {etat.erreur ? <Alert variant="danger">{etat.erreur}</Alert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mot_de_passe">Mot de passe</Label>
        <Input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={enCours}>
        {enCours ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connexion…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Se connecter
          </>
        )}
      </Button>
    </form>
  );
}
