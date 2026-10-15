"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { actionCreerCommande, type EtatCommande } from "@/app/actions/commande";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { EtatVide } from "@/components/ui/etat-vide";
import { Separator } from "@/components/ui/separator";
import { ImageProduit } from "@/components/brand/image-produit";
import { usePanier, cleLigne } from "@/hooks/use-panier";
import { detecterProblemesStock } from "@/lib/panier";
import { formatMontant, lienWhatsApp } from "@/lib/utils";
import { env } from "@/lib/env";
import type { ParametresBoutique } from "@/services/parametres";

const ETAT_INITIAL: EtatCommande = { ok: false, message: "" };

function MessageChamp({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

export function FormulaireCommande({ parametres }: { parametres: ParametresBoutique }) {
  const { lignes, estMonte, sousTotal, fraisLivraison, total, vider } = usePanier();
  const [etat, action, enCours] = useActionState(actionCreerCommande, ETAT_INITIAL);
  const [cleIdempotence] = React.useState(() => crypto.randomUUID());
  const [conditions, setConditions] = React.useState(false);
  const confirmation = etat.ok ? etat.confirmation : undefined;
  const confirmationRef = React.useRef<HTMLDivElement>(null);
  const [lienSuivi, setLienSuivi] = React.useState("");
  const [lienCopie, setLienCopie] = React.useState(false);

  React.useEffect(() => {
    if (confirmation?.jeton_suivi) {
      setLienSuivi(
        `${window.location.origin}/suivi-commande?jeton=${encodeURIComponent(
          confirmation.jeton_suivi,
        )}`,
      );
    }
  }, [confirmation]);

  React.useEffect(() => {
    if (confirmation) vider();
  }, [confirmation, vider]);

  React.useEffect(() => {
    if (confirmation) {
      confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [confirmation]);

  const articles = React.useMemo(
    () =>
      lignes.map((l) => ({
        produitId: l.produitId,
        varianteId: l.varianteId,
        quantite: l.quantite,
      })),
    [lignes],
  );

  const problemes = React.useMemo(() => detecterProblemesStock(lignes), [lignes]);
  const villes = parametres.livraison.villes_livraison;

  const messagePartage = confirmation
    ? `Commande ZOUHRI FRAGRANCE ${confirmation.numero_commande}. Lien de suivi : ${lienSuivi}`
    : "";
  const whatsappHref = env.whatsappNumero
    ? lienWhatsApp(env.whatsappNumero, messagePartage)
    : `https://wa.me/?text=${encodeURIComponent(messagePartage)}`;

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(lienSuivi);
      setLienCopie(true);
      window.setTimeout(() => setLienCopie(false), 2000);
    } catch {
      setLienCopie(false);
    }
  }

  if (confirmation) {
    return (
      <div ref={confirmationRef} className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-emerald-200 bg-white p-6 text-center sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </span>
          <h1 className="mt-5 font-serif text-2xl">Merci pour votre commande</h1>
          <p className="mt-2 text-sm text-gris">
            Votre commande a bien été enregistrée. Notre équipe vous contactera pour la
            confirmer.
          </p>
          <div className="mx-auto mt-6 max-w-sm rounded-lg border border-bordure bg-ivoire/60 p-4 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gris">Numéro de commande</span>
              <span className="font-medium">{confirmation.numero_commande}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-gris">Sous-total</span>
              <span>{formatMontant(confirmation.sous_total, confirmation.devise)}</span>
            </div>
            {confirmation.montant_reduction > 0 ? (
              <div className="mt-1 flex items-center justify-between text-emerald-700">
                <span>Réduction</span>
                <span>−{formatMontant(confirmation.montant_reduction, confirmation.devise)}</span>
              </div>
            ) : null}
            <div className="mt-1 flex items-center justify-between">
              <span className="text-gris">Livraison</span>
              <span>
                {confirmation.frais_livraison === 0
                  ? "Offerte"
                  : formatMontant(confirmation.frais_livraison, confirmation.devise)}
              </span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-baseline justify-between text-base font-medium">
              <span>Total</span>
              <span className="font-serif text-xl">
                {formatMontant(confirmation.montant_total, confirmation.devise)}
              </span>
            </div>
          </div>

          {confirmation.jeton_suivi ? (
            <Alert variant="info" className="mx-auto mt-6 max-w-md text-left" titre="Suivi de commande">
              Conservez ce lien pour suivre l&apos;avancement de votre commande.
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/suivi-commande?jeton=${encodeURIComponent(confirmation.jeton_suivi)}`}>
                    Suivre ma commande
                  </Link>
                </Button>
                {lienSuivi ? (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <a href={whatsappHref ?? "#"} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                        Enregistrer sur WhatsApp
                      </a>
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={copierLien}>
                      {lienCopie ? (
                        <>
                          <Check className="h-4 w-4" />
                          Lien copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copier le lien
                        </>
                      )}
                    </Button>
                  </>
                ) : null}
              </div>
            </Alert>
          ) : null}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/boutique">Continuer mes achats</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!estMonte) {
    return <div className="skeleton h-96 rounded-xl" />;
  }

  if (lignes.length === 0) {
    return (
      <EtatVide
        icon={ShoppingBag}
        titre="Votre panier est vide"
        description="Ajoutez des articles à votre panier avant de passer commande."
        action={
          <Button asChild>
            <Link href="/boutique">Découvrir la boutique</Link>
          </Button>
        }
      />
    );
  }

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="articles" value={JSON.stringify(articles)} />
      <input type="hidden" name="cle_idempotence" value={cleIdempotence} />

      <section className="space-y-6" aria-label="Informations de livraison">
        <div className="rounded-xl border border-bordure bg-white p-5 sm:p-6">
          <h2 className="font-serif text-xl">Vos coordonnées</h2>
          <p className="mt-1 text-sm text-gris">
            Aucun compte nécessaire. Nous vous contactons pour confirmer la commande.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nom_client">Nom complet *</Label>
              <Input id="nom_client" name="nom_client" autoComplete="name" required />
              <MessageChamp message={etat.erreurs?.nom_client} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone_client">Téléphone *</Label>
              <Input
                id="telephone_client"
                name="telephone_client"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="06 12 34 56 78"
                required
              />
              <MessageChamp message={etat.erreurs?.telephone_client} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email_client">E-mail (facultatif)</Label>
              <Input
                id="email_client"
                name="email_client"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
              />
              <MessageChamp message={etat.erreurs?.email_client} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-bordure bg-white p-5 sm:p-6">
          <h2 className="font-serif text-xl">Adresse de livraison</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ville_livraison">Ville *</Label>
              {villes.length > 0 ? (
                <select
                  id="ville_livraison"
                  name="ville_livraison"
                  required
                  defaultValue=""
                  className="flex h-11 w-full rounded-md border border-bordure bg-white px-3 py-2 text-sm text-noir focus-visible:border-or focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
                >
                  <option value="" disabled>
                    Choisissez une ville
                  </option>
                  {villes.map((ville) => (
                    <option key={ville} value={ville}>
                      {ville}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="ville_livraison"
                  name="ville_livraison"
                  autoComplete="address-level2"
                  placeholder="Casablanca"
                  required
                />
              )}
              <MessageChamp message={etat.erreurs?.ville_livraison} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complement_adresse">Complément (facultatif)</Label>
              <Input
                id="complement_adresse"
                name="complement_adresse"
                placeholder="Appartement, étage…"
              />
              <MessageChamp message={etat.erreurs?.complement_adresse} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="adresse_livraison">Adresse complète *</Label>
              <Textarea
                id="adresse_livraison"
                name="adresse_livraison"
                autoComplete="street-address"
                placeholder="Rue, numéro, quartier…"
                required
                className="min-h-20"
              />
              <MessageChamp message={etat.erreurs?.adresse_livraison} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="instructions_livraison">Instructions de livraison (facultatif)</Label>
              <Textarea
                id="instructions_livraison"
                name="instructions_livraison"
                placeholder="Indications pour le livreur…"
                className="min-h-20"
              />
              <MessageChamp message={etat.erreurs?.instructions_livraison} />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-ivoire/70 p-3 text-xs text-gris">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-or" />
            <span>
              Livraison partout au Maroc. Frais{" "}
              {formatMontant(parametres.livraison.frais_livraison)} · offerte dès{" "}
              {formatMontant(parametres.livraison.seuil_livraison_gratuite)}.
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-bordure bg-white p-5 sm:p-6">
          <h2 className="font-serif text-xl">Code promotionnel</h2>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="code_promotion">Code (facultatif)</Label>
            <Input
              id="code_promotion"
              name="code_promotion"
              placeholder="BIENVENUE10"
              className="uppercase"
            />
            <MessageChamp message={etat.erreurs?.code_promotion} />
          </div>
        </div>

        <div className="rounded-xl border border-bordure bg-white p-5 sm:p-6">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={conditions}
              onCheckedChange={(valeur) => setConditions(valeur === true)}
              aria-describedby="conditions-texte"
            />
            <span id="conditions-texte" className="text-sm text-noir">
              J&apos;accepte les{" "}
              <Link href="/conditions-generales" className="text-or-fonce underline">
                conditions générales de vente
              </Link>{" "}
              et la{" "}
              <Link href="/confidentialite" className="text-or-fonce underline">
                politique de confidentialité
              </Link>
              . *
            </span>
          </label>
          <input type="hidden" name="accepter_conditions" value={conditions ? "on" : ""} />
          <MessageChamp message={etat.erreurs?.accepter_conditions} />
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-xl border border-bordure bg-white p-5 sm:p-6">
          <h2 className="font-serif text-xl">Votre commande</h2>
          <ul className="mt-4 space-y-3">
            {lignes.map((ligne) => (
              <li key={cleLigne(ligne)} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-ivoire">
                  <ImageProduit src={ligne.imageUrl} alt={ligne.nom} sizes="56px" />
                  <span className="absolute right-0 top-0 rounded-bl-md bg-noir/80 px-1.5 text-[0.65rem] text-ivoire">
                    ×{ligne.quantite}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-2 text-sm font-medium">{ligne.nom}</span>
                  <span className="text-xs text-gris">
                    {ligne.nomVariante ?? ligne.contenance ?? ""}
                  </span>
                </div>
                <span className="text-sm">
                  {formatMontant(ligne.prixUnitaire * ligne.quantite)}
                </span>
              </li>
            ))}
          </ul>

          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gris">Sous-total</dt>
              <dd>{formatMontant(sousTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gris">Livraison</dt>
              <dd>{fraisLivraison === 0 ? "Offerte" : formatMontant(fraisLivraison)}</dd>
            </div>
            <Separator />
            <div className="flex items-baseline justify-between text-base">
              <dt className="font-medium">Total estimé</dt>
              <dd className="font-serif text-xl">{formatMontant(total)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-gris">
            Le montant définitif, réductions incluses, est calculé et confirmé par notre équipe.
          </p>

          {problemes.length > 0 ? (
            <Alert variant="warning" className="mt-4" titre="Disponibilité">
              <ul className="list-disc space-y-1 pl-4">
                {problemes.map((probleme) => (
                  <li key={probleme.cle}>
                    {probleme.nom} — {probleme.probleme}
                  </li>
                ))}
              </ul>
            </Alert>
          ) : null}

          {etat.message && !etat.ok ? (
            <Alert variant="danger" className="mt-4">
              {etat.message}
            </Alert>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full"
            disabled={enCours || problemes.length > 0}
          >
            {enCours ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              <>
                Confirmer ma commande
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <div className="mt-4 space-y-2 text-xs text-gris">
            <p className="inline-flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-or" /> Aucun paiement en ligne
            </p>
            <p className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-or" /> Vos données ne sont utilisées que pour
              la livraison
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
