"use server";

import { randomUUID } from "crypto";
import { commandeSchema } from "@/schemas/commande";
import { creerCommande, type ConfirmationCommande } from "@/services/commandes";

export interface EtatCommande {
  ok: boolean;
  message: string;
  confirmation?: ConfirmationCommande;
  erreurs?: Record<string, string>;
}

function extraireArticles(brut: FormDataEntryValue | null): unknown {
  if (typeof brut !== "string") return [];
  try {
    return JSON.parse(brut);
  } catch {
    return [];
  }
}

export async function actionCreerCommande(
  _precedent: EtatCommande,
  donnees: FormData,
): Promise<EtatCommande> {
  const analyse = commandeSchema.safeParse({
    nom_client: donnees.get("nom_client"),
    telephone_client: donnees.get("telephone_client"),
    email_client: donnees.get("email_client") ?? "",
    ville_livraison: donnees.get("ville_livraison"),
    adresse_livraison: donnees.get("adresse_livraison"),
    complement_adresse: donnees.get("complement_adresse") ?? "",
    instructions_livraison: donnees.get("instructions_livraison") ?? "",
    code_promotion: donnees.get("code_promotion") ?? "",
    articles: extraireArticles(donnees.get("articles")),
    accepter_conditions: donnees.get("accepter_conditions") === "on",
  });

  if (!analyse.success) {
    const erreurs: Record<string, string> = {};
    for (const probleme of analyse.error.issues) {
      const champ = String(probleme.path[0] ?? "general");
      if (!erreurs[champ]) erreurs[champ] = probleme.message;
    }
    return {
      ok: false,
      message: analyse.error.issues[0]?.message ?? "Veuillez vérifier les informations saisies.",
      erreurs,
    };
  }

  const cleBrute = donnees.get("cle_idempotence");
  const cleIdempotence =
    typeof cleBrute === "string" && cleBrute.length >= 8 ? cleBrute.slice(0, 64) : randomUUID();

  try {
    const confirmation = await creerCommande(analyse.data, cleIdempotence);
    return {
      ok: true,
      message: "Votre commande a bien été enregistrée.",
      confirmation,
    };
  } catch (erreur) {
    console.error("actionCreerCommande:", erreur);
    return {
      ok: false,
      message:
        erreur instanceof Error
          ? erreur.message
          : "Une erreur est survenue lors de la commande. Veuillez réessayer.",
    };
  }
}
