import type { EmitirFaturaRequest, Fatura, RegistarPagamentoFaturaRequest } from "@/modules/invoices/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { useInfiniteList, type Filtros } from "@/shared/api/pagination";
import { LIVE, apiGet, useInvalidateAdmin } from "@/shared/api/query";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useAdminFaturas(filtros: Filtros = {}) {
  return useInfiniteList<Fatura>(API_ENDPOINTS.admin.faturas, filtros, { refetchInterval: LIVE.refetchInterval });
}

export function useAdminFatura(id: string | null) {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.faturas, "detalhe", id],
    queryFn: () => apiGet<Fatura>(`${API_ENDPOINTS.admin.faturas}/${id}`),
    enabled: !!id,
  });
}

/** Fecho de conta na caixa: emite a fatura e conclui a marcação. */
export function useAdminEmitirFatura() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ marcacaoId, ...payload }: EmitirFaturaRequest & { marcacaoId: string }) => {
      const res = await apiClient.post(`${API_ENDPOINTS.admin.marcacoes}/${marcacaoId}/fatura`, payload);
      return extractApiData<Fatura>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminPagarFatura() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ id, ...payload }: RegistarPagamentoFaturaRequest & { id: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.faturas}/${id}/pagar`, payload);
      return extractApiData<Fatura>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminAnularFatura() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.faturas}/${id}/anular`);
      return extractApiData<Fatura>(res.data);
    },
    onSuccess: invalidate,
  });
}

/** Reenvio manual (ex.: o cliente diz que não recebeu). Sem email vai para o da conta. */
export function useAdminReenviarFatura() {
  return useMutation({
    mutationFn: async ({ id, email }: { id: string; email?: string }) => {
      await apiClient.post(`${API_ENDPOINTS.admin.faturas}/${id}/reenviar`, email ? { email } : {});
    },
  });
}

export function useMinhaAreaFaturas(enabled: boolean) {
  return useInfiniteList<Fatura>(API_ENDPOINTS.minhaArea.faturas, {}, { enabled, size: 20 });
}
