import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-serif text-6xl text-or">404</p>
      <h1 className="mt-4 font-serif text-2xl sm:text-3xl">Page introuvable</h1>
      <p className="mt-3 max-w-md text-sm text-gris">
        La page que vous recherchez n&apos;existe pas ou a été déplacée. Découvrez nos fragrances
        ou revenez à l&apos;accueil.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/boutique">Découvrir la boutique</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
