import type { Metadata } from "next";
import { PageEditoriale } from "@/components/contenu/page-editoriale";
import { obtenirParametresBoutique } from "@/services/parametres";
import { siteConfig } from "@/lib/site";
import { formatMontant } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description:
    "Conditions générales de vente de ZOUHRI FRAGRANCE : commande, prix, livraison, confirmation et droit de retour.",
  alternates: { canonical: "/conditions-generales" },
};

export default async function PageConditionsGenerales() {
  const parametres = await obtenirParametresBoutique();
  const { identite, livraison } = parametres;

  return (
    <PageEditoriale
      crumb="Conditions générales"
      surtitre="Informations légales"
      titre="Conditions générales de vente"
      chapeau={`Les présentes conditions régissent les ventes réalisées sur la boutique en ligne ${identite.nom_boutique}. Toute commande implique leur acceptation sans réserve.`}
      sections={[
        {
          titre: "Commande",
          contenu: (
            <p>
              La commande s&apos;effectue sans création de compte. Le client renseigne ses
              coordonnées de livraison et valide son panier. Aucun paiement en ligne n&apos;est
              demandé : la commande est confirmée par notre équipe qui contacte le client pour en
              convenir les modalités (montant final, livraison, règlement).
            </p>
          ),
        },
        {
          titre: "Prix",
          contenu: (
            <p>
              Les prix sont indiqués en {siteConfig.devise}. Le montant affiché au moment de la
              commande est estimatif ; le montant définitif, réductions éventuelles incluses, est
              confirmé par notre équipe avant livraison.
            </p>
          ),
        },
        {
          titre: "Livraison",
          contenu: (
            <p>
              Les frais de livraison s&apos;élèvent à {formatMontant(livraison.frais_livraison)} et
              sont offerts à partir de{" "}
              {formatMontant(livraison.seuil_livraison_gratuite)} d&apos;achat. La livraison est
              assurée partout au Maroc, dans les délais communiqués lors de la confirmation.
            </p>
          ),
        },
        {
          titre: "Confirmation et disponibilité",
          contenu: (
            <p>
              Toute commande reste soumise à la disponibilité des articles. En cas d&apos;article
              indisponible, notre équipe en informe le client afin de trouver une solution
              (substitution, report ou annulation partielle).
            </p>
          ),
        },
        {
          titre: "Retours",
          contenu: (
            <p>
              Les conditions de retour et d&apos;échange sont détaillées sur la page{" "}
              <strong>Livraison &amp; retours</strong>. Pour des raisons d&apos;hygiène, les
              produits ouverts ou utilisés ne peuvent être repris.
            </p>
          ),
        },
        {
          titre: "Droit applicable",
          contenu: (
            <p>
              Les présentes conditions sont soumises au droit marocain. Tout litige sera recherché
              en priorité par une solution amiable.
            </p>
          ),
        },
      ]}
    />
  );
}
