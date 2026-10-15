import { Entete } from "@/components/layout/entete";
import { BandeauAnnonce } from "@/components/layout/bandeau-annonce";
import { PiedDePage } from "@/components/layout/pied-de-page";
import { TiroirPanier } from "@/components/layout/tiroir-panier";
import { InitialiserPanier } from "@/components/layout/initialiser-panier";
import { listerCategories, construireArbre } from "@/services/categories";
import { obtenirParametresBoutique } from "@/services/parametres";
import { siteConfig } from "@/lib/site";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LayoutBoutique({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, parametres] = await Promise.all([
    listerCategories(),
    obtenirParametresBoutique(),
  ]);
  const arbre = construireArbre(categories);

  const donneesStructurees = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${env.siteUrl}/#organisation`,
        name: parametres.identite.nom_boutique,
        url: env.siteUrl,
        logo: `${env.siteUrl}${siteConfig.logo}`,
        slogan: parametres.identite.slogan,
        areaServed: parametres.identite.pays,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "service client",
          areaServed: "MA",
          availableLanguage: ["fr", "ar"],
          ...(parametres.identite.telephone_contact
            ? { telephone: parametres.identite.telephone_contact }
            : {}),
          ...(parametres.identite.email_contact
            ? { email: parametres.identite.email_contact }
            : {}),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${env.siteUrl}/#site`,
        url: env.siteUrl,
        name: parametres.identite.nom_boutique,
        inLanguage: "fr",
        publisher: { "@id": `${env.siteUrl}/#organisation` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${env.siteUrl}/boutique?recherche={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <BandeauAnnonce banniere={parametres.banniere} />
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-noir focus:px-4 focus:py-2 focus:text-ivoire"
      >
        Aller au contenu principal
      </a>
      <Entete
        categories={arbre}
        nomBoutique={parametres.identite.nom_boutique}
        telephone={parametres.identite.telephone_contact || null}
      />
      <main id="contenu-principal" className="flex-1">
        {children}
      </main>
      <PiedDePage categories={arbre} parametres={parametres} />
      <TiroirPanier />
      <InitialiserPanier
        frais={parametres.livraison.frais_livraison}
        seuilGratuit={parametres.livraison.seuil_livraison_gratuite}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />
    </div>
  );
}
