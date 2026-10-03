import { CATEGORY_META } from "@/data/mock-services";
import type { Service, ServiceCategory } from "@/types";
import type { Servico } from "@/types/api";

/**
 * A API devolve os campos em português (nome, categoria, preco, duracaoMinutos,
 * destaque, ativo) enquanto as páginas públicas usam o tipo `Service`.
 * Este helper normaliza qualquer item — da API ou do catálogo local — para `Service`.
 *
 * A `categoria` da API é texto livre: traduzimos para as chaves do CATEGORY_META.
 * Categorias sem correspondência caem em "outros" (nunca são escondidas).
 */

export type CategoryKey = ServiceCategory | "outros";

const strip = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

const CATEGORY_ALIASES: Record<string, ServiceCategory> = {
  "nail art": "nailart",
  "unhas de gel": "alongamento",
  alongamentos: "alongamento",
  tratamento: "tratamentos",
  especial: "especiais",
};

// Aceita a chave ("maos"), o rótulo ("Cuidados com as Mãos") ou um alias.
export function resolveCategory(raw: unknown): CategoryKey {
  if (typeof raw !== "string" || !raw.trim()) return "outros";
  const key = strip(raw);
  if (key in CATEGORY_META) return key as ServiceCategory;
  if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key];
  const byLabel = (Object.entries(CATEGORY_META) as [ServiceCategory, { label: string }][]).find(
    ([, meta]) => strip(meta.label) === key,
  );
  return byLabel ? byLabel[0] : "outros";
}

export type NormalizedService = Omit<Service, "category"> & {
  category: CategoryKey;
  rawCategory?: string;
  ativo: boolean;
};

type RawService = Partial<Servico> & Partial<Service>;

export function normalizeServico(s: RawService): NormalizedService {
  return {
    id: String(s.id),
    name: s.nome ?? s.name ?? "",
    category: resolveCategory(s.categoria ?? s.category),
    rawCategory: s.categoria ?? s.category,
    description: s.descricao ?? s.description ?? undefined,
    price: Number(s.preco ?? s.price ?? 0),
    duration: Number(s.duracaoMinutos ?? s.duration ?? 0),
    featured: Boolean(s.destaque ?? s.featured ?? false),
    ativo: s.ativo ?? true,
  };
}

export function normalizeServicos(list: RawService[] | undefined | null): NormalizedService[] {
  return (list ?? []).filter((s) => s?.ativo !== false).map(normalizeServico);
}

export const OUTROS_META = { label: "Outros Serviços", tagline: "Fora do menu habitual", icon: "🗂️" };

export function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat as ServiceCategory] ?? OUTROS_META;
}

export const CATEGORY_ORDER = Object.keys(CATEGORY_META) as ServiceCategory[];

/** Agrupa por categoria na ordem do menu; "outros" vai no fim. */
export function groupByCategory<T extends { category: string }>(items: T[]) {
  const order: string[] = [...CATEGORY_ORDER, "outros"];
  const byCat = new Map<string, T[]>();
  for (const s of items) {
    const list = byCat.get(s.category) ?? [];
    list.push(s);
    byCat.set(s.category, list);
  }
  return Array.from(byCat.entries())
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([cat, list]) => ({ cat, meta: getCategoryMeta(cat), items: list }));
}
