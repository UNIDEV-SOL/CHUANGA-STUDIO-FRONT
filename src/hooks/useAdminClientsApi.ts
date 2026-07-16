import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";

type ClienteUI = any;

type ClienteRaw = any;

function mapCliente(raw: ClienteRaw): ClienteUI {
  return {
    id: String(raw?.id ?? ""),
    name: raw?.nome ?? raw?.name ?? "",
    email: raw?.email ?? "",
    telefone: raw?.telefone ?? raw?.phone ?? "",
    createdAt: raw?.criadoEm ?? raw?.createdAt ?? "",
    count: raw?.totalMarcacoes ?? raw?.count ?? 0,
    spent: raw?.totalInvestido ?? raw?.spent ?? 0,
  };
}

export function useAdminClientes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.clientes],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.clientes);
      const data = extractApiData<ClienteRaw[] | any>(res.data);
      const list = Array.isArray(data) ? data : [];
      return list.map(mapCliente);
    },
  });
}

