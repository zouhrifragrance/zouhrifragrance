import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EtatVideProps {
  icon: LucideIcon;
  titre: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EtatVide({
  icon: Icon,
  titre,
  description,
  action,
  className,
}: EtatVideProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-bordure bg-white/60 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ivoire">
        <Icon className="h-7 w-7 text-or" aria-hidden="true" />
      </span>
      <div className="max-w-md space-y-1.5">
        <h3 className="font-serif text-xl">{titre}</h3>
        {description ? <p className="text-sm text-gris">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
