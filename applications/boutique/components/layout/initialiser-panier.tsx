"use client";

import { useEffect } from "react";
import { usePanier } from "@/hooks/use-panier";

export function InitialiserPanier({
  frais,
  seuilGratuit,
}: {
  frais: number;
  seuilGratuit: number;
}) {
  const { definirFrais } = usePanier();
  useEffect(() => {
    definirFrais(frais, seuilGratuit);
  }, [frais, seuilGratuit, definirFrais]);
  return null;
}
