import { LayoutDashboard, CalendarRange, Sparkles, Users, MessageSquare, LogOut } from "lucide-react";
import { Logo } from "@/atoms/Logo";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }
const NAV: NavItem[] = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/marcacoes", label: "Marcações", icon: CalendarRange },
  { to: "/admin/servicos", label: "Serviços", icon: Sparkles },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/cotacoes", label: "Cotações", icon: MessageSquare },
];

export function AdminLayout() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (!isAdmin) navigate("/entrar");
  }, [isAdmin, navigate]);

  if (!user) return null;

  const initials = user.name.split(" ").slice(0, 2).map((w) => w[0]).join("");

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <aside className="hidden lg:flex flex-col w-[260px] bg-primary text-primary-foreground fixed inset-y-0 left-0 p-6">
        <Link to="/" className="mb-10">
          <Logo tone="light" compact />
        </Link>
        <div className="text-[10px] uppercase tracking-[0.28em] text-accent mb-3">Estúdio</div>
        <nav className="flex-1 flex flex-col gap-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition",
                  active ? "bg-accent text-primary font-medium" : "text-porcelain/75 hover:bg-white/5 hover:text-porcelain",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9 border border-accent/40">
              <AvatarFallback className="bg-accent/30 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[11px] text-porcelain/60 truncate">{user.email}</p>
            </div>
          </div>
          <button
            // 4. Corrigido o navigate do botão de Sair também
            onClick={() => { signOut(); navigate("/"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-porcelain/70 hover:bg-white/5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </aside>
      <div className="flex-1 lg:ml-[260px]">
        <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Link to="/" className="text-xs story-link text-muted-foreground">Ver site público →</Link>
          </div>
        </header>
        <main className="p-6 md:p-8"><Outlet /></main>
        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-primary text-primary-foreground border-t border-white/10 flex justify-around py-2">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]", active ? "text-accent" : "text-porcelain/70")}>
                <n.icon className="h-4 w-4" /> {n.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}