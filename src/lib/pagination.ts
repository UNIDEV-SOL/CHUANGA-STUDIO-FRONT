import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { apiClient, extractApiData } from "./httpClient";

/** Página da API (mesmo formato do SPO-BACK: PageResponse). */
export interface PageResponse<T> {
  isFirst: boolean;
  totalItems: number;
  size: number;
  isLast: boolean;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  currentPage: number;
  content: T[];
}

export type Filtros = Record<string, string | number | boolean | null | undefined>;

/** Só envia os filtros preenchidos (a API trata os ausentes como "todos"). */
export function paramsDe(filtros: Filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "todas" && v !== "todos") params.set(k, String(v));
  });
  return params;
}

export async function buscarPagina<T>(url: string, filtros: Filtros = {}, page = 0, size = 20, sort?: string) {
  const params = paramsDe(filtros);
  params.set("page", String(page));
  params.set("size", String(size));
  if (sort) params.set("sort", sort);
  const res = await apiClient.get(`${url}?${params}`);
  return extractApiData<PageResponse<T>>(res.data);
}

/** Listas curtas usadas inteiras (catálogo, equipa, províncias): uma página grande basta. */
export async function buscarTudo<T>(url: string, filtros: Filtros = {}, size = 500) {
  return (await buscarPagina<T>(url, filtros, 0, size)).content ?? [];
}

/**
 * Lista com scroll infinito: os filtros vão para a API e fazem parte da chave de cache,
 * por isso mudar um filtro recomeça da página 0.
 */
export function useInfiniteList<T>(
  url: string,
  filtros: Filtros = {},
  opcoes: { size?: number; sort?: string; enabled?: boolean; refetchInterval?: number; chave?: QueryKey } = {},
) {
  const { size = 20, sort, enabled = true, refetchInterval } = opcoes;
  const query = useInfiniteQuery({
    queryKey: [url, "paginado", filtros, size, sort, ...(opcoes.chave ?? [])],
    queryFn: ({ pageParam }) => buscarPagina<T>(url, filtros, pageParam, size, sort),
    initialPageParam: 0,
    getNextPageParam: (ultima) => (ultima?.hasNext ? ultima.currentPage + 1 : undefined),
    enabled,
    refetchInterval,
  });
  const items = query.data?.pages.flatMap((p) => p?.content ?? []) ?? [];
  return {
    query,
    items,
    total: query.data?.pages[0]?.totalItems ?? 0,
    hasMore: !!query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
  };
}
