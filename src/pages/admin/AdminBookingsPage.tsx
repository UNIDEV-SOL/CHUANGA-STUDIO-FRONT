import { useMemo, useState } from "react";
import { Search, Trash2, Check, Clock, Phone, User, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatMZN, formatDate, formatHora, parseDate } from "@/lib/format";
import { MARCACAO_STATUS_OPTIONS } from "@/lib/status";
import { StatusBadge } from "@/atoms/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAdminAtualizarStatusMarcacao,
  useAdminConfirmarPagamento,
  useAdminEliminarMarcacao,
  useAdminMarcacoes,
} from "@/hooks/useAdminApi";
import type { Marcacao, StatusMarcacao } from "@/types/api";

const METODO_LABEL: Record<string, string> = { MPESA: "M-Pesa", EMOLA: "e-Mola" };

const when = (m: Marcacao) => parseDate(`${m.data}T${m.hora}`)?.getTime() ?? 0;

export default function AdminBookingsPage() {
  const bookingsQuery = useAdminMarcacoes();
  const atualizarStatus = useAdminAtualizarStatusMarcacao();
  const confirmarPagamento = useAdminConfirmarPagamento();
  const eliminar = useAdminEliminarMarcacao();

  const [status, setStatus] = useState<StatusMarcacao | "todas">("todas");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return bookings
      .filter((b) => status === "todas" || b.status === status)
      .filter((b) => !term || b.clienteNome.toLowerCase().includes(term) || b.clienteTelefone.includes(term))
      .sort((a, b) => when(b) - when(a));
  }, [bookings, status, q]);

  const open = openId ? bookings.find((b) => b.id === openId) ?? null : null;

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
          {filtered.length} de {bookings.length}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar cliente ou telefone..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusMarcacao | "todas")}>
          <SelectTrigger className="w-full sm:w-[220px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os estados</SelectItem>
            {MARCACAO_STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {bookingsQuery.isError && <QueryError query={bookingsQuery} className="mb-4" />}

      <div className="rounded-2xl bg-card border border-border/60 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Cliente</th>
              <th className="text-left px-5 py-3 font-medium">Data</th>
              <th className="text-left px-5 py-3 font-medium">Serviços</th>
              <th className="text-left px-5 py-3 font-medium">Estado</th>
              <th className="text-right px-5 py-3 font-medium">Total</th>
              <th className="px-3 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {bookingsQuery.isLoading &&
              [0, 1, 2, 3].map((i) => (
                <tr key={i} className="border-t border-border/40">
                  <td colSpan={6} className="px-5 py-3"><Skeleton className="h-10 w-full" /></td>
                </tr>
              ))}
            {bookingsQuery.isSuccess && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma marcação encontrada.</td></tr>
            )}
            {filtered.map((b) => (
              <tr
                key={b.id}
                tabIndex={0}
                className="border-t border-border/40 hover:bg-secondary/20 cursor-pointer focus-visible:outline-none focus-visible:bg-secondary/30"
                onClick={() => setOpenId(b.id)}
                onKeyDown={(e) => e.key === "Enter" && setOpenId(b.id)}
              >
                <td className="px-5 py-4">
                  <p className="font-medium">{b.clienteNome}</p>
                  <p className="text-xs text-muted-foreground">{b.clienteTelefone}</p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <p>{formatDate(b.data)}</p>
                  <p className="text-xs text-muted-foreground">{formatHora(b.hora)}</p>
                </td>
                <td className="px-5 py-4 text-xs max-w-[240px]">
                  <span className="line-clamp-2">{b.servicos.map((s) => s.nome).join(", ")}</span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={b.status} />
                  {!b.adiantamentoPago && b.status === "AGUARDA_CONFIRMACAO" && (
                    <p className="text-[10px] text-muted-foreground mt-1">Pagamento por validar</p>
                  )}
                </td>
                <td className="px-5 py-4 text-right font-display text-primary whitespace-nowrap">{formatMZN(b.valorTotal)}</td>
                <td className="px-3 py-4 text-muted-foreground"><ChevronRight className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                <div className="p-4 rounded-xl bg-secondary/40">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1"><Clock className="inline h-3 w-3 mr-1" /> Quando</p>
                  <p className="font-display text-lg">{formatDate(open.data)} · {formatHora(open.hora)}</p>
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
                  {!open.adiantamentoPago && open.status !== "CANCELADA" && (
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
