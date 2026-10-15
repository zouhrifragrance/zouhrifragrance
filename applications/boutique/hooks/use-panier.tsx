"use client";

import * as React from "react";
import type { LignePanier } from "@/types";
import {
  CLES_PANIER,
  ajouterLigne,
  calculerFraisLivraison,
  calculerSousTotal,
  cleLigne,
  deserialiserPanier,
  modifierQuantite,
  quantiteTotale,
  retirerLigne,
  serialiserPanier,
} from "@/lib/panier";
import { toast } from "sonner";

interface ContextePanier {
  lignes: LignePanier[];
  estMonte: boolean;
  nombreArticles: number;
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  ajouter: (ligne: LignePanier, options?: { ouvrirTiroir?: boolean }) => void;
  modifier: (cle: string, quantite: number) => void;
  retirer: (cle: string) => void;
  vider: () => void;
  definirFrais: (frais: number, seuilGratuit: number) => void;
  tiroirOuvert: boolean;
  ouvrirTiroir: () => void;
  fermerTiroir: () => void;
}

const PanierContexte = React.createContext<ContextePanier | null>(null);

export function FournisseurPanier({ children }: { children: React.ReactNode }) {
  const [lignes, setLignes] = React.useState<LignePanier[]>([]);
  const [estMonte, setEstMonte] = React.useState(false);
  const [tiroirOuvert, setTiroirOuvert] = React.useState(false);
  const [regleLivraison, setRegleLivraison] = React.useState({ frais: 30, seuil: 500 });

  React.useEffect(() => {
    setLignes(deserialiserPanier(window.localStorage.getItem(CLES_PANIER)));
    setEstMonte(true);
  }, []);

  React.useEffect(() => {
    if (!estMonte) return;
    window.localStorage.setItem(CLES_PANIER, serialiserPanier(lignes));
  }, [lignes, estMonte]);

  React.useEffect(() => {
    if (!estMonte) return;
    const synchroniser = (evenement: StorageEvent) => {
      if (evenement.key === CLES_PANIER) {
        setLignes(deserialiserPanier(evenement.newValue));
      }
    };
    window.addEventListener("storage", synchroniser);
    return () => window.removeEventListener("storage", synchroniser);
  }, [estMonte]);

  const ajouter = React.useCallback(
    (ligne: LignePanier, options?: { ouvrirTiroir?: boolean }) => {
      setLignes((precedent) => ajouterLigne(precedent, ligne));
      toast.success("Ajouté au panier", {
        description: ligne.nomVariante ? `${ligne.nom} — ${ligne.nomVariante}` : ligne.nom,
      });
      if (options?.ouvrirTiroir) setTiroirOuvert(true);
    },
    [],
  );

  const modifier = React.useCallback((cle: string, quantite: number) => {
    setLignes((precedent) => modifierQuantite(precedent, cle, quantite));
  }, []);

  const retirer = React.useCallback((cle: string) => {
    setLignes((precedent) => retirerLigne(precedent, cle));
    toast.info("Article retiré du panier");
  }, []);

  const vider = React.useCallback(() => {
    setLignes([]);
    toast.info("Panier vidé");
  }, []);

  const definirFrais = React.useCallback((frais: number, seuilGratuit: number) => {
    setRegleLivraison({ frais, seuil: seuilGratuit });
  }, []);

  const sousTotal = React.useMemo(() => calculerSousTotal(lignes), [lignes]);
  const fraisLivraison = React.useMemo(
    () => calculerFraisLivraison(sousTotal, regleLivraison.frais, regleLivraison.seuil),
    [sousTotal, regleLivraison],
  );
  const total = React.useMemo(
    () => Math.round((Math.max(0, sousTotal) + fraisLivraison) * 100) / 100,
    [sousTotal, fraisLivraison],
  );

  const valeur: ContextePanier = {
    lignes,
    estMonte,
    nombreArticles: quantiteTotale(lignes),
    sousTotal,
    fraisLivraison,
    total,
    ajouter,
    modifier,
    retirer,
    vider,
    definirFrais,
    tiroirOuvert,
    ouvrirTiroir: () => setTiroirOuvert(true),
    fermerTiroir: () => setTiroirOuvert(false),
  };

  return <PanierContexte.Provider value={valeur}>{children}</PanierContexte.Provider>;
}

export function usePanier(): ContextePanier {
  const contexte = React.useContext(PanierContexte);
  if (!contexte) {
    throw new Error("usePanier doit être utilisé à l'intérieur du FournisseurPanier.");
  }
  return contexte;
}

export { cleLigne };
