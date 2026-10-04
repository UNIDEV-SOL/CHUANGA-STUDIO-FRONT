import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import { useInfiniteList, type Filtros } from "@/lib/pagination";
import type {
  Avaliacao,
  CriarValeRequest,
  EstadoFidelizacao,
  FidelizacaoConfig,
  PedidoAvaliacao,
  ResumoAvaliacoes,
  SaldoVale,
  Vale,
} from "@/types/api";

async function get<T>(url: string) {
  const res = await apiClient.get(url);
  return extractApiData<T>(res.data);
}

// --- Fidelização ---

export function useFidelizacaoConfig() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.fidelizacaoConfig],
    queryFn: () => get<FidelizacaoConfig>(API_ENDPOINTS.admin.fidelizacaoConfig),
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
    queryFn: () => get<EstadoFidelizacao>(`${API_ENDPOINTS.admin.clientes}/${clienteId}/fidelizacao`),
    enabled: !!clienteId,
  });
}

export function useMinhaFidelizacao(enabled = true) {
  return useQuery({
    queryKey: [API_ENDPOINTS.minhaArea.fidelizacao],
    queryFn: () => get<EstadoFidelizacao>(API_ENDPOINTS.minhaArea.fidelizacao),
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
    ? get<SaldoVale>(`${API_ENDPOINTS.admin.validarVale}?codigo=${c}`)
    : get<SaldoVale>(`${API_ENDPOINTS.publico.vales}/${c}`);
}

// --- Avaliações ---

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
    queryFn: async () => (await get<{ content: Avaliacao[] }>(`${API_ENDPOINTS.publico.avaliacoes}?size=${size}`)).content ?? [],
    staleTime: 5 * 60_000,
  });
}

export function useResumoAvaliacoes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.avaliacoesResumo],
    queryFn: () => get<ResumoAvaliacoes>(API_ENDPOINTS.publico.avaliacoesResumo),
    staleTime: 5 * 60_000,
  });
}

export function usePedidoAvaliacao(token: string | undefined) {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.pedidoAvaliacao, token],
    queryFn: () => get<PedidoAvaliacao>(`${API_ENDPOINTS.publico.pedidoAvaliacao}/${token}`),
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
