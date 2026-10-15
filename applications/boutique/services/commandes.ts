import { randomBytes, createHash } from "crypto";
import { creerClientServeur } from "@/lib/supabase/server";
import { donneesDemoActives } from "./categories";
import type { Commande, CommandeComplete } from "@/types";
import type { DonneesCommandeValidees } from "@/schemas";
import { formatMontant, normaliserTelephone } from "@/lib/utils";

export interface ConfirmationCommande {
  id: string;
  numero_commande: string;
  statut_commande: string;
  sous_total: number;
  montant_reduction: number;
  frais_livraison: number;
  montant_total: number;
  devise: string;
  date_creation: string;
  deja_existante: boolean;
  jeton_suivi: string | null;
}

export interface ResultatSuivi {
  trouve: boolean;
  message?: string;
  numero_commande?: string;
  statut_commande?: string;
  date_creation?: string;
  montant_total?: number;
  devise?: string;
  historique?: { statut: string; date: string }[];
}

type StoreDemo = Map<string, { commande: Commande & { lignes: unknown[] }; jeton: string }>;

function storeDemo(): StoreDemo {
  const global = globalThis as unknown as { __zouhri_orders?: StoreDemo };
  if (!global.__zouhri_orders) global.__zouhri_orders = new Map();
  return global.__zouhri_orders;
}

export async function creerCommande(
  donnees: DonneesCommandeValidees,
  cleIdempotence: string,
): Promise<ConfirmationCommande> {
  const payload = {
    nom_client: donnees.nom_client,
    telephone_client: normaliserTelephone(donnees.telephone_client) ?? donnees.telephone_client,
    email_client: donnees.email_client,
    ville_livraison: donnees.ville_livraison,
    adresse_livraison: donnees.adresse_livraison,
    complement_adresse: donnees.complement_adresse,
    instructions_livraison: donnees.instructions_livraison,
    code_promotion: donnees.code_promotion,
    articles: donnees.articles.map((a) => ({
      produit_id: a.produitId,
      variante_id: a.varianteId ?? null,
      quantite: a.quantite,
    })),
  };

  if (donneesDemoActives()) {
    return creerCommandeDemo(payload, cleIdempotence);
  }

  const supabase = await creerClientServeur();
  if (!supabase) {
    throw new Error("Service de commande indisponible : Supabase n'est pas configuré.");
  }

  const { data, error } = await supabase.rpc("creer_commande", {
    p_payload: payload,
    p_cle_idempotence: cleIdempotence,
  });

  if (error) {
    console.error("creer_commande (RPC):", error.code, error.message);
    const message = error.message ?? "Erreur lors de la création de la commande.";
    throw new Error(extraireMessageLisible(message));
  }

  return data as unknown as ConfirmationCommande;
}

export async function suivreCommande(jeton: string): Promise<ResultatSuivi> {
  if (donneesDemoActives()) {
    for (const [, valeur] of storeDemo()) {
      if (valeur.jeton === jeton) {
        return {
          trouve: true,
          numero_commande: valeur.commande.numero_commande,
          statut_commande: valeur.commande.statut_commande,
          date_creation: valeur.commande.date_creation,
          montant_total: valeur.commande.montant_total,
          devise: valeur.commande.devise,
          historique: [
            { statut: "EN_ATTENTE_CONFIRMATION", date: valeur.commande.date_creation },
          ],
        };
      }
    }
    return { trouve: false, message: "Aucune commande trouvée pour ce lien de suivi." };
  }

  const supabase = await creerClientServeur();
  if (!supabase) return { trouve: false, message: "Service indisponible." };

  const { data, error } = await supabase.rpc("suivre_commande", { p_jeton: jeton });
  if (error || !data) {
    return { trouve: false, message: "Service de suivi indisponible." };
  }
  return data as unknown as ResultatSuivi;
}

/**
 * Suivi de secours lorsque le client a perdu son lien : il fournit le numero
 * de commande et le telephone utilise lors de la commande.
 */
export async function suivreCommandeParContact(
  numero: string,
  telephone: string,
): Promise<ResultatSuivi> {
  if (donneesDemoActives()) {
    const digits = telephone.replace(/[^0-9]/g, "");
    for (const [, valeur] of storeDemo()) {
      if (
        valeur.commande.numero_commande.toUpperCase() === numero.trim().toUpperCase() &&
        valeur.commande.telephone_client.replace(/[^0-9]/g, "") === digits
      ) {
        return {
          trouve: true,
          numero_commande: valeur.commande.numero_commande,
          statut_commande: valeur.commande.statut_commande,
          date_creation: valeur.commande.date_creation,
          montant_total: valeur.commande.montant_total,
          devise: valeur.commande.devise,
          historique: [
            { statut: "EN_ATTENTE_CONFIRMATION", date: valeur.commande.date_creation },
          ],
        };
      }
    }
    return {
      trouve: false,
      message: "Aucune commande ne correspond à ce numéro et ce téléphone.",
    };
  }

  const supabase = await creerClientServeur();
  if (!supabase) return { trouve: false, message: "Service indisponible." };

  const { data, error } = await supabase.rpc("suivre_commande_par_contact", {
    p_numero: numero,
    p_telephone: telephone,
  });
  if (error || !data) {
    return { trouve: false, message: "Service de suivi indisponible." };
  }
  return data as unknown as ResultatSuivi;
}

/** Recuperation d'une commande complete par identifiant (administration). */
export async function obtenirCommandeParId(id: string) {
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("commandes")
    .select("*, lignes_commande(*), historique_statuts_commande(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("obtenirCommandeParId:", error.message);
    return null;
  }
  return data as unknown as CommandeComplete;
}

function extraireMessageLisible(messageBrut: string): string {
  const correspondance = messageBrut.match(/message:\s*(.+)$/i);
  if (correspondance?.[1]) return correspondance[1].trim();
  if (messageBrut.includes("Stock insuffisant")) return messageBrut;
  if (messageBrut.includes("panier est vide")) return "Votre panier est vide.";
  if (messageBrut.includes("Quantité invalide")) return "Une quantité est invalide.";
  return "Une erreur est survenue lors de la commande. Veuillez réessayer.";
}

/** Chemin de secours en mode demonstration (developpement uniquement). */
function creerCommandeDemo(
  payload: {
    nom_client: string;
    telephone_client: string;
    email_client: string | null;
    ville_livraison: string;
    adresse_livraison: string;
    complement_adresse: string | null;
    instructions_livraison: string | null;
    code_promotion: string | null;
    articles: { produit_id: string; variante_id: string | null; quantite: number }[];
  },
  cleIdempotence: string,
): ConfirmationCommande {
  const store = storeDemo();
  const existante = store.get(cleIdempotence);
  if (existante) {
    return {
      id: existante.commande.id,
      numero_commande: existante.commande.numero_commande,
      statut_commande: existante.commande.statut_commande,
      sous_total: existante.commande.sous_total,
      montant_reduction: existante.commande.montant_reduction,
      frais_livraison: existante.commande.frais_livraison,
      montant_total: existante.commande.montant_total,
      devise: existante.commande.devise,
      date_creation: existante.commande.date_creation,
      deja_existante: true,
      jeton_suivi: null,
    };
  }

  const sousTotal = 100;
  const jeton = randomBytes(32).toString("hex");
  const commande: Commande & { lignes: unknown[] } = {
    id: randomBytes(16).toString("hex"),
    numero_commande: `ZF-DEMO-${Date.now()}`,
    nom_client: payload.nom_client,
    telephone_client: payload.telephone_client,
    email_client: payload.email_client,
    ville_livraison: payload.ville_livraison,
    adresse_livraison: payload.adresse_livraison,
    complement_adresse: payload.complement_adresse,
    instructions_livraison: payload.instructions_livraison,
    statut_commande: "EN_ATTENTE_CONFIRMATION",
    statut_paiement: "NON_PAYE",
    sous_total: sousTotal,
    montant_reduction: 0,
    frais_livraison: sousTotal >= 500 ? 0 : 30,
    montant_total: sousTotal + (sousTotal >= 500 ? 0 : 30),
    devise: "MAD",
    cle_idempotence: cleIdempotence,
    code_promotion: payload.code_promotion,
    date_creation: new Date().toISOString(),
    date_modification: new Date().toISOString(),
    lignes: payload.articles,
  } as unknown as Commande & { lignes: unknown[] };

  store.set(cleIdempotence, { commande, jeton });
  createHash("sha256").update(jeton).digest("hex");

  return {
    id: commande.id,
    numero_commande: commande.numero_commande,
    statut_commande: commande.statut_commande,
    sous_total: commande.sous_total,
    montant_reduction: commande.montant_reduction,
    frais_livraison: commande.frais_livraison,
    montant_total: commande.montant_total,
    devise: commande.devise,
    date_creation: commande.date_creation,
    deja_existante: false,
    jeton_suivi: jeton,
  };
}

export function messageConfirmationCourt(confirmation: ConfirmationCommande): string {
  return `Commande ${confirmation.numero_commande} — ${formatMontant(
    confirmation.montant_total,
    confirmation.devise,
  )}`;
}
