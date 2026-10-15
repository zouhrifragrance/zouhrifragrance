import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageProduitProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}

const PROVISOIRE = "/images/produit-provisoire.svg";

export function ImageProduit({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
  fill = true,
  width,
  height,
}: ImageProduitProps) {
  const source = src && src.trim() ? src : PROVISOIRE;
  const estDistant = source.startsWith("http") || source.startsWith("/images");

  if (fill) {
    return (
      <Image
        src={source}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={source}
      alt={alt}
      width={width ?? 600}
      height={height ?? 750}
      sizes={sizes}
      priority={priority}
      unoptimized={!estDistant && source.endsWith(".svg")}
      className={cn("object-cover", className)}
    />
  );
}
