import Link from "next/link";
import { ImageProduit } from "@/components/brand/image-produit";
import { Badge } from "@/components/ui/badge";
import { formatMontant } from "@/lib/utils";
import type { ProduitCarte } from "@/types";
import { cn } from "@/lib/utils";

interface CarteProduitProps {
  produit: ProduitCarte;
  indexPrioritaire?: number;
  className?: string;
}

export function CarteProduit({ produit, indexPrioritaire = 4, className }: CarteProduitProps) {
  const imagePrincipale =
    produit.images_produits?.find((i) => i.est_principale) ?? produit.images_produits?.[0];
  const enPromotion =
    produit.prix_promotionnel !== null && produit.prix_promotionnel < produit.prix_vente;
  const prixAffiche = enPromotion ? produit.prix_promotionnel! : produit.prix_vente;
  const rupture = produit.quantite_stock <= 0;

  return (
    <Link
      href={`/produits/${produit.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-bordure bg-white transition-all duration-300 hover:-translate-y-1 hover:border-or/40 hover:shadow-luxe",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ivoire">
        <ImageProduit
          src={imagePrincipale?.url}
          alt={imagePrincipale?.texte_alt ?? produit.nom}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={indexPrioritaire < 4}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {enPromotion ? <Badge variant="solid">Promotion</Badge> : null}
          {produit.est_mis_en_avant && !enPromotion ? (
            <Badge variant="default">Sélection</Badge>
          ) : null}
        </div>
        {rupture ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Badge variant="neutral">Rupture de stock</Badge>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5 sm:p-4">
        {produit.categories?.nom ? (
          <span className="text-[0.68rem] uppercase tracking-widest text-gris">
            {produit.categories.nom}
          </span>
        ) : null}
        <h3 className="line-clamp-2 font-serif text-base leading-snug text-noir group-hover:text-or-fonce sm:text-lg">
          {produit.nom}
        </h3>
        {produit.description_courte ? (
          <p className="line-clamp-2 text-xs text-gris sm:text-[0.8rem]">
            {produit.description_courte}
          </p>
        ) : null}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-sm font-semibold text-noir sm:text-base">
            {formatMontant(prixAffiche, produit.devise)}
          </span>
          {enPromotion ? (
            <span className="text-xs text-gris line-through">
              {formatMontant(produit.prix_vente, produit.devise)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
