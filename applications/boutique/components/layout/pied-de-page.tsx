import Link from "next/link";
import { Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FormulaireNewsletter } from "@/components/layout/formulaire-newsletter";
import { siteConfig } from "@/lib/site";
import type { ParametresBoutique } from "@/services/parametres";
import type { CategorieAvecEnfants } from "@/types";

interface PiedDePageProps {
  categories: CategorieAvecEnfants[];
  parametres: ParametresBoutique;
}

export function PiedDePage({ categories, parametres }: PiedDePageProps) {
  const { identite, reseaux } = parametres;
  const annee = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-bordure bg-noir text-ivoire/85">
      <div className="container-luxe grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="[&_span]:text-ivoire">
            <Logo taille="sm" />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ivoire/70">
            {siteConfig.slogan}. Fragrances et cosmétiques sélectionnés avec soin,
            livrés partout au Maroc.
          </p>
          <div className="flex gap-2">
            {reseaux.instagram ? (
              <a
                href={reseaux.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ivoire/20 text-ivoire/80 transition-colors hover:border-or hover:text-or-clair"
              >
                <Instagram className="h-4 w-4" />
              </a>
            ) : null}
            {reseaux.facebook ? (
              <a
                href={reseaux.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ivoire/20 text-ivoire/80 transition-colors hover:border-or hover:text-or-clair"
              >
                <Facebook className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-serif text-base text-ivoire">Navigation</h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/boutique" className="hover:text-or-clair">
                Boutique
              </Link>
            </li>
            <li>
              <Link href="/nouveautes" className="hover:text-or-clair">
                Nouveautés
              </Link>
            </li>
            <li>
              <Link href="/meilleures-ventes" className="hover:text-or-clair">
                Meilleures ventes
              </Link>
            </li>
            <li>
              <Link href="/notre-histoire" className="hover:text-or-clair">
                Notre histoire
              </Link>
            </li>
            <li>
              <Link href="/suivi-commande" className="hover:text-or-clair">
                Suivre ma commande
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-or-clair">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-serif text-base text-ivoire">Catégories</h2>
          <ul className="space-y-2.5 text-sm">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <Link href={`/categories/${cat.slug}`} className="hover:text-or-clair">
                  {cat.nom}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          <div>
            <h2 className="mb-4 font-serif text-base text-ivoire">Contact</h2>
            <ul className="space-y-2.5 text-sm">
              {identite.telephone_contact ? (
                <li>
                  <a
                    href={`tel:${identite.telephone_contact}`}
                    className="inline-flex items-center gap-2 hover:text-or-clair"
                  >
                    <Phone className="h-4 w-4 text-or" />
                    {identite.telephone_contact}
                  </a>
                </li>
              ) : null}
              {identite.email_contact ? (
                <li>
                  <a
                    href={`mailto:${identite.email_contact}`}
                    className="inline-flex items-center gap-2 hover:text-or-clair"
                  >
                    <Mail className="h-4 w-4 text-or" />
                    {identite.email_contact}
                  </a>
                </li>
              ) : null}
              {identite.ville || identite.adresse ? (
                <li className="inline-flex items-start gap-2 text-ivoire/70">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-or" />
                  <span>{[identite.adresse, identite.ville, identite.pays].filter(Boolean).join(", ")}</span>
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-base text-ivoire">Newsletter</h2>
            <div className="[&_input]:bg-white/95 [&_input]:text-noir">
              <FormulaireNewsletter />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-ivoire/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-3 py-6 text-xs text-ivoire/60 sm:flex-row">
          <p>
            © {annee} {identite.nom_boutique}. Tous droits réservés.
          </p>
          <nav aria-label="Liens légaux" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/confidentialite" className="hover:text-or-clair">
              Confidentialité
            </Link>
            <Link href="/conditions-generales" className="hover:text-or-clair">
              Conditions générales
            </Link>
            <Link href="/livraison-retours" className="hover:text-or-clair">
              Livraison & retours
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
