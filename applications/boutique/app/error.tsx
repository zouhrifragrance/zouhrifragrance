"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-serif text-2xl sm:text-3xl">Une erreur est survenue</h1>
      <p className="mt-3 max-w-md text-sm text-gris">
        Nous n&apos;avons pas pu afficher cette page. Veuillez réessayer dans quelques instants.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
