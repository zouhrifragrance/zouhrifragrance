"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LIBELLES_STATUT_COMMANDE, type StatutCommande } from "@/types";

const STATUTS = Object.keys(LIBELLES_STATUT_COMMANDE) as StatutCommande[];

export function FiltresCommandes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recherche, setRecherche] = React.useState(searchParams.get("recherche") ?? "");
  const statut = searchParams.get("statut") ?? "";

  function appliquer(params: { statut?: string; recherche?: string }) {
    const suivants = new URLSearchParams(searchParams.toString());
    if (params.statut !== undefined) {
      if (params.statut) suivants.set("statut", params.statut);
      else suivants.delete("statut");
    }
    if (params.recherche !== undefined) {
      if (params.recherche) suivants.set("recherche", params.recherche);
      else suivants.delete("recherche");
    }
    router.push(`/admin/commandes?${suivants.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris-clair" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") appliquer({ recherche });
          }}
          placeholder="Rechercher un numéro, un client, un téléphone…"
          className="pl-9"
          aria-label="Rechercher une commande"
        />
      </div>

      <select
        value={statut}
        onChange={(e) => appliquer({ statut: e.target.value })}
        className="h-11 rounded-md border border-bordure bg-white px-3 text-sm focus-visible:border-or focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or sm:w-56"
        aria-label="Filtrer par statut"
      >
        <option value="">Tous les statuts</option>
        {STATUTS.map((code) => (
          <option key={code} value={code}>
            {LIBELLES_STATUT_COMMANDE[code]}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => appliquer({ recherche })}>
          Rechercher
        </Button>
        {statut || recherche ? (
          <Button
            variant="ghost"
            onClick={() => {
              setRecherche("");
              router.push("/admin/commandes");
            }}
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </Button>
        ) : null}
      </div>
    </div>
  );
}
