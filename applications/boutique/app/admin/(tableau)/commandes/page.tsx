import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listerCommandesAdmin } from "@/services/admin";
import { BadgeStatutCommande } from "@/components/admin/badge-statut";
import { FiltresCommandes } from "@/components/admin/filtres-commandes";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatDateHeure, formatMontant, cn } from "@/lib/utils";
import type { StatutCommande } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Commandes" };

export default async function PageCommandesAdmin({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; recherche?: string }>;
}) {
  const { statut, recherche } = await searchParams;
  const commandes = await listerCommandesAdmin({
    statut: (statut as StatutCommande) || "",
    recherche: recherche ?? "",
  });

  const nbEnAttente = commandes.filter(
    (c) => c.statut_commande === "EN_ATTENTE_CONFIRMATION",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">Commandes</h1>
          <p className="mt-1 text-sm text-gris">
            {commandes.length} commande{commandes.length > 1 ? "s" : ""} affichée
            {commandes.length > 1 ? "s" : ""}.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="skeleton h-11 rounded-md" />}>
        <FiltresCommandes />
      </Suspense>

      {nbEnAttente > 0 && statut !== "EN_ATTENTE_CONFIRMATION" ? (
        <Alert variant="warning" titre={`${nbEnAttente} commande${nbEnAttente > 1 ? "s" : ""} à confirmer`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Ces commandes attendent votre confirmation.</span>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/commandes?statut=EN_ATTENTE_CONFIRMATION">
                Afficher les commandes en attente
              </Link>
            </Button>
          </div>
        </Alert>
      ) : null}

      {commandes.length === 0 ? (
        <Alert variant="info">Aucune commande ne correspond à votre recherche.</Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bordure bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-bordure bg-ivoire/50 text-left text-xs uppercase tracking-wider text-gris">
                <th className="px-4 py-3 font-medium">Numéro</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Ville</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {commandes.map((commande) => (
                <tr
                  key={commande.id}
                  className={cn(
                    "border-b border-bordure/60 last:border-0",
                    commande.statut_commande === "EN_ATTENTE_CONFIRMATION" && "bg-amber-50/70",
                  )}
                >
                  <td className="px-4 py-3 font-medium text-noir">{commande.numero_commande}</td>
                  <td className="px-4 py-3">
                    <p className="text-noir">{commande.nom_client}</p>
                    <p className="text-xs text-gris">{commande.telephone_client}</p>
                  </td>
                  <td className="px-4 py-3 text-gris">{commande.ville_livraison}</td>
                  <td className="px-4 py-3">{formatMontant(commande.montant_total)}</td>
                  <td className="px-4 py-3">
                    <BadgeStatutCommande statut={commande.statut_commande} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gris">
                    {formatDateHeure(commande.date_creation)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/commandes/${commande.id}`}>Détails</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
