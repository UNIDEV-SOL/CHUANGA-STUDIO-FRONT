import { useState, Suspense } from "react";
import { BarChart3, LayoutDashboard, CalendarRange, Clock, Receipt, Sparkles, Users, MessageSquare, LogOut, ExternalLink, UsersRound, MoreHorizontal, Images, PanelLeftClose, PanelLeftOpen, MessagesSquare, Gift, Star } from "lucide-react";
import { Logo } from "@/shared/components/Logo";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { cn } from "@/shared/lib/utils";
import { initials } from "@/shared/lib/format";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { PageLoader } from "@/shared/components/PageLoader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { NotificacoesBell } from "@/modules/notifications/components/NotificacoesBell";
import { useChatNaoLidas } from "@/modules/chat/hooks/useChatApi";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { usePaginaTitulo } from "@/shared/lib/seo";

interface NavItem { to: string; label: string; short: string; icon: typeof LayoutDashboard; end?: boolean }
const NAV: NavItem[] = [
  { to: "/admin", label: "Visão geral", short: "Início", icon: LayoutDashboard, end: true },
  { to: "/admin/marcacoes", label: "Marcações", short: "Marcações", icon: CalendarRange },
  { to: "/admin/faturas", label: "Faturas", short: "Faturas", icon: Receipt },
  { to: "/admin/mensagens", label: "Mensagens", short: "Mensagens", icon: MessagesSquare },
  { to: "/admin/relatorios", label: "Relatórios", short: "Caixa", icon: BarChart3 },
  { to: "/admin/horario", label: "Horário", short: "Horário", icon: Clock },
  { to: "/admin/servicos", label: "Serviços", short: "Serviços", icon: Sparkles },
  { to: "/admin/clientes", label: "Clientes", short: "Clientes", icon: Users },
  { to: "/admin/cotacoes", label: "Cotações", short: "Cotações", icon: MessageSquare },
  { to: "/admin/fidelizacao", label: "Fidelização e vales", short: "Vales", icon: Gift },
  { to: "/admin/avaliacoes", label: "Avaliações", short: "Avaliações", icon: Star },
  { to: "/admin/galeria", label: "Galeria", short: "Galeria", icon: Images },
  { to: "/admin/equipa", label: "Equipa", short: "Equipa", icon: UsersRound },
];

// Telemóvel: só os atalhos do dia a dia na barra; o resto vai para "Mais".
const NAV_PRINCIPAL = ["/admin", "/admin/marcacoes", "/admin/faturas", "/admin/clientes"];

export function AdminLayout() {
  usePaginaTitulo("Painel", { indexar: false });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mais, setMais] = useState(false);
  const chat = useChatNaoLidas();
  const mensagensPorLer = chat.data?.naoLidas ?? 0;
  // Sidebar encolhida (só ícones) — fica guardada neste browser.
  const [encolhida, setEncolhida] = useState(() => {
    try {
      return localStorage.getItem("admin.sidebar.encolhida") === "1";
    } catch {
      return false;
    }
  });
  const alternarSidebar = () =>
    setEncolhida((v) => {
      try {
        localStorage.setItem("admin.sidebar.encolhida", v ? "0" : "1");
      } catch {
        // sem localStorage (modo privado): fica só nesta sessão
      }
      return !v;
    });

  if (!user) return null;

  const principais = NAV.filter((n) => NAV_PRINCIPAL.includes(n.to));
  const outros = NAV.filter((n) => !NAV_PRINCIPAL.includes(n.to));
  const outroAtivo = outros.some((n) => pathname.startsWith(n.to));

  const logout = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-primary text-primary-foreground fixed inset-y-0 left-0 z-30 transition-[width,padding] duration-200",
          encolhida ? "w-[76px] px-3 py-6" : "w-[260px] p-6",
        )}
      >
        <div className={cn("mb-10 flex items-center", encolhida ? "justify-center" : "justify-between")}>
          {!encolhida && <Link to="/"><Logo tone="light" compact /></Link>}
          <button
            onClick={alternarSidebar}
            aria-label={encolhida ? "Expandir menu" : "Encolher menu"}
            title={encolhida ? "Expandir menu" : "Encolher menu"}
            className="h-8 w-8 grid place-items-center rounded-lg text-porcelain/75 hover:bg-white/10 hover:text-porcelain"
          >
            {encolhida ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        {!encolhida && <div className="text-[10px] uppercase tracking-[0.28em] text-accent mb-3">Estúdio</div>}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={encolhida ? n.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 py-2.5 rounded-xl text-sm transition",
                  encolhida ? "justify-center px-0" : "px-3",
                  isActive ? "bg-accent text-primary font-medium" : "text-porcelain/75 hover:bg-white/5 hover:text-porcelain",
                )
              }
            >
              <span className="relative">
                <n.icon className="h-4 w-4 shrink-0" />
                {n.to === "/admin/mensagens" && mensagensPorLer > 0 && encolhida && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-deep" />
                )}
              </span>
              {!encolhida && n.label}
              {!encolhida && n.to === "/admin/mensagens" && mensagensPorLer > 0 && (
                <span className="ml-auto text-[10px] min-w-[20px] h-5 px-1.5 rounded-full bg-rose-deep text-white grid place-items-center">{mensagensPorLer}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className={cn("flex items-center gap-3 mb-3", encolhida && "justify-center")}>
            <Avatar className="h-9 w-9 border border-accent/40" title={encolhida ? `${user.name} · ${user.email}` : undefined}>
              <AvatarFallback className="bg-accent/30 text-primary text-xs font-semibold">{initials(user.name)}</AvatarFallback>
            </Avatar>
            {!encolhida && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[11px] text-porcelain/60 truncate">{user.email}</p>
              </div>
            )}
          </div>
          <Link
            to="/"
            title={encolhida ? "Ver site" : undefined}
            className={cn("w-full flex items-center gap-2 py-2 rounded-lg text-xs text-porcelain/70 hover:bg-white/5", encolhida ? "justify-center" : "px-3")}
          >
            <ExternalLink className="h-3.5 w-3.5" /> {!encolhida && "Ver site"}
          </Link>
          <button
            onClick={logout}
            title={encolhida ? "Sair" : undefined}
            className={cn("w-full flex items-center gap-2 py-2 rounded-lg text-xs text-porcelain/70 hover:bg-white/5", encolhida ? "justify-center" : "px-3")}
          >
            <LogOut className="h-3.5 w-3.5" /> {!encolhida && "Sair"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-primary text-primary-foreground h-14 px-4 flex items-center justify-between">
        <Link to="/"><Logo tone="light" compact className="[&>span]:text-xl" /></Link>
        <div className="flex items-center gap-1">
        <NotificacoesBell tone="light" />
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-porcelain/80 px-2 py-1.5 rounded-lg hover:bg-white/5">
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
        </div>
      </header>

      <div className={cn("transition-[margin] duration-200", encolhida ? "lg:ml-[76px]" : "lg:ml-[260px]")}>
        {/* Barra superior (computador): notificações */}
        <div className="hidden lg:flex sticky top-0 z-20 justify-end items-center gap-2 px-8 h-14 bg-background/80 backdrop-blur border-b border-border/50">
          <NotificacoesBell />
        </div>
        <main className="p-5 md:p-8 pb-24 lg:pb-8 max-w-7xl"><Suspense fallback={<PageLoader />}><Outlet /></Suspense></main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-primary text-primary-foreground border-t border-white/10 flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {principais.map((n) => (
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
        <button
          type="button"
          onClick={() => setMais(true)}
          className={cn("flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]", outroAtivo ? "text-accent" : "text-porcelain/70")}
        >
          <MoreHorizontal className="h-4 w-4" /> Mais
        </button>
      </nav>

      <Sheet open={mais} onOpenChange={setMais}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl text-left">Mais</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {outros.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setMais(false)}
                className={({ isActive }) =>
                  cn("flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs", isActive ? "border-primary bg-primary/5 text-primary" : "border-border")
                }
              >
                <n.icon className="h-5 w-5" /> {n.label}
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
