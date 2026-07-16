export const formatMZN = (v: number) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "MZN",
    maximumFractionDigits: 0,
  }).format(v);

const isValidDate = (value: unknown) => {
  if (typeof value !== "string") return false;
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

export const formatDate = (iso: string) => {
  if (!isValidDate(iso)) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
};

export const formatDateShort = (iso: string) => {
  if (!isValidDate(iso)) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
};

export const formatTime = (iso: string) => {
  if (!isValidDate(iso)) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
};

export const relative = (iso: string) => {
  if (!isValidDate(iso)) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
};

