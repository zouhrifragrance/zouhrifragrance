import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatutProps {
  children: ReactNode;
  className?: string;
  libelle?: string;
}

/** Conteneur accessible annonçant un chargement en cours. */
export function StatutChargement({ children, className, libelle = "Chargement…" }: StatutProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{libelle}</span>
      {children}
    </div>
  );
}

/** Carte produit factice, calquée sur `CarteProduit`. */
export function SqueletteCarteProduit() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-white">
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="mt-2 h-5 w-1/3" />
      </div>
    </div>
  );
}

export function GrilleProduitsSquelette({
  nombre = 8,
  className,
}: {
  nombre?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: nombre }).map((_, index) => (
        <SqueletteCarteProduit key={index} />
      ))}
    </div>
  );
}

export function EnTeteSquelette({
  puce = true,
  className,
}: {
  puce?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {puce ? <Skeleton className="h-3.5 w-44" /> : null}
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

/** Page liste / catalogue : en-tête, barre de filtres et grille de produits. */
export function ChargementCatalogue({
  nombre = 8,
  filtres = true,
}: {
  nombre?: number;
  filtres?: boolean;
}) {
  return (
    <StatutChargement className="container-luxe py-8 sm:py-10">
      <EnTeteSquelette />
      {filtres ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      ) : null}
      <GrilleProduitsSquelette nombre={nombre} className="mt-8" />
    </StatutChargement>
  );
}

/** Fiche produit : galerie à gauche, informations et achat à droite. */
export function ChargementProduit() {
  return (
    <StatutChargement className="container-luxe py-8 sm:py-10">
      <Skeleton className="h-3.5 w-64" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="space-y-3 rounded-xl border border-bordure bg-white p-4 sm:p-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StatutChargement>
  );
}

/** Page avec formulaire et récapitulatif latéral (panier, commande, contact). */
export function ChargementFormulaire({
  colonneLaterale = true,
}: {
  colonneLaterale?: boolean;
}) {
  return (
    <StatutChargement className="container-luxe py-8 sm:py-10">
      <EnTeteSquelette />
      <div
        className={cn(
          "mt-8 grid gap-8",
          colonneLaterale && "lg:grid-cols-[1fr_360px]",
        )}
      >
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, bloc) => (
            <div
              key={bloc}
              className="space-y-4 rounded-xl border border-bordure bg-white p-5 sm:p-6"
            >
              <Skeleton className="h-5 w-40" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, champ) => (
                  <div key={champ} className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-11 w-full rounded-md" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ))}
        </div>
        {colonneLaterale ? (
          <aside className="space-y-4 rounded-xl border border-bordure bg-white p-5 sm:p-6 lg:h-fit">
            <Skeleton className="h-5 w-36" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, ligne) => (
                <div key={ligne} className="flex gap-3">
                  <Skeleton className="h-16 w-14 shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-12 w-full rounded-md" />
          </aside>
        ) : null}
      </div>
    </StatutChargement>
  );
}

/** Page de contenu éditorial (texte, mentions, CGV…). */
export function ChargementContenu({ paragraphes = 5 }: { paragraphes?: number }) {
  return (
    <StatutChargement className="container-luxe py-8 sm:py-10">
      <EnTeteSquelette />
      <div className="mt-8 max-w-3xl space-y-4">
        {Array.from({ length: paragraphes }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </StatutChargement>
  );
}

/** Page d'accueil : bandeau, réassurance et sections de produits. */
export function ChargementAccueil() {
  return (
    <StatutChargement className="pb-4">
      <section className="border-b border-bordure bg-noir">
        <div className="container-luxe grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <Skeleton className="h-8 w-52 rounded-full bg-white/10" />
            <Skeleton className="h-12 w-full bg-white/10 sm:h-14" />
            <Skeleton className="h-12 w-4/5 bg-white/10" />
            <Skeleton className="h-4 w-full bg-white/10" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-48 rounded-md bg-white/10" />
              <Skeleton className="h-12 w-40 rounded-md bg-white/10" />
            </div>
          </div>
          <Skeleton className="mx-auto aspect-[4/5] w-full max-w-md rounded-2xl bg-white/10" />
        </div>
      </section>
      <section className="container-luxe py-14 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Skeleton className="mx-auto h-3.5 w-24" />
          <Skeleton className="mx-auto h-8 w-80 max-w-full" />
          <Skeleton className="mx-auto h-4 w-full" />
          <Skeleton className="mx-auto h-4 w-3/4" />
        </div>
      </section>
      <section className="container-luxe py-6 sm:py-10">
        <Skeleton className="h-7 w-48" />
        <GrilleProduitsSquelette nombre={4} className="mt-6" />
      </section>
    </StatutChargement>
  );
}

/** Tableau de bord administrateur : KPI et panneaux. */
export function ChargementAdmin() {
  return (
    <StatutChargement className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-bordure bg-white p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-bordure bg-white p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-5 h-40 w-full rounded-md" />
        </div>
        <div className="rounded-xl border border-bordure bg-white p-5">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </StatutChargement>
  );
}

/** Liste / table administrateur. */
export function ChargementAdminListe({ lignes = 6 }: { lignes?: number }) {
  return (
    <StatutChargement className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <div className="overflow-hidden rounded-xl border border-bordure bg-white">
        <div className="flex items-center gap-4 border-b border-bordure px-4 py-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-3.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: lignes }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-bordure/60 px-4 py-3.5 last:border-0">
            {Array.from({ length: 4 }).map((_, colonne) => (
              <Skeleton key={colonne} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </StatutChargement>
  );
}
