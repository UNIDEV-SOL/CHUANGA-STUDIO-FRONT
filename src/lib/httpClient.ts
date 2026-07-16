import axios from "axios";
import { toast } from "sonner";

type AxiosRequestConfigLike = {
  headers?: Record<string, any>;
};


const getApiBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  // Enunciado: Base URL da API: http://localhost:8080/api
  // Então aqui retornamos exatamente esse valor.
  return fromEnv?.replace(/\/$/, "") || "http://localhost:8080/";
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

const TOKEN_KEY = "chuanga:token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export function extractApiData<T>(data: any): T {
  // Wrapper: { sucesso, mensagem, dados, timestamp }
  return data?.dados as T;
}

export function extractApiMensagem(error: unknown): string {
  const anyErr = error as any;
  const msg = anyErr?.response?.data?.mensagem;
  if (typeof msg === "string" && msg.trim().length) return msg;
  return anyErr?.message || "Erro inesperado.";
}

// Request interceptor: injeta token quando existir
apiClient.interceptors.request.use((config: any) => {
  const token = getToken();
  if (token) {
    config.headers = (config.headers ?? {}) as AxiosRequestConfigLike["headers"];
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Response interceptor: trata 401
apiClient.interceptors.response.use(
  (res: any) => res,
  (error: any) => {
    const status = error?.response?.status;
    if (status === 401) {
      setToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/entrar";
      }
      toast.error("Sessão expirada. Faça login novamente.");
    }
    return Promise.reject(error);
  },
);


