import { CATEGORY_META } from "@/data/mock-services";
import type { Service } from "@/types";

/**
 * A API devolve os campos em português (nome, categoria, preco, duracaoMinutos,
 * destaque, ativo) enquanto o resto do frontend usa o tipo `Service` em inglês
 * (name, category, price, duration, featured). Este helper normaliza qualquer
 * item — vindo da API ou do mock local — para o shape `Service`.
 *
 * Também traduz o valor de `categoria` da API (ex: "Fotografia", "Vídeo",
 * "Edição") para as chaves internas do CATEGORY_META (maos, pes, verniz, ...).
 * Categorias que não têm correspondência não são descartadas: caem em
 * "outros", que é sempre exibido, para nunca perdermos serviços silenciosamente.
 */

// Ajusta este mapa conforme as categorias reais do backend forem definidas.
// Chave: valor que a API pode devolver (case-insensitive) -> categoria interna.
const CATEGORY_ALIASES: Record<string, Service["category"] | "outros"> = {
  maos: "maos",
  "mãos": "maos",
  pes: "pes",
  "pés": "pes",
  verniz: "verniz",
  alongamento: "alongamento",
  manutencao: "manutencao",
  "manutenção": "manutencao",
  remocao: "remocao",
  "remoção": "remocao",
  nailart: "nailart",
  "nail art": "nailart",
  tratamentos: "tratamentos",
  especiais: "especiais",
  premium: "premium",
};

function resolveCategory(raw: unknown): Service["category"] | "outros" {
  if (typeof raw !== "string") return "outros";
  const key = raw.trim().toLowerCase();
  return CATEGORY_ALIASES[key] ?? "outros";
}

export type NormalizedService = Service & { rawCategory?: string };

export function normalizeServico(s: any): NormalizedService {
  return {
    id: String(s.id),
    name: s.nome ?? s.name ?? "",
    category: resolveCategory(s.categoria ?? s.category),
    rawCategory: s.categoria ?? s.category,
    description: s.descricao ?? s.description,
    price: Number(s.preco ?? s.price ?? 0),
    duration: Number(s.duracaoMinutos ?? s.duration ?? 0),
    featured: Boolean(s.destaque ?? s.featured ?? false),
    ativo: s.ativo ?? true,
  } as NormalizedService;
}

export function normalizeServicos(list: any[] | undefined | null): NormalizedService[] {
  return (list ?? [])
    .filter((s) => (s?.ativo ?? true) !== false)
    .map(normalizeServico);
}

// Meta de fallback para categorias sem correspondência no CATEGORY_META,
// para a UI nunca quebrar nem esconder serviços "órfãos".
export const OUTROS_META = { label: "Outros Serviços", tagline: "Fora do menu habitual", icon: "🗂️" };

export function getCategoryMeta(cat: string) {
  return (CATEGORY_META as any)[cat] ?? OUTROS_META;
}