import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type {
  CriarCotacaoRequest,
  CriarMarcacaoRequest,
  Cotacao,
  Marcacao,
} from "@/types/api";

export function useMinhaAreaMarcacoes(enabled: boolean) {
  return useQuery({
    queryKey: [API_ENDPOINTS.minhaArea.marcacoes],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.minhaArea.marcacoes);
      return extractApiData<Marcacao[]>(res.data) ?? [];
    },
    enabled,
  });
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

export function useCriarCotacao() {
  return useMutation({
    mutationFn: async (payload: CriarCotacaoRequest) => {
      const res = await apiClient.post(API_ENDPOINTS.publico.cotacoes, payload);
      return extractApiData<Cotacao>(res.data);
    },
  });
}
