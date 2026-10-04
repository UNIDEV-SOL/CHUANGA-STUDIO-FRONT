export const formatMZN = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "MZN",
    maximumFractionDigits: 0,
  }).format(Number(v ?? 0));

/**
 * Converte strings de data do backend em Date local.
 * "yyyy-MM-dd" é tratado como data local (o `new Date()` nativo trata-o como
 * UTC, o que pode mostrar o dia anterior consoante o fuso).
 */
export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Data local no formato yyyy-MM-dd (para inputs type="date" e para a API). */
export function toIsoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayIso = () => toIsoDate(new Date());

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => {
  const d = parseDate(iso);
  return d ? new Intl.DateTimeFormat("pt-PT", opts).format(d) : "—";
};

export const formatDate = (iso: string) =>
  fmt(iso, { day: "2-digit", month: "long", year: "numeric" });

export const formatDateShort = (iso: string) =>
  fmt(iso, { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDay = (iso: string) => fmt(iso, { day: "numeric" });

export const formatMonthShort = (iso: string) => fmt(iso, { month: "short" });

export const formatTime = (iso: string) => fmt(iso, { hour: "2-digit", minute: "2-digit" });

/** "10:00:00" -> "10:00" */
export const formatHora = (hora: string | null | undefined) => (hora ? hora.slice(0, 5) : "—");

export const relative = (iso: string) => {
  const d = parseDate(iso);
  if (!d) return "—";
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "agora mesmo";
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.round(h / 24);
  return `há ${days}d`;
};

export const initials = (name: string | null | undefined) =>
  String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const whatsappDigits = (phone: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = `258${digits}`;
  return digits;
};

/** Link wa.me — assume Moçambique (+258) quando o número vem sem indicativo. */
export function whatsappLink(phone: string) {
  return `https://wa.me/${whatsappDigits(phone)}`;
}

/**
 * Conversa com a mensagem já escrita. No computador vai direto ao WhatsApp Web:
 * pelo wa.me, a app de desktop costuma abrir a conversa mas perder o texto.
 */
export function whatsappMensagemLink(phone: string, texto: string) {
  const params = `phone=${whatsappDigits(phone)}&text=${encodeURIComponent(texto)}`;
  const telemovel = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return telemovel ? `https://api.whatsapp.com/send?${params}` : `https://web.whatsapp.com/send?${params}`;
}
