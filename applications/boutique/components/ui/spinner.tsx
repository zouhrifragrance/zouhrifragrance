import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-or", className)}
      aria-hidden="true"
    />
  );
}

export function Chargement({ libelle = "Chargement…" }: { libelle?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-gris"
    >
      <Spinner className="h-7 w-7" />
      <span className="text-sm">{libelle}</span>
    </div>
  );
}
