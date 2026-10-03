import { cn } from "@/lib/utils";
import { COTACAO_STATUS, MARCACAO_STATUS } from "@/lib/status";

const BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap";

export function StatusBadge({
  status,
  kind = "marcacao",
  className,
}: {
  status: string | null | undefined;
  kind?: "marcacao" | "cotacao";
  className?: string;
}) {
  const map: Record<string, { label: string; cls: string }> =
    kind === "cotacao" ? COTACAO_STATUS : MARCACAO_STATUS;
  const m = status ? map[status.toUpperCase()] : undefined;

  return (
    <span className={cn(BASE, m?.cls ?? "bg-muted/30 text-muted-foreground border-border", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m?.label ?? "Estado desconhecido"}
    </span>
  );
}
