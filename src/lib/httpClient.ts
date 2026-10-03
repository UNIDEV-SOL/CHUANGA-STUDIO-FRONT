import axios, { AxiosError } from "axios";
import { API_ENDPOINTS } from "./apiEndpoints";
import { clearSession, getToken } from "./session";

// O backend expõe tudo sob o context-path `/api` e os paths em API_ENDPOINTS
// já incluem esse prefixo. Por isso a base é apenas o host — se o .env vier
// com `/api` no fim, removemos para não gerar `/api/api/...`.
const getApiBaseUrl = () => {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const base = fromEnv || "http://localhost:8080";
  return base.replace(/\/+$/, "").replace(/\/api$/, "");
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

/** Erro normalizado: `message` já vem com a mensagem do backend quando existe. */
export class ApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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

const AUTH_PATHS: string[] = [API_ENDPOINTS.auth.entrar, API_ENDPOINTS.auth.cadastrar];

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    // 401 num endpoint de auth = credenciais erradas, não sessão expirada.
    if (status === 401 && !AUTH_PATHS.includes(url) && getToken()) {
      clearSession("expired");
    }
    return Promise.reject(new ApiError(extractApiMensagem(error), status));
  },
);
