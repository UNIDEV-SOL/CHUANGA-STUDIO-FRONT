import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Sparkles, Phone, Mail, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatDay, formatHora, formatMZN, formatMonthShort, parseDate } from "@/lib/format";
import { StatusBadge } from "@/atoms/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMinhaAreaCancelarMarcacao, useMinhaAreaMarcacoes } from "@/hooks/useMinhaAreaApi";
import type { Marcacao } from "@/types/api";

const when = (m: Marcacao) => parseDate(`${m.data}T${m.hora}`)?.getTime() ?? 0;
const servicosLabel = (m: Marcacao, sep = " · ") => m.servicos.map((s) => s.nome).join(sep);

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const marcacoesQuery = useMinhaAreaMarcacoes(!!user);
  const cancelarMutation = useMinhaAreaCancelarMarcacao();
  const [toCancel, setToCancel] = useState<Marcacao | null>(null);

  const { upcoming, history } = useMemo(() => {
    const list = marcacoesQuery.data ?? [];
    const now = Date.now();
    const isActive = (m: Marcacao) =>
      (m.status === "AGUARDA_CONFIRMACAO" || m.status === "CONFIRMADA") && when(m) >= now;
    return {
      upcoming: list.filter(isActive).sort((a, b) => when(a) - when(b)),
      history: list.filter((m) => !isActive(m)).sort((a, b) => when(b) - when(a)),
    };
  }, [marcacoesQuery.data]);

  if (!user) return null;

  const concluidas = history.filter((m) => m.status === "CONCLUIDA").length;

  async function confirmCancel() {
    if (!toCancel) return;
    try {
      await cancelarMutation.mutateAsync(toCancel.id);
      toast.success("Marcação cancelada.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setToCancel(null);
    }
  }

  return (
    <section className="py-16 gradient-hero min-h-[70vh]">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Minha área</p>
            <h1 className="font-display text-4xl md:text-5xl mt-2">
              Olá, <em className="text-gradient-rose italic">{user.name.split(" ")[0]}</em>
            </h1>
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
            <p className="font-display text-4xl mt-2">{concluidas}</p>
          </div>
          <div className="p-6 rounded-2xl bg-primary text-primary-foreground min-w-0">
            <div className="flex items-center gap-3 text-sm opacity-80"><User className="h-4 w-4" /> Conta</div>
            <p className="text-sm mt-2 truncate flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{user.email}</span></p>
            {user.phone && <p className="text-sm mt-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {user.phone}</p>}
          </div>
        </div>

        <h2 className="font-display text-2xl mb-4">Próximas marcações</h2>
        {marcacoesQuery.isLoading ? (
          <div className="p-10 rounded-2xl border border-border/60 bg-card grid place-items-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : marcacoesQuery.isError ? (
          <div className="p-10 rounded-2xl border border-dashed border-destructive/40 text-center bg-card">
            <p className="text-destructive text-sm">{(marcacoesQuery.error as Error).message}</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => marcacoesQuery.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-border text-center text-muted-foreground bg-card">
            Não tem marcações futuras. <Link to="/reservar" className="text-primary story-link">Reservar agora</Link>.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((m) => (
              <div key={m.id} className="p-5 rounded-2xl bg-card border border-border/60 flex flex-wrap items-center gap-5 hover-lift">
                <div className="text-center min-w-[70px]">
                  <p className="font-display text-3xl text-primary">{formatDay(m.data)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {formatMonthShort(m.data)} · {formatHora(m.hora)}
                  </p>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={m.status} />
                    <span className="text-xs text-muted-foreground">#{m.id.slice(-6)}</span>
                    {!m.adiantamentoPago && (
                      <span className="text-[11px] text-muted-foreground">· adiantamento em verificação</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground">{servicosLabel(m)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl text-primary">{formatMZN(m.valorTotal)}</p>
                  <button onClick={() => setToCancel(m)} className="text-xs text-destructive story-link">
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
              {history.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-card border border-border/40 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    {formatDate(m.data)} · <span className="text-muted-foreground">{servicosLabel(m, ", ")}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={m.status} />
                    <span className="text-muted-foreground">{formatMZN(m.valorTotal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!toCancel} onOpenChange={(v) => !v && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta marcação?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel && `${formatDate(toCancel.data)} às ${formatHora(toCancel.hora)} — ${servicosLabel(toCancel, ", ")}.`}{" "}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmCancel(); }}
              disabled={cancelarMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancelar marcação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
