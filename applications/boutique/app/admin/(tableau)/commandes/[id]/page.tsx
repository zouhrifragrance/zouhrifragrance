import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { exigerUtilisateurAdmin, peutGerer } from "@/lib/auth-admin";
import { obtenirCommandeParId } from "@/services/commandes";
import { BadgeStatutCommande } from "@/components/admin/badge-statut";
import { ActionsCommande } from "@/components/admin/actions-commande";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDateHeure, formatMontant } from "@/lib/utils";
import { LIBELLES_STATUT_PAIEMENT, type StatutPaiement } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Détail de la commande" };

export default async function PageCommandeAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { role } = await exigerUtilisateurAdmin();
  const commande = await obtenirCommandeParId(id);

  if (!commande) {
    notFound();
  }

  const gest = peutGerer(role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Retour aux commandes">
            <Link href="/admin/commandes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-2xl">{commande.numero_commande}</h1>
            <p className="text-xs text-gris">{formatDateHeure(commande.date_creation)}</p>
          </div>
        </div>
        <BadgeStatutCommande statut={commande.statut_commande} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-bordure bg-white p-5">
            <h2 className="font-serif text-lg">Articles</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-bordure text-left text-xs uppercase tracking-wider text-gris">
                    <th className="pb-2 pr-3 font-medium">Produit</th>
                    <th className="pb-2 pr-3 font-medium">Prix unitaire</th>
                    <th className="pb-2 pr-3 font-medium">Qté</th>
                    <th className="pb-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {commande.lignes_commande.map((ligne) => (
                    <tr key={ligne.id} className="border-b border-bordure/60 last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="text-noir">{ligne.nom_produit}</p>
                        {ligne.nom_variante ? (
                          <p className="text-xs text-gris">{ligne.nom_variante}</p>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3">{formatMontant(ligne.prix_unitaire)}</td>
                      <td className="py-2.5 pr-3">{ligne.quantite}</td>
                      <td className="py-2.5">{formatMontant(ligne.montant_ligne)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Separator className="my-4" />
            <dl className="ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gris">Sous-total</dt>
                <dd>{formatMontant(commande.sous_total, commande.devise)}</dd>
              </div>
              {commande.montant_reduction > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <dt>Réduction{commande.code_promotion ? ` (${commande.code_promotion})` : ""}</dt>
                  <dd>−{formatMontant(commande.montant_reduction, commande.devise)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-gris">Livraison</dt>
                <dd>{formatMontant(commande.frais_livraison, commande.devise)}</dd>
              </div>
              <Separator />
              <div className="flex items-baseline justify-between text-base font-medium">
                <dt>Total</dt>
                <dd className="font-serif text-xl">
                  {formatMontant(commande.montant_total, commande.devise)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-bordure bg-white p-5">
            <h2 className="font-serif text-lg">Historique des statuts</h2>
            {commande.historique_statuts_commande.length === 0 ? (
              <p className="mt-3 text-sm text-gris">Aucun historique.</p>
            ) : (
              <ol className="mt-4 space-y-3 border-l border-bordure pl-5">
                {commande.historique_statuts_commande.map((etape) => (
                  <li key={etape.id} className="relative">
                    <span className="absolute -left-[1.6rem] mt-1.5 h-2 w-2 rounded-full bg-or" />
                    <div className="flex flex-wrap items-center gap-2">
                      <BadgeStatutCommande statut={etape.statut_nouveau} />
                      <span className="text-xs text-gris">{formatDateHeure(etape.date_creation)}</span>
                    </div>
                    {etape.commentaire ? (
                      <p className="mt-1 text-sm text-gris">{etape.commentaire}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-bordure bg-white p-5 text-sm">
            <h2 className="font-serif text-lg">Client</h2>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs uppercase tracking-widest text-gris">Nom</dt>
                <dd className="text-noir">{commande.nom_client}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-gris">Téléphone</dt>
                <dd>
                  <a href={`tel:${commande.telephone_client}`} className="text-noir hover:text-or-fonce">
                    {commande.telephone_client}
                  </a>
                </dd>
              </div>
              {commande.email_client ? (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-gris">E-mail</dt>
                  <dd>
                    <a href={`mailto:${commande.email_client}`} className="text-noir hover:text-or-fonce">
                      {commande.email_client}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs uppercase tracking-widest text-gris">Livraison</dt>
                <dd className="text-noir">
                  {[commande.adresse_livraison, commande.complement_adresse, commande.ville_livraison]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
              {commande.instructions_livraison ? (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-gris">Instructions</dt>
                  <dd className="text-gris">{commande.instructions_livraison}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs uppercase tracking-widest text-gris">Paiement</dt>
                <dd className="text-noir">
                  {LIBELLES_STATUT_PAIEMENT[commande.statut_paiement as StatutPaiement]}
                </dd>
              </div>
            </dl>
          </section>

          <ActionsCommande
            commandeId={commande.id}
            statutActuel={commande.statut_commande}
            stockLibere={commande.stock_libere}
            peutGerer={gest}
          />
        </div>
      </div>
    </div>
  );
}
