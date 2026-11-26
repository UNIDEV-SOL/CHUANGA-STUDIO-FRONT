import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Trash2, Check, Clock, Phone, User, Loader2, ChevronRight, Receipt, CalendarClock, AlertTriangle, UserRound } from "lucide-react";
import { toast } from "sonner";
import { formatMZN, formatDate, formatHora } from "@/shared/lib/format";
import { MARCACAO_STATUS_OPTIONS } from "@/shared/lib/status";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { QueryError } from "@/shared/components/QueryError";
import { InfiniteScrollTable } from "@/shared/components/InfiniteScrollTable";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { FecharContaDialog } from "@/modules/invoices/components/FecharContaDialog";
import { RemarcarDialog } from "@/modules/bookings/components/RemarcarDialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { useAdminAtualizarStatusMarcacao, useAdminConfirmarPagamento, useAdminEliminarMarcacao, useAdminMarcacoes, useAdminAtribuirProfissional, useAdminMarcacao } from "@/modules/bookings/hooks/useBookingsApi";
import { useAdminProfissionais } from "@/modules/team/hooks/useTeamApi";
import type { Marcacao, StatusMarcacao } from "@/modules/bookings/models";

const METODO_LABEL: Record<string, string> = { MPESA: "M-Pesa", EMOLA: "e-Mola" };

export default function AdminBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<StatusMarcacao | "todas">("todas");
  const [filtroProf, setFiltroProf] = useState<string>("todas");
  const [q, setQ] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const busca = useDebounce(q);

  // Filtros enviados à API (paginação no servidor, scroll infinito na tabela).
  const lista = useAdminMarcacoes({
    status,
    busca,
    profissionalId: filtroProf !== "todas" && filtroProf !== "nenhuma" ? filtroProf : undefined,
    semProfissional: filtroProf === "nenhuma" ? true : undefined,
    dataInicio,
    dataFim,
  });
  const atualizarStatus = useAdminAtualizarStatusMarcacao();
  const confirmarPagamento = useAdminConfirmarPagamento();
  const eliminar = useAdminEliminarMarcacao();
  const profissionaisQuery = useAdminProfissionais();
  const profissionais = useMemo(() => profissionaisQuery.data ?? [], [profissionaisQuery.data]);
  const atribuir = useAdminAtribuirProfissional();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fecharConta, setFecharConta] = useState(false);
  const [remarcar, setRemarcar] = useState(false);

  // ?id= (ex.: vindo de uma notificação) abre a marcação mesmo que não esteja na página carregada.
  const openId = searchParams.get("id");
  const setOpenId = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("id", id); else next.delete("id");
    setSearchParams(next, { replace: true });
  };
  const detalhe = useAdminMarcacao(openId);
  const open = openId ? lista.items.find((b) => b.id === openId) ?? detalhe.data ?? null : null;
  const faltas = open?.clienteFaltas ?? 0;

  async function run(action: Promise<unknown>, success: string) {
    try {
      await action;
      toast.success(success);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  }

  const changeStatus = (m: Marcacao, next: StatusMarcacao) =>
    next !== m.status &&
    run(atualizarStatus.mutateAsync({ id: m.id, status: next }), "Estado atualizado.");

  const doDelete = async () => {
    if (!open) return;
    const ok = await run(eliminar.mutateAsync(open.id), "Marcação eliminada.");
    setConfirmDelete(false);
    if (ok) setOpenId(null);
  };

  const busy = atualizarStatus.isPending || confirmarPagamento.isPending || eliminar.isPending;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Agenda</p>
          <h1 className="font-display text-4xl mt-1">Marcações</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lista.total} {lista.total === 1 ? "marcação" : "marcações"}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar cliente, telefone ou email..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusMarcacao | "todas")}>
          <SelectTrigger className="w-full sm:w-[200px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os estados</SelectItem>
            {MARCACAO_STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {profissionais.length > 0 && (
          <Select value={filtroProf} onValueChange={setFiltroProf}>
            <SelectTrigger className="w-full sm:w-[190px] h-10" aria-label="Profissional"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Toda a equipa</SelectItem>
              {profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              <SelectItem value="nenhuma">Sem profissional</SelectItem>
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2">
          <Input type="date" value={dataInicio} max={dataFim || undefined} onChange={(e) => setDataInicio(e.target.value)} className="h-10 w-[150px]" aria-label="De" />
          <span className="text-muted-foreground text-sm">a</span>
          <Input type="date" value={dataFim} min={dataInicio || undefined} onChange={(e) => setDataFim(e.target.value)} className="h-10 w-[150px]" aria-label="Até" />
        </div>
      </div>

      {lista.query.isError && <QueryError query={lista.query} className="mb-4" />}

      <InfiniteScrollTable<Marcacao>
        data={lista.items}
        total={lista.total}
        getRowKey={(b) => b.id}
        onRowClick={(b) => setOpenId(b.id)}
        isLoading={lista.isLoading}
        hasMore={lista.hasMore}
        isLoadingMore={lista.isLoadingMore}
        onLoadMore={lista.loadMore}
        emptyMessage="Nenhuma marcação encontrada com estes filtros."
        columns={[
          {
            id: "cliente", label: "Cliente", minWidth: 200,
            render: (b) => (
              <>
                <p className="font-medium">
                  {b.clienteNome}
                  {(b.clienteFaltas ?? 0) > 0 && (
                    <span className="ml-2 text-[10px] font-semibold text-destructive" title="Faltas sem aviso">
                      {b.clienteFaltas} falta{(b.clienteFaltas ?? 0) > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{b.clienteTelefone}</p>
              </>
            ),
          },
          {
            id: "data", label: "Data", minWidth: 150, className: "whitespace-nowrap",
            render: (b) => (<><p>{formatDate(b.data)}</p><p className="text-xs text-muted-foreground">{formatHora(b.hora)}</p></>),
          },
          {
            id: "servicos", label: "Serviços", minWidth: 220, className: "text-xs max-w-[260px]",
            render: (b) => (
              <>
                <span className="line-clamp-2">{b.servicos.map((s) => s.nome).join(", ")}</span>
                {b.profissionalNome && <span className="text-muted-foreground">com {b.profissionalNome}</span>}
              </>
            ),
          },
          {
            id: "estado", label: "Estado", minWidth: 150,
            render: (b) => (
              <>
                <StatusBadge status={b.status} />
                {!b.adiantamentoPago && b.status === "AGUARDA_CONFIRMACAO" && (
                  <p className="text-[10px] text-muted-foreground mt-1">Pagamento por validar</p>
                )}
                {b.faturaNumero && <p className="text-[10px] text-muted-foreground mt-1">{b.faturaNumero}</p>}
              </>
            ),
          },
          {
            id: "total", label: "Total", align: "right", minWidth: 110, className: "font-display text-primary whitespace-nowrap",
            render: (b) => formatMZN(b.valorTotal),
          },
          { id: "abrir", label: "", align: "right", className: "text-muted-foreground w-8", render: () => <ChevronRight className="h-4 w-4 inline" /> },
        ]}
      />

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Marcação #{open.id.slice(-6)}</DialogTitle>
                <DialogDescription className="sr-only">Detalhes e ações da marcação</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-accent/20 text-rose-deep grid place-items-center shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{open.clienteNome}</p>
                    <a href={`tel:${open.clienteTelefone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3 w-3" /> {open.clienteTelefone}
                    </a>
                  </div>
                  <StatusBadge status={open.status} />
                </div>
                {faltas > 0 && (
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span>
                      Esta cliente já faltou {faltas} vez{faltas > 1 ? "es" : ""} sem avisar.
                      Confirme o adiantamento antes de reservar o horário.
                    </span>
                  </div>
                )}
                {profissionais.length > 0 && (
                  <div className="flex items-center gap-3">
                    <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Profissional</span>
                    <Select
                      value={open.profissionalId ?? "nenhuma"}
                      disabled={busy || atribuir.isPending || !(open.status === "AGUARDA_CONFIRMACAO" || open.status === "CONFIRMADA")}
                      onValueChange={(v) => run(
                        atribuir.mutateAsync({ id: open.id, profissionalId: v === "nenhuma" ? null : v }),
                        "Profissional atualizada.",
                      )}
                    >
                      <SelectTrigger className="h-9 flex-1" aria-label="Profissional da marcação"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhuma">Sem profissional</SelectItem>
                        {profissionais.filter((p) => p.ativo || p.id === open.profissionalId).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-secondary/40 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1"><Clock className="inline h-3 w-3 mr-1" /> Quando</p>
                    <p className="font-display text-lg">{formatDate(open.data)} · {formatHora(open.hora)}</p>
                  </div>
                  {(open.status === "AGUARDA_CONFIRMACAO" || open.status === "CONFIRMADA") && (
                    <Button variant="outline" size="sm" className="rounded-full" disabled={busy} onClick={() => setRemarcar(true)}>
                      <CalendarClock className="h-4 w-4 mr-1.5" /> Remarcar
                    </Button>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Serviços</p>
                  <ul className="space-y-1">
                    {open.servicos.map((s) => (
                      <li key={s.servicoId} className="flex justify-between gap-3">
                        <span>{s.nome}</span><span className="text-primary whitespace-nowrap">{formatMZN(s.preco)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-dashed border-border mt-3 pt-3 flex justify-between font-display text-lg">
                    <span>Total</span><span className="text-primary">{formatMZN(open.valorTotal)}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Adiantamento ({formatMZN(open.valorAdiantamento)})
                      {open.metodoPagamento && ` · ${METODO_LABEL[open.metodoPagamento] ?? open.metodoPagamento}`}
                    </p>
                    <p className="text-sm font-medium">{open.adiantamentoPago ? "✓ Confirmado" : "Por validar"}</p>
                  </div>
                  {!open.adiantamentoPago && (open.status === "AGUARDA_CONFIRMACAO" || open.status === "CONFIRMADA") && (
                    <Button
                      size="sm"
                      className="rounded-full bg-primary"
                      disabled={busy}
                      onClick={() => run(confirmarPagamento.mutateAsync(open.id), "Pagamento confirmado.")}
                    >
                      {confirmarPagamento.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                      Confirmar pagamento
                    </Button>
                  )}
                </div>
                {open.faturaId ? (
                  <Link
                    to={`/admin/faturas?id=${open.faturaId}`}
                    className="p-3 rounded-lg border border-border flex flex-wrap items-center justify-between gap-3 hover:bg-secondary/30"
                  >
                    <span className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-rose-deep" />
                      <span className="font-medium">Fatura {open.faturaNumero}</span>
                      <StatusBadge kind="fatura" status={open.faturaStatus} />
                    </span>
                    <span className="text-xs text-muted-foreground">Abrir fatura</span>
                  </Link>
                ) : (
                  (open.status === "CONFIRMADA" || open.status === "AGUARDA_CONFIRMACAO") && (
                    <Button className="w-full rounded-full bg-primary h-11" disabled={busy} onClick={() => setFecharConta(true)}>
                      <Receipt className="h-4 w-4 mr-2" /> Fechar conta e emitir fatura
                    </Button>
                  )
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Select value={open.status} onValueChange={(v) => changeStatus(open, v as StatusMarcacao)} disabled={busy}>
                    <SelectTrigger className="flex-1 min-w-[200px] h-10" aria-label="Alterar estado"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MARCACAO_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="icon" aria-label="Eliminar marcação" disabled={busy} onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <FecharContaDialog marcacao={open} open={fecharConta} onOpenChange={setFecharConta} />
      <RemarcarDialog marcacao={open} open={remarcar} onOpenChange={setRemarcar} modo="admin" />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar marcação?</AlertDialogTitle>
            <AlertDialogDescription>
              A marcação de {open?.clienteNome} será removida permanentemente. Para manter o histórico, prefira o estado "Cancelada".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void doDelete(); }}
              disabled={eliminar.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
