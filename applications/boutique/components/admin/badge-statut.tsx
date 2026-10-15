import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COULEURS_STATUT, LIBELLES_STATUT_COMMANDE, type StatutCommande } from "@/types";

export function BadgeStatutCommande({
  statut,
  className,
}: {
  statut: StatutCommande;
  className?: string;
}) {
  return (
    <Badge className={cn("border", COULEURS_STATUT[statut], className)}>
      {LIBELLES_STATUT_COMMANDE[statut]}
    </Badge>
  );
}
