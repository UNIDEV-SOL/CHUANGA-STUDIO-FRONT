import { setSessionToken } from "@/modules/auth/lib/session";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { useMutation } from "@tanstack/react-query";

/** Qualquer utilizador autenticado (admin ou cliente). */
export function useTrocarSenha() {
  return useMutation({
    mutationFn: async (payload: { senhaAtual: string; novaSenha: string }) => {
      const res = await apiClient.patch(API_ENDPOINTS.minhaArea.senha, payload);
      // O backend termina as sessões antigas (incluindo esta) e devolve um token novo.
      const dados = extractApiData<{ token: string }>(res.data);
      if (dados?.token) setSessionToken(dados.token);
    },
  });
}

// --- Notificações do sistema (sino do painel) ---
