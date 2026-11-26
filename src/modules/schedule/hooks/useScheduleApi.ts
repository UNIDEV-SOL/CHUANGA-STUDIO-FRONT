import type { ConfiguracaoHorario, Disponibilidade, HorarioDia } from "@/modules/schedule/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { apiGet } from "@/shared/api/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminHorario() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.horario],
    queryFn: () => apiGet<ConfiguracaoHorario>(API_ENDPOINTS.admin.horario),
  });
}

/** Horário e dias fechados mudam as horas livres da reserva: invalida também a disponibilidade. */
function useInvalidateHorario() {
  const queryClient = useQueryClient();
  return (data: ConfiguracaoHorario) => {
    queryClient.setQueryData([API_ENDPOINTS.admin.horario], data);
    return queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.disponibilidade] });
  };
}

export function useAdminGuardarHorario() {
  const onSuccess = useInvalidateHorario();
  return useMutation({
    mutationFn: async (semana: HorarioDia[]) => {
      const res = await apiClient.put(API_ENDPOINTS.admin.horario, { semana });
      return extractApiData<ConfiguracaoHorario>(res.data);
    },
    onSuccess,
  });
}

export function useAdminAdicionarDiaFechado() {
  const onSuccess = useInvalidateHorario();
  return useMutation({
    mutationFn: async (payload: { data: string; motivo?: string }) => {
      const res = await apiClient.post(API_ENDPOINTS.admin.diasFechados, payload);
      return extractApiData<ConfiguracaoHorario>(res.data);
    },
    onSuccess,
  });
}

export function useAdminRemoverDiaFechado() {
  const onSuccess = useInvalidateHorario();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`${API_ENDPOINTS.admin.diasFechados}/${id}`);
      return extractApiData<ConfiguracaoHorario>(res.data);
    },
    onSuccess,
  });
}

/** Horas de início livres num dia para os serviços escolhidos (o backend calcula a duração). */
export function useDisponibilidade(
  data: string,
  servicosIds: string[],
  enabled = true,
  ignorarMarcacaoId?: string,
  profissionalId?: string,
) {
  const ids = [...servicosIds].sort();
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.disponibilidade, data, ids, ignorarMarcacaoId ?? null, profissionalId ?? null],
    queryFn: async () => {
      const params = new URLSearchParams({ data });
      ids.forEach((id) => params.append("servicosIds", id));
      if (ignorarMarcacaoId) params.set("ignorarMarcacaoId", ignorarMarcacaoId);
      if (profissionalId) params.set("profissionalId", profissionalId);
      const res = await apiClient.get(`${API_ENDPOINTS.publico.disponibilidade}?${params}`);
      return extractApiData<Disponibilidade>(res.data);
    },
    enabled: enabled && !!data,
    staleTime: 30_000,
  });
}
