import type { CriarMarcacaoRequest, Marcacao, StatusMarcacao } from "@/modules/bookings/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { useInfiniteList, type Filtros } from "@/shared/api/pagination";
import { LIVE, apiGet, useInvalidateAdmin } from "@/shared/api/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminMarcacoes(filtros: Filtros = {}) {
  return useInfiniteList<Marcacao>(API_ENDPOINTS.admin.marcacoes, filtros, { refetchInterval: LIVE.refetchInterval });
}

export function useAdminMarcacao(id: string | null) {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.marcacoes, "detalhe", id],
    queryFn: () => apiGet<Marcacao>(`${API_ENDPOINTS.admin.marcacoes}/${id}`),
    enabled: !!id,
  });
}

export function useAdminAtualizarStatusMarcacao() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusMarcacao }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.marcacoes}/${id}/status`, { status });
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminConfirmarPagamento() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.marcacoes}/${id}/confirmar-pagamento`);
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminEliminarMarcacao() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_ENDPOINTS.admin.marcacoes}/${id}`);
    },
    onSuccess: invalidate,
  });
}

export function useAdminRemarcar() {
  const invalidate = useInvalidateAdmin();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, hora }: { id: string; data: string; hora: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.marcacoes}/${id}/remarcar`, { data, hora });
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: () =>
      Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.disponibilidade] })]),
  });
}

export function useAdminAtribuirProfissional() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ id, profissionalId }: { id: string; profissionalId: string | null }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.marcacoes}/${id}/profissional`, { profissionalId });
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: invalidate,
  });
}

/** Marcações da cliente (paginadas; a "Minha área" carrega mais ao pedir). */
export function useMinhaAreaMarcacoes(enabled: boolean) {
  return useInfiniteList<Marcacao>(API_ENDPOINTS.minhaArea.marcacoes, {}, { enabled, size: 30 });
}

export function useMinhaAreaCancelarMarcacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.minhaArea.marcacoes}/${id}/cancelar`);
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.minhaArea.marcacoes] }),
  });
}

export function useMinhaAreaRemarcar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, hora }: { id: string; data: string; hora: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.minhaArea.marcacoes}/${id}/remarcar`, { data, hora });
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.minhaArea.marcacoes] }),
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.disponibilidade] }),
      ]),
  });
}

export function useCriarMarcacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CriarMarcacaoRequest) => {
      const res = await apiClient.post(API_ENDPOINTS.publico.marcacoes, payload);
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.minhaArea.marcacoes] }),
  });
}
