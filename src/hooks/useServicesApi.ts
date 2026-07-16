import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type { Servico, ServicoRequest } from "@/types/api";


export function usePublicServicos() {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.servicos],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.publico.servicos);
      return extractApiData<Servico[]>(res.data);
    },
  });
}


export function useAdminServicos() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.servicos],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.servicos);
      return extractApiData<Servico[]>(res.data);
    },
  });
}

export function useAdminUpsertServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { method: "POST" | "PUT"; id?: string; payload: ServicoRequest }) => {
      const { method, id, payload } = input;
      if (method === "POST") {
        const res = await apiClient.post(API_ENDPOINTS.admin.servicos, payload);
        return extractApiData<Servico>(res.data);
      }
      if (!id) throw new Error("id é obrigatório para PUT");
      const res = await apiClient.put(`${API_ENDPOINTS.admin.servicos}/${id}`, payload);
      return extractApiData<Servico>(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.servicos] });
    },
  });
}

export function useAdminDeleteServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`${API_ENDPOINTS.admin.servicos}/${id}`);
      return extractApiData<null>(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.servicos] });
    },
  });
}

