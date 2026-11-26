import type { ClienteDetalhe, ClienteResumo } from "@/modules/clients/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient } from "@/shared/api/httpClient";
import { useInfiniteList, type Filtros } from "@/shared/api/pagination";
import { apiGet } from "@/shared/api/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminClientes(filtros: Filtros = {}) {
  return useInfiniteList<ClienteResumo>(API_ENDPOINTS.admin.clientes, filtros);
}

export function useAdminClienteDetalhe(id: string | null) {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.clientes, id],
    queryFn: () => apiGet<ClienteDetalhe>(`${API_ENDPOINTS.admin.clientes}/${id}`),
    enabled: !!id,
  });
}

export function useAdminGuardarNotasCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas: string }) => {
      await apiClient.patch(`${API_ENDPOINTS.admin.clientes}/${id}/notas`, { notas });
    },
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.clientes, id] }),
  });
}
