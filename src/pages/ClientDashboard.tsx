import { Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatMZN } from "@/lib/format";
import { StatusBadge } from "@/atoms/StatusBadge";
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles, Phone, Mail, User } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useMinhaAreaCancelarMarcacao, useMinhaAreaMarcacoes, useMinhaAreaPerfil } from "@/hooks/useMinhaAreaApi";
import { toast } from "sonner";



export default function ClientDashboardPage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const perfilQuery = useMinhaAreaPerfil();
  const marcacoesQuery = useMinhaAreaMarcacoes();
  const cancelarMutation = useMinhaAreaCancelarMarcacao();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/entrar");
    else if (isAdmin) navigate("/admin");
  }, [isAuthenticated, isAdmin, navigate]);

  if (!user) return null;

  const marcacoes = (marcacoesQuery.data ?? []) as any[];
  const upcoming = marcacoes.filter((b: any) => b.status !== "concluida" && b.status !== "cancelada");
  const history = marcacoes.filter((b: any) => b.status === "concluida" || b.status === "cancelada");

  const serviceName = (id: string) => id;


  return (
    <PublicLayout>
      <section className="py-16 gradient-hero min-h-[70vh]">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Minha área</p>
              <h1 className="font-display text-4xl md:text-5xl mt-2">Olá, <em className="text-gradient-rose italic">{user.name.split(" ")[0]}</em></h1>
            </div>
            <Button asChild className="rounded-full bg-primary px-6 h-11">
              <Link to="/reservar">Nova reserva</Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-10">
            <div className="p-6 rounded-2xl bg-card border border-border/60">
              <div className="flex items-center gap-3 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /> Próximas</div>
              <p className="font-display text-4xl mt-2">{upcoming.length}</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/60">
              <div className="flex items-center gap-3 text-sm text-muted-foreground"><Sparkles className="h-4 w-4" /> Concluídas</div>
              <p className="font-display text-4xl mt-2">{history.filter((b: any) => b.status === "concluida").length}</p>
            </div>
            <div className="p-6 rounded-2xl bg-primary text-primary-foreground">
              <div className="flex items-center gap-3 text-sm opacity-80"><User className="h-4 w-4" /> Conta</div>
              <p className="text-sm mt-2 truncate flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {user.email}</p>
              {user.phone && <p className="text-sm mt-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {user.phone}</p>}
            </div>
          </div>

          <h2 className="font-display text-2xl mb-4">Próximas marcações</h2>
          {upcoming.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-border text-center text-muted-foreground bg-card">
              Ainda não tem marcações. <Link to="/reservar" className="text-primary story-link">Reservar agora</Link>.
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b: any) => (
                <div key={b.id} className="p-5 rounded-2xl bg-card border border-border/60 flex flex-wrap items-center gap-5 hover-lift">
                  <div className="text-center min-w-[70px]">
                    <p className="font-display text-3xl text-primary">{new Date(b.date).getDate()}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-PT", { month: "short" }).format(new Date(b.date))} · {b.time}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={b.status} />
                      <span className="text-xs text-muted-foreground">#{b.id.slice(-6)}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      {b.serviceIds.map(serviceName).join(" · ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-primary">{formatMZN(b.totalPrice)}</p>
                    <button
                      onClick={async () => {
                        try {
                          await cancelarMutation.mutateAsync(b.id);
                          toast.success("Marcação cancelada");
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                      className="text-xs text-destructive story-link"
                    >
                      Cancelar
                    </button>

                  </div>
                </div>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <>
              <h2 className="font-display text-2xl mb-4 mt-12">Histórico</h2>
              <div className="space-y-2">
                {history.map((b: any) => (
                  <div key={b.id} className="p-4 rounded-xl bg-card border border-border/40 flex items-center justify-between text-sm">
                    <span>{formatDate(b.date)} · {b.serviceIds.map(serviceName).join(", ")}</span>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={b.status} />
                      <span className="text-muted-foreground">{formatMZN(b.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
