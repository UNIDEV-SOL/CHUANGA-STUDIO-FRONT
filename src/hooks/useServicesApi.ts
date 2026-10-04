import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type { Disponibilidade, GaleriaItem, Profissional, Servico, ServicoRequest } from "@/types/api";
import { SEED_SERVICES } from "@/data/mock-services";
import { normalizeServicos } from "@/lib/normalizeServico";
import { buscarTudo, useInfiniteList, type Filtros } from "@/lib/pagination";

export function usePublicServicos() {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.servicos],
    // O catálogo inteiro (algumas dezenas de serviços) numa página grande.
    queryFn: () => buscarTudo<Servico>(API_ENDPOINTS.publico.servicos, {}, 500),
    staleTime: 5 * 60_000,
  });
}

/**
 * Catálogo público normalizado. Se a API falhar, mostra o menu local de
 * referência (`isFallback`) — útil para navegação, mas os IDs locais não
 * existem no backend, por isso reservas/cotações devem ficar bloqueadas.
 */
export function useCatalogo() {
  const query = usePublicServicos();
  const isFallback = query.isError;
  const services = useMemo(
    () => normalizeServicos(isFallback ? SEED_SERVICES : query.data),
    [isFallback, query.data],
  );
  return { services, isLoading: query.isLoading, isFallback, refetch: query.refetch };
}

/** Lista do painel: paginada e filtrada na API (busca, categoria, ativo). */
export function useAdminServicos(filtros: Filtros = {}) {
  return useInfiniteList<Servico>(API_ENDPOINTS.admin.servicos, filtros);
}

function useInvalidateServicos() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.servicos] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.servicos] }),
    ]);
}

export function useAdminSalvarServico() {
  const invalidate = useInvalidateServicos();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: ServicoRequest }) => {
      const res = id
        ? await apiClient.put(`${API_ENDPOINTS.admin.servicos}/${id}`, payload)
        : await apiClient.post(API_ENDPOINTS.admin.servicos, payload);
      return extractApiData<Servico>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminEliminarServico() {
  const invalidate = useInvalidateServicos();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_ENDPOINTS.admin.servicos}/${id}`);
    },
    onSuccess: invalidate,
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

/** Equipa ativa, para a cliente escolher na reserva (vazio = estúdio sem equipa registada). */
export function usePublicProfissionais() {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.profissionais],
    queryFn: () => buscarTudo<Profissional>(API_ENDPOINTS.publico.profissionais, {}, 100),
    staleTime: 5 * 60_000,
  });
}

// --- Províncias e distritos (classificadores) ---

export interface Provincia { id: number; codigo: string; nome: string; sigla: string }
export interface Distrito { id: number; codigo: string; nome: string; provinciaId: number }

export function useProvincias() {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.provincias],
    queryFn: () => buscarTudo<Provincia>(API_ENDPOINTS.publico.provincias, {}, 50),
    staleTime: Infinity,
  });
}

export function useDistritos(provinciaId?: number | string | null) {
  return useQuery({
    queryKey: [API_ENDPOINTS.publico.distritos, provinciaId],
    queryFn: () => buscarTudo<Distrito>(API_ENDPOINTS.publico.distritos, { provinciaId }, 100),
    enabled: !!provinciaId,
    staleTime: Infinity,
  });
}

/** Galeria pública (só fotos publicadas), paginada. */
export function useGaleriaPublica(filtros: Filtros = {}, size = 12) {
  return useInfiniteList<GaleriaItem>(API_ENDPOINTS.publico.galeria, filtros, { size });
}
