import type { FormaPagamento, StatusFatura } from "@/modules/invoices/models";
import type { StatusCotacao } from "@/modules/quotations/models";
import type { StatusMarcacao } from "@/modules/bookings/models";

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
  NAO_COMPARECEU: {
    label: "Não compareceu",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
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

export const FATURA_STATUS: Record<StatusFatura, { label: string; cls: string }> = {
  PENDENTE: { label: "Por pagar", cls: "bg-gold/15 text-gold border-gold/30" },
  PAGA: {
    label: "Paga",
    cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  },
  ANULADA: { label: "Anulada", cls: "bg-muted text-muted-foreground border-border line-through" },
};

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  NUMERARIO: "Numerário",
  MPESA: "M-Pesa",
  EMOLA: "e-Mola",
  CARTAO: "Cartão",
  TRANSFERENCIA: "Transferência bancária",
};

export const FORMA_PAGAMENTO_OPTIONS = Object.entries(FORMA_PAGAMENTO_LABEL).map(([value, label]) => ({
  value: value as FormaPagamento,
  label,
}));
