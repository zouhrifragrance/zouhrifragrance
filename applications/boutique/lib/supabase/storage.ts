"use client";

import { creerClientNavigateur } from "@/lib/supabase/client";

export const BUCKET_MEDIAS = "medias";
export const TAILLE_MAX_IMAGE_OCTETS = 5 * 1024 * 1024;
export const TYPES_MIME_IMAGES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export function validerFichierImage(file: File): string | null {
  if (!(TYPES_MIME_IMAGES as readonly string[]).includes(file.type)) {
    return "Format non supporté (JPEG, PNG, WebP, AVIF ou GIF).";
  }
  if (file.size > TAILLE_MAX_IMAGE_OCTETS) {
    return "Fichier trop volumineux (5 Mo maximum).";
  }
  return null;
}

function extensionDepuisMime(mime: string): string {
  const correspondances: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
  };
  return correspondances[mime] ?? "jpg";
}

export async function televerserImage(file: File): Promise<string> {
  const erreur = validerFichierImage(file);
  if (erreur) throw new Error(erreur);

  const supabase = creerClientNavigateur();
  const chemin = `produits/${crypto.randomUUID()}.${extensionDepuisMime(file.type)}`;

  const { error } = await supabase.storage
    .from(BUCKET_MEDIAS)
    .upload(chemin, file, { cacheControl: "3600", upsert: false });

  if (error) {
    throw new Error(`Échec du téléversement : ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_MEDIAS).getPublicUrl(chemin);
  return data.publicUrl;
}

export function cheminDepuisUrlMedias(url: string): string | null {
  const marqueur = "/storage/v1/object/public/medias/";
  const index = url.indexOf(marqueur);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marqueur.length));
}

export async function supprimerImagesMedias(urls: string[]): Promise<void> {
  const chemins = urls
    .map(cheminDepuisUrlMedias)
    .filter((chemin): chemin is string => chemin !== null);
  if (chemins.length === 0) return;

  const supabase = creerClientNavigateur();
  await supabase.storage.from(BUCKET_MEDIAS).remove(chemins);
}
