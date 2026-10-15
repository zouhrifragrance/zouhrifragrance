import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";

/**
 * Client a privileges eleves. NE JAMAIS importer ce module depuis un
 * composant client. La cle service_role contourne les politiques RLS.
 */
export function creerClientAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!env.supabaseUrl || !serviceKey) {
    throw new Error(
      "Client administrateur indisponible : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.",
    );
  }
  return createClient<Database>(env.supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
