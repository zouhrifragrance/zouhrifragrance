import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  chemin: string;
  page: number;
  totalPages: number;
  parametres: Record<string, string | string[] | undefined>;
}

function construireLien(
  chemin: string,
  parametres: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(parametres)) {
    if (cle === "page" || valeur === undefined) continue;
    if (Array.isArray(valeur)) {
      valeur.forEach((v) => params.append(cle, v));
    } else {
      params.set(cle, valeur);
    }
  }
  if (page > 1) params.set("page", String(page));
  const requete = params.toString();
  return requete ? `${chemin}?${requete}` : chemin;
}

export function Pagination({ chemin, page, totalPages, parametres }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <Link
        href={construireLien(chemin, parametres, Math.max(1, page - 1))}
        aria-label="Page précédente"
        aria-disabled={page <= 1}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md border border-bordure bg-white text-noir hover:border-or/50",
          page <= 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((element, index) =>
        element === "…" ? (
          <span key={`ellipse-${index}`} className="px-2 text-gris">
            …
          </span>
        ) : (
          <Link
            key={element}
            href={construireLien(chemin, parametres, element)}
            aria-current={element === page ? "page" : undefined}
            className={cn(
              "flex h-10 min-w-10 items-center justify-center rounded-md border px-2 text-sm",
              element === page
                ? "border-or bg-or text-white"
                : "border-bordure bg-white text-noir hover:border-or/50",
            )}
          >
            {element}
          </Link>
        ),
      )}

      <Link
        href={construireLien(chemin, parametres, Math.min(totalPages, page + 1))}
        aria-label="Page suivante"
        aria-disabled={page >= totalPages}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md border border-bordure bg-white text-noir hover:border-or/50",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
