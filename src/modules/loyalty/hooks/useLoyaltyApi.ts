import type { CriarValeRequest, EstadoFidelizacao, FidelizacaoConfig, SaldoVale, Vale } from "@/modules/loyalty/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { useInfiniteList, type Filtros } from "@/shared/api/pagination";
import { apiGet } from "@/shared/api/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useFidelizacaoConfig() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.fidelizacaoConfig],
    queryFn: () => apiGet<FidelizacaoConfig>(API_ENDPOINTS.admin.fidelizacaoConfig),
  });
}

export function useGuardarFidelizacaoConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: FidelizacaoConfig) => {
      const res = await apiClient.put(API_ENDPOINTS.admin.fidelizacaoConfig, config);
      return extractApiData<FidelizacaoConfig>(res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.fidelizacaoConfig] }),
  });
}

/** Cartão de carimbos de uma cliente (no fecho de conta). */
export function useFidelizacaoCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.clientes, clienteId, "fidelizacao"],
    queryFn: () => apiGet<EstadoFidelizacao>(`${API_ENDPOINTS.admin.clientes}/${clienteId}/fidelizacao`),
    enabled: !!clienteId,
  });
}

export function useMinhaFidelizacao(enabled = true) {
  return useQuery({
    queryKey: [API_ENDPOINTS.minhaArea.fidelizacao],
    queryFn: () => apiGet<EstadoFidelizacao>(API_ENDPOINTS.minhaArea.fidelizacao),
    enabled,
  });
}

// --- Vales-oferta ---

export function useVales(filtros: Filtros = {}) {
  return useInfiniteList<Vale>(API_ENDPOINTS.admin.vales, filtros);
}

export function useCriarVale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dados: CriarValeRequest) => {
      const res = await apiClient.post(API_ENDPOINTS.admin.vales, dados);
      return extractApiData<Vale>(res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.vales] }),
  });
}

export function useAnularVale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.vales}/${id}/anular`);
      return extractApiData<Vale>(res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.vales] }),
  });
}

/** Valida o código na caixa (admin) ou mostra o saldo no site (público). */
export async function consultarVale(codigo: string, admin: boolean) {
  const c = encodeURIComponent(codigo.trim().toUpperCase());
  return admin
    ? apiGet<SaldoVale>(`${API_ENDPOINTS.admin.validarVale}?codigo=${c}`)
    : apiGet<SaldoVale>(`${API_ENDPOINTS.publico.vales}/${c}`);
}

// --- Avaliações ---
