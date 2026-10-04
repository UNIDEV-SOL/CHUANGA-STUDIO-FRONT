import { Fragment, type ReactNode } from "react";
import { parseDate } from "@/lib/format";

/** Rótulo do dia para os separadores ("Hoje", "Ontem", "3 de outubro"). */
export function rotuloDia(iso: string) {
  const d = parseDate(iso);
  if (!d) return "";
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (mesmoDia(d, hoje)) return "Hoje";
  if (mesmoDia(d, ontem)) return "Ontem";
  const dias = (hoje.getTime() - d.getTime()) / 86_400_000;
  if (dias < 7) return new Intl.DateTimeFormat("pt-PT", { weekday: "long" }).format(d).replace(/^./, (c) => c.toUpperCase());
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: d.getFullYear() === hoje.getFullYear() ? undefined : "numeric" }).format(d);
}

export const horaDe = (iso: string) => {
  const d = parseDate(iso);
  return d ? d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : "";
};

/** Hora (hoje), "Ontem" ou data curta, como na lista do WhatsApp. */
export function quando(iso: string | null) {
  if (!iso) return "";
  const r = rotuloDia(iso);
  if (r === "Hoje") return horaDe(iso);
  if (r === "Ontem") return r;
  const d = parseDate(iso)!;
  return (Date.now() - d.getTime()) / 86_400_000 < 7 ? r : d.toLocaleDateString("pt-PT");
}

export function vistoPorUltimo(iso: string | null) {
  if (!iso) return "";
  const r = rotuloDia(iso);
  return `visto por último ${r === "Hoje" ? "hoje" : r === "Ontem" ? "ontem" : `em ${r}`} às ${horaDe(iso)}`;
}

/** Cor estável por nome para os remetentes no grupo. */
const CORES = ["text-rose-deep", "text-sky-700", "text-emerald-700", "text-amber-700", "text-violet-700", "text-teal-700", "text-fuchsia-700", "text-orange-700"];
export function corDe(nome: string) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = nome.charCodeAt(i) + ((h << 5) - h);
  return CORES[Math.abs(h) % CORES.length];
}

export function tamanho(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function duracao(s: number | null | undefined) {
  const t = Math.max(0, Math.round(s ?? 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export const EMOJIS_REACAO = ["👍", "❤️", "😂", "😮", "😢", "🙏", "💅", "🔥", "👏", "😍"];

export const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😘", "😎", "🤩", "🥳", "😇", "🙂", "😉", "😌", "🤗",
  "🤔", "😅", "😢", "😭", "😮", "😴", "🙄", "😬", "👍", "👎", "👏", "🙏", "💪", "🤝", "👋", "✌️",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💖", "💕", "✨", "🔥", "🌸", "🌷", "🌹", "💐",
  "💅", "💄", "👑", "💎", "🎉", "🎁", "📅", "⏰", "📍", "📸", "✅", "❌", "⭐", "💯",
];

/**
 * Formatação do WhatsApp: *negrito*, _itálico_, ~riscado~, `monoespaçado`, links clicáveis e @menções.
 */
export function formatarTexto(texto: string, claro: boolean): ReactNode {
  const linhas = texto.split("\n");
  return linhas.map((linha, i) => (
    <Fragment key={i}>
      {formatarLinha(linha, claro)}
      {i < linhas.length - 1 && <br />}
    </Fragment>
  ));
}

const PADRAO = /(https?:\/\/[^\s]+|www\.[^\s]+|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`|@[\p{L}]+(?:\s[\p{L}]+)?)/gu;

function formatarLinha(linha: string, claro: boolean): ReactNode[] {
  const partes: ReactNode[] = [];
  let ultimo = 0;
  for (const m of linha.matchAll(PADRAO)) {
    const t = m[0];
    const i = m.index ?? 0;
    if (i > ultimo) partes.push(linha.slice(ultimo, i));
    const k = `${i}-${t}`;
    if (/^(https?:\/\/|www\.)/.test(t)) {
      partes.push(<a key={k} href={t.startsWith("www.") ? `https://${t}` : t} target="_blank" rel="noreferrer" className={claro ? "underline" : "text-sky-700 underline"}>{t}</a>);
    } else if (t.startsWith("*")) partes.push(<strong key={k}>{t.slice(1, -1)}</strong>);
    else if (t.startsWith("_")) partes.push(<em key={k}>{t.slice(1, -1)}</em>);
    else if (t.startsWith("~")) partes.push(<s key={k}>{t.slice(1, -1)}</s>);
    else if (t.startsWith("`")) partes.push(<code key={k} className="font-mono text-[0.9em]">{t.slice(1, -1)}</code>);
    else partes.push(<span key={k} className={claro ? "font-semibold" : "font-semibold text-sky-700"}>{t}</span>);
    ultimo = i + t.length;
  }
  if (ultimo < linha.length) partes.push(linha.slice(ultimo));
  return partes;
}
