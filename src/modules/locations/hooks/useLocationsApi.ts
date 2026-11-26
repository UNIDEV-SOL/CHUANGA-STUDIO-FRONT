import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { buscarTudo } from "@/shared/api/pagination";
import { useQuery } from "@tanstack/react-query";

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
