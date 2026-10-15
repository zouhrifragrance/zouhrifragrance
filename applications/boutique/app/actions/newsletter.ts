"use server";

import { newsletterSchema } from "@/schemas/commande";
import { inscrireNewsletter } from "@/services/newsletter";

export interface EtatFormulaire {
  ok: boolean;
  message: string;
}

export async function actionInscriptionNewsletter(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const analyse = newsletterSchema.safeParse({ email: donnees.get("email") });
  if (!analyse.success) {
    return {
      ok: false,
      message: analyse.error.issues[0]?.message ?? "Adresse e-mail invalide.",
    };
  }
  try {
    return await inscrireNewsletter(analyse.data.email);
  } catch (erreur) {
    console.error("actionInscriptionNewsletter:", erreur);
    return { ok: false, message: "Une erreur est survenue. Veuillez réessayer." };
  }
}
