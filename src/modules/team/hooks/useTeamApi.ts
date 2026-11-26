import type { Usuario } from "@/modules/auth/models";
import type { Profissional } from "@/modules/team/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { buscarTudo } from "@/shared/api/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminProfissionais() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.profissionais],
    queryFn: () => buscarTudo<Profissional>(API_ENDPOINTS.admin.profissionais, {}, 100),
  });
}

/** Mudar a equipa muda a capacidade: invalida também a disponibilidade e a lista pública. */
function useInvalidateEquipa() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.profissionais] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.profissionais] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.disponibilidade] }),
    ]);
}

export function useAdminGuardarProfissional() {
  const onSuccess = useInvalidateEquipa();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id?: string; nome: string; telefone?: string | null; ativo: boolean; ordem: number }) => {
      const res = id
        ? await apiClient.put(`${API_ENDPOINTS.admin.profissionais}/${id}`, payload)
        : await apiClient.post(API_ENDPOINTS.admin.profissionais, payload);
      return extractApiData<Profissional>(res.data);
    },
    onSuccess,
  });
}

export function useAdminRemoverProfissional() {
  const onSuccess = useInvalidateEquipa();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_ENDPOINTS.admin.profissionais}/${id}`);
    },
    onSuccess,
  });
}

export function useAdminUtilizadores() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.utilizadores],
    queryFn: () => buscarTudo<Usuario>(API_ENDPOINTS.admin.utilizadores, {}, 100),
  });
}

export function useAdminCriarUtilizador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { nome: string; email: string; telefone?: string; senha: string }) => {
      const res = await apiClient.post(API_ENDPOINTS.admin.utilizadores, payload);
      return extractApiData<Usuario>(res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.utilizadores] }),
  });
}

export function useAdminAtivarUtilizador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.utilizadores}/${id}/ativo`, { ativo });
      return extractApiData<Usuario>(res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.utilizadores] }),
  });
}

/** Equipa ativa, para a cliente escolher na reserva (vazio = estúdio sem equipa registada). */
export function usePublicProfissionais() {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.profissionais],
    queryFn: () => buscarTudo<Profissional>(API_ENDPOINTS.publico.profissionais, {}, 100),
    staleTime: 5 * 60_000,
  });
}

// --- Províncias e distritos (classificadores) ---
