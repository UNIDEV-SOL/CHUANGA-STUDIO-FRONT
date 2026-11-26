import type { Marcacao } from "@/modules/bookings/models";
import type { EstatisticasAdmin, RelatorioCaixa } from "@/modules/reports/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { buscarTudo } from "@/shared/api/pagination";
import { LIVE, apiGet } from "@/shared/api/query";
import { useQuery } from "@tanstack/react-query";

export function useAdminEstatisticas() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.estatisticas],
    queryFn: () => apiGet<EstatisticasAdmin>(API_ENDPOINTS.admin.estatisticas),
    ...LIVE,
  });
}

export function useAdminMarcacoesProximas() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.marcacoesProximas],
    queryFn: () => buscarTudo<Marcacao>(API_ENDPOINTS.admin.marcacoesProximas, {}, 10),
    ...LIVE,
  });
}

export function useAdminAtividadeRecente() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.atividadeRecente],
    queryFn: () => buscarTudo<Marcacao>(API_ENDPOINTS.admin.atividadeRecente, {}, 10),
    ...LIVE,
  });
}

// --- Listas paginadas (scroll infinito; filtros enviados à API) ---

export function useAdminRelatorioCaixa(inicio: string, fim: string) {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.relatorioCaixa, inicio, fim],
    queryFn: () => apiGet<RelatorioCaixa>(`${API_ENDPOINTS.admin.relatorioCaixa}?inicio=${inicio}&fim=${fim}`),
    enabled: !!inicio && !!fim && inicio <= fim,
  });
}

// --- Fase 3: equipa, ficha da cliente, utilizadores ---
