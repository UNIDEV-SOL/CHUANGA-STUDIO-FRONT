import axios, { AxiosError } from "axios";
import { ConfigValue } from "@/config";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { clearSession, getToken } from "@/modules/auth/lib/session";

// O backend expõe tudo sob o context-path `/api` e os paths em API_ENDPOINTS
// já incluem esse prefixo. Por isso a base é apenas o host (ver config/index.ts);
// em produção é vazia e os pedidos vão para o próprio domínio (o nginx encaminha /api).
export const apiClient = axios.create({
  baseURL: ConfigValue.API_URL,
  headers: { "Content-Type": "application/json" },
});

/** Erro normalizado: `message` já vem com a mensagem do backend quando existe. */
export class ApiError extends Error {
  readonly status?: number;
  /** Código estável do backend (ex.: TOKEN_EXPIRADO, LIMITE_PEDIDOS, DADOS_INVALIDOS). */
  readonly codigo?: string;
  /** Erros por campo (validação) ou detalhes do erro, quando o backend os envia. */
  readonly dados?: unknown;
  constructor(message: string, status?: number, codigo?: string, dados?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
    this.dados = dados;
  }
}

/** Desembrulha o wrapper `{ sucesso, mensagem, dados, timestamp }`. */
export function extractApiData<T>(data: unknown): T {
  return (data as { dados: T } | undefined)?.dados as T;
}

export function extractApiMensagem(error: unknown): string {
  if (error instanceof Error && !(error instanceof AxiosError)) return error.message;
  const err = error as AxiosError<{ mensagem?: string }>;
  const msg = err?.response?.data?.mensagem;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (err?.code === "ERR_NETWORK") return "Não foi possível contactar o servidor.";
  return err?.message || "Erro inesperado.";
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

const AUTH_PATHS: string[] = [
  API_ENDPOINTS.auth.entrar,
  API_ENDPOINTS.auth.cadastrar,
  API_ENDPOINTS.auth.recuperarSenha,
  API_ENDPOINTS.auth.verificarCodigo,
  API_ENDPOINTS.auth.redefinirSenha,
];

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ codigo?: string; dados?: unknown }>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const mensagem = extractApiMensagem(error);
    // 401 num endpoint de auth = credenciais erradas, não sessão expirada.
    // Nos outros, o backend diz porquê (expirou, conta desativada, palavra-passe trocada...).
    if (status === 401 && !AUTH_PATHS.includes(url) && getToken()) {
      clearSession("expired", mensagem);
    }
    return Promise.reject(new ApiError(mensagem, status, error.response?.data?.codigo, error.response?.data?.dados));
  },
);
