import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import { useInfiniteList } from "@/lib/pagination";
import type {
  CriarCotacaoRequest,
  CriarMarcacaoRequest,
  Cotacao,
  Fatura,
  GaleriaItem,
  Marcacao,
} from "@/types/api";

/** Marcações da cliente (paginadas; a "Minha área" carrega mais ao pedir). */
export function useMinhaAreaMarcacoes(enabled: boolean) {
  return useInfiniteList<Marcacao>(API_ENDPOINTS.minhaArea.marcacoes, {}, { enabled, size: 30 });
}

export function useMinhaAreaFaturas(enabled: boolean) {
  return useInfiniteList<Fatura>(API_ENDPOINTS.minhaArea.faturas, {}, { enabled, size: 20 });
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

export function useCriarCotacao() {
  return useMutation({
    mutationFn: async (payload: CriarCotacaoRequest) => {
      const res = await apiClient.post(API_ENDPOINTS.publico.cotacoes, payload);
      return extractApiData<Cotacao>(res.data);
    },
  });
}

/** Fotos que a cliente sugeriu para a galeria (com o estado da curadoria). */
export function useMinhasSugestoes(enabled: boolean) {
  return useInfiniteList<GaleriaItem>(API_ENDPOINTS.minhaArea.sugestoes, {}, { enabled, size: 12 });
}

export function useSugerirFoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dados: FormData) => {
      const res = await apiClient.post(API_ENDPOINTS.minhaArea.sugestoes, dados, { headers: { "Content-Type": "multipart/form-data" } });
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.minhaArea.sugestoes] }),
  });
}
