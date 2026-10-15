"use client";

import * as React from "react";
import { Minus, Plus, ShoppingBag, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePanier } from "@/hooks/use-panier";
import { formatMontant } from "@/lib/utils";
import type { ProduitComplet } from "@/types";

interface SelecteurAchatProps {
  produit: ProduitComplet;
}

export function SelecteurAchat({ produit }: SelecteurAchatProps) {
  const { ajouter } = usePanier();
  const variantesActives = produit.variantes_produit.filter((v) => v.est_active);

  const [varianteId, setVarianteId] = React.useState<string | null>(
    variantesActives[0]?.id ?? null,
  );
  const [quantite, setQuantite] = React.useState(1);

  const variante = variantesActives.find((v) => v.id === varianteId) ?? null;

  const prixVente = variante?.prix_vente ?? produit.prix_vente;
  const prixPromo = variante?.prix_promotionnel ?? produit.prix_promotionnel;
  const enPromotion = prixPromo !== null && prixPromo < prixVente;
  const prixAffiche = enPromotion ? prixPromo! : prixVente;
  const stockDisponible = variante ? variante.quantite_stock : produit.quantite_stock;
  const imagePrincipale =
    produit.images_produits.find((i) => i.est_principale) ?? produit.images_produits[0];

  React.useEffect(() => {
    setQuantite(1);
  }, [varianteId]);

  const ajouterAuPanier = () => {
    if (stockDisponible <= 0) return;
    ajouter(
      {
        produitId: produit.id,
        varianteId: variante?.id ?? null,
        slug: produit.slug,
        nom: produit.nom,
        nomVariante: variante?.nom ?? null,
        contenance: variante?.contenance ?? null,
        prixUnitaire: prixAffiche,
        prixBarre: enPromotion ? prixVente : null,
        imageUrl: imagePrincipale?.url ?? null,
        quantite,
        stockDisponible,
        referenceSku: variante?.reference_sku ?? produit.reference_sku,
      },
      { ouvrirTiroir: true },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-serif text-3xl text-noir">
          {formatMontant(prixAffiche, produit.devise)}
        </span>
        {enPromotion ? (
          <>
            <span className="text-base text-gris line-through">
              {formatMontant(prixVente, produit.devise)}
            </span>
            <Badge variant="solid">
              −{Math.round((1 - prixAffiche / prixVente) * 100)}%
            </Badge>
          </>
        ) : null}
      </div>

      {variantesActives.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-noir">
            {variante?.contenance ? "Contenance" : "Variante"}
          </p>
          <div className="flex flex-wrap gap-2">
            {variantesActives.map((v) => {
              const actif = v.id === varianteId;
              const indisponible = v.quantite_stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVarianteId(v.id)}
                  disabled={indisponible}
                  aria-pressed={actif}
                  className={`min-h-11 rounded-md border px-4 py-2 text-sm transition-colors ${
                    actif
                      ? "border-or bg-or/10 font-medium text-or-fonce"
                      : "border-bordure text-noir hover:border-or/50"
                  } ${indisponible ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {v.nom}
                  {indisponible ? " — épuisé" : ""}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-noir">Quantité</p>
        <div className="inline-flex items-center rounded-md border border-bordure">
          <button
            type="button"
            onClick={() => setQuantite((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center hover:bg-ivoire"
            aria-label="Diminuer la quantité"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-sm" aria-live="polite">
            {quantite}
          </span>
          <button
            type="button"
            onClick={() => setQuantite((q) => Math.min(stockDisponible || 1, q + 1))}
            disabled={quantite >= stockDisponible}
            className="flex h-11 w-11 items-center justify-center hover:bg-ivoire disabled:opacity-40"
            aria-label="Augmenter la quantité"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        {stockDisponible > 0 ? (
          <p className="text-sm text-emerald-700">
            En stock{stockDisponible <= 5 ? ` — plus que ${stockDisponible} en stock` : ""}
          </p>
        ) : (
          <p className="text-sm text-red-600">Produit momentanément indisponible</p>
        )}
      </div>

      <div className="hidden sm:block">
        <Button
          size="lg"
          className="w-full"
          onClick={ajouterAuPanier}
          disabled={stockDisponible <= 0}
        >
          <ShoppingBag className="h-4 w-4" />
          Ajouter au panier
        </Button>
      </div>

      <div className="grid gap-2 text-xs text-gris sm:text-sm">
        <p className="inline-flex items-center gap-2">
          <Truck className="h-4 w-4 text-or" /> Livraison partout au Maroc
        </p>
        <p className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-or" /> Commande sans compte, confirmation par notre équipe
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bordure bg-white/95 p-3 safe-bottom backdrop-blur sm:hidden">
        <Button
          size="lg"
          className="w-full"
          onClick={ajouterAuPanier}
          disabled={stockDisponible <= 0}
        >
          <ShoppingBag className="h-4 w-4" />
          Ajouter — {formatMontant(prixAffiche * quantite, produit.devise)}
        </Button>
      </div>
      <div className="h-16 sm:hidden" />
    </div>
  );
}
