import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Sparkles, HeartHandshake } from "lucide-react";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { Button } from "@/components/ui/button";
import { ImageProduit } from "@/components/brand/image-produit";
import { obtenirParametresBoutique } from "@/services/parametres";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notre histoire",
  description:
    "Découvrez l'histoire de ZOUHRI FRAGRANCE, maison marocaine de parfums et de cosmétiques : notre démarche, nos valeurs et notre sélection.",
  alternates: { canonical: "/notre-histoire" },
};

const valeurs = [
  {
    icon: Sparkles,
    titre: "Une sélection exigeante",
    texte:
      "Chaque fragrance et chaque soin sont choisis pour leur tenue, leur qualité et leur caractère. Nous privilégions des compositions soignées.",
  },
  {
    icon: Leaf,
    titre: "Inspiration marocaine",
    texte:
      "Nos univers s'inspirent des matières et des traditions du Maroc : oud, rose, ambre, argan et notes solaires.",
  },
  {
    icon: HeartHandshake,
    titre: "Un service attentionné",
    texte:
      "Commande sans compte, confirmation par notre équipe et accompagnement personnalisé, partout au Maroc.",
  },
];

export default async function PageNotreHistoire() {
  const parametres = await obtenirParametresBoutique();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-bordure bg-noir text-ivoire">
        <div className="absolute inset-0 opacity-[0.12]">
          <Image
            src="/images/categorie-provisoire.svg"
            alt=""
            fill
            className="object-cover"
            aria-hidden="true"
          />
        </div>
        <div className="container-luxe relative py-14 sm:py-20">
          <FilAriane
            elements={[{ libelle: "Accueil", href: "/" }, { libelle: "Notre histoire" }]}
          />
          <p className="mt-6 text-xs uppercase tracking-luxe text-or-clair">La maison</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-ivoire sm:text-5xl">
            {siteConfig.slogan}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ivoire/75 sm:text-base">
            {parametres.identite.nom_boutique} est née d&apos;une conviction : le parfum est une
            signature, un souvenir que l&apos;on porte. Nous réunissons des fragrances et des soins
            d&apos;inspiration marocaine, pensés pour chaque moment et chaque personnalité.
          </p>
        </div>
      </section>

      <section className="container-luxe grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-bordure bg-ivoire">
          <ImageProduit
            src="/images/produit-provisoire.svg"
            alt="Univers ZOUHRI FRAGRANCE (visuel provisoire)"
            sizes="(max-width: 1024px) 90vw, 45vw"
          />
        </div>
        <div className="space-y-5">
          <p className="eyebrow">Notre démarche</p>
          <h2 className="font-serif text-3xl">Le luxe accessible, à la marocaine</h2>
          <span className="block h-px w-16 bg-or" />
          <div className="space-y-3 text-sm leading-relaxed text-noir/85 sm:text-base">
            <p>
              Nous parcourons les compositions pour ne garder que celles qui racontent quelque
              chose : un oud profond, une rose délicate, un ambre enveloppant. Notre objectif est
              simple : vous proposer des parfums et des cosmétiques de qualité, à des prix justes.
            </p>
            <p>
              Parce que commander doit rester simple, notre boutique ne demande ni compte ni
              paiement en ligne. Vous choisissez vos produits, nous vous contactons pour confirmer
              et livrer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link href="/boutique">Découvrir la boutique</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-bordure bg-white">
        <div className="container-luxe py-14">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Nos valeurs</p>
            <h2 className="mt-2 font-serif text-3xl">Ce qui nous guide</h2>
            <span className="mx-auto mt-4 block h-px w-16 bg-or" />
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {valeurs.map((valeur) => (
              <div key={valeur.titre} className="rounded-xl border border-bordure bg-ivoire/50 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                  <valeur.icon className="h-6 w-6 text-or" />
                </span>
                <h3 className="mt-4 font-serif text-xl">{valeur.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gris">{valeur.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
