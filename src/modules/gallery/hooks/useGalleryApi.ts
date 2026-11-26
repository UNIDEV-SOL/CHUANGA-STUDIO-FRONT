import type { GaleriaItem } from "@/modules/gallery/models";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { buscarPagina, useInfiniteList, type Filtros } from "@/shared/api/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminGaleria(filtros: Filtros = {}) {
  return useInfiniteList<GaleriaItem>(API_ENDPOINTS.admin.galeria, filtros, { size: 24 });
}

function useInvalidateGaleria() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.galeria] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.galeria] }),
    ]);
}

export function useCarregarFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async (dados: FormData) => {
      const res = await apiClient.post(API_ENDPOINTS.admin.galeria, dados, { headers: { "Content-Type": "multipart/form-data" } });
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAtualizarFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; titulo?: string | null; descricao?: string | null; categoria?: string | null; publicado?: boolean; destaque?: boolean; ordem?: number }) => {
      const res = await apiClient.put(`${API_ENDPOINTS.admin.galeria}/${id}`, payload);
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useRemoverFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_ENDPOINTS.admin.galeria}/${id}`);
    },
    onSuccess: invalidate,
  });
}

export function useSubstituirFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: FormData }) => {
      const res = await apiClient.put(`${API_ENDPOINTS.admin.galeria}/${id}/imagem`, dados, { headers: { "Content-Type": "multipart/form-data" } });
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useCuradoriaFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async ({ id, acao, motivo }: { id: string; acao: "aprovar" | "rejeitar"; motivo?: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.galeria}/${id}/${acao}`, acao === "rejeitar" ? { motivo } : undefined);
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: invalidate,
  });
}

/** Nº de sugestões por aprovar (para o separador do painel). */
export function useSugestoesPendentes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.galeria, "pendentes"],
    queryFn: async () => (await buscarPagina<GaleriaItem>(API_ENDPOINTS.admin.galeria, { estado: "PENDENTE" }, 0, 1)).totalItems,
    refetchInterval: 60_000,
  });
}

/** Fotos que a cliente sugeriu para a galeria (com o estado da curadoria). */
export function useMinhasSugestoes(enabled: boolean) {
  return useInfiniteList<GaleriaItem>(API_ENDPOINTS.minhaArea.sugestoes, {}, { enabled, size: 12 });
}

export function useSugerirFoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dados: FormData) => {
      const res = await apiClient.post(API_ENDPOINTS.minhaArea.sugestoes, dados, { headers: { "Content-Type": "multipart/form-data" } });
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.minhaArea.sugestoes] }),
  });
}

/** Galeria pública (só fotos publicadas), paginada. */
export function useGaleriaPublica(filtros: Filtros = {}, size = 12) {
  return useInfiniteList<GaleriaItem>(API_ENDPOINTS.publico.galeria, filtros, { size });
}
