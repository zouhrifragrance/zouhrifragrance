import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMontant(
  montant: number | string | null | undefined,
  devise = "MAD",
): string {
  const valeur = typeof montant === "string" ? Number(montant) : (montant ?? 0);
  const sur = Number.isFinite(valeur) ? valeur : 0;
  return `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(sur)} ${devise}`;
}

export function formatNombre(valeur: number | string | null | undefined): string {
  const n = typeof valeur === "string" ? Number(valeur) : (valeur ?? 0);
  return new Intl.NumberFormat("fr-MA").format(Number.isFinite(n) ? n : 0);
}

export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  },
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", options).format(d);
}

export function formatDateHeure(date: string | Date | null | undefined): string {
  return formatDate(date, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Genere un slug a partir d'un texte (accents retires, minuscules, tirets). */
export function slugifier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalise un numero de telephone marocain. */
export function normaliserTelephone(entree: string): string | null {
  const nettoyee = entree.replace(/[\s().-]/g, "");
  if (/^0[5-7]\d{8}$/.test(nettoyee)) return `+212${nettoyee.slice(1)}`;
  if (/^\+212[5-7]\d{8}$/.test(nettoyee)) return nettoyee;
  if (/^212[5-7]\d{8}$/.test(nettoyee)) return `+${nettoyee}`;
  return null;
}

export function tronquer(texte: string, longueur = 120): string {
  if (texte.length <= longueur) return texte;
  return `${texte.slice(0, longueur).trimEnd()}…`;
}

export function lienWhatsApp(numero: string | null, message: string): string | null {
  if (!numero) return null;
  const numeroPropre = numero.replace(/[^\d]/g, "");
  if (!numeroPropre) return null;
  return `https://wa.me/${numeroPropre}?text=${encodeURIComponent(message)}`;
}
