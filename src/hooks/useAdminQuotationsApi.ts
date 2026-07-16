import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";

type QuotationUI = any;

export function useAdminCotacoes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.cotacoes],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.cotacoes);
      const data = extractApiData<any[] | any>(res.data);
      const list = Array.isArray(data) ? data : [];

      return list.map((raw: any) => ({
        id: String(raw?.id ?? ""),
        clientName: raw?.nome ?? raw?.clientName ?? "",
        clientPhone: raw?.telefone ?? raw?.clientPhone ?? "",
        clientEmail: raw?.email ?? raw?.clientEmail ?? null,
        createdAt: raw?.criadoEm ?? raw?.createdAt ?? "",
        status: raw?.status ?? "",
        estimatedTotal: Number(raw?.totalEstimado ?? raw?.totalEstimado ?? raw?.estimatedTotal ?? 0),
        serviceIds: (raw?.servicosNomes ?? raw?.servicos ?? []).map((x: any) => String(x?.servicoId ?? x?.id ?? x?.servico?.id ?? x)).filter(Boolean),
        message: raw?.mensagem ?? raw?.message ?? null,
      })) as QuotationUI[];
    },
  });
}

