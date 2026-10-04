import type { Marcacao } from "@/types/api";
import { guardarFicheiro } from "./pdf";

// O estúdio está em Maputo (UTC+2, sem horário de verão): converte a hora local para UTC.
const OFFSET_MAPUTO_HORAS = 2;

function utc(data: string, hora: string, minutosExtra = 0) {
  const [a, m, d] = data.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d, h - OFFSET_MAPUTO_HORAS, min + minutosExtra));
  return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

const descricao = (m: Marcacao) => `${m.servicos.map((s) => s.nome).join(", ")} · Pedido #${m.id.slice(-6)}`;
const LOCAL = "Chuanga Studio, Maputo – Moçambique";

const escapar = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function googleCalendarUrl(m: Marcacao) {
  const inicio = utc(m.data, m.hora);
  const fim = utc(m.data, m.hora, Math.max(m.duracaoMinutos || 0, 30));
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: "Chuanga Studio",
    dates: `${inicio}/${fim}`,
    details: descricao(m),
    location: LOCAL,
    ctz: "Africa/Maputo",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

/** Ficheiro .ics para iPhone/Outlook, com alarme 2 h antes. */
export function descarregarIcs(m: Marcacao) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chuanga Studio//Marcacoes//PT",
    "BEGIN:VEVENT",
    `UID:${m.id}@chuangastudio`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${utc(m.data, m.hora)}`,
    `DTEND:${utc(m.data, m.hora, Math.max(m.duracaoMinutos || 0, 30))}`,
    "SUMMARY:Chuanga Studio",
    `DESCRIPTION:${escapar(descricao(m))}`,
    `LOCATION:${escapar(LOCAL)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Marcação no Chuanga Studio daqui a 2 horas",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  guardarFicheiro(new Blob([ics], { type: "text/calendar;charset=utf-8" }), "marcacao-chuanga-studio.ics");
}
