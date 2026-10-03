import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type {
  ClienteResumo,
  Cotacao,
  EstatisticasAdmin,
  Marcacao,
  StatusMarcacao,
} from "@/types/api";

// O painel mostra "Em tempo real": refaz o pedido periodicamente.
const LIVE = { refetchInterval: 30_000, refetchOnWindowFocus: true } as const;

async function get<T>(url: string) {
  const res = await apiClient.get(url);
  return extractApiData<T>(res.data);
}

export function useAdminEstatisticas() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.estatisticas],
    queryFn: () => get<EstatisticasAdmin>(API_ENDPOINTS.admin.estatisticas),
    ...LIVE,
  });
}

export function useAdminMarcacoesProximas() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.marcacoesProximas],
    queryFn: async () => (await get<Marcacao[]>(API_ENDPOINTS.admin.marcacoesProximas)) ?? [],
    ...LIVE,
  });
}

export function useAdminAtividadeRecente() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.atividadeRecente],
    queryFn: async () => (await get<Marcacao[]>(API_ENDPOINTS.admin.atividadeRecente)) ?? [],
    ...LIVE,
  });
}

export function useAdminClientes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.clientes],
    queryFn: async () => (await get<ClienteResumo[]>(API_ENDPOINTS.admin.clientes)) ?? [],
  });
}

export function useAdminMarcacoes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.marcacoes],
    queryFn: async () => (await get<Marcacao[]>(API_ENDPOINTS.admin.marcacoes)) ?? [],
    ...LIVE,
  });
}

export function useAdminCotacoes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.cotacoes],
    queryFn: async () => (await get<Cotacao[]>(API_ENDPOINTS.admin.cotacoes)) ?? [],
  });
}

/** Qualquer alteração a marcações afeta lista, dashboard e resumo de clientes. */
function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0] ?? "").startsWith("/api/admin/"),
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
