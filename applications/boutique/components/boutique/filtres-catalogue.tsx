"use client";

import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import type { Categorie } from "@/types";
import type { ValeursFiltres } from "@/lib/filtres";

interface FiltresCatalogueProps {
  categories: Categorie[];
  valeurs: ValeursFiltres;
  nombreResultats: number;
}

function ContenuFiltres({ categories, valeurs }: Omit<FiltresCatalogueProps, "nombreResultats">) {
  const racines = categories.filter((c) => !c.categorie_parente_id);
  const enfantsDe = (id: string) => categories.filter((c) => c.categorie_parente_id === id);
  const aDesFiltres =
    valeurs.categories.length > 0 || valeurs.prixMin || valeurs.prixMax || valeurs.recherche;

  return (
    <form method="get" action="/boutique" className="space-y-6">
      <input type="hidden" name="tri" value={valeurs.tri} />

      <div className="space-y-2">
        <label htmlFor="filtre-recherche" className="text-sm font-medium text-noir">
          Recherche
        </label>
        <input
          id="filtre-recherche"
          type="search"
          name="recherche"
          defaultValue={valeurs.recherche}
          placeholder="Nom du produit…"
          className="h-11 w-full rounded-md border border-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-or"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-noir">Catégories</legend>
        <div className="space-y-2.5">
          {racines.map((cat) => (
            <div key={cat.id} className="space-y-2">
              <LabelFiltre categorie={cat} valeurs={valeurs} />
              {enfantsDe(cat.id).length > 0 ? (
                <div className="ml-5 space-y-2">
                  {enfantsDe(cat.id).map((enfant) => (
                    <LabelFiltre key={enfant.id} categorie={enfant} valeurs={valeurs} />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-noir">Prix (MAD)</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="prix_min"
            min={0}
            defaultValue={valeurs.prixMin}
            placeholder="Min"
            aria-label="Prix minimum"
            className="h-11 w-full rounded-md border border-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-or"
          />
          <span className="text-gris">—</span>
          <input
            type="number"
            name="prix_max"
            min={0}
            defaultValue={valeurs.prixMax}
            placeholder="Max"
            aria-label="Prix maximum"
            className="h-11 w-full rounded-md border border-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-or"
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Button type="submit">Appliquer les filtres</Button>
        {aDesFiltres ? (
          <Button asChild variant="ghost" type="button">
            <Link href="/boutique">Réinitialiser</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function LabelFiltre({ categorie, valeurs }: { categorie: Categorie; valeurs: ValeursFiltres }) {
  const coche = valeurs.categories.includes(categorie.slug);
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-noir">
      <input
        type="checkbox"
        name="categorie"
        value={categorie.slug}
        defaultChecked={coche}
        className="h-4 w-4 rounded border-bordure text-or focus:ring-or"
      />
      {categorie.nom}
    </label>
  );
}

export function FiltresCatalogue({
  categories,
  valeurs,
  nombreResultats,
}: FiltresCatalogueProps) {
  const [ouvert, setOuvert] = React.useState(false);

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 rounded-xl border border-bordure bg-white p-5">
          <h2 className="mb-5 font-serif text-lg">Filtres</h2>
          <ContenuFiltres categories={categories} valeurs={valeurs} />
        </div>
      </aside>

      <Sheet open={ouvert} onOpenChange={setOuvert}>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden">
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {nombreResultats > 0 ? (
              <span className="text-xs text-gris">({nombreResultats})</span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent cote="gauche" className="w-[86vw] max-w-sm overflow-y-auto">
          <SheetTitle className="pr-8">Filtres</SheetTitle>
          <ContenuFiltres categories={categories} valeurs={valeurs} />
          <SheetClose asChild>
            <Button variant="secondary" className="mt-2 w-full">
              <X className="h-4 w-4" />
              Fermer
            </Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
    </>
  );
}
