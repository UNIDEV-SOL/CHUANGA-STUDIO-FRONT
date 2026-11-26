import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Ban, Check, ChevronRight, Copy, Download, Loader2, Mail, MessageCircle, MessageSquareText, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatDateShort, formatHora, formatMZN, formatTime, toIsoDate, whatsappMensagemLink } from "@/shared/lib/format";
import { FATURA_STATUS, FORMA_PAGAMENTO_LABEL, FORMA_PAGAMENTO_OPTIONS } from "@/shared/lib/status";
import { descarregarPdf, nomeFicheiroFatura } from "@/shared/lib/pdf";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { QueryError } from "@/shared/components/QueryError";
import { InfiniteScrollTable } from "@/shared/components/InfiniteScrollTable";
import { useDebounce } from "@/shared/hooks/useDebounce";
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
import { useAdminAnularFatura, useAdminFatura, useAdminFaturas, useAdminPagarFatura, useAdminReenviarFatura } from "@/modules/invoices/hooks/useInvoicesApi";
import { useAdminRelatorioCaixa } from "@/modules/reports/hooks/useReportsApi";
import type { Fatura, FormaPagamento, StatusFatura } from "@/modules/invoices/models";

const mensagemWhatsapp = (f: Fatura) =>
  `Olá ${f.clienteNome.split(" ")[0]}! Segue a sua ${f.status === "PAGA" ? "fatura/recibo" : "fatura"} ` +
  `${f.numero} do Chuanga Studio (${formatMZN(f.totalAPagar)}): ${f.pdfUrl}`;

export default function AdminInvoicesPage() {
  const pagar = useAdminPagarFatura();
  const anular = useAdminAnularFatura();
  const reenviar = useAdminReenviarFatura();
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState<StatusFatura | "todas">("todas");
  const [q, setQ] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const busca = useDebounce(q);
  const lista = useAdminFaturas({ status, busca, dataInicio, dataFim });
  // "Por receber" de todas as datas (vem do relatório de caixa, sem carregar todas as faturas).
  const hoje = toIsoDate(new Date());
  const resumo = useAdminRelatorioCaixa(hoje, hoje);
  const openId = searchParams.get("id");
  const detalhe = useAdminFatura(openId);
  const [forma, setForma] = useState<FormaPagamento>("NUMERARIO");
  const [referencia, setReferencia] = useState("");
  const [emailReenvio, setEmailReenvio] = useState("");
  const [confirmAnular, setConfirmAnular] = useState(false);
  const [baixando, setBaixando] = useState(false);

  const open = openId ? lista.items.find((f) => f.id === openId) ?? detalhe.data ?? null : null;

  // Ao abrir uma fatura, prepara os campos com os dados dela.
  useEffect(() => {
    if (!open) return;
    setForma("NUMERARIO");
    setReferencia("");
    setEmailReenvio(open.clienteEmail ?? "");
  }, [open?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrir = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("id", id); else next.delete("id");
    setSearchParams(next, { replace: true });
  };

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

  async function baixar(f: Fatura) {
    setBaixando(true);
    try {
      await descarregarPdf(`${API_ENDPOINTS.admin.faturas}/${f.id}/pdf`, nomeFicheiroFatura(f.numero));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBaixando(false);
    }
  }

  async function copiar(texto: string, sucesso: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(sucesso);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  const doAnular = async () => {
    if (!open) return;
    await run(anular.mutateAsync(open.id), "Fatura anulada. A marcação voltou a ficar confirmada.");
    setConfirmAnular(false);
  };

  const busy = pagar.isPending || anular.isPending || reenviar.isPending;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Caixa</p>
          <h1 className="font-display text-4xl mt-1">Faturas</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {resumo.data && resumo.data.faturasPorReceber > 0
            ? `${resumo.data.faturasPorReceber} por pagar · ${formatMZN(resumo.data.porReceber)}`
            : `${lista.total} faturas`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar cliente, telefone ou nº..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFatura | "todas")}>
          <SelectTrigger className="w-full sm:w-[200px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os estados</SelectItem>
            {Object.entries(FATURA_STATUS).map(([value, s]) => <SelectItem key={value} value={value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="date" value={dataInicio} max={dataFim || undefined} onChange={(e) => setDataInicio(e.target.value)} className="h-10 w-[150px]" aria-label="Emitidas desde" />
          <span className="text-muted-foreground text-sm">a</span>
          <Input type="date" value={dataFim} min={dataInicio || undefined} onChange={(e) => setDataFim(e.target.value)} className="h-10 w-[150px]" aria-label="Emitidas até" />
        </div>
      </div>

      {lista.query.isError && <QueryError query={lista.query} className="mb-4" />}

      <InfiniteScrollTable<Fatura>
        data={lista.items}
        total={lista.total}
        getRowKey={(f) => f.id}
        onRowClick={(f) => abrir(f.id)}
        isLoading={lista.isLoading}
        hasMore={lista.hasMore}
        isLoadingMore={lista.isLoadingMore}
        onLoadMore={lista.loadMore}
        emptyMessage='Nenhuma fatura encontrada. As faturas são emitidas em Marcações → "Fechar conta".'
        columns={[
          { id: "numero", label: "Nº", minWidth: 120, className: "font-medium whitespace-nowrap", render: (f) => f.numero },
          {
            id: "cliente", label: "Cliente", minWidth: 200,
            render: (f) => (<><p className="font-medium">{f.clienteNome}</p><p className="text-xs text-muted-foreground">{f.clienteTelefone}</p></>),
          },
          {
            id: "emitida", label: "Emitida", minWidth: 120, className: "whitespace-nowrap",
            render: (f) => (<><p>{formatDateShort(f.dataEmissao)}</p><p className="text-xs text-muted-foreground">{formatTime(f.dataEmissao)}</p></>),
          },
          { id: "estado", label: "Estado", minWidth: 110, render: (f) => <StatusBadge kind="fatura" status={f.status} /> },
          {
            id: "total", label: "A pagar", align: "right", minWidth: 110, className: "font-display text-primary whitespace-nowrap",
            render: (f) => formatMZN(f.totalAPagar),
          },
          { id: "abrir", label: "", align: "right", className: "text-muted-foreground w-8", render: () => <ChevronRight className="h-4 w-4 inline" /> },
        ]}
      />

      <Dialog open={!!open} onOpenChange={(v) => !v && abrir(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl flex flex-wrap items-center gap-3">
                  {open.numero} <StatusBadge kind="fatura" status={open.status} />
                </DialogTitle>
                <DialogDescription>
                  {open.clienteNome} · atendimento de {formatDate(open.dataMarcacao)} às {formatHora(open.horaMarcacao)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <ul className="space-y-1">
                  {open.itens.map((i, idx) => (
                    <li key={idx} className="flex justify-between gap-3">
                      <span>{i.quantidade > 1 && `${i.quantidade} × `}{i.descricao}</span>
                      <span className="text-primary whitespace-nowrap">{formatMZN(i.total)}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl bg-secondary/40 p-4 space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMZN(open.subtotal)}</span></div>
                  {Number(open.desconto) > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>− {formatMZN(open.desconto)}</span></div>
                  )}
                  {Number(open.descontoFidelizacao) > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Fidelização</span><span>− {formatMZN(open.descontoFidelizacao ?? 0)}</span></div>
                  )}
                  {Number(open.adiantamentoDeduzido) > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Adiantamento</span><span>− {formatMZN(open.adiantamentoDeduzido)}</span></div>
                  )}
                  {Number(open.valorVale) > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Vale {open.valeCodigo}</span><span>− {formatMZN(open.valorVale ?? 0)}</span></div>
                  )}
                  <div className="border-t border-dashed border-border pt-2 mt-2 flex justify-between font-display text-xl">
                    <span>{open.status === "PAGA" ? "Total pago" : "Total a pagar"}</span>
                    <span className="text-primary">{formatMZN(open.totalAPagar)}</span>
                  </div>
                  {open.status === "PAGA" && open.pagoEm && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Pago a {formatDateShort(open.pagoEm)} às {formatTime(open.pagoEm)}
                      {open.formaPagamento && ` · ${FORMA_PAGAMENTO_LABEL[open.formaPagamento]}`}
                      {open.referenciaPagamento && ` · ref. ${open.referenciaPagamento}`}
                    </p>
                  )}
                </div>
                {open.observacoes && <p className="text-xs italic text-muted-foreground">{open.observacoes}</p>}

                {open.status === "PENDENTE" && (
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <p className="font-medium">Registar pagamento</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
                        <SelectTrigger className="h-9" aria-label="Forma de pagamento"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FORMA_PAGAMENTO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Referência (opcional)" maxLength={60} value={referencia} onChange={(e) => setReferencia(e.target.value)} className="h-9" />
                    </div>
                    <Button
                      className="w-full rounded-full bg-primary"
                      disabled={busy}
                      onClick={() => run(
                        pagar.mutateAsync({ id: open.id, formaPagamento: forma, referenciaPagamento: referencia.trim() || undefined }),
                        "Pagamento registado. O recibo foi enviado ao cliente.",
                      )}
                    >
                      {pagar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                      Marcar como paga
                    </Button>
                  </div>
                )}

                {open.status !== "ANULADA" && (
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <div>
                      <p className="font-medium">Enviar de novo</p>
                      <p className="text-xs text-muted-foreground">Se o cliente não recebeu, reenvie por email (pode corrigir o endereço) ou pelo WhatsApp.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email-reenvio" className="text-xs">Email</Label>
                      <div className="flex gap-2">
                        <Input id="email-reenvio" type="email" placeholder="email@cliente.com" value={emailReenvio}
                          onChange={(e) => setEmailReenvio(e.target.value)} className="h-9" />
                        <Button
                          variant="outline" className="h-9 shrink-0" disabled={busy || !emailReenvio.trim()}
                          onClick={() => run(
                            reenviar.mutateAsync({ id: open.id, email: emailReenvio.trim() }),
                            `Fatura reenviada para ${emailReenvio.trim()}.`,
                          )}
                        >
                          {reenviar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                          Reenviar
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {open.clienteTelefone && (
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <a href={whatsappMensagemLink(open.clienteTelefone, mensagemWhatsapp(open))} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="rounded-full"
                        onClick={() => copiar(mensagemWhatsapp(open), "Mensagem copiada. Cole-a na conversa do cliente.")}>
                        <MessageSquareText className="h-4 w-4 mr-1.5" /> Copiar mensagem
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => copiar(open.pdfUrl, "Link do PDF copiado.")}>
                        <Copy className="h-4 w-4 mr-1.5" /> Copiar link do PDF
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" className="flex-1 rounded-full" disabled={baixando} onClick={() => baixar(open)}>
                    {baixando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Descarregar PDF
                  </Button>
                  {open.status !== "ANULADA" && (
                    <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => setConfirmAnular(true)}>
                      <Ban className="h-4 w-4 mr-2" /> Anular
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAnular} onOpenChange={setConfirmAnular}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular a fatura {open?.numero}?</AlertDialogTitle>
            <AlertDialogDescription>
              A fatura fica sem valor e a marcação volta a "Confirmada", para poder fechar a conta outra vez com os valores certos.
              {open?.status === "PAGA" && " Atenção: esta fatura já foi paga."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void doAnular(); }}
              disabled={anular.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {anular.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Anular fatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
