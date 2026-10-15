"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Boxes,
  Percent,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoleUtilisateur } from "@/types";

interface EntreeNavigation {
  libelle: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  roles: RoleUtilisateur[];
}

const ENTREES: EntreeNavigation[] = [
  { libelle: "Tableau de bord", href: "/admin", icon: LayoutDashboard, exact: true, roles: ["ADMIN", "GESTIONNAIRE", "LECTEUR"] },
  { libelle: "Commandes", href: "/admin/commandes", icon: ShoppingBag, roles: ["ADMIN", "GESTIONNAIRE", "LECTEUR"] },
  { libelle: "Produits", href: "/admin/produits", icon: Package, roles: ["ADMIN", "GESTIONNAIRE"] },
  { libelle: "Catégories", href: "/admin/categories", icon: Tags, roles: ["ADMIN", "GESTIONNAIRE"] },
  { libelle: "Stocks", href: "/admin/stocks", icon: Boxes, roles: ["ADMIN", "GESTIONNAIRE"] },
  { libelle: "Promotions", href: "/admin/promotions", icon: Percent, roles: ["ADMIN", "GESTIONNAIRE"] },
  { libelle: "Paramètres", href: "/admin/parametres", icon: Settings, roles: ["ADMIN"] },
];

export function NavigationAdmin({
  role,
  onNaviguer,
  commandesEnAttente = 0,
}: {
  role: RoleUtilisateur;
  onNaviguer?: () => void;
  commandesEnAttente?: number;
}) {
  const chemin = usePathname();
  const entrees = ENTREES.filter((entree) => entree.roles.includes(role));

  return (
    <nav className="space-y-1" aria-label="Navigation administration">
      {entrees.map((entree) => {
        const actif = entree.exact ? chemin === entree.href : chemin.startsWith(entree.href);
        const alerte =
          entree.href === "/admin/commandes" && commandesEnAttente > 0;
        return (
          <Link
            key={entree.href}
            href={entree.href}
            onClick={onNaviguer}
            aria-current={actif ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              actif
                ? "bg-noir text-ivoire"
                : "text-noir/80 hover:bg-ivoire hover:text-noir",
            )}
          >
            <entree.icon className={cn("h-4 w-4", actif ? "text-or-clair" : "text-gris")} />
            <span className="flex-1">{entree.libelle}</span>
            {alerte ? (
              <span
                className={cn(
                  "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.65rem] font-semibold text-white",
                  actif ? "bg-or" : "bg-amber-500",
                )}
                aria-label={`${commandesEnAttente} commande${commandesEnAttente > 1 ? "s" : ""} en attente de confirmation`}
              >
                {commandesEnAttente}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
