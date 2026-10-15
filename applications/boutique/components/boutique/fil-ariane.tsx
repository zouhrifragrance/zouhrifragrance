import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { env } from "@/lib/env";

export interface ElementFilAriane {
  libelle: string;
  href?: string;
}

export function FilAriane({ elements }: { elements: ElementFilAriane[] }) {
  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: elements.map((element, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: element.libelle,
      ...(element.href ? { item: `${env.siteUrl}${element.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="text-xs text-gris sm:text-sm">
        <ol className="flex flex-wrap items-center gap-1.5">
          {elements.map((element, index) => {
            const dernier = index === elements.length - 1;
            return (
              <li key={`${element.libelle}-${index}`} className="flex items-center gap-1.5">
                {element.href && !dernier ? (
                  <Link href={element.href} className="hover:text-or-fonce">
                    {element.libelle}
                  </Link>
                ) : (
                  <span className="text-noir" aria-current={dernier ? "page" : undefined}>
                    {element.libelle}
                  </span>
                )}
                {!dernier ? <ChevronRight className="h-3.5 w-3.5 text-gris-clair" /> : null}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />
    </>
  );
}
