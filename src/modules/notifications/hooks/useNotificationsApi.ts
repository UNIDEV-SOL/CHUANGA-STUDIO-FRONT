import type { Notificacao } from "@/modules/notifications/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient } from "@/shared/api/httpClient";
import { useInfiniteList } from "@/shared/api/pagination";
import { apiGet } from "@/shared/api/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useNotificacoesResumo() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.notificacoes, "resumo"],
    queryFn: () => apiGet<{ naoLidas: number }>(`${API_ENDPOINTS.admin.notificacoes}/resumo`),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
}

export function useNotificacoes(soNaoLidas: boolean, enabled: boolean) {
  return useInfiniteList<Notificacao>(API_ENDPOINTS.admin.notificacoes, { naoLidas: soNaoLidas || undefined }, { size: 15, enabled });
}

function useInvalidateNotificacoes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.notificacoes] });
}

export function useMarcarNotificacaoLida() {
  const invalidate = useInvalidateNotificacoes();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`${API_ENDPOINTS.admin.notificacoes}/${id}/lida`);
    },
    onSuccess: invalidate,
  });
}

export function useMarcarTodasNotificacoesLidas() {
  const invalidate = useInvalidateNotificacoes();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch(`${API_ENDPOINTS.admin.notificacoes}/lidas`);
    },
    onSuccess: invalidate,
  });
}

// --- Galeria (painel) ---
