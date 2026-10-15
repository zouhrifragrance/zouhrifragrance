import type { Metadata } from "next";
import { PageEditoriale } from "@/components/contenu/page-editoriale";
import { obtenirParametresBoutique } from "@/services/parametres";
import { formatMontant } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Livraison & retours",
  description:
    "Délais et zones de livraison, frais, confirmation par téléphone et conditions de retour des commandes ZOUHRI FRAGRANCE.",
  alternates: { canonical: "/livraison-retours" },
};

export default async function PageLivraisonRetours() {
  const parametres = await obtenirParametresBoutique();
  const { livraison, identite } = parametres;

  return (
    <PageEditoriale
      crumb="Livraison & retours"
      surtitre="Service client"
      titre="Livraison & retours"
      chapeau="Tout ce qu'il faut savoir sur la réception de votre commande et les retours."
      sections={[
        {
          titre: "Zones et délais",
          contenu: (
            <p>
              Nous livrons partout au Maroc. Les délais habituels sont de 24 à 72 heures selon la
              ville. Après validation de votre commande, notre équipe vous contacte au numéro
              indiqué pour confirmer la date de livraison.
            </p>
          ),
        },
        {
          titre: "Frais de livraison",
          contenu: (
            <p>
              Les frais de livraison sont de {formatMontant(livraison.frais_livraison)}. La
              livraison est offerte dès {formatMontant(livraison.seuil_livraison_gratuite)}
              d&apos;achat.
            </p>
          ),
        },
        {
          titre: "Réception du colis",
          contenu: (
            <p>
              Vérifiez l&apos;état de votre colis à la réception. En cas de produit endommagé ou
              d&apos;erreur, signalez-le immédiatement au livreur et contactez-nous dans les plus
              brefs délais.
            </p>
          ),
        },
        {
          titre: "Retours et échanges",
          contenu: (
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Un produit non ouvert, dans son emballage d&apos;origine, peut faire l&apos;objet
                d&apos;un échange dans un délai de 7 jours après réception.
              </li>
              <li>
                Pour des raisons d&apos;hygiène, les produits ouverts, utilisés ou descellés ne sont
                pas repris, sauf défaut de fabrication.
              </li>
              <li>
                Les frais de retour peuvent être à la charge du client, sauf en cas
                d&apos;erreur ou de défaut de notre part.
              </li>
            </ul>
          ),
        },
        {
          titre: "Nous contacter",
          contenu: (
            <p>
              Pour toute question relative à une livraison ou un retour, contactez notre service
              client
              {identite.telephone_contact ? ` au ${identite.telephone_contact}` : ""}
              {identite.email_contact ? ` ou par e-mail à ${identite.email_contact}` : ""}.
            </p>
          ),
        },
      ]}
    />
  );
}
