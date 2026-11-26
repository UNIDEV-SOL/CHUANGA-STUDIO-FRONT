import { useEffect } from "react";
import { ConfigValue } from "@/config";

const SITE = "Chuanga Studio";
const URL_SITE = ConfigValue.SITE_URL;
const DESCRICAO_PADRAO =
  "Chuanga Studio: estúdio de unhas em Maputo. Manicure, pedicure, alongamento em gel e acrílico, nail art e spa. Marque online em poucos minutos.";

function meta(seletor: string, atributo: "name" | "property", chave: string, valor: string) {
  let el = document.head.querySelector<HTMLMetaElement>(seletor);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(atributo, chave);
    document.head.appendChild(el);
  }
  el.content = valor;
}

function canonico(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Título, descrição e Open Graph por página (o Google executa JavaScript, por isso basta no cliente).
 * indexar: false para páginas privadas ou de link pessoal.
 */
export function usePaginaTitulo(titulo: string | null, opcoes: { descricao?: string; indexar?: boolean } = {}) {
  const { descricao = DESCRICAO_PADRAO, indexar = true } = opcoes;
  useEffect(() => {
    const completo = titulo ? `${titulo} · ${SITE}` : `${SITE} · Manicure, pedicure e unhas em Maputo`;
    document.title = completo;
    meta('meta[name="description"]', "name", "description", descricao);
    meta('meta[property="og:title"]', "property", "og:title", completo);
    meta('meta[property="og:description"]', "property", "og:description", descricao);
    meta('meta[property="og:url"]', "property", "og:url", URL_SITE + window.location.pathname);
    meta('meta[name="robots"]', "name", "robots", indexar ? "index, follow" : "noindex, nofollow");
    canonico(URL_SITE + window.location.pathname);
  }, [titulo, descricao, indexar]);
}

/** Junta a nota média das avaliações publicadas ao JSON-LD do estúdio (estrelas nos resultados do Google). */
export function useNotaNoJsonLd(media: number | undefined, total: number | undefined) {
  useEffect(() => {
    const el = document.getElementById("ld-estudio");
    if (!el || !media || !total) return;
    try {
      const dados = JSON.parse(el.textContent ?? "{}");
      dados.aggregateRating = { "@type": "AggregateRating", ratingValue: Number(media).toFixed(1), reviewCount: total, bestRating: 5, worstRating: 1 };
      el.textContent = JSON.stringify(dados);
    } catch {
      // JSON-LD inválido: deixa ficar o original.
    }
  }, [media, total]);
}
