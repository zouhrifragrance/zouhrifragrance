"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EtatVide } from "@/components/ui/etat-vide";
import { ImageProduit } from "@/components/brand/image-produit";
import { usePanier } from "@/hooks/use-panier";
import { formatMontant } from "@/lib/utils";

export function TiroirPanier() {
  const {
    lignes,
    tiroirOuvert,
    fermerTiroir,
    modifier,
    retirer,
    sousTotal,
    fraisLivraison,
    total,
    nombreArticles,
    vider,
  } = usePanier();

  const cle = (l: (typeof lignes)[number]) => `${l.produitId}::${l.varianteId ?? "sans-variante"}`;

  return (
    <Sheet open={tiroirOuvert} onOpenChange={(ouvert) => !ouvert && fermerTiroir()}>
      <SheetContent cote="droite" className="gap-0 p-0">
        <div className="flex items-center justify-between border-b border-bordure px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4 text-or" />
            Panier ({nombreArticles})
          </SheetTitle>
        </div>

        {lignes.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EtatVide
              icon={ShoppingBag}
              titre="Votre panier est vide"
              description="Parcourez notre boutique et ajoutez vos fragrances préférées."
              action={
                <Button asChild onClick={fermerTiroir}>
                  <Link href="/boutique">Découvrir la boutique</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                <AnimatePresence initial={false}>
                  {lignes.map((ligne) => {
                    const id = cle(ligne);
                    const montant = ligne.prixUnitaire * ligne.quantite;
                    return (
                      <motion.li
                        key={id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.18 }}
                        className="flex gap-3"
                      >
                        <Link
                          href={`/produits/${ligne.slug}`}
                          onClick={fermerTiroir}
                          className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-ivoire"
                        >
                          <ImageProduit
                            src={ligne.imageUrl}
                            alt={ligne.nom}
                            sizes="64px"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                href={`/produits/${ligne.slug}`}
                                onClick={fermerTiroir}
                                className="line-clamp-2 text-sm font-medium text-noir hover:text-or-fonce"
                              >
                                {ligne.nom}
                              </Link>
                              {ligne.nomVariante ? (
                                <p className="text-xs text-gris">{ligne.nomVariante}</p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => retirer(id)}
                              className="rounded-md p-1 text-gris hover:bg-red-50 hover:text-red-600"
                              aria-label={`Retirer ${ligne.nom} du panier`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center rounded-md border border-bordure">
                              <button
                                type="button"
                                onClick={() => modifier(id, ligne.quantite - 1)}
                                className="flex h-8 w-8 items-center justify-center text-noir hover:bg-ivoire"
                                aria-label="Diminuer la quantité"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm" aria-live="polite">
                                {ligne.quantite}
                              </span>
                              <button
                                type="button"
                                onClick={() => modifier(id, ligne.quantite + 1)}
                                disabled={ligne.quantite >= ligne.stockDisponible}
                                className="flex h-8 w-8 items-center justify-center text-noir hover:bg-ivoire disabled:opacity-40"
                                aria-label="Augmenter la quantité"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-medium">
                              {formatMontant(montant)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>

              <button
                type="button"
                onClick={vider}
                className="mt-5 text-xs text-gris underline-offset-4 hover:text-red-600 hover:underline"
              >
                Vider le panier
              </button>
            </div>

            <div className="border-t border-bordure bg-ivoire/60 px-5 py-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gris">Sous-total</dt>
                  <dd>{formatMontant(sousTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gris">Livraison estimée</dt>
                  <dd>{fraisLivraison === 0 ? "Offerte" : formatMontant(fraisLivraison)}</dd>
                </div>
                <div className="flex justify-between border-t border-bordure pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatMontant(total)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild size="lg" onClick={fermerTiroir}>
                  <Link href="/commande">Passer commande</Link>
                </Button>
                <Button asChild variant="outline" onClick={fermerTiroir}>
                  <Link href="/panier">Voir le panier</Link>
                </Button>
              </div>
              <p className="mt-3 text-center text-xs text-gris">
                Aucun paiement en ligne. Confirmation par notre équipe.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
