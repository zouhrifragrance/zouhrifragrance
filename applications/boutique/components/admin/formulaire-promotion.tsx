"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { actionEnregistrerPromotion, type EtatPromotionAdmin } from "@/app/actions/admin-promotions";
import { promotionSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import type { Promotion } from "@/types";

const ETAT_INITIAL: EtatPromotionAdmin = { ok: true, message: "" };

function jourDefaut(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FormulairePromotion({
  categories,
  produits,
  promotion,
}: {
  categories: { id: string; nom: string }[];
  produits: { id: string; nom: string }[];
  promotion?: Promotion;
}) {
  const [etat, action, enCours] = useActionState(actionEnregistrerPromotion, ETAT_INITIAL);

  const [code, setCode] = React.useState(promotion?.code ?? "");
  const [nom, setNom] = React.useState(promotion?.nom ?? "");
  const [typeReduction, setTypeReduction] = React.useState<"POURCENTAGE" | "MONTANT_FIXE">(
    promotion?.type_reduction ?? "POURCENTAGE",
  );
  const [valeur, setValeur] = React.useState(String(promotion?.valeur ?? ""));
  const [montantMinimum, setMontantMinimum] = React.useState(
    String(promotion?.montant_minimum ?? "0"),
  );
  const [limiteUtilisation, setLimiteUtilisation] = React.useState(
    promotion?.limite_utilisation != null ? String(promotion.limite_utilisation) : "",
  );
  const [dateDebut, setDateDebut] = React.useState(
    promotion?.date_debut ? promotion.date_debut.slice(0, 10) : jourDefaut(),
  );
  const [dateFin, setDateFin] = React.useState(promotion?.date_fin?.slice(0, 10) ?? "");
  const [estActive, setEstActive] = React.useState(promotion?.est_active ?? true);
  const [categoriesIds, setCategoriesIds] = React.useState<string[]>(
    promotion?.categories_ids ?? [],
  );
  const [produitsIds, setProduitsIds] = React.useState<string[]>(promotion?.produits_ids ?? []);
  const [erreurs, setErreurs] = React.useState<Record<string, string>>({});

  const payload = React.useMemo(
    () => ({
      code,
      nom,
      type_reduction: typeReduction,
      valeur: valeur === "" ? 0 : Number(valeur),
      montant_minimum: montantMinimum === "" ? 0 : Number(montantMinimum),
      limite_utilisation: limiteUtilisation === "" ? null : Number(limiteUtilisation),
      categories_ids: categoriesIds,
      produits_ids: produitsIds,
      date_debut: dateDebut,
      date_fin: dateFin,
      est_active: estActive,
    }),
    [
      code,
      nom,
      typeReduction,
      valeur,
      montantMinimum,
      limiteUtilisation,
      categoriesIds,
      produitsIds,
      dateDebut,
      dateFin,
      estActive,
    ],
  );

  function basculer(liste: string[], setListe: (v: string[]) => void, id: string, actif: boolean) {
    setListe(actif ? [...liste, id] : liste.filter((valeur) => valeur !== id));
  }

  function valider(evenement: React.FormEvent<HTMLFormElement>) {
    const resultat = promotionSchema.safeParse(payload);
    if (!resultat.success) {
      evenement.preventDefault();
      const nouvellesErreurs: Record<string, string> = {};
      for (const probleme of resultat.error.issues) {
        const cle = probleme.path.join(".");
        if (!nouvellesErreurs[cle]) nouvellesErreurs[cle] = probleme.message;
      }
      setErreurs(nouvellesErreurs);
      return;
    }
    setErreurs({});
  }

  return (
    <form action={action} onSubmit={valider} className="max-w-2xl space-y-6">
      <input type="hidden" name="donnees" value={JSON.stringify(payload)} />
      {promotion ? <input type="hidden" name="promotion_id" value={promotion.id} /> : null}

      {etat.message ? <Alert variant={etat.ok ? "success" : "danger"}>{etat.message}</Alert> : null}

      <div className="space-y-4 rounded-xl border border-bordure bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BIENVENUE10"
              className="uppercase"
            />
            {erreurs.code ? <p className="text-xs text-red-600">{erreurs.code}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom *</Label>
            <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
            {erreurs.nom ? <p className="text-xs text-red-600">{erreurs.nom}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="type">Type de réduction *</Label>
            <select
              id="type"
              value={typeReduction}
              onChange={(e) => setTypeReduction(e.target.value as "POURCENTAGE" | "MONTANT_FIXE")}
              className="h-11 w-full rounded-md border border-bordure bg-white px-3 text-sm focus-visible:border-or focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
            >
              <option value="POURCENTAGE">Pourcentage (%)</option>
              <option value="MONTANT_FIXE">Montant fixe</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valeur">
              Valeur * {typeReduction === "POURCENTAGE" ? "(%)" : "(montant)"}
            </Label>
            <Input
              id="valeur"
              type="number"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
            />
            {erreurs.valeur ? <p className="text-xs text-red-600">{erreurs.valeur}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="minimum">Montant minimum d&apos;achat</Label>
            <Input
              id="minimum"
              type="number"
              value={montantMinimum}
              onChange={(e) => setMontantMinimum(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="limite">Limite d&apos;utilisation</Label>
            <Input
              id="limite"
              type="number"
              value={limiteUtilisation}
              onChange={(e) => setLimiteUtilisation(e.target.value)}
              placeholder="Illimitée si vide"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="debut">Date de début *</Label>
            <Input
              id="debut"
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fin">Date de fin</Label>
            <Input id="fin" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
            {erreurs.date_fin ? <p className="text-xs text-red-600">{erreurs.date_fin}</p> : null}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={estActive} onCheckedChange={(v) => setEstActive(v === true)} />
          Promotion active
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-bordure bg-white p-5">
        <h2 className="font-serif text-lg">Ciblage (facultatif)</h2>
        <p className="text-xs text-gris">
          Sans sélection, la promotion s&apos;applique à l&apos;ensemble du panier.
        </p>

        {categories.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">Catégories concernées</p>
            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
              {categories.map((categorie) => {
                const actif = categoriesIds.includes(categorie.id);
                return (
                  <label key={categorie.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={actif}
                      onCheckedChange={(v) =>
                        basculer(categoriesIds, setCategoriesIds, categorie.id, v === true)
                      }
                    />
                    {categorie.nom}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {produits.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">Produits concernés</p>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {produits.map((produit) => {
                const actif = produitsIds.includes(produit.id);
                return (
                  <label key={produit.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={actif}
                      onCheckedChange={(v) =>
                        basculer(produitsIds, setProduitsIds, produit.id, v === true)
                      }
                    />
                    {produit.nom}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={enCours}>
          {enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/promotions">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
