import { cn } from "@/lib/utils";
import type { ProduitCarte } from "@/types";
import { CarteProduit } from "./carte-produit";

interface GrilleProduitsProps {
  produits: ProduitCarte[];
  className?: string;
  colonnes?: "auto" | "4";
}

export function GrilleProduits({ produits, className, colonnes = "auto" }: GrilleProduitsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-5",
        colonnes === "auto"
          ? "md:grid-cols-3 lg:grid-cols-4"
          : "lg:grid-cols-4",
        className,
      )}
    >
      {produits.map((produit, index) => (
        <CarteProduit key={produit.id} produit={produit} indexPrioritaire={index} />
      ))}
    </div>
  );
}
