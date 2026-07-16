import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { AppUser } from "@/types";
import { auth, sessionStore, usersStore } from "@/data/store";
import { apiClient, extractApiData, extractApiMensagem, setToken } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type { Usuario } from "@/types/api";

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => AppUser;
  signUp: (input: { name: string; email: string; phone?: string; password: string }) => AppUser;
  signInWithGoogle: () => AppUser;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUsuarioToAppUser(u: Usuario): AppUser {
  // Frontend historicamente usa role: "admin" | "cliente"
  // Backend usa papel: "ADMIN" | "CLIENTE".
  const role = u.papel === "ADMIN" ? "admin" : "cliente";
  return {
    id: u.id,
    name: u.nome,
    email: u.email,
    phone: u.telefone,
    role,
    createdAt: u.criadoEm,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {

  const session = sessionStore.useValue();
  const users = usersStore.useValue();
  const user = useMemo(
    () => users.find((u) => u.id === session.userId) ?? null,
    [users, session.userId],
  );

  const signIn = (email: string, password: string) => {
    return (async () => {
      try {
        const res = await apiClient.post(API_ENDPOINTS.auth.entrar, { email, senha: password });
        const dados = extractApiData<{ token: string; usuario: Usuario }>(res.data);
        setToken(dados.token);

        const mapped = mapUsuarioToAppUser(dados.usuario);
        usersStore.set((prev) => {
          const idx = prev.findIndex((x) => x.id === mapped.id);
          if (idx === -1) return [...prev, { ...mapped } as any];
          const next = [...prev];
          next[idx] = { ...(next[idx] as any), ...mapped };
          return next;
        });
        sessionStore.set({ userId: mapped.id });
        return mapped;
      } catch (e) {
        throw new Error(extractApiMensagem(e));
      }
    })() as any;
  };

  const signUp = (input: { name: string; email: string; phone?: string; password: string }) => {
    return (async () => {
      try {
        const res = await apiClient.post(API_ENDPOINTS.auth.cadastrar, {
          nome: input.name,
          email: input.email,
          telefone: input.phone,
          senha: input.password,
        });
        const dados = extractApiData<{ token: string; usuario: Usuario }>(res.data);
        setToken(dados.token);

        const mapped = mapUsuarioToAppUser(dados.usuario);
        usersStore.set((prev) => {
          const idx = prev.findIndex((x) => x.id === mapped.id);
          if (idx === -1) return [...prev, { ...mapped } as any];
          const next = [...prev];
          next[idx] = { ...(next[idx] as any), ...mapped };
          return next;
        });
        sessionStore.set({ userId: mapped.id });
        return mapped;
      } catch (e) {
        throw new Error(extractApiMensagem(e));
      }
    })() as any;
  };

  const signOut = () => {
    setToken(null);
    auth.signOut();
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin" && user?.role !== undefined && true,
    signIn,
    signUp,
    signInWithGoogle: auth.signInWithGoogleMock,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

