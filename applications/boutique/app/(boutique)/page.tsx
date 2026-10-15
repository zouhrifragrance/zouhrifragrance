import Link from "next/link";
import Image from "next/image";
import { ArrowRight, PackageCheck, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TitreSection } from "@/components/boutique/titre-section";
import { GrilleProduits } from "@/components/boutique/grille-produits";
import { ImageProduit } from "@/components/brand/image-produit";
import { construireArbre, listerCategories } from "@/services/categories";
import { listerNouveautes, listerMeilleuresVentes, listerProduitsMisEnAvant } from "@/services/produits";
import { obtenirParametresBoutique } from "@/services/parametres";
import { siteConfig } from "@/lib/site";
import { formatMontant } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PageAccueil() {
  const [categories, nouveautes, meilleuresVentes, misEnAvant, parametres] = await Promise.all([
    listerCategories(),
    listerNouveautes(8),
    listerMeilleuresVentes(4),
    listerProduitsMisEnAvant(1),
    obtenirParametresBoutique(),
  ]);

  const arbre = construireArbre(categories);
  const selection = misEnAvant[0] ?? nouveautes[0] ?? null;
  const { livraison } = parametres;

  return (
    <div className="pb-4">
      {/* Hero */}
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
        <div className="container-luxe relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-or/40 bg-noir/40 px-4 py-1.5 text-xs uppercase tracking-luxe text-or-clair">
              <Sparkles className="h-3.5 w-3.5" />
              {parametres.identite.slogan}
            </span>
            <h1 className="font-serif text-4xl leading-tight text-ivoire sm:text-5xl lg:text-6xl">
              L&apos;élégance d&apos;une fragrance,
              <br className="hidden sm:block" /> à la marocaine
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-ivoire/75 sm:text-base lg:mx-0">
              Découvrez notre sélection de parfums et de cosmétiques soigneusement
              choisis. Commandez simplement, sans créer de compte.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg">
                <Link href="/boutique">
                  Explorer la boutique
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-ivoire/40 text-ivoire hover:bg-ivoire/10 hover:text-ivoire">
                <Link href="/nouveautes">Voir les nouveautés</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-or/25 bg-noir-doux">
              <ImageProduit
                src="/images/categorie-provisoire.svg"
                alt="Univers ZOUHRI FRAGRANCE (visuel provisoire)"
                sizes="(max-width: 1024px) 80vw, 40vw"
                priority
              />
            </div>
            <div className="absolute -bottom-5 -left-2 rounded-xl border border-bordure bg-white p-4 shadow-luxe sm:left-6">
              <p className="text-xs uppercase tracking-widest text-gris">À partir de</p>
              <p className="font-serif text-xl text-noir">220 {siteConfig.devise}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="border-b border-bordure bg-white">
        <div className="container-luxe grid gap-4 py-8 sm:grid-cols-3">
          {[
            { icon: PackageCheck, titre: "Commande sans compte", texte: "Commandez en quelques étapes, sans inscription." },
            { icon: Truck, titre: "Livraison au Maroc", texte: `Frais ${formatMontant(livraison.frais_livraison)} · offerte dès ${formatMontant(livraison.seuil_livraison_gratuite)}.` },
            { icon: Sparkles, titre: "Confirmation par notre équipe", texte: "Aucun paiement en ligne. Nous vous contactons pour confirmer." },
          ].map((item) => (
            <div key={item.titre} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ivoire">
                <item.icon className="h-5 w-5 text-or" />
              </span>
              <div>
                <p className="font-medium text-noir">{item.titre}</p>
                <p className="text-sm text-gris">{item.texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Présentation */}
      <section className="container-luxe py-14 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">La maison</p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl">
            Des fragrances pensées pour chaque moment
          </h2>
          <span className="mx-auto mt-4 block h-px w-16 bg-or" />
          <p className="mt-4 text-sm leading-relaxed text-gris sm:text-base">
            {siteConfig.nom} sélectionne des parfums et des soins d&apos;inspiration
            marocaine, alliant tradition et modernité. Notre objectif : vous offrir des
            produits de qualité, une expérience d&apos;achat simple et un service
            attentionné, partout au Maroc.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/notre-histoire">Découvrir notre histoire</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Catégories */}
      {arbre.length > 0 ? (
        <section className="container-luxe py-6 sm:py-10">
          <TitreSection
            eyebrow="Explorer"
            titre="Nos catégories"
            description="Parcourez nos univers, des parfums aux coffrets cadeaux."
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {arbre
              .flatMap((cat) => [cat, ...cat.enfants])
              .slice(0, 8)
              .map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-xl border border-bordure bg-noir"
                >
                  <ImageProduit
                    src={cat.image_url ?? "/images/categorie-provisoire.svg"}
                    alt={cat.nom}
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="absolute inset-0 opacity-70 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-noir/85 to-transparent" />
                  <div className="relative p-4">
                    <h3 className="font-serif text-lg text-ivoire">{cat.nom}</h3>
                    <span className="text-xs text-or-clair">Découvrir →</span>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      {/* Nouveautés */}
      {nouveautes.length > 0 ? (
        <section className="container-luxe py-10 sm:py-14">
          <TitreSection
            eyebrow="Arrivages"
            titre="Nouveautés"
            alignement="gauche"
            action={
              <Button asChild variant="ghost">
                <Link href="/nouveautes">
                  Tout voir <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <GrilleProduits produits={nouveautes.slice(0, 8)} />
        </section>
      ) : null}

      {/* Sélection */}
      {selection ? (
        <section className="border-y border-bordure bg-white">
          <div className="container-luxe grid items-center gap-8 py-12 lg:grid-cols-2 lg:py-16">
            <div className="relative aspect-[4/5] max-w-md overflow-hidden rounded-2xl border border-bordure bg-ivoire">
              <ImageProduit
                src={selection.images_produits?.find((i) => i.est_principale)?.url ?? selection.images_produits?.[0]?.url}
                alt={selection.nom}
                sizes="(max-width: 1024px) 80vw, 40vw"
              />
            </div>
            <div className="space-y-4">
              <Badge variant="default">Sélection de la maison</Badge>
              <h2 className="font-serif text-3xl">{selection.nom}</h2>
              <p className="text-sm leading-relaxed text-gris sm:text-base">
                {selection.description_courte ?? selection.description}
              </p>
              <p className="font-serif text-2xl">
                {formatMontant(
                  selection.prix_promotionnel ?? selection.prix_vente,
                  selection.devise,
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={`/produits/${selection.slug}`}>Voir le produit</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/boutique">Toute la boutique</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Meilleures ventes */}
      {meilleuresVentes.length > 0 ? (
        <section className="container-luxe py-10 sm:py-14">
          <TitreSection
            eyebrow="Les préférées"
            titre="Meilleures ventes"
            alignement="gauche"
            action={
              <Button asChild variant="ghost">
                <Link href="/meilleures-ventes">
                  Tout voir <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <GrilleProduits produits={meilleuresVentes} />
        </section>
      ) : null}

      {/* Éditorial */}
      <section className="bg-noir text-ivoire">
        <div className="container-luxe grid gap-8 py-14 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-luxe text-or-clair">L&apos;univers ZOUHRI</p>
            <h2 className="font-serif text-3xl text-ivoire">
              Le parfum, une signature intemporelle
            </h2>
            <p className="text-sm leading-relaxed text-ivoire/75 sm:text-base">
              Chaque fragrance raconte une histoire : un souvenir, une émotion, une
              occasion. Nous vous accompagnons pour trouver le sillage qui vous
              ressemble, pour vous ou pour offrir.
            </p>
            <Button asChild variant="outline" className="border-ivoire/40 text-ivoire hover:bg-ivoire/10 hover:text-ivoire">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-or/20">
              <ImageProduit src="/images/produit-provisoire.svg" alt="Visuel provisoire" sizes="40vw" />
            </div>
            <div className="relative mt-6 aspect-square overflow-hidden rounded-xl border border-or/20">
              <ImageProduit src="/images/produit-provisoire.svg" alt="Visuel provisoire" sizes="40vw" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
