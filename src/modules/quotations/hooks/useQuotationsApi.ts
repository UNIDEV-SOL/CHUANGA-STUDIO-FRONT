import type { Cotacao, CriarCotacaoRequest } from "@/modules/quotations/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { useInfiniteList, type Filtros } from "@/shared/api/pagination";
import { useInvalidateAdmin } from "@/shared/api/query";
import { useMutation } from "@tanstack/react-query";

export function useAdminCotacoes(filtros: Filtros = {}) {
  return useInfiniteList<Cotacao>(API_ENDPOINTS.admin.cotacoes, filtros);
}

export function useAdminAtualizarCotacao() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ id, acao }: { id: string; acao: "respondido" | "arquivar" }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.cotacoes}/${id}/${acao}`);
      return extractApiData<Cotacao>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useCriarCotacao() {
  return useMutation({
    mutationFn: async (payload: CriarCotacaoRequest) => {
      const res = await apiClient.post(API_ENDPOINTS.publico.cotacoes, payload);
      return extractApiData<Cotacao>(res.data);
    },
  });
}
