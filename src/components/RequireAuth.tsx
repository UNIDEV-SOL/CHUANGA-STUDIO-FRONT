import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

/**
 * Protege rotas por sessão e papel. Sem sessão -> /entrar (com retorno);
 * papel errado -> área correspondente ao papel do utilizador.
 */
export function RequireAuth({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/minha-area"} replace />;
  }

  return <>{children}</>;
}
