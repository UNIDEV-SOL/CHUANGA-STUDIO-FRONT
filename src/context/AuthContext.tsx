import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AppUser } from "@/types";
import type { AutenticacaoResponse, CadastroRequest, Usuario } from "@/types/api";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import {
  clearSession,
  onSessionEnd,
  sessionStore,
  setSession,
  setSessionUser,
} from "@/lib/session";

interface SignUpInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** true enquanto há token mas o perfil ainda não foi carregado. */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signUp: (input: SignUpInput) => Promise<AppUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUsuarioToAppUser(u: Usuario): AppUser {
  return {
    id: u.id,
    name: u.nome,
    email: u.email,
    phone: u.telefone,
    role: u.papel === "ADMIN" ? "admin" : "cliente",
    createdAt: u.criadoEm,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token, user } = sessionStore.useValue();
  const queryClient = useQueryClient();

  // Revalida o token guardado e atualiza os dados do utilizador.
  // Se o token expirou, o interceptor HTTP limpa a sessão (401).
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiClient
      .get(API_ENDPOINTS.minhaArea.perfil)
      .then((res) => {
        if (!cancelled) setSessionUser(mapUsuarioToAppUser(extractApiData<Usuario>(res.data)));
      })
      .catch(() => {
        // Erros de rede não terminam uma sessão já conhecida (401 é tratado no
        // interceptor). Mas sem dados do utilizador não há como continuar.
        if (!cancelled && !sessionStore.get().user) clearSession("logout");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(
    () =>
      onSessionEnd((reason) => {
        queryClient.clear();
        if (reason === "expired") toast.error("Sessão expirada. Inicie sessão novamente.");
      }),
    [queryClient],
  );

  const authenticate = useCallback(async (url: string, body: object) => {
    const res = await apiClient.post(url, body);
    const dados = extractApiData<AutenticacaoResponse>(res.data);
    const mapped = mapUsuarioToAppUser(dados.usuario);
    queryClient.clear();
    setSession(dados.token, mapped);
    return mapped;
  }, [queryClient]);

  const signIn = useCallback(
    (email: string, password: string) =>
      authenticate(API_ENDPOINTS.auth.entrar, { email: email.trim(), senha: password }),
    [authenticate],
  );

  const signUp = useCallback(
    (input: SignUpInput) =>
      authenticate(API_ENDPOINTS.auth.cadastrar, {
        nome: input.name.trim(),
        email: input.email.trim(),
        telefone: input.phone.trim(),
        senha: input.password,
      } satisfies CadastroRequest),
    [authenticate],
  );

  const signOut = useCallback(() => clearSession("logout"), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: token ? user : null,
      isAuthenticated: !!token && !!user,
      isAdmin: !!token && user?.role === "admin",
      isLoading: !!token && !user,
      signIn,
      signUp,
      signOut,
    }),
    [token, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
