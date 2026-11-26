import { createStore } from "./store";
import type { AppUser } from "@/types";

// Sessão = token JWT + utilizador autenticado. Fica num único store para que
// o interceptor HTTP (fora do React) e o AuthContext partilhem o mesmo estado.
interface Session {
  token: string | null;
  user: AppUser | null;
}

const LEGACY_TOKEN_KEY = "chuanga:token";

function readLegacyToken() {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(LEGACY_TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

export const sessionStore = createStore<Session>("chuanga:auth", {
  token: readLegacyToken(),
  user: null,
});

export const getToken = () => sessionStore.get().token;

export function setSession(token: string, user: AppUser) {
  sessionStore.set({ token, user });
}

/** Troca só o token (ex.: depois de alterar a palavra-passe o backend emite um novo). */
export function setSessionToken(token: string) {
  sessionStore.set((prev) => ({ ...prev, token }));
}

export function setSessionUser(user: AppUser) {
  sessionStore.set((prev) => ({ ...prev, user }));
}

export type SessionEndReason = "logout" | "expired";
type Listener = (reason: SessionEndReason, mensagem?: string) => void;
const endListeners = new Set<Listener>();

/** Notificado sempre que a sessão termina (logout manual ou 401). */
export function onSessionEnd(listener: Listener) {
  endListeners.add(listener);
  return () => {
    endListeners.delete(listener);
  };
}

/** `mensagem` = motivo exato vindo do backend (ex.: "A sua conta foi desativada."). */
export function clearSession(reason: SessionEndReason = "logout", mensagem?: string) {
  const hadSession = !!sessionStore.get().token;
  sessionStore.set({ token: null, user: null });
  try {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // ignore
  }
  if (hadSession) endListeners.forEach((l) => l(reason, mensagem));
}
