"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

const OPTIONS = [
  { valeur: "nouveautes", libelle: "Nouveautés" },
  { valeur: "prix_asc", libelle: "Prix croissant" },
  { valeur: "prix_desc", libelle: "Prix décroissant" },
  { valeur: "popularite", libelle: "Popularité" },
];

export function SelecteurTri({ valeur }: { valeur: string }) {
  const router = useRouter();
  const parametres = useSearchParams();

  const changer = (nouvelle: string) => {
    const params = new URLSearchParams(parametres.toString());
    params.set("tri", nouvelle);
    params.delete("page");
    router.push(`/boutique?${params.toString()}`);
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <ArrowUpDown className="h-4 w-4 text-gris" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only sm:text-gris">Trier par</span>
      <select
        value={valeur}
        onChange={(e) => changer(e.target.value)}
        className="h-10 rounded-md border border-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-or"
        aria-label="Trier les produits"
      >
        {OPTIONS.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}
