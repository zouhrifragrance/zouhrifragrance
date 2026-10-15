"use server";

import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";

export interface EtatAuthAdmin {
  erreur?: string;
}

/**
 * Authentifie un administrateur via Supabase Auth puis verifie son profil.
 */
export async function actionConnexion(
  _precedent: EtatAuthAdmin,
  formData: FormData,
): Promise<EtatAuthAdmin> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const redirectionBrute = String(formData.get("redirection") ?? "/admin");
  const redirection = redirectionBrute.startsWith("/admin") ? redirectionBrute : "/admin";

  if (!email || !motDePasse) {
    return { erreur: "Renseignez votre adresse e-mail et votre mot de passe." };
  }

  const supabase = await creerClientServeur();
  if (!supabase) {
    return {
      erreur:
        "Administration indisponible : la connexion à Supabase n'est pas configurée sur ce serveur.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error || !data.user) {
    return { erreur: "Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe." };
  }

  const { data: profil } = await supabase
    .from("profils_utilisateurs")
    .select("role, est_actif")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profil || !profil.est_actif) {
    await supabase.auth.signOut();
    return { erreur: "Ce compte n'a pas accès à l'administration." };
  }

  redirect(redirection);
}

/**
 * Met fin à la session d'administration.
 */
export async function actionDeconnexion(): Promise<void> {
  const supabase = await creerClientServeur();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/admin/connexion");
}
