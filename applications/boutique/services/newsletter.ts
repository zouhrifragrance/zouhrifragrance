import { creerClientServeur } from "@/lib/supabase/server";
import { donneesDemoActives } from "./categories";

export async function inscrireNewsletter(email: string): Promise<{ ok: boolean; message: string }> {
  if (donneesDemoActives()) {
    return { ok: true, message: "Merci, votre inscription est enregistrée." };
  }
  const supabase = await creerClientServeur();
  if (!supabase) {
    return { ok: false, message: "Le service est momentanément indisponible." };
  }

  const { error } = await supabase
    .from("inscriptions_newsletter")
    .upsert({ email: email.toLowerCase(), est_actif: true }, { onConflict: "email" });

  if (error) {
    console.error("inscrireNewsletter:", error.message);
    return { ok: false, message: "Impossible d'enregistrer votre inscription pour le moment." };
  }
  return { ok: true, message: "Merci, votre inscription est enregistrée." };
}
