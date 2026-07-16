import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type { Cotacao, EstatisticasAdmin, ClienteResumo, Marcacao, Usuario, StatusMarcacao } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { extractApiData } from "@/lib/httpClient";


// Mantém organização por domínio (minha-area)

export function useMinhaAreaPerfil() {
  return useQuery({
    queryKey: [API_ENDPOINTS.minhaArea.perfil],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.minhaArea.perfil);
      return extractApiData<Usuario>(res.data);
    },
    enabled: true,
  });
}

export function useMinhaAreaMarcacoes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.minhaArea.marcacoes],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.minhaArea.marcacoes);
      return extractApiData<Marcacao[]>(res.data);
    },
    enabled: true,
  });
}

export function useMinhaAreaCancelarMarcacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Endpoint no enunciado: PATCH /minha-area/marcacoes/{id}/cancelar
      const res = await apiClient.patch(`${API_ENDPOINTS.minhaArea.marcacoes}/${id}/cancelar`, null);
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.minhaArea.marcacoes] });
    },
  });
}


