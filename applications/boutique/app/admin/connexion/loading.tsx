import { Skeleton } from "@/components/ui/skeleton";
import { StatutChargement } from "@/components/chargement/chargement-page";

export default function Loading() {
  return (
    <StatutChargement className="flex min-h-dvh items-center justify-center bg-ivoire px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-bordure bg-white p-6 sm:p-8">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-6 w-40" />
          <Skeleton className="mx-auto h-4 w-56 max-w-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </div>
    </StatutChargement>
  );
}
