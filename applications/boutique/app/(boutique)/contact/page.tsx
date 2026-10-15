import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { FormulaireContact } from "@/components/contact/formulaire-contact";
import { obtenirParametresBoutique } from "@/services/parametres";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez ZOUHRI FRAGRANCE : téléphone, e-mail, WhatsApp et adresse. Notre équipe vous répond pour toute question sur votre commande.",
  alternates: { canonical: "/contact" },
};

export default async function PageContact() {
  const { identite } = await obtenirParametresBoutique();
  const whatsappHref = identite.whatsapp_numero
    ? `https://wa.me/${identite.whatsapp_numero.replace(/[^0-9]/g, "")}`
    : "";

  const coordonnees = [
    identite.telephone_contact && {
      icon: Phone,
      label: "Téléphone",
      valeur: identite.telephone_contact,
      href: `tel:${identite.telephone_contact}`,
    },
    identite.whatsapp_numero && {
      icon: MessageCircle,
      label: "WhatsApp",
      valeur: identite.whatsapp_numero,
      href: whatsappHref,
    },
    identite.email_contact && {
      icon: Mail,
      label: "E-mail",
      valeur: identite.email_contact,
      href: `mailto:${identite.email_contact}`,
    },
    (identite.adresse || identite.ville) && {
      icon: MapPin,
      label: "Adresse",
      valeur: [identite.adresse, identite.ville, identite.pays].filter(Boolean).join(", "),
      href: "",
    },
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    valeur: string;
    href: string;
  }[];

  return (
    <div className="container-luxe py-8 sm:py-10">
      <FilAriane elements={[{ libelle: "Accueil", href: "/" }, { libelle: "Contact" }]} />
      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">Service client</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Nous contacter</h1>
        <p className="mt-3 text-sm leading-relaxed text-gris sm:text-base">
          Une question sur un produit, une commande ou une livraison ? Écrivez-nous, notre équipe
          vous répond avec attention.
        </p>
        <span className="mt-5 block h-px w-16 bg-or" />
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="rounded-xl border border-bordure bg-white p-5 sm:p-6">
          <h2 className="font-serif text-xl">Envoyez-nous un message</h2>
          <p className="mt-1 text-sm text-gris">
            Remplissez le formulaire : votre message sera préparé pour un envoi immédiat.
          </p>
          <div className="mt-5">
            <FormulaireContact
              whatsappNumero={identite.whatsapp_numero}
              emailContact={identite.email_contact}
            />
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-bordure bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl">Nos coordonnées</h2>
            {coordonnees.length > 0 ? (
              <ul className="mt-4 space-y-4 text-sm">
                {coordonnees.map((coordonnee) => (
                  <li key={coordonnee.label} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ivoire">
                      <coordonnee.icon className="h-4 w-4 text-or" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gris">
                        {coordonnee.label}
                      </p>
                      {coordonnee.href ? (
                        <a
                          href={coordonnee.href}
                          target={coordonnee.href.startsWith("http") ? "_blank" : undefined}
                          rel={coordonnee.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-noir hover:text-or-fonce"
                        >
                          {coordonnee.valeur}
                        </a>
                      ) : (
                        <p className="text-noir">{coordonnee.valeur}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gris">
                Nos coordonnées seront bientôt disponibles ici. Merci de votre patience.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-bordure bg-ivoire/60 p-5 text-sm sm:p-6">
            <h2 className="flex items-center gap-2 font-serif text-lg">
              <Clock className="h-4 w-4 text-or" />
              Horaires
            </h2>
            <p className="mt-2 text-gris">
              Du lundi au samedi, de 9h à 19h. Nous traitons les commandes et messages dans les
              meilleurs délais.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
