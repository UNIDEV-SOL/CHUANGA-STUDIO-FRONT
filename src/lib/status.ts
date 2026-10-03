import type { StatusCotacao, StatusMarcacao } from "@/types/api";

export const MARCACAO_STATUS: Record<StatusMarcacao, { label: string; cls: string }> = {
  AGUARDA_CONFIRMACAO: {
    label: "Aguarda confirmação",
    cls: "bg-gold/15 text-gold border-gold/30",
  },
  CONFIRMADA: {
    label: "Confirmada",
    cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  },
  CONCLUIDA: {
    label: "Concluída",
    cls: "bg-primary/10 text-primary border-primary/30",
  },
  CANCELADA: {
    label: "Cancelada",
    cls: "bg-muted text-muted-foreground border-border",
  },
};

export const COTACAO_STATUS: Record<StatusCotacao, { label: string; cls: string }> = {
  NOVO: { label: "Novo", cls: "bg-rose-deep text-white border-rose-deep" },
  RESPONDIDO: {
    label: "Respondido",
    cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  },
  ARQUIVADO: { label: "Arquivado", cls: "bg-muted text-muted-foreground border-border" },
};

export const MARCACAO_STATUS_OPTIONS = Object.entries(MARCACAO_STATUS).map(([value, m]) => ({
  value: value as StatusMarcacao,
  label: m.label,
}));
