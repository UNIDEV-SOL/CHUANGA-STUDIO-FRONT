import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { useQueryClient } from "@tanstack/react-query";

// O painel mostra "Em tempo real": refaz o pedido periodicamente.
export const LIVE = { refetchInterval: 30_000, refetchOnWindowFocus: true } as const;

export async function apiGet<T>(url: string) {
  const res = await apiClient.get(url);
  return extractApiData<T>(res.data);
}

/** Qualquer alteração a marcações afeta lista, dashboard e resumo de clientes. */
export function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0] ?? "").startsWith("/api/admin/"),
    });
}
