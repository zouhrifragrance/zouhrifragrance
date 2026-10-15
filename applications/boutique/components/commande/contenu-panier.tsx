"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EtatVide } from "@/components/ui/etat-vide";
import { Separator } from "@/components/ui/separator";
import { ImageProduit } from "@/components/brand/image-produit";
import { usePanier, cleLigne } from "@/hooks/use-panier";
import { formatMontant } from "@/lib/utils";

export function ContenuPanier() {
  const { lignes, estMonte, modifier, retirer, vider, sousTotal, fraisLivraison, total } =
    usePanier();

  if (!estMonte) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="skeleton h-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (lignes.length === 0) {
    return (
      <EtatVide
        icon={ShoppingBag}
        titre="Votre panier est vide"
        description="Parcourez notre boutique et ajoutez vos fragrances préférées."
        action={
          <Button asChild>
            <Link href="/boutique">Découvrir la boutique</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section aria-label="Articles du panier">
        <ul className="divide-y divide-bordure rounded-xl border border-bordure bg-white">
          {lignes.map((ligne) => {
            const id = cleLigne(ligne);
            return (
              <li key={id} className="flex gap-4 p-4 sm:p-5">
                <Link
                  href={`/produits/${ligne.slug}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-ivoire"
                >
                  <ImageProduit src={ligne.imageUrl} alt={ligne.nom} sizes="96px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/produits/${ligne.slug}`}
                        className="font-medium text-noir hover:text-or-fonce"
                      >
                        {ligne.nom}
                      </Link>
                      {ligne.nomVariante || ligne.contenance ? (
                        <p className="text-xs text-gris">
                          {ligne.nomVariante ?? ligne.contenance}
                        </p>
                      ) : null}
                      {ligne.referenceSku ? (
                        <p className="text-xs text-gris-clair">Réf. {ligne.referenceSku}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => retirer(id)}
                      className="rounded-md p-1.5 text-gris transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Retirer ${ligne.nom} du panier`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-md border border-bordure">
                      <button
                        type="button"
                        onClick={() => modifier(id, ligne.quantite - 1)}
                        className="flex h-9 w-9 items-center justify-center text-noir hover:bg-ivoire"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm" aria-live="polite">
                        {ligne.quantite}
                      </span>
                      <button
                        type="button"
                        onClick={() => modifier(id, ligne.quantite + 1)}
                        disabled={ligne.quantite >= ligne.stockDisponible}
                        className="flex h-9 w-9 items-center justify-center text-noir hover:bg-ivoire disabled:opacity-40"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-noir">
                        {formatMontant(ligne.prixUnitaire * ligne.quantite)}
                      </p>
                      <p className="text-xs text-gris">
                        {formatMontant(ligne.prixUnitaire)} l&apos;unité
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/boutique">Continuer mes achats</Link>
          </Button>
          <button
            type="button"
            onClick={vider}
            className="text-xs text-gris underline-offset-4 hover:text-red-600 hover:underline"
          >
            Vider le panier
          </button>
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-xl border border-bordure bg-white p-5 sm:p-6">
          <h2 className="font-serif text-xl">Récapitulatif</h2>
          <Separator className="my-4" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gris">Sous-total</dt>
              <dd className="font-medium">{formatMontant(sousTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gris">Livraison estimée</dt>
              <dd className="font-medium">
                {fraisLivraison === 0 ? "Offerte" : formatMontant(fraisLivraison)}
              </dd>
            </div>
            <Separator />
            <div className="flex items-baseline justify-between text-base">
              <dt className="font-medium">Total</dt>
              <dd className="font-serif text-xl">{formatMontant(total)}</dd>
            </div>
          </dl>
          <Button asChild size="lg" className="mt-5 w-full">
            <Link href="/commande">
              Passer commande
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-3 text-center text-xs text-gris">
            Aucun paiement en ligne. Commande sans compte.
          </p>
        </div>
      </aside>
    </div>
  );
}
