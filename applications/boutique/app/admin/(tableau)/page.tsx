import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Coins,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { obtenirStatistiquesTableauDeBord } from "@/services/admin";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { BadgeStatutCommande } from "@/components/admin/badge-statut";
import { formatDateHeure, formatMontant } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tableau de bord" };

function CarteKpi({
  titre,
  valeur,
  icone: Icone,
  detail,
  accent,
}: {
  titre: string;
  valeur: string;
  icone: typeof Coins;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-bordure bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-gris">{titre}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${accent ? "bg-or/15" : "bg-ivoire"}`}
        >
          <Icone className="h-4 w-4 text-or" />
        </span>
      </div>
      <p className="mt-3 font-serif text-2xl text-noir">{valeur}</p>
      {detail ? <p className="mt-1 text-xs text-gris">{detail}</p> : null}
    </div>
  );
}

export default async function PageTableauDeBord() {
  const stats = await obtenirStatistiquesTableauDeBord();

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-2xl">Tableau de bord</h1>
        <Alert variant="warning" titre="Données indisponibles">
          La connexion à Supabase n&apos;est pas configurée, ou les migrations ne sont pas encore
          appliquées. Les statistiques s&apos;afficheront une fois la base prête.
        </Alert>
      </div>
    );
  }

  const { compteurs, commandes_recentes, produits_plus_vendus, stock_faible, ventes_30_jours } =
    stats;
  const maxVente = Math.max(1, ...ventes_30_jours.map((v) => Number(v.total)));
  const panierMoyen =
    compteurs.total > 0 ? stats.chiffre_affaires_confirme / Math.max(1, compteurs.total) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gris">Vue d&apos;ensemble de l&apos;activité de la boutique.</p>
      </div>

      {compteurs.en_attente > 0 ? (
        <Alert
          variant="warning"
          titre={`${compteurs.en_attente} commande${compteurs.en_attente > 1 ? "s" : ""} en attente de confirmation`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Des commandes attendent votre validation ({formatMontant(stats.montant_en_attente)}).
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/commandes?statut=EN_ATTENTE_CONFIRMATION">
                Traiter les commandes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteKpi
          titre="Chiffre d'affaires confirmé"
          valeur={formatMontant(stats.chiffre_affaires_confirme)}
          icone={TrendingUp}
          detail="Commandes confirmées et suivantes"
          accent
        />
        <Link
          href="/admin/commandes?statut=EN_ATTENTE_CONFIRMATION"
          className="block rounded-xl transition-shadow hover:shadow-luxe-sm"
        >
          <CarteKpi
            titre="En attente"
            valeur={String(compteurs.en_attente)}
            icone={Clock}
            detail={`${formatMontant(stats.montant_en_attente)} à confirmer`}
            accent={compteurs.en_attente > 0}
          />
        </Link>
        <CarteKpi
          titre="Commandes totales"
          valeur={String(compteurs.total)}
          icone={ShoppingBag}
          detail={`${compteurs.livrees} livrées · ${compteurs.annulees} annulées`}
        />
        <CarteKpi
          titre="Panier moyen"
          valeur={formatMontant(panierMoyen)}
          icone={Coins}
          detail="Sur l'ensemble des commandes"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-bordure bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">Ventes des 30 derniers jours</h2>
          </div>
          {ventes_30_jours.length === 0 ? (
            <p className="mt-4 text-sm text-gris">Aucune vente enregistrée sur cette période.</p>
          ) : (
            <div className="mt-5 flex h-40 items-end gap-1.5">
              {ventes_30_jours.map((jour) => (
                <div
                  key={jour.jour}
                  className="group relative flex-1 rounded-t bg-or/30 transition-colors hover:bg-or"
                  style={{ height: `${Math.max(4, (Number(jour.total) / maxVente) * 100)}%` }}
                  title={`${jour.jour} · ${formatMontant(Number(jour.total))}`}
                >
                  <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-noir px-2 py-1 text-[0.65rem] text-ivoire group-hover:block">
                    {formatMontant(Number(jour.total))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-bordure bg-white p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="font-serif text-lg">Stock faible</h2>
          </div>
          {stock_faible.length === 0 ? (
            <p className="mt-4 text-sm text-gris">Aucun produit sous le seuil d&apos;alerte.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stock_faible.map((produit) => (
                <li key={produit.nom} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-noir">{produit.nom}</span>
                  <span className="shrink-0 text-xs text-gris">
                    <strong className="text-noir">{produit.stock}</strong> / seuil {produit.seuil}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/stocks">
                Gérer les stocks
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-bordure bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">Commandes récentes</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/commandes">Tout voir</Link>
            </Button>
          </div>
          {commandes_recentes.length === 0 ? (
            <p className="mt-4 text-sm text-gris">Aucune commande pour le moment.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-bordure text-left text-xs uppercase tracking-wider text-gris">
                    <th className="pb-2 pr-3 font-medium">Numéro</th>
                    <th className="pb-2 pr-3 font-medium">Client</th>
                    <th className="pb-2 pr-3 font-medium">Montant</th>
                    <th className="pb-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {commandes_recentes.map((commande) => (
                    <tr key={commande.id} className="border-b border-bordure/60 last:border-0">
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/admin/commandes/${commande.id}`}
                          className="font-medium text-noir hover:text-or-fonce"
                        >
                          {commande.numero_commande}
                        </Link>
                        <p className="text-xs text-gris">{formatDateHeure(commande.date_creation)}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-noir">{commande.nom_client}</td>
                      <td className="py-2.5 pr-3">{formatMontant(commande.montant_total)}</td>
                      <td className="py-2.5">
                        <BadgeStatutCommande statut={commande.statut_commande} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-bordure bg-white p-5">
          <h2 className="font-serif text-lg">Produits les plus vendus</h2>
          {produits_plus_vendus.length === 0 ? (
            <p className="mt-4 text-sm text-gris">Pas encore de ventes enregistrées.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {produits_plus_vendus.map((produit, index) => (
                <li key={produit.nom} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ivoire text-xs font-medium text-gris">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-noir">{produit.nom}</span>
                  <span className="shrink-0 text-xs text-gris">
                    {produit.quantite} vendu{Number(produit.quantite) > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
