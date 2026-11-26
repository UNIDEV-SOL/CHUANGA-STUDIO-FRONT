import { SEED_SERVICES } from "@/modules/catalog/data/mock-services";
import { normalizeServicos } from "@/modules/catalog/lib/normalizeServico";
import type { Servico, ServicoRequest } from "@/modules/catalog/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { buscarTudo, useInfiniteList, type Filtros } from "@/shared/api/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export function usePublicServicos() {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.servicos],
    // O catálogo inteiro (algumas dezenas de serviços) numa página grande.
    queryFn: () => buscarTudo<Servico>(API_ENDPOINTS.publico.servicos, {}, 500),
    staleTime: 5 * 60_000,
  });
}

/**
 * Catálogo público normalizado. Se a API falhar, mostra o menu local de
 * referência (`isFallback`) — útil para navegação, mas os IDs locais não
 * existem no backend, por isso reservas/cotações devem ficar bloqueadas.
 */
export function useCatalogo() {
  const query = usePublicServicos();
  const isFallback = query.isError;
  const services = useMemo(
    () => normalizeServicos(isFallback ? SEED_SERVICES : query.data),
    [isFallback, query.data],
  );
  return { services, isLoading: query.isLoading, isFallback, refetch: query.refetch };
}

/** Lista do painel: paginada e filtrada na API (busca, categoria, ativo). */
export function useAdminServicos(filtros: Filtros = {}) {
  return useInfiniteList<Servico>(API_ENDPOINTS.admin.servicos, filtros);
}

function useInvalidateServicos() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.servicos] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.servicos] }),
    ]);
}

export function useAdminSalvarServico() {
  const invalidate = useInvalidateServicos();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: ServicoRequest }) => {
      const res = id
        ? await apiClient.put(`${API_ENDPOINTS.admin.servicos}/${id}`, payload)
        : await apiClient.post(API_ENDPOINTS.admin.servicos, payload);
      return extractApiData<Servico>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminEliminarServico() {
  const invalidate = useInvalidateServicos();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_ENDPOINTS.admin.servicos}/${id}`);
    },
    onSuccess: invalidate,
  });
}
