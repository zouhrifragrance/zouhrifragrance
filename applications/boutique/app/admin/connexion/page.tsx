import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FormulaireConnexion } from "@/components/admin/formulaire-connexion";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

export default async function PageConnexionAdmin({
  searchParams,
}: {
  searchParams: Promise<{ redirection?: string; configuration?: string; acces?: string }>;
}) {
  const { redirection, configuration, acces } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivoire px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo taille="md" />
        </div>
        <div className="rounded-2xl border border-bordure bg-white p-6 shadow-luxe sm:p-8">
          <h1 className="font-serif text-2xl">Espace administration</h1>
          <p className="mt-1 text-sm text-gris">
            Connectez-vous pour gérer la boutique.
          </p>

          <div className="mt-5 space-y-4">
            {configuration ? (
              <Alert variant="warning" titre="Supabase non configuré">
                Renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> pour activer l&apos;administration.
              </Alert>
            ) : null}
            {acces === "refuse" ? (
              <Alert variant="danger">
                Votre compte n&apos;a pas les droits nécessaires pour accéder à l&apos;administration.
              </Alert>
            ) : null}

            <FormulaireConnexion redirection={redirection} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gris">
          <Link href="/" className="hover:text-or-fonce">
            ← Retour à la boutique
          </Link>
        </p>
      </div>
    </main>
  );
}
