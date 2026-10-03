import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type { Servico, ServicoRequest } from "@/types/api";
import { SEED_SERVICES } from "@/data/mock-services";
import { normalizeServicos } from "@/lib/normalizeServico";

export function usePublicServicos() {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.servicos],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.publico.servicos);
      return extractApiData<Servico[]>(res.data) ?? [];
    },
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

export function useAdminServicos() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.servicos],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.servicos);
      return extractApiData<Servico[]>(res.data) ?? [];
    },
  });
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
