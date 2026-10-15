export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StatutCommande =
  | "EN_ATTENTE_CONFIRMATION"
  | "CONFIRMEE"
  | "EN_PREPARATION"
  | "EXPEDIEE"
  | "LIVREE"
  | "ANNULEE"
  | "RETOURNEE";

export type StatutPaiement =
  | "NON_PAYE"
  | "A_PAYER_LIVRAISON"
  | "PAYE"
  | "REMBOURSE";

export type TypeMouvementStock =
  | "ENTREE"
  | "SORTIE"
  | "RESERVATION"
  | "LIBERATION"
  | "AJUSTEMENT"
  | "RETOUR";

export type TypeReduction = "POURCENTAGE" | "MONTANT_FIXE";

export type RoleUtilisateur = "ADMIN" | "GESTIONNAIRE" | "LECTEUR";

type TableDefinition<
  Row,
  Insert = Partial<Row>,
  Update = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profils_utilisateurs: TableDefinition<{
        id: string;
        nom_complet: string;
        role: RoleUtilisateur;
        est_actif: boolean;
        date_creation: string;
        date_modification: string;
      }>;
      roles_utilisateurs: TableDefinition<{
        id: string;
        code: string;
        libelle: string;
        description: string | null;
        date_creation: string;
      }>;
      categories: TableDefinition<{
        id: string;
        nom: string;
        slug: string;
        description: string | null;
        image_url: string | null;
        categorie_parente_id: string | null;
        ordre_affichage: number;
        est_active: boolean;
        titre_seo: string | null;
        description_seo: string | null;
        date_creation: string;
        date_modification: string;
      }>;
      produits: TableDefinition<{
        id: string;
        nom: string;
        slug: string;
        description_courte: string | null;
        description: string | null;
        categorie_id: string | null;
        reference_sku: string | null;
        prix_vente: number;
        prix_promotionnel: number | null;
        devise: string;
        quantite_stock: number;
        seuil_stock_faible: number;
        est_mis_en_avant: boolean;
        est_publie: boolean;
        titre_seo: string | null;
        description_seo: string | null;
        date_creation: string;
        date_modification: string;
      }>;
      images_produits: TableDefinition<{
        id: string;
        produit_id: string;
        url: string;
        texte_alt: string | null;
        est_principale: boolean;
        ordre_affichage: number;
        date_creation: string;
      }>;
      variantes_produit: TableDefinition<{
        id: string;
        produit_id: string;
        nom: string;
        contenance: string | null;
        reference_sku: string | null;
        prix_vente: number | null;
        prix_promotionnel: number | null;
        quantite_stock: number;
        seuil_stock_faible: number;
        est_active: boolean;
        ordre_affichage: number;
        date_creation: string;
        date_modification: string;
      }>;
      mouvements_stock: TableDefinition<{
        id: string;
        produit_id: string | null;
        variante_id: string | null;
        type_mouvement: TypeMouvementStock;
        quantite: number;
        motif: string | null;
        commande_id: string | null;
        utilisateur_id: string | null;
        date_creation: string;
      }>;
      commandes: TableDefinition<{
        id: string;
        numero_commande: string;
        nom_client: string;
        telephone_client: string;
        email_client: string | null;
        ville_livraison: string;
        adresse_livraison: string;
        complement_adresse: string | null;
        instructions_livraison: string | null;
        statut_commande: StatutCommande;
        statut_paiement: StatutPaiement;
        sous_total: number;
        montant_reduction: number;
        frais_livraison: number;
        montant_total: number;
        devise: string;
        cle_idempotence: string;
        code_promotion: string | null;
        reservation_expire_le: string | null;
        stock_libere: boolean;
        date_creation: string;
        date_modification: string;
      }>;
      lignes_commande: TableDefinition<{
        id: string;
        commande_id: string;
        produit_id: string | null;
        variante_id: string | null;
        nom_produit: string;
        nom_variante: string | null;
        reference_sku: string | null;
        prix_unitaire: number;
        quantite: number;
        montant_ligne: number;
        date_creation: string;
      }>;
      historique_statuts_commande: TableDefinition<{
        id: string;
        commande_id: string;
        statut_precedent: StatutCommande | null;
        statut_nouveau: StatutCommande;
        commentaire: string | null;
        acteur: string | null;
        date_creation: string;
      }>;
      jetons_suivi_commande: TableDefinition<{
        id: string;
        commande_id: string;
        empreinte_jeton: string;
        date_creation: string;
        date_expiration: string;
        est_revoque: boolean;
      }>;
      promotions: TableDefinition<{
        id: string;
        code: string;
        nom: string;
        type_reduction: TypeReduction;
        valeur: number;
        montant_minimum: number;
        limite_utilisation: number | null;
        nombre_utilisations: number;
        categories_ids: string[];
        produits_ids: string[];
        date_debut: string;
        date_fin: string | null;
        est_active: boolean;
        date_creation: string;
        date_modification: string;
      }>;
      utilisations_promotions: TableDefinition<{
        id: string;
        promotion_id: string;
        commande_id: string;
        date_creation: string;
      }>;
      inscriptions_newsletter: TableDefinition<{
        id: string;
        email: string;
        est_actif: boolean;
        date_creation: string;
      }>;
      parametres_boutique: TableDefinition<{
        cle: string;
        valeur: Json;
        description: string | null;
        date_modification: string;
      }>;
      journaux_activite_administration: TableDefinition<{
        id: string;
        utilisateur_id: string | null;
        action: string;
        table_cible: string | null;
        enregistrement_id: string | null;
        details: Json | null;
        date_creation: string;
      }>;
    };
    Views: { [_ in never]: never };
    Functions: {
      creer_commande: {
        Args: { p_payload: Json; p_cle_idempotence: string };
        Returns: Json;
      };
      suivre_commande: {
        Args: { p_jeton: string };
        Returns: Json;
      };
      suivre_commande_par_contact: {
        Args: { p_numero: string; p_telephone: string };
        Returns: Json;
      };
      confirmer_commande: {
        Args: { p_commande_id: string; p_commentaire?: string };
        Returns: Json;
      };
      changer_statut_commande: {
        Args: {
          p_commande_id: string;
          p_nouveau_statut: StatutCommande;
          p_commentaire?: string;
        };
        Returns: Json;
      };
      liberer_stock_commande: {
        Args: { p_commande_id: string; p_motif?: string };
        Returns: Json;
      };
      verifier_est_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      valider_promotion: {
        Args: { p_code: string; p_sous_total: number; p_lignes: Json };
        Returns: Json;
      };
      statistiques_tableau_de_bord: {
        Args: Record<string, never>;
        Returns: Json;
      };
      produits_meilleures_ventes: {
        Args: { p_limite?: number };
        Returns: { produit_id: string; total_vendu: number }[];
      };
    };
    Enums: {
      statut_commande: StatutCommande;
      statut_paiement: StatutPaiement;
      type_mouvement_stock: TypeMouvementStock;
      type_reduction: TypeReduction;
      role_utilisateur: RoleUtilisateur;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
