import { exigerUtilisateurAdmin } from "@/lib/auth-admin";
import { compterCommandesEnAttente } from "@/services/admin";
import { CoquilleAdmin } from "@/components/admin/coquille-admin";

export default async function LayoutTableauDeBord({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ profil, email }, commandesEnAttente] = await Promise.all([
    exigerUtilisateurAdmin(),
    compterCommandesEnAttente(),
  ]);

  return (
    <CoquilleAdmin
      nomComplet={profil.nom_complet}
      email={email}
      role={profil.role}
      commandesEnAttente={commandesEnAttente}
    >
      {children}
    </CoquilleAdmin>
  );
}
