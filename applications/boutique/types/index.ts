import type {
  Database,
  StatutCommande,
  StatutPaiement,
  TypeReduction,
  TypeMouvementStock,
  RoleUtilisateur,
} from "./database";

type Tables = Database["public"]["Tables"];

export type Categorie = Tables["categories"]["Row"];
export type Produit = Tables["produits"]["Row"];
export type ImageProduit = Tables["images_produits"]["Row"];
export type VarianteProduit = Tables["variantes_produit"]["Row"];
export type Commande = Tables["commandes"]["Row"];
export type LigneCommande = Tables["lignes_commande"]["Row"];
export type HistoriqueStatut = Tables["historique_statuts_commande"]["Row"];
export type MouvementStock = Tables["mouvements_stock"]["Row"];
export type Promotion = Tables["promotions"]["Row"];
export type ParametreBoutique = Tables["parametres_boutique"]["Row"];
export type ProfilUtilisateur = Tables["profils_utilisateurs"]["Row"];
export type InscriptionNewsletter = Tables["inscriptions_newsletter"]["Row"];
export type JournalActivite = Tables["journaux_activite_administration"]["Row"];

export type ProduitComplet = Produit & {
  images_produits: ImageProduit[];
  variantes_produit: VarianteProduit[];
  categories: Pick<Categorie, "id" | "nom" | "slug"> | null;
};

export type ProduitCarte = Produit & {
  images_produits: Pick<ImageProduit, "url" | "texte_alt" | "est_principale">[];
  categories: Pick<Categorie, "id" | "nom" | "slug"> | null;
};

export type CategorieAvecEnfants = Categorie & {
  enfants: CategorieAvecEnfants[];
};

export type CommandeComplete = Commande & {
  lignes_commande: LigneCommande[];
  historique_statuts_commande: HistoriqueStatut[];
};

export type LignePanier = {
  produitId: string;
  varianteId: string | null;
  slug: string;
  nom: string;
  nomVariante: string | null;
  contenance: string | null;
  prixUnitaire: number;
  prixBarre: number | null;
  imageUrl: string | null;
  quantite: number;
  stockDisponible: number;
  referenceSku: string | null;
  poids?: number;
};

export type { StatutCommande, StatutPaiement, TypeReduction, TypeMouvementStock, RoleUtilisateur };

export const LIBELLES_STATUT_COMMANDE: Record<StatutCommande, string> = {
  EN_ATTENTE_CONFIRMATION: "En attente de confirmation",
  CONFIRMEE: "Confirmée",
  EN_PREPARATION: "En préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
  RETOURNEE: "Retournée",
};

export const LIBELLES_STATUT_PAIEMENT: Record<StatutPaiement, string> = {
  NON_PAYE: "Non payé",
  A_PAYER_LIVRAISON: "Paiement à la livraison",
  PAYE: "Payé",
  REMBOURSE: "Remboursé",
};

export const TRANSITIONS_STATUT: Record<StatutCommande, StatutCommande[]> = {
  EN_ATTENTE_CONFIRMATION: ["CONFIRMEE", "ANNULEE"],
  CONFIRMEE: ["EN_PREPARATION", "ANNULEE"],
  EN_PREPARATION: ["EXPEDIEE", "ANNULEE"],
  EXPEDIEE: ["LIVREE", "RETOURNEE"],
  LIVREE: ["RETOURNEE"],
  ANNULEE: [],
  RETOURNEE: [],
};

export const COULEURS_STATUT: Record<StatutCommande, string> = {
  EN_ATTENTE_CONFIRMATION: "bg-amber-50 text-amber-800 border-amber-200",
  CONFIRMEE: "bg-blue-50 text-blue-800 border-blue-200",
  EN_PREPARATION: "bg-violet-50 text-violet-800 border-violet-200",
  EXPEDIEE: "bg-cyan-50 text-cyan-800 border-cyan-200",
  LIVREE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  ANNULEE: "bg-red-50 text-red-700 border-red-200",
  RETOURNEE: "bg-stone-100 text-stone-700 border-stone-200",
};

export function statutsSuivantsPossibles(statut: StatutCommande): StatutCommande[] {
  return TRANSITIONS_STATUT[statut] ?? [];
}

export function transitionAutorisee(
  depuis: StatutCommande,
  vers: StatutCommande,
): boolean {
  return statutsSuivantsPossibles(depuis).includes(vers);
}
