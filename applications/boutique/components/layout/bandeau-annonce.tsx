import Link from "next/link";
import { Megaphone } from "lucide-react";
import type { ParametresBoutique } from "@/services/parametres";

export function BandeauAnnonce({
  banniere,
}: {
  banniere: ParametresBoutique["banniere"];
}) {
  if (!banniere.active || !banniere.texte.trim()) return null;

  const lien = banniere.lien.trim();
  const lienValide = /^(https?:\/\/|\/)/i.test(lien);

  return (
    <div className="bg-noir text-ivoire">
      <div className="container-luxe flex flex-col items-center justify-center gap-1 py-2 text-center text-xs sm:flex-row sm:gap-3 sm:text-sm">
        <Megaphone className="hidden h-4 w-4 shrink-0 text-or-clair sm:block" aria-hidden="true" />
        <span className="tracking-wide text-ivoire/90">{banniere.texte}</span>
        {lienValide ? (
          <Link
            href={lien}
            className="font-medium text-or-clair underline underline-offset-2 hover:text-or"
          >
            En savoir plus
          </Link>
        ) : null}
      </div>
    </div>
  );
}
