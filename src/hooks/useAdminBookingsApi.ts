import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type { Servico } from "@/types/api";
import { normalizeBookingStatus } from "@/lib/normalizeBookingStatus";

export function useAdminMarcacoes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.marcacoes],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.marcacoes);
      const data = extractApiData<any[] | any>(res.data);
      const list = Array.isArray(data) ? data : [];

      return list.map((raw: any) => {
        const servicos = raw?.servicos ?? raw?.serviceItems ?? [];
        const status = normalizeBookingStatus(raw?.status) ?? "aguardando_pagamento";

        return {
          id: String(raw?.id ?? ""),
          clientName: raw?.clienteNome ?? raw?.clientName ?? raw?.cliente?.nome ?? "",
          clientPhone: raw?.clienteTelefone ?? raw?.clientPhone ?? raw?.cliente?.telefone ?? "",
          date: raw?.data ?? raw?.date ?? "",
          time: raw?.hora ?? raw?.time ?? "",
          status,
          totalPrice: Number(raw?.valorTotal ?? raw?.totalPrice ?? 0),
          serviceIds: (servicos ?? []).map((s: any) => String(s?.servicoId ?? s?.id ?? s?.servico?.id ?? "")).filter(Boolean),
          notes: raw?.notas ?? raw?.notes,
          advancePaid: raw?.adiantamentoPago ?? raw?.advancePaid,
          advanceProof: raw?.referenciaAdiantamento ?? raw?.advanceProof,
        };
      });
    },
  });
}


export function useAdminServicos() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.servicos],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.admin.servicos);
      const data = extractApiData<Servico[] | any>(res.data);
      return (Array.isArray(data) ? data : []).map((s: any) => ({
        id: String(s?.id ?? ""),
        name: s?.nome ?? s?.name ?? "",
        category: s?.categoria,
        price: s?.preco,
        duration: s?.duracaoMinutos,
        description: s?.descricao ?? null,
        featured: !!s?.destaque,
        ativo: !!s?.ativo,
        nome: s?.nome,
      }));
    },
  });
}

