import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, User2, LayoutDashboard, LogOut, MessagesSquare } from "lucide-react";
import { useChatNaoLidas } from "@/hooks/useChatApi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/atoms/Logo";
import { initials as getInitials } from "@/lib/format";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/servicos", label: "Serviços" },
  { to: "/sobre", label: "O Estúdio" },
  { to: "/galeria", label: "Galeria" },
  { to: "/cotacao", label: "Cotação" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const chat = useChatNaoLidas(!!user);
  const porLer = chat.data?.naoLidas ?? 0;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const initials = getInitials(user?.name);

  // Fecha o menu mobile ao mudar de página.
  useEffect(() => setOpen(false), [pathname]);

  const logout = () => {
    signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto max-w-7xl px-5 md:px-8 h-[72px] flex items-center justify-between gap-6">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden lg:flex items-center gap-9">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "story-link text-sm font-medium transition-colors",
                  isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground",
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Button
            asChild
            size="sm"
            className="hidden md:inline-flex bg-primary hover:bg-primary/90 rounded-full px-5 shadow-elegant"
          >
            <Link to="/reservar">Reservar</Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none focus-visible:ring-2 ring-ring" aria-label="Menu da conta">
                  <span className="relative block">
                    <Avatar className="h-9 w-9 border-2 border-accent/40">
                      <AvatarFallback className="bg-accent/20 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {porLer > 0 && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-rose-deep border-2 border-background" aria-label="Mensagens por ler" />}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Painel do Estúdio
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/minha-area">
                        <User2 className="h-4 w-4 mr-2" />
                        Minha área
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/minha-area/mensagens">
                        <MessagesSquare className="h-4 w-4 mr-2" />
                        Mensagens
                        {porLer > 0 && <span className="ml-auto text-[10px] min-w-[18px] h-[18px] px-1 rounded-full bg-rose-deep text-white grid place-items-center">{porLer}</span>}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="hidden md:inline-flex rounded-full"
            >
              <Link to="/entrar">Entrar</Link>
            </Button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "lg:hidden overflow-hidden border-t border-border/50 transition-[max-height]",
          open ? "max-h-96" : "max-h-0 border-t-0",
        )}
      >
        <div className="px-5 py-4 flex flex-col gap-1 bg-background">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn("py-2.5 px-2 text-sm font-medium rounded-md hover:bg-muted", isActive && "bg-muted")
              }
            >
              {n.label}
            </NavLink>
          ))}
          <div className="flex gap-2 pt-3 border-t border-border mt-2">
            <Button asChild className="flex-1 rounded-full bg-primary">
              <Link to="/reservar">Reservar</Link>
            </Button>
            {!user && (
              <Button asChild variant="outline" className="flex-1 rounded-full">
                <Link to="/entrar">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
