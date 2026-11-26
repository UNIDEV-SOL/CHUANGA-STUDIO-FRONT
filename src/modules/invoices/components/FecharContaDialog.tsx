import { useEffect, useMemo, useState } from "react";
import { Check, Gift, Loader2, Minus, Plus, Receipt, Stamp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatMZN } from "@/shared/lib/format";
import { FORMA_PAGAMENTO_OPTIONS } from "@/shared/lib/status";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { ComboboxSelect } from "@/shared/ui/combobox-select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/ui/select";
import { useAdminEmitirFatura } from "@/modules/invoices/hooks/useInvoicesApi";
import { usePublicServicos } from "@/modules/catalog/hooks/useCatalogApi";
import { consultarVale, useFidelizacaoCliente } from "@/modules/loyalty/hooks/useLoyaltyApi";
import type { Fatura, FormaPagamento } from "@/modules/invoices/models";
import type { Marcacao } from "@/modules/bookings/models";
import type { SaldoVale } from "@/modules/loyalty/models";

interface Linha {
  key: string;
  servicoId: string | null;
  descricao: string;
  precoUnitario: number;
  quantidade: number;
}

let seq = 0;
const novaKey = () => `l${++seq}`;

const linhasDaMarcacao = (m: Marcacao): Linha[] =>
  m.servicos.map((s) => ({ key: novaKey(), servicoId: s.servicoId, descricao: s.nome, precoUnitario: Number(s.preco), quantidade: 1 }));

/**
 * Fecho de conta na caixa: parte dos serviços reservados, permite ajustar ao que
 * foi realmente feito (extras, quantidades, desconto) e emite a fatura.
 */
export function FecharContaDialog({
  marcacao,
  open,
  onOpenChange,
  onEmitida,
}: {
  marcacao: Marcacao | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEmitida?: (f: Fatura) => void;
}) {
  const emitir = useAdminEmitirFatura();
  // Catálogo ativo inteiro para o "Adicionar serviço".
  const servicosQuery = usePublicServicos();

  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [escolhido, setEscolhido] = useState("");
  const [extraDescricao, setExtraDescricao] = useState("");
  const [extraPreco, setExtraPreco] = useState("");
  const [desconto, setDesconto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [jaPagou, setJaPagou] = useState(false);
  const [forma, setForma] = useState<FormaPagamento>("NUMERARIO");
  const [referencia, setReferencia] = useState("");
  const [nuit, setNuit] = useState("");
  const fidelizacao = useFidelizacaoCliente(open ? marcacao?.clienteId : undefined);
  const [usarRecompensa, setUsarRecompensa] = useState(false);
  const [codigoVale, setCodigoVale] = useState("");
  const [vale, setVale] = useState<SaldoVale | null>(null);
  const [validandoVale, setValidandoVale] = useState(false);

  // Recomeça sempre a partir da reserva quando o diálogo abre.
  useEffect(() => {
    if (!open || !marcacao) return;
    setLinhas(linhasDaMarcacao(marcacao));
    setEscolhido("");
    setExtraDescricao("");
    setExtraPreco("");
    setDesconto("");
    setObservacoes("");
    setJaPagou(false);
    setForma("NUMERARIO");
    setReferencia("");
    setNuit("");
    setUsarRecompensa(false);
    setCodigoVale("");
    setVale(null);
  }, [open, marcacao]);

  async function validarVale() {
    if (!codigoVale.trim()) return;
    setValidandoVale(true);
    try {
      const v = await consultarVale(codigoVale, true);
      if (v.estado !== "ATIVO" || v.expirado || Number(v.saldo) <= 0) {
        setVale(null);
        toast.error(v.expirado ? "Este vale já expirou." : v.estado === "ANULADO" ? "Este vale foi anulado." : "Este vale já não tem saldo.");
      } else {
        setVale(v);
      }
    } catch (e) {
      setVale(null);
      toast.error((e as Error).message);
    } finally {
      setValidandoVale(false);
    }
  }

  const catalogo = useMemo(
    () => (servicosQuery.data ?? []).filter((s) => s.ativo).map((s) => ({ value: s.id, label: `${s.nome} · ${formatMZN(s.preco)}` })),
    [servicosQuery.data],
  );

  const subtotal = linhas.reduce((t, l) => t + l.precoUnitario * l.quantidade, 0);
  const descontoNum = Math.max(0, Number(desconto) || 0);
  // Mesma ordem que o backend: desconto → fidelização → adiantamento → vale.
  const aposDesconto = Math.max(0, subtotal - descontoNum);
  const estadoFid = fidelizacao.data;
  const recompensaDisponivel = !!estadoFid?.ativo && (estadoFid.recompensasDisponiveis ?? 0) > 0;
  const valorFidelizacao = usarRecompensa && recompensaDisponivel ? Math.min(Number(estadoFid!.valorRecompensa), aposDesconto) : 0;
  const aposFidelizacao = aposDesconto - valorFidelizacao;
  const adiantamento = marcacao?.adiantamentoPago
    ? Math.min(Number(marcacao.valorAdiantamento), aposFidelizacao)
    : 0;
  const restante = aposFidelizacao - adiantamento;
  const valorVale = vale ? Math.min(Number(vale.saldo), restante) : 0;
  const total = Math.max(0, restante - valorVale);
  const descontoInvalido = descontoNum > subtotal;
  const nuitInvalido = nuit.trim() !== "" && !/^\d{9}$/.test(nuit.trim());

  const alterar = (key: string, patch: Partial<Linha>) =>
    setLinhas((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const adicionarServico = (id: string) => {
    const s = servicosQuery.data?.find((x) => x.id === id);
    if (!s) return;
    setLinhas((ls) => {
      const existente = ls.find((l) => l.servicoId === s.id);
      return existente
        ? ls.map((l) => (l === existente ? { ...l, quantidade: l.quantidade + 1 } : l))
        : [...ls, { key: novaKey(), servicoId: s.id, descricao: s.nome, precoUnitario: Number(s.preco), quantidade: 1 }];
    });
    setEscolhido("");
  };

  const adicionarExtra = () => {
    const preco = Number(extraPreco);
    if (!extraDescricao.trim() || !(preco >= 0) || extraPreco === "") return;
    setLinhas((ls) => [...ls, { key: novaKey(), servicoId: null, descricao: extraDescricao.trim(), precoUnitario: preco, quantidade: 1 }]);
    setExtraDescricao("");
    setExtraPreco("");
  };

  async function submeter() {
    if (!marcacao) return;
    try {
      const fatura = await emitir.mutateAsync({
        marcacaoId: marcacao.id,
        itens: linhas.map((l) =>
          l.servicoId
            ? { servicoId: l.servicoId, precoUnitario: l.precoUnitario, quantidade: l.quantidade }
            : { descricao: l.descricao, precoUnitario: l.precoUnitario, quantidade: l.quantidade },
        ),
        desconto: descontoNum || undefined,
        observacoes: observacoes.trim() || undefined,
        formaPagamento: jaPagou ? forma : undefined,
        referenciaPagamento: jaPagou && referencia.trim() ? referencia.trim() : undefined,
        clienteNuit: nuit.trim() || undefined,
        aplicarFidelizacao: valorFidelizacao > 0,
        codigoVale: vale?.codigo,
      });
      toast.success(`Fatura ${fatura.numero} emitida e enviada ao cliente.`);
      onOpenChange(false);
      onEmitida?.(fatura);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Receipt className="h-5 w-5 text-rose-deep" /> Fechar conta
          </DialogTitle>
          <DialogDescription>
            {marcacao?.clienteNome} · confirme os serviços realmente feitos. A fatura é enviada por email (e WhatsApp, se configurado).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Serviços realizados</p>
            {linhas.length === 0 && (
              <p className="text-muted-foreground text-xs py-3">Adicione pelo menos um serviço.</p>
            )}
            <ul className="divide-y divide-border/60">
              {linhas.map((l) => (
                <li key={l.key} className="py-2.5 flex flex-wrap items-center gap-3">
                  <span className="flex-1 min-w-[160px]">
                    {l.descricao}
                    {!l.servicoId && <span className="ml-2 text-[10px] uppercase tracking-wider text-rose-deep">extra</span>}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="icon" variant="outline" className="h-7 w-7" aria-label="Menos"
                      disabled={l.quantidade <= 1} onClick={() => alterar(l.key, { quantidade: l.quantidade - 1 })}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center tabular-nums">{l.quantidade}</span>
                    <Button type="button" size="icon" variant="outline" className="h-7 w-7" aria-label="Mais"
                      onClick={() => alterar(l.key, { quantidade: l.quantidade + 1 })}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    type="number" min={0} step="1" aria-label="Preço unitário"
                    className="h-8 w-24 text-right"
                    value={l.precoUnitario}
                    onChange={(e) => alterar(l.key, { precoUnitario: Math.max(0, Number(e.target.value) || 0) })}
                  />
                  <span className="w-24 text-right text-primary font-medium tabular-nums">{formatMZN(l.precoUnitario * l.quantidade)}</span>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Remover"
                    onClick={() => setLinhas((ls) => ls.filter((x) => x.key !== l.key))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Adicionar serviço do menu</Label>
              <ComboboxSelect items={catalogo} value={escolhido} setValue={setEscolhido} placeHolder="Procurar serviço..." onSelect={adicionarServico} />
            </div>
            <div className="space-y-1.5">
              <Label>Ou um extra</Label>
              <div className="flex gap-2">
                <Input placeholder="Descrição" value={extraDescricao} onChange={(e) => setExtraDescricao(e.target.value)} className="h-9" />
                <Input placeholder="MZN" type="number" min={0} value={extraPreco} onChange={(e) => setExtraPreco(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && adicionarExtra()} className="h-9 w-24" />
                <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Adicionar extra" onClick={adicionarExtra}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="desconto">Desconto (MZN)</Label>
              <Input id="desconto" type="number" min={0} placeholder="0" value={desconto} onChange={(e) => setDesconto(e.target.value)} className="h-9" />
              {descontoInvalido && <p className="text-xs text-destructive">O desconto não pode ser maior que o subtotal.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nuit">NUIT do cliente (opcional)</Label>
              <Input id="nuit" inputMode="numeric" placeholder="9 dígitos" maxLength={9} value={nuit}
                onChange={(e) => setNuit(e.target.value.replace(/\D/g, ""))} className="h-9" />
              {nuitInvalido && <p className="text-xs text-destructive">O NUIT tem 9 dígitos.</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="obs">Observações na fatura</Label>
              <Textarea id="obs" rows={2} maxLength={500} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="flex items-center gap-2 font-medium"><Stamp className="h-4 w-4 text-rose-deep" /> Cartão de fidelização</p>
              {!estadoFid ? (
                <p className="text-xs text-muted-foreground">{fidelizacao.isLoading ? "A carregar..." : "—"}</p>
              ) : !estadoFid.ativo ? (
                <p className="text-xs text-muted-foreground">O programa está desligado.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1" aria-label={`${estadoFid.carimbos} de ${estadoFid.visitasPorRecompensa} carimbos`}>
                    {Array.from({ length: estadoFid.visitasPorRecompensa }, (_, i) => (
                      <span key={i} className={`h-5 w-5 rounded-full border text-[10px] grid place-items-center ${i < estadoFid.carimbos ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                        {i < estadoFid.carimbos && <Check className="h-3 w-3" />}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {estadoFid.carimbos}/{estadoFid.visitasPorRecompensa} visitas · esta fatura conta como mais uma.
                  </p>
                  {recompensaDisponivel && (
                    <label className="flex items-center justify-between gap-2 cursor-pointer pt-1">
                      <span className="text-sm">Usar recompensa de <strong>{formatMZN(estadoFid.valorRecompensa)}</strong></span>
                      <Switch checked={usarRecompensa} onCheckedChange={setUsarRecompensa} />
                    </label>
                  )}
                </>
              )}
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="flex items-center gap-2 font-medium"><Gift className="h-4 w-4 text-rose-deep" /> Vale-oferta</p>
              <div className="flex gap-2">
                <Input placeholder="CHG-XXXX-XXXX" value={codigoVale} maxLength={20} className="h-9 font-mono uppercase"
                  onChange={(e) => { setCodigoVale(e.target.value.toUpperCase()); setVale(null); }}
                  onKeyDown={(e) => e.key === "Enter" && validarVale()} />
                <Button type="button" variant="outline" className="h-9" disabled={!codigoVale.trim() || validandoVale} onClick={validarVale}>
                  {validandoVale ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar"}
                </Button>
              </div>
              {vale && (
                <p className="text-xs text-emerald-700 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Saldo {formatMZN(vale.saldo)}
                  <button type="button" className="ml-auto underline text-muted-foreground" onClick={() => { setVale(null); setCodigoVale(""); }}>retirar</button>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-secondary/40 p-4 space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMZN(subtotal)}</span></div>
            {descontoNum > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>− {formatMZN(descontoNum)}</span></div>
            )}
            {valorFidelizacao > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Recompensa de fidelização</span><span>− {formatMZN(valorFidelizacao)}</span></div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adiantamento já pago</span>
              <span>{adiantamento > 0 ? `− ${formatMZN(adiantamento)}` : "—"}</span>
            </div>
            {valorVale > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Vale {vale?.codigo}</span><span>− {formatMZN(valorVale)}</span></div>
            )}
            {marcacao && !marcacao.adiantamentoPago && (
              <p className="text-[11px] text-gold">O adiantamento desta marcação não foi confirmado, por isso não é descontado.</p>
            )}
            <div className="border-t border-dashed border-border pt-2 mt-2 flex justify-between font-display text-2xl">
              <span>{jaPagou ? "Total pago" : "Total a pagar"}</span><span className="text-primary">{formatMZN(total)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span>
                <span className="font-medium">O cliente já pagou</span>
                <span className="block text-xs text-muted-foreground">A fatura sai como paga e o cliente recebe o recibo.</span>
              </span>
              <Switch checked={jaPagou} onCheckedChange={setJaPagou} />
            </label>
            {jaPagou && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
                  <SelectTrigger className="h-9" aria-label="Forma de pagamento"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMA_PAGAMENTO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Referência (opcional)" maxLength={60} value={referencia} onChange={(e) => setReferencia(e.target.value)} className="h-9" />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={emitir.isPending}>Voltar</Button>
          <Button className="rounded-full bg-primary" disabled={emitir.isPending || linhas.length === 0 || descontoInvalido || nuitInvalido} onClick={submeter}>
            {emitir.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Receipt className="h-4 w-4 mr-2" />}
            Emitir fatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
