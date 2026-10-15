import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, PackageSearch, Phone, Search, Ticket } from "lucide-react";
import { FilAriane } from "@/components/boutique/fil-ariane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { suivreCommande, suivreCommandeParContact, type ResultatSuivi } from "@/services/commandes";
import { formatDateHeure, formatMontant } from "@/lib/utils";
import {
  LIBELLES_STATUT_COMMANDE,
  type StatutCommande,
} from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi de commande",
  description:
    "Suivez l'avancement de votre commande ZOUHRI FRAGRANCE avec votre lien de suivi, ou retrouvez-la avec votre numéro de commande et votre téléphone.",
  robots: { index: false, follow: true },
};

function nomStatut(code: string | undefined): string {
  if (!code) return "Statut inconnu";
  return LIBELLES_STATUT_COMMANDE[code as StatutCommande] ?? code;
}

export default async function PageSuivi({
  searchParams,
}: {
  searchParams: Promise<{ jeton?: string; numero?: string; telephone?: string }>;
}) {
  const { jeton, numero, telephone } = await searchParams;
  const jetonPropre = jeton?.trim() ?? "";
  const numeroPropre = numero?.trim() ?? "";
  const telephonePropre = telephone?.trim() ?? "";

  let resultat: ResultatSuivi | null = null;
  if (jetonPropre) {
    resultat = await suivreCommande(jetonPropre);
  } else if (numeroPropre || telephonePropre) {
    resultat =
      numeroPropre && telephonePropre
        ? await suivreCommandeParContact(numeroPropre, telephonePropre)
        : {
            trouve: false,
            message: "Veuillez renseigner à la fois le numéro de commande et le téléphone.",
          };
  }

  return (
    <div className="container-luxe py-8 sm:py-10">
      <FilAriane
        elements={[{ libelle: "Accueil", href: "/" }, { libelle: "Suivi de commande" }]}
      />
      <div className="mt-6 max-w-2xl">
        <h1 className="font-serif text-3xl sm:text-4xl">Suivi de commande</h1>
        <p className="mt-2 text-sm text-gris">
          Vous avez perdu votre lien de suivi ? Retrouvez votre commande avec votre numéro et
          le téléphone utilisé lors de la commande.
        </p>

        <div className="mt-6 rounded-xl border border-bordure bg-white p-5 sm:p-6">
          <h2 className="font-serif text-lg">Retrouver ma commande</h2>
          <form
            action="/suivi-commande"
            method="get"
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="numero">Numéro de commande</Label>
              <Input
                id="numero"
                name="numero"
                defaultValue={numeroPropre}
                placeholder="ZF-20260101-AB12CD"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris-clair" />
                <Input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={telephonePropre}
                  placeholder="06 12 34 56 78"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto">
                <Search className="h-4 w-4" />
                Retrouver ma commande
              </Button>
            </div>
          </form>

          <div className="relative my-6 text-center">
            <span className="relative z-10 bg-white px-3 text-xs uppercase tracking-widest text-gris">
              ou
            </span>
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-bordure" />
          </div>

          <h2 className="font-serif text-lg">J&apos;ai mon lien de suivi</h2>
          <p className="mt-1 text-sm text-gris">
            Collez le jeton reçu lors de votre commande.
          </p>
          <form
            action="/suivi-commande"
            method="get"
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris-clair" />
              <Input
                name="jeton"
                defaultValue={jetonPropre}
                placeholder="Jeton de suivi"
                className="pl-9"
                aria-label="Jeton de suivi"
                required
              />
            </div>
            <Button type="submit" variant="outline">
              Suivre ma commande
            </Button>
          </form>
        </div>

        {resultat ? (
          <div className="mt-8">
            {!resultat.trouve ? (
              <Alert variant="warning" titre="Commande introuvable">
                {resultat.message ??
                  "Aucune commande ne correspond à ces informations. Vérifiez votre numéro et votre téléphone, ou contactez notre service client."}
              </Alert>
            ) : (
              <div className="rounded-xl border border-bordure bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ivoire">
                      <PackageSearch className="h-6 w-6 text-or" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gris">
                        Commande
                      </p>
                      <p className="font-medium text-noir">{resultat.numero_commande}</p>
                    </div>
                  </div>
                  <Badge variant="default">{nomStatut(resultat.statut_commande)}</Badge>
                </div>

                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex justify-between rounded-lg bg-ivoire/60 px-4 py-3">
                    <span className="text-gris">Date</span>
                    <span>{formatDateHeure(resultat.date_creation)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-ivoire/60 px-4 py-3">
                    <span className="text-gris">Montant</span>
                    <span>{formatMontant(resultat.montant_total, resultat.devise)}</span>
                  </div>
                </div>

                {resultat.historique && resultat.historique.length > 0 ? (
                  <ol className="mt-6 space-y-4 border-l border-bordure pl-5">
                    {resultat.historique.map((etape, index) => (
                      <li key={`${etape.statut}-${index}`} className="relative">
                        <span className="absolute -left-[1.6rem] flex h-5 w-5 items-center justify-center rounded-full bg-or text-white">
                          <CircleCheck className="h-3.5 w-3.5" />
                        </span>
                        <p className="text-sm font-medium text-noir">
                          {nomStatut(etape.statut)}
                        </p>
                        <p className="text-xs text-gris">{formatDateHeure(etape.date)}</p>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-8 text-sm text-gris">
          Un problème avec votre commande ?{" "}
          <Link href="/contact" className="text-or-fonce underline">
            Contactez-nous
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
