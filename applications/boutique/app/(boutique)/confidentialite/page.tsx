import type { Metadata } from "next";
import { PageEditoriale } from "@/components/contenu/page-editoriale";
import { obtenirParametresBoutique } from "@/services/parametres";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment ZOUHRI FRAGRANCE collecte, utilise et protège vos données personnelles lors de vos commandes.",
  alternates: { canonical: "/confidentialite" },
};

export default async function PageConfidentialite() {
  const { identite } = await obtenirParametresBoutique();

  return (
    <PageEditoriale
      crumb="Confidentialité"
      surtitre="Informations légales"
      titre="Politique de confidentialité"
      chapeau={`La présente politique décrit la manière dont ${identite.nom_boutique} traite vos données personnelles. Nous nous engageons à les protéger et à les utiliser uniquement dans le cadre de nos services.`}
      sections={[
        {
          titre: "Données collectées",
          contenu: (
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Données de commande :</strong> nom, téléphone, adresse e-mail
                (facultative), adresse et ville de livraison.
              </li>
              <li>
                <strong>Données de suivi :</strong> contenu du panier et jeton de suivi associé à
                votre commande.
              </li>
              <li>
                <strong>Newsletter :</strong> adresse e-mail, uniquement si vous y avez consenti.
              </li>
            </ul>
          ),
        },
        {
          titre: "Finalités du traitement",
          contenu: (
            <p>
              Vos données servent exclusivement à traiter votre commande : nous contacter pour la
              confirmer, organiser la livraison et assurer le suivi. Elles ne sont jamais vendues
              ni cédées à des tiers à des fins commerciales.
            </p>
          ),
        },
        {
          titre: "Durée de conservation",
          contenu: (
            <p>
              Les données liées à une commande sont conservées le temps nécessaire à sa gestion et
              à nos obligations légales. Vous pouvez demander leur suppression à tout moment.
            </p>
          ),
        },
        {
          titre: "Sécurité",
          contenu: (
            <p>
              L&apos;accès aux données est restreint et protégé. Les jetons de suivi sont stockés
              sous forme chiffrée (empreinte), ce qui empêche toute exploitation directe en cas
              d&apos;accès non autorisé.
            </p>
          ),
        },
        {
          titre: "Vos droits",
          contenu: (
            <p>
              Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos
              données. Pour l&apos;exercer, contactez-nous
              {identite.email_contact ? ` à ${identite.email_contact}` : ""}
              {identite.telephone_contact ? ` ou au ${identite.telephone_contact}` : ""}.
            </p>
          ),
        },
      ]}
    />
  );
}
