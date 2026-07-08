import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppUser } from "@/types";
import { auth, sessionStore, usersStore } from "@/data/store";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = sessionStore.useValue();
  const users = usersStore.useValue();
  const user = useMemo(
    () => users.find((u) => u.id === session.userId) ?? null,
    [users, session.userId],
  );
  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    signIn: auth.signInWithPassword,
    signUp: auth.signUp,
    signInWithGoogle: auth.signInWithGoogleMock,
    signOut: auth.signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
