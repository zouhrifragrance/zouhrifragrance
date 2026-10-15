import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env, supabaseConfiguree } from "@/lib/env";

type CookieAEnregistrer = { name: string; value: string; options: CookieOptions };

/**
 * Client Supabase cote serveur (Server Components, Route Handlers, Server Actions).
 * Les cookies sont necessaires pour conserver la session d'administration.
 */
export async function creerClientServeur() {
  if (!supabaseConfiguree) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesAEnregistrer: CookieAEnregistrer[]) {
        try {
          cookiesAEnregistrer.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Appel depuis un Server Component en lecture seule : ignore.
        }
      },
    },
  });
}

export async function recupererUtilisateur() {
  const supabase = await creerClientServeur();
  if (!supabase) return { supabase: null, utilisateur: null, profil: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, utilisateur: null, profil: null };

  const { data: profil } = await supabase
    .from("profils_utilisateurs")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, utilisateur: user, profil };
}
