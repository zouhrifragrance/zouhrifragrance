import { redirect } from "next/navigation";
import { recupererUtilisateur } from "@/lib/supabase/server";
import type { ProfilUtilisateur, RoleUtilisateur } from "@/types";

export interface ContexteAdmin {
  utilisateurId: string;
  email: string | null;
  profil: ProfilUtilisateur;
  role: RoleUtilisateur;
}

const HIERARCHIE: Record<RoleUtilisateur, number> = {
  LECTEUR: 1,
  GESTIONNAIRE: 2,
  ADMIN: 3,
};

/**
 * Verifie que l'utilisateur connecte dispose d'un profil actif avec un role.
 * Redirige vers la page de connexion sinon.
 */
export async function exigerUtilisateurAdmin(): Promise<ContexteAdmin> {
  const { utilisateur, profil } = await recupererUtilisateur();

  if (!utilisateur) {
    redirect("/admin/connexion");
  }
  if (!profil || !profil.est_actif) {
    redirect("/admin/connexion?acces=refuse");
  }

  return {
    utilisateurId: utilisateur.id,
    email: utilisateur.email ?? null,
    profil,
    role: profil.role,
  };
}

/**
 * Verifie que l'utilisateur dispose au minimum du role demande.
 */
export async function exigerNiveau(roleMinimum: RoleUtilisateur): Promise<ContexteAdmin> {
  const contexte = await exigerUtilisateurAdmin();
  const niveau = HIERARCHIE[contexte.role] ?? 0;
  const niveauMinimum = HIERARCHIE[roleMinimum] ?? 0;
  if (niveau < niveauMinimum) {
    redirect("/admin?acces=insuffisant");
  }
  return contexte;
}

export function peutGerer(role: RoleUtilisateur): boolean {
  return (HIERARCHIE[role] ?? 0) >= (HIERARCHIE.GESTIONNAIRE ?? 0);
}
