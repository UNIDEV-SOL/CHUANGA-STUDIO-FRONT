import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type {
  ClienteResumo,
  Cotacao,
  EstatisticasAdmin,
  Marcacao,
} from "@/types/api";

export function useAdminEstatisticas() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.estatisticas],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.estatisticas);
      return extractApiData<EstatisticasAdmin>(res.data);
    },
  });
}

export function useAdminMarcacoesProximas() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.marcacoesProximas],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.marcacoesProximas);
      return extractApiData<Marcacao[]>(res.data);
    },
  });
}

export function useAdminAtividadeRecente() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.atividadeRecente],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.atividadeRecente);
      return extractApiData<Marcacao[]>(res.data);
    },
  });
}

export function useAdminClientes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.clientes],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.clientes);
      return extractApiData<ClienteResumo[]>(res.data);
    },
  });
}

export function useAdminMarcacoes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.marcacoes],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.marcacoes);
      return extractApiData<Marcacao[]>(res.data);
    },
  });
}

export function useAdminCotacoes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.cotacoes],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.cotacoes);
      return extractApiData<Cotacao[]>(res.data);
    },
  });
}

