"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NavigationAdmin } from "@/components/admin/navigation-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { actionDeconnexion } from "@/app/actions/admin-auth";
import type { RoleUtilisateur } from "@/types";

const LIBELLES_ROLE: Record<RoleUtilisateur, string> = {
  ADMIN: "Administrateur",
  GESTIONNAIRE: "Gestionnaire",
  LECTEUR: "Lecteur",
};

interface CoquilleAdminProps {
  nomComplet: string;
  email: string | null;
  role: RoleUtilisateur;
  commandesEnAttente?: number;
  children: React.ReactNode;
}

export function CoquilleAdmin({
  nomComplet,
  email,
  role,
  commandesEnAttente = 0,
  children,
}: CoquilleAdminProps) {
  const [menuOuvert, setMenuOuvert] = React.useState(false);

  return (
    <div className="min-h-screen bg-ivoire">
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-bordure bg-white lg:flex">
          <div className="border-b border-bordure px-5 py-5">
            <Logo taille="sm" href="/admin" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <NavigationAdmin role={role} commandesEnAttente={commandesEnAttente} />
          </div>
          <div className="border-t border-bordure p-4">
            <p className="truncate text-sm font-medium text-noir">{nomComplet}</p>
            <p className="truncate text-xs text-gris">{email ?? "—"}</p>
            <div className="mt-2">
              <Badge variant="neutral">{LIBELLES_ROLE[role]}</Badge>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-bordure bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3">
              <Sheet open={menuOuvert} onOpenChange={setMenuOuvert}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent cote="gauche" className="lg:hidden">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <div className="mb-4">
                    <Logo taille="sm" href="/admin" />
                  </div>
                  <NavigationAdmin
                    role={role}
                    commandesEnAttente={commandesEnAttente}
                    onNaviguer={() => setMenuOuvert(false)}
                  />
                  <div className="mt-4 border-t border-bordure pt-4">
                    <p className="truncate text-sm font-medium">{nomComplet}</p>
                    <p className="truncate text-xs text-gris">{email ?? "—"}</p>
                    <div className="mt-2">
                      <Badge variant="neutral">{LIBELLES_ROLE[role]}</Badge>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <span className="font-serif text-lg lg:hidden">Administration</span>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/" target="_blank">
                  Voir la boutique
                </Link>
              </Button>
              <form action={actionDeconnexion}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </form>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
