import type { Avaliacao, PedidoAvaliacao, ResumoAvaliacoes } from "@/modules/reviews/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { useInfiniteList, type Filtros } from "@/shared/api/pagination";
import { apiGet } from "@/shared/api/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAvaliacoesAdmin(filtros: Filtros = {}) {
  return useInfiniteList<Avaliacao>(API_ENDPOINTS.admin.avaliacoes, filtros);
}

export function usePublicarAvaliacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, publicada }: { id: string; publicada: boolean }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.avaliacoes}/${id}/publicacao`, { publicada });
      return extractApiData<Avaliacao>(res.data);
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.avaliacoes] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.avaliacoes] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.avaliacoesResumo] }),
    ]),
  });
}

export function useAvaliacoesPublicas(size = 6) {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.avaliacoes, size],
    queryFn: async () => (await apiGet<{ content: Avaliacao[] }>(`${API_ENDPOINTS.publico.avaliacoes}?size=${size}`)).content ?? [],
    staleTime: 5 * 60_000,
  });
}

export function useResumoAvaliacoes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.avaliacoesResumo],
    queryFn: () => apiGet<ResumoAvaliacoes>(API_ENDPOINTS.publico.avaliacoesResumo),
    staleTime: 5 * 60_000,
  });
}

export function usePedidoAvaliacao(token: string | undefined) {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.pedidoAvaliacao, token],
    queryFn: () => apiGet<PedidoAvaliacao>(`${API_ENDPOINTS.publico.pedidoAvaliacao}/${token}`),
    enabled: !!token,
    retry: false,
  });
}

export function useResponderAvaliacao(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dados: { nota: number; comentario?: string }) => {
      await apiClient.post(`${API_ENDPOINTS.publico.pedidoAvaliacao}/${token}`, dados);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.pedidoAvaliacao, token] }),
  });
}
