import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";

const MAP: Record<BookingStatus, { label: string; cls: string }> = {
  aguardando_pagamento: {
    label: "Aguarda pagamento",
    cls: "bg-gold/15 text-gold border-gold/30",
  },
  confirmada: {
    label: "Confirmada",
    cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  },
  pendente_ausencia: {
    label: "Reserva pendente",
    cls: "bg-rose-deep/10 text-rose-deep border-rose-deep/30",
  },
  concluida: {
    label: "Concluída",
    cls: "bg-primary/10 text-primary border-primary/30",
  },
  cancelada: {
    label: "Cancelada",
    cls: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const m = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        m.cls,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}
