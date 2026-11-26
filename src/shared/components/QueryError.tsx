import { AlertTriangle } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

/** Estado de erro padrão para listas/painéis que dependem de uma query. */
export function QueryError({
  query,
  className,
}: {
  query: { error: unknown; refetch: () => unknown; isFetching?: boolean };
  className?: string;
}) {
  return (
    <div className={cn("p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm flex flex-wrap items-center gap-3", className)}>
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <span className="flex-1 min-w-[180px]">{(query.error as Error)?.message ?? "Erro ao carregar dados."}</span>
      <Button size="sm" variant="outline" className="rounded-full" disabled={query.isFetching} onClick={() => query.refetch()}>
        Tentar novamente
      </Button>
    </div>
  );
}
