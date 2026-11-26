import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, CalendarClock, CalendarPlus, Sparkles, Phone, Mail, User, Loader2, Download, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { formatDate, formatDateShort, formatDay, formatHora, formatMZN, formatMonthShort, parseDate } from "@/shared/lib/format";
import { descarregarPdf, nomeFicheiroFatura } from "@/shared/lib/pdf";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { descarregarIcs, googleCalendarUrl } from "@/modules/bookings/lib/calendario";
import { RemarcarDialog } from "@/modules/bookings/components/RemarcarDialog";
import { TrocarSenhaDialog } from "@/modules/auth/components/TrocarSenhaDialog";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { CartaoFidelizacao } from "@/modules/loyalty/components/CartaoFidelizacao";
import { useMinhaAreaCancelarMarcacao, useMinhaAreaMarcacoes } from "@/modules/bookings/hooks/useBookingsApi";
import { useMinhaAreaFaturas } from "@/modules/invoices/hooks/useInvoicesApi";
import { useMinhasSugestoes } from "@/modules/gallery/hooks/useGalleryApi";
import { urlDaApi } from "@/shared/lib/imagem";
import type { Fatura } from "@/modules/invoices/models";
import type { Marcacao } from "@/modules/bookings/models";
import { usePaginaTitulo } from "@/shared/lib/seo";

const when = (m: Marcacao) => parseDate(`${m.data}T${m.hora}`)?.getTime() ?? 0;
const servicosLabel = (m: Marcacao, sep = " · ") => m.servicos.map((s) => s.nome).join(sep);
// Igual ao backend (app.marcacoes.antecedencia-remarcar-horas): depois disto, só pelo WhatsApp.
const ANTECEDENCIA_REMARCAR_MS = 24 * 60 * 60 * 1000;
const podeRemarcar = (m: Marcacao) => when(m) - Date.now() > ANTECEDENCIA_REMARCAR_MS;

export default function ClientDashboardPage() {
  usePaginaTitulo("Minha área", { indexar: false });
  const { user } = useAuth();
  const marcacoesQuery = useMinhaAreaMarcacoes(!!user);
  const cancelarMutation = useMinhaAreaCancelarMarcacao();
  const faturasQuery = useMinhaAreaFaturas(!!user);
  const sugestoes = useMinhasSugestoes(!!user);
  const [toCancel, setToCancel] = useState<Marcacao | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);
  const [aRemarcar, setARemarcar] = useState<Marcacao | null>(null);
  const [trocarSenha, setTrocarSenha] = useState(false);

  const { upcoming, history } = useMemo(() => {
    const list = marcacoesQuery.items;
    const now = Date.now();
    const isActive = (m: Marcacao) =>
      (m.status === "AGUARDA_CONFIRMACAO" || m.status === "CONFIRMADA") && when(m) >= now;
    return {
      upcoming: list.filter(isActive).sort((a, b) => when(a) - when(b)),
      history: list.filter((m) => !isActive(m)).sort((a, b) => when(b) - when(a)),
    };
  }, [marcacoesQuery.items]);

  if (!user) return null;

  const concluidas = history.filter((m) => m.status === "CONCLUIDA").length;

  async function baixarFatura(f: Fatura) {
    setBaixando(f.id);
    try {
      await descarregarPdf(`${API_ENDPOINTS.minhaArea.faturas}/${f.id}/pdf`, nomeFicheiroFatura(f.numero));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBaixando(null);
    }
  }

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
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full px-5 h-11">
              <Link to="/minha-area/mensagens">Mensagens</Link>
            </Button>
            <Button asChild className="rounded-full bg-primary px-6 h-11">
              <Link to="/reservar">Nova reserva</Link>
            </Button>
          </div>
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
            <button onClick={() => setTrocarSenha(true)} className="text-xs mt-3 underline underline-offset-4 opacity-80 hover:opacity-100">
              Alterar palavra-passe
            </button>
          </div>
        </div>

        <CartaoFidelizacao />

        <h2 className="font-display text-2xl mb-4">Próximas marcações</h2>
        {marcacoesQuery.isLoading ? (
          <div className="p-10 rounded-2xl border border-border/60 bg-card grid place-items-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : marcacoesQuery.query.isError ? (
          <div className="p-10 rounded-2xl border border-dashed border-destructive/40 text-center bg-card">
            <p className="text-destructive text-sm">{(marcacoesQuery.query.error as Error).message}</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => marcacoesQuery.query.refetch()}>
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
                  {m.profissionalNome && <p className="text-xs text-muted-foreground mt-0.5">com {m.profissionalNome}</p>}
                </div>
                <div className="text-right space-y-1">
                  <p className="font-display text-xl text-primary">{formatMZN(m.valorTotal)}</p>
                  <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs">
                    {podeRemarcar(m) ? (
                      <button onClick={() => setARemarcar(m)} className="text-primary story-link inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" /> Remarcar
                      </button>
                    ) : (
                      <span className="text-muted-foreground" title="Faltam menos de 24 h: fale connosco pelo WhatsApp">Remarcar só pelo WhatsApp</span>
                    )}
                    <button onClick={() => setToCancel(m)} className="text-destructive story-link">Cancelar</button>
                  </div>
                  <div className="flex justify-end gap-3 text-xs text-muted-foreground">
                    <CalendarPlus className="h-3.5 w-3.5" />
                    <a href={googleCalendarUrl(m)} target="_blank" rel="noreferrer" className="story-link">Google Calendar</a>
                    <button onClick={() => descarregarIcs(m)} className="story-link">iPhone / Outlook</button>
                  </div>
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
            {marcacoesQuery.hasMore && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm" className="rounded-full" disabled={marcacoesQuery.isLoadingMore} onClick={marcacoesQuery.loadMore}>
                  {marcacoesQuery.isLoadingMore && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Ver mais
                </Button>
              </div>
            )}
          </>
        )}

        {faturasQuery.items.length > 0 && (
          <>
            <h2 className="font-display text-2xl mb-4 mt-12">Faturas</h2>
            <div className="space-y-2">
              {faturasQuery.items.map((f) => (
                <div key={f.id} className="p-4 rounded-xl bg-card border border-border/40 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-3 min-w-0">
                    <Receipt className="h-4 w-4 text-rose-deep shrink-0" />
                    <span className="min-w-0">
                      <span className="font-medium">{f.numero}</span>
                      <span className="text-muted-foreground"> · {formatDateShort(f.dataEmissao)}</span>
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <StatusBadge kind="fatura" status={f.status} />
                    <span className="font-display text-lg text-primary">{formatMZN(f.totalAPagar)}</span>
                    <Button variant="outline" size="sm" className="rounded-full" disabled={baixando === f.id} onClick={() => baixarFatura(f)}>
                      {baixando === f.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {faturasQuery.hasMore && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm" className="rounded-full" disabled={faturasQuery.isLoadingMore} onClick={faturasQuery.loadMore}>
                  {faturasQuery.isLoadingMore && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Ver mais faturas
                </Button>
              </div>
            )}
          </>
        )}

        {sugestoes.items.length > 0 && (
          <>
            <h2 className="font-display text-2xl mb-4 mt-12">Fotos que sugeri</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sugestoes.items.map((g) => (
                <figure key={g.id} className="rounded-xl overflow-hidden bg-card border border-border/40">
                  <img src={urlDaApi(g.miniaturaUrl)} alt={g.titulo ?? ""} loading="lazy" className="aspect-square w-full object-cover" />
                  <figcaption className="p-2 text-xs">
                    <span className={
                      g.estado === "APROVADA" ? "text-emerald-700 dark:text-emerald-400 font-medium"
                        : g.estado === "REJEITADA" ? "text-destructive font-medium" : "text-gold font-medium"
                    }>
                      {g.estado === "APROVADA" ? "Publicada na galeria" : g.estado === "REJEITADA" ? "Não aprovada" : "Em revisão"}
                    </span>
                    {g.motivoRejeicao && <span className="block text-muted-foreground mt-0.5">{g.motivoRejeicao}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
      </div>

      <TrocarSenhaDialog open={trocarSenha} onOpenChange={setTrocarSenha} />
      <RemarcarDialog marcacao={aRemarcar} open={!!aRemarcar} onOpenChange={(v) => !v && setARemarcar(null)} modo="cliente" />

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
