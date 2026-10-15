"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env, supabaseConfiguree } from "@/lib/env";

export function creerClientNavigateur() {
  if (!supabaseConfiguree) {
    throw new Error(
      "Supabase n'est pas configuré : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis.",
    );
  }
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
