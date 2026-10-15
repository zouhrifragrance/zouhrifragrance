"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, ChevronDown, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePanier } from "@/hooks/use-panier";
import { NAVIGATION_PUBLIQUE } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { CategorieAvecEnfants } from "@/types";

interface EnteteProps {
  categories: CategorieAvecEnfants[];
  nomBoutique: string;
  telephone?: string | null;
}

export function Entete({ categories, telephone }: EnteteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { nombreArticles, ouvrirTiroir } = usePanier();
  const [menuOuvert, setMenuOuvert] = React.useState(false);
  const [rechercheOuverte, setRechercheOuverte] = React.useState(false);
  const [terme, setTerme] = React.useState("");

  React.useEffect(() => {
    setMenuOuvert(false);
  }, [pathname]);

  const soumettreRecherche = (evenement: React.FormEvent) => {
    evenement.preventDefault();
    const valeur = terme.trim();
    setRechercheOuverte(false);
    router.push(valeur ? `/boutique?recherche=${encodeURIComponent(valeur)}` : "/boutique");
  };

  const estActif = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-bordure bg-ivoire/95 backdrop-blur supports-[backdrop-filter]:bg-ivoire/80">
      <div className="hidden border-b border-bordure/70 bg-noir text-ivoire lg:block">
        <div className="container-luxe flex h-9 items-center justify-between text-xs">
          <p className="tracking-wide text-ivoire/80">
            Commande sans compte · Aucun paiement en ligne · Confirmation par notre équipe
          </p>
          <div className="flex items-center gap-4 text-ivoire/80">
            {telephone ? (
              <a href={`tel:${telephone}`} className="inline-flex items-center gap-1.5 hover:text-or-clair">
                <Phone className="h-3.5 w-3.5" />
                {telephone}
              </a>
            ) : null}
            <span className="text-or-clair">Livraison partout au Maroc</span>
          </div>
        </div>
      </div>

      <div className="container-luxe flex h-16 items-center justify-between gap-3 lg:h-[72px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOuvert(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-noir transition-colors hover:bg-or/10 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </div>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {NAVIGATION_PUBLIQUE.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-or-fonce",
                estActif(item.href) ? "text-or-fonce" : "text-noir",
              )}
            >
              {item.libelle}
            </Link>
          ))}

          {categories.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-noir transition-colors hover:text-or-fonce"
                >
                  Catégories
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <DropdownMenuItem asChild>
                      <Link href={`/categories/${cat.slug}`} className="font-medium">
                        {cat.nom}
                      </Link>
                    </DropdownMenuItem>
                    {cat.enfants.map((enfant) => (
                      <DropdownMenuItem key={enfant.id} asChild>
                        <Link href={`/categories/${enfant.slug}`} className="pl-6 text-gris">
                          {enfant.nom}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRechercheOuverte((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-noir transition-colors hover:bg-or/10"
            aria-label="Rechercher un produit"
            aria-expanded={rechercheOuverte}
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={ouvrirTiroir}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-noir transition-colors hover:bg-or/10"
            aria-label={`Panier, ${nombreArticles} article${nombreArticles > 1 ? "s" : ""}`}
          >
            <ShoppingBag className="h-5 w-5" />
            {nombreArticles > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-or px-1 text-[0.65rem] font-semibold text-white">
                {nombreArticles}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {rechercheOuverte ? (
        <div className="border-t border-bordure bg-white">
          <form onSubmit={soumettreRecherche} className="container-luxe flex gap-2 py-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" />
              <input
                autoFocus
                value={terme}
                onChange={(e) => setTerme(e.target.value)}
                placeholder="Rechercher un parfum, un produit…"
                aria-label="Terme de recherche"
                className="h-11 w-full rounded-md border border-bordure bg-ivoire pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-or"
              />
            </div>
            <Button type="submit" size="default">
              Rechercher
            </Button>
          </form>
        </div>
      ) : null}

      <Sheet open={menuOuvert} onOpenChange={setMenuOuvert}>
        <SheetContent cote="gauche" className="w-[86vw] max-w-xs overflow-y-auto">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <Logo taille="sm" />
          <nav aria-label="Menu mobile" className="mt-2 flex flex-col">
            {NAVIGATION_PUBLIQUE.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-2 py-3 text-base font-medium text-noir transition-colors hover:bg-ivoire hover:text-or-fonce"
                >
                  {item.libelle}
                </Link>
              </SheetClose>
            ))}
          </nav>

          {categories.length > 0 ? (
            <div className="mt-2 border-t border-bordure pt-3">
              <p className="px-2 pb-2 text-xs font-medium uppercase tracking-widest text-gris">
                Catégories
              </p>
              <div className="flex flex-col">
                {categories.map((cat) => (
                  <div key={cat.id} className="py-0.5">
                    <SheetClose asChild>
                      <Link
                        href={`/categories/${cat.slug}`}
                        className="block rounded-md px-2 py-2 text-sm font-medium text-noir hover:bg-ivoire hover:text-or-fonce"
                      >
                        {cat.nom}
                      </Link>
                    </SheetClose>
                    {cat.enfants.map((enfant) => (
                      <SheetClose asChild key={enfant.id}>
                        <Link
                          href={`/categories/${enfant.slug}`}
                          className="block rounded-md px-2 py-1.5 pl-6 text-sm text-gris hover:bg-ivoire hover:text-or-fonce"
                        >
                          {enfant.nom}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {telephone ? (
            <a
              href={`tel:${telephone}`}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-ivoire px-3 py-2 text-sm text-noir"
            >
              <Phone className="h-4 w-4 text-or" />
              {telephone}
            </a>
          ) : null}
        </SheetContent>
      </Sheet>
    </header>
  );
}
