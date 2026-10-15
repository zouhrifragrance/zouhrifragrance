import { cn } from "@/lib/utils";

interface TitreSectionProps {
  eyebrow?: string;
  titre: string;
  description?: string;
  alignement?: "centre" | "gauche";
  className?: string;
  action?: React.ReactNode;
}

export function TitreSection({
  eyebrow,
  titre,
  description,
  alignement = "centre",
  className,
  action,
}: TitreSectionProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-3",
        alignement === "centre" ? "items-center text-center" : "items-start text-left",
        action && "sm:flex-row sm:items-end sm:justify-between sm:text-left",
        className,
      )}
    >
      <div className={cn("space-y-2", alignement === "centre" && !action && "items-center")}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="font-serif text-2xl sm:text-3xl">{titre}</h2>
        <span
          className={cn(
            "block h-px w-14 bg-or",
            alignement === "centre" && !action && "mx-auto",
          )}
        />
        {description ? (
          <p className="max-w-2xl text-sm text-gris sm:text-base">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
