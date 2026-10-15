import { cn } from "@/lib/utils";
import type { ProduitCarte } from "@/types";
import { CarteProduit } from "./carte-produit";
import { ApparitionElement, ApparitionGroupe } from "./apparition";

interface GrilleProduitsProps {
  produits: ProduitCarte[];
  className?: string;
  colonnes?: "auto" | "4";
  anime?: boolean;
}

export function GrilleProduits({
  produits,
  className,
  colonnes = "auto",
  anime = false,
}: GrilleProduitsProps) {
  const classes = cn(
    "grid grid-cols-2 gap-3 sm:gap-5",
    colonnes === "auto" ? "md:grid-cols-3 lg:grid-cols-4" : "lg:grid-cols-4",
    className,
  );

  if (!anime) {
    return (
      <div className={classes}>
        {produits.map((produit, index) => (
          <CarteProduit key={produit.id} produit={produit} indexPrioritaire={index} />
        ))}
      </div>
    );
  }

  return (
    <ApparitionGroupe className={classes}>
      {produits.map((produit, index) => (
        <ApparitionElement key={produit.id} className="h-full">
          <CarteProduit
            produit={produit}
            indexPrioritaire={index}
            className="h-full"
          />
        </ApparitionElement>
      ))}
    </ApparitionGroupe>
  );
}
