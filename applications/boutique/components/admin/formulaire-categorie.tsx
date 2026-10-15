"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { actionEnregistrerCategorie, type EtatCategorieAdmin } from "@/app/actions/admin-categories";
import { categorieSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { slugifier } from "@/lib/utils";
import type { Categorie } from "@/types";

const ETAT_INITIAL: EtatCategorieAdmin = { ok: true, message: "" };

export function FormulaireCategorie({
  categories,
  categorie,
}: {
  categories: { id: string; nom: string }[];
  categorie?: Categorie;
}) {
  const [etat, action, enCours] = useActionState(actionEnregistrerCategorie, ETAT_INITIAL);

  const [nom, setNom] = React.useState(categorie?.nom ?? "");
  const [slug, setSlug] = React.useState(categorie?.slug ?? "");
  const [slugManuel, setSlugManuel] = React.useState(Boolean(categorie));
  const [description, setDescription] = React.useState(categorie?.description ?? "");
  const [imageUrl, setImageUrl] = React.useState(categorie?.image_url ?? "");
  const [parentId, setParentId] = React.useState(categorie?.categorie_parente_id ?? "");
  const [ordre, setOrdre] = React.useState(String(categorie?.ordre_affichage ?? "0"));
  const [estActive, setEstActive] = React.useState(categorie?.est_active ?? true);
  const [titreSeo, setTitreSeo] = React.useState(categorie?.titre_seo ?? "");
  const [descriptionSeo, setDescriptionSeo] = React.useState(categorie?.description_seo ?? "");
  const [erreurs, setErreurs] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!slugManuel) setSlug(slugifier(nom));
  }, [nom, slugManuel]);

  const payload = React.useMemo(
    () => ({
      nom,
      slug,
      description,
      image_url: imageUrl,
      categorie_parente_id: parentId,
      ordre_affichage: ordre === "" ? 0 : Number(ordre),
      est_active: estActive,
      titre_seo: titreSeo,
      description_seo: descriptionSeo,
    }),
    [nom, slug, description, imageUrl, parentId, ordre, estActive, titreSeo, descriptionSeo],
  );

  function valider(evenement: React.FormEvent<HTMLFormElement>) {
    const resultat = categorieSchema.safeParse(payload);
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

  const parentsPossibles = categories.filter((c) => c.id !== categorie?.id);

  return (
    <form action={action} onSubmit={valider} className="max-w-2xl space-y-6">
      <input type="hidden" name="donnees" value={JSON.stringify(payload)} />
      {categorie ? <input type="hidden" name="categorie_id" value={categorie.id} /> : null}

      {etat.message ? <Alert variant={etat.ok ? "success" : "danger"}>{etat.message}</Alert> : null}

      <div className="space-y-4 rounded-xl border border-bordure bg-white p-5">
        <div className="space-y-1.5">
          <Label htmlFor="nom">Nom de la catégorie *</Label>
          <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          {erreurs.nom ? <p className="text-xs text-red-600">{erreurs.nom}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (URL) *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManuel(true);
            }}
          />
          {erreurs.slug ? <p className="text-xs text-red-600">{erreurs.slug}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-28"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="image_url">Image (URL)</Label>
          <Input
            id="image_url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
          {erreurs.image_url ? <p className="text-xs text-red-600">{erreurs.image_url}</p> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="parent">Catégorie parente</Label>
            <select
              id="parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="h-11 w-full rounded-md border border-bordure bg-white px-3 text-sm focus-visible:border-or focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
            >
              <option value="">Aucune (catégorie racine)</option>
              {parentsPossibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ordre">Ordre d&apos;affichage</Label>
            <Input
              id="ordre"
              type="number"
              value={ordre}
              onChange={(e) => setOrdre(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={estActive} onCheckedChange={(v) => setEstActive(v === true)} />
          Catégorie active (visible sur la boutique)
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-bordure bg-white p-5">
        <h2 className="font-serif text-lg">Référencement (SEO)</h2>
        <div className="space-y-1.5">
          <Label htmlFor="titre_seo">Titre SEO</Label>
          <Input
            id="titre_seo"
            value={titreSeo}
            onChange={(e) => setTitreSeo(e.target.value)}
            maxLength={70}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description_seo">Description SEO</Label>
          <Textarea
            id="description_seo"
            value={descriptionSeo}
            onChange={(e) => setDescriptionSeo(e.target.value)}
            className="min-h-20"
            maxLength={180}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={enCours}>
          {enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/categories">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
