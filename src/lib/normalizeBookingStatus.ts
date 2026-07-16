import type { BookingStatus } from "@/types";

// Converte status vindos da API (ex: "AGUARDA_CONFIRMACAO")
// para os valores usados no front-end (BookingStatus).
// Caso não reconheça, retorna null para permitir fallback no caller.
export function normalizeBookingStatus(input: unknown): BookingStatus | null {
  if (!input) return null;

  // Aceita tanto strings já normalizadas (minúsculo) quanto UPPERCASE.
  const raw = String(input).trim();
  if (!raw) return null;

  const normalized = raw
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const MAP: Record<string, BookingStatus> = {
    aguardando_pagamento: "aguardando_pagamento",

    // UPPERCASE esperado no backend
    aguarda_confiramação: "aguardando_pagamento", // (fallback improvável, mantido por tolerância)
    aguarda_confirmacao: "aguardando_pagamento",
    aguarda_confirmaçao: "aguardando_pagamento",
    aguardaconfirmacao: "aguardando_pagamento",
    aguarda_confirmacao_pago: "aguardando_pagamento",

    confirmada: "confirmada",
    confirmacao: "confirmada",
    confirmacao_pagamento: "confirmada",

    pendente_ausencia: "pendente_ausencia",
    pendente_ausência: "pendente_ausencia" as any,
    pendente_ausencia_: "pendente_ausencia",

    concluida: "concluida",
    concluida_finalizada: "concluida",
    finalizada: "concluida",

    cancelada: "cancelada",
    cancelada_cancelado: "cancelada",
    cancelado: "cancelada",
  };

  return MAP[normalized] ?? null;
}

