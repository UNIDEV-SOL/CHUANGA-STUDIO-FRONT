import { LayoutDashboard, CalendarRange, Sparkles, Users, MessageSquare, LogOut, ExternalLink } from "lucide-react";
import { Logo } from "@/atoms/Logo";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem { to: string; label: string; short: string; icon: typeof LayoutDashboard; end?: boolean }
const NAV: NavItem[] = [
  { to: "/admin", label: "Visão geral", short: "Início", icon: LayoutDashboard, end: true },
  { to: "/admin/marcacoes", label: "Marcações", short: "Marcações", icon: CalendarRange },
  { to: "/admin/servicos", label: "Serviços", short: "Serviços", icon: Sparkles },
  { to: "/admin/clientes", label: "Clientes", short: "Clientes", icon: Users },
  { to: "/admin/cotacoes", label: "Cotações", short: "Cotações", icon: MessageSquare },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const logout = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <aside className="hidden lg:flex flex-col w-[260px] bg-primary text-primary-foreground fixed inset-y-0 left-0 p-6 z-30">
        <Link to="/" className="mb-10">
          <Logo tone="light" compact />
        </Link>
        <div className="text-[10px] uppercase tracking-[0.28em] text-accent mb-3">Estúdio</div>
        <nav className="flex-1 flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition",
                  isActive ? "bg-accent text-primary font-medium" : "text-porcelain/75 hover:bg-white/5 hover:text-porcelain",
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9 border border-accent/40">
              <AvatarFallback className="bg-accent/30 text-primary text-xs font-semibold">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[11px] text-porcelain/60 truncate">{user.email}</p>
            </div>
          </div>
          <Link
            to="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-porcelain/70 hover:bg-white/5"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ver site
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-porcelain/70 hover:bg-white/5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-primary text-primary-foreground h-14 px-4 flex items-center justify-between">
        <Link to="/"><Logo tone="light" compact className="[&>span]:text-xl" /></Link>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-porcelain/80 px-2 py-1.5 rounded-lg hover:bg-white/5">
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
      </header>

      <div className="lg:ml-[260px]">
        <main className="p-5 md:p-8 pb-24 lg:pb-8 max-w-7xl"><Outlet /></main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-primary text-primary-foreground border-t border-white/10 flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn("flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]", isActive ? "text-accent" : "text-porcelain/70")
            }
          >
            <n.icon className="h-4 w-4" /> {n.short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
