"use client";

import * as React from "react";
import { ImageProduit } from "@/components/brand/image-produit";
import { cn } from "@/lib/utils";

interface GalerieProduitProps {
  images: { id: string; url: string; texte_alt: string | null }[];
  nom: string;
}

export function GalerieProduit({ images, nom }: GalerieProduitProps) {
  const liste = images.length > 0 ? images : [{ id: "placeholder", url: "", texte_alt: nom }];
  const [index, setIndex] = React.useState(0);
  const active = liste[index] ?? liste[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-bordure bg-ivoire">
        <ImageProduit
          src={active?.url}
          alt={active?.texte_alt ?? nom}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {liste.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Galerie d'images">
          {liste.map((image, i) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Voir l'image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-ivoire transition-colors sm:h-20 sm:w-20",
                i === index ? "border-or" : "border-bordure hover:border-or/50",
              )}
            >
              <ImageProduit src={image.url} alt={image.texte_alt ?? `${nom} ${i + 1}`} sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
