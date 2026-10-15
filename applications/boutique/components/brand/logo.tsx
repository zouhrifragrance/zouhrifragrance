import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

interface LogoProps {
  className?: string;
  taille?: "sm" | "md" | "lg";
  avecTexte?: boolean;
  href?: string | null;
}

const tailles = {
  sm: { img: 34, classe: "h-8 w-8 sm:h-9 sm:w-9" },
  md: { img: 44, classe: "h-10 w-10 sm:h-11 sm:w-11" },
  lg: { img: 72, classe: "h-16 w-16 sm:h-[72px] sm:w-[72px]" },
} as const;

export function Logo({
  className,
  taille = "md",
  avecTexte = true,
  href = "/",
}: LogoProps) {
  const config = tailles[taille];

  const contenu = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full ring-1 ring-or/30",
          config.classe,
        )}
      >
        <Image
          src={siteConfig.logo}
          alt="Logo ZOUHRI FRAGRANCE"
          fill
          sizes="72px"
          className="object-cover"
          priority
        />
      </span>
      {avecTexte ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="font-serif text-base font-semibold tracking-[0.14em] text-noir sm:text-lg">
            ZOUHRI
          </span>
          <span className="text-[0.58rem] font-medium uppercase tracking-[0.34em] text-or-fonce">
            Fragrance
          </span>
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="ZOUHRI FRAGRANCE — Accueil" className="shrink-0">
        {contenu}
      </Link>
    );
  }
  return contenu;
}
