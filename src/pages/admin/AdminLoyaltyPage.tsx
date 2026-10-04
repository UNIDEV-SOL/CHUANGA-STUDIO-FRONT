import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Ban, Copy, Gift, Loader2, Plus, Search, Stamp } from "lucide-react";
import { toast } from "sonner";
import { formatDateShort, formatMZN } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryError } from "@/components/QueryError";
import { InfiniteScrollTable } from "@/components/InfiniteScrollTable";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useAnularVale, useCriarVale, useFidelizacaoConfig, useGuardarFidelizacaoConfig, useVales,
} from "@/hooks/useFidelizacaoApi";
import type { EstadoVale, Vale } from "@/types/api";

const ESTADO_VALE: Record<EstadoVale, { label: string; cls: string }> = {
  ATIVO: { label: "Ativo", cls: "bg-emerald-100 text-emerald-800" },
  ESGOTADO: { label: "Usado", cls: "bg-secondary text-muted-foreground" },
  ANULADO: { label: "Anulado", cls: "bg-red-100 text-red-700" },
};

function EstadoValeBadge({ v }: { v: Vale }) {
  const e = v.expirado && v.estado === "ATIVO" ? { label: "Expirado", cls: "bg-amber-100 text-amber-800" } : ESTADO_VALE[v.estado];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${e.cls}`}>{e.label}</span>;
}

export default function AdminLoyaltyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const separador = searchParams.get("separador") === "programa" ? "programa" : "vales";
  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Clientes</p>
        <h1 className="font-display text-4xl mt-1">Fidelização e vales</h1>
      </div>
      <Tabs value={separador} onValueChange={(v) => setSearchParams(v === "vales" ? {} : { separador: v }, { replace: true })}>
        <TabsList className="mb-6">
          <TabsTrigger value="vales"><Gift className="h-4 w-4 mr-1.5" /> Vales-oferta</TabsTrigger>
          <TabsTrigger value="programa"><Stamp className="h-4 w-4 mr-1.5" /> Cartão de fidelização</TabsTrigger>
        </TabsList>
        <TabsContent value="vales"><Vales /></TabsContent>
        <TabsContent value="programa"><Programa /></TabsContent>
      </Tabs>
    </div>
  );
}

function Vales() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoVale | "todos">("todos");
  const busca = useDebounce(q);
  const lista = useVales({ busca, estado });
  const anular = useAnularVale();
  const [novo, setNovo] = useState(false);
  const [aberto, setAberto] = useState<Vale | null>(null);

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      toast.success("Código copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar código, comprador ou quem recebe..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v as EstadoVale | "todos")}>
          <SelectTrigger className="w-full sm:w-[180px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estados</SelectItem>
            {Object.entries(ESTADO_VALE).map(([v, e]) => <SelectItem key={v} value={v}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="rounded-full bg-primary h-10" onClick={() => setNovo(true)}><Plus className="h-4 w-4 mr-1.5" /> Novo vale</Button>
      </div>

      {lista.query.isError && <QueryError query={lista.query} className="mb-4" />}

      <InfiniteScrollTable<Vale>
        data={lista.items}
        total={lista.total}
        getRowKey={(v) => v.id}
        onRowClick={setAberto}
        isLoading={lista.isLoading}
        hasMore={lista.hasMore}
        isLoadingMore={lista.isLoadingMore}
        onLoadMore={lista.loadMore}
        emptyMessage="Ainda não há vales. Crie um quando alguém comprar um vale-oferta na caixa."
        columns={[
          { id: "codigo", label: "Código", minWidth: 150, className: "font-mono font-medium whitespace-nowrap", render: (v) => v.codigo },
          {
            id: "para", label: "Para / De", minWidth: 200,
            render: (v) => (<><p className="font-medium">{v.beneficiarioNome ?? "—"}</p><p className="text-xs text-muted-foreground">{v.compradorNome ? `de ${v.compradorNome}` : ""}</p></>),
          },
          { id: "emitido", label: "Emitido", minWidth: 110, className: "whitespace-nowrap", render: (v) => formatDateShort(v.criadoEm) },
          { id: "validade", label: "Válido até", minWidth: 110, className: "whitespace-nowrap", render: (v) => (v.validoAte ? formatDateShort(v.validoAte) : "—") },
          { id: "estado", label: "Estado", minWidth: 100, render: (v) => <EstadoValeBadge v={v} /> },
          {
            id: "saldo", label: "Saldo", align: "right", minWidth: 130, className: "whitespace-nowrap",
            render: (v) => (<><p className="font-display text-lg text-primary">{formatMZN(v.saldo)}</p><p className="text-xs text-muted-foreground">de {formatMZN(v.valorInicial)}</p></>),
          },
        ]}
      />

      <NovoValeDialog open={novo} onOpenChange={setNovo} onCriado={(v) => setAberto(v)} />

      <Dialog open={!!aberto} onOpenChange={(v) => !v && setAberto(null)}>
        <DialogContent className="max-w-md">
          {aberto && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Vale-oferta</DialogTitle>
                <DialogDescription>Emitido a {formatDateShort(aberto.criadoEm)}</DialogDescription>
              </DialogHeader>
              <div className="rounded-2xl border-2 border-dashed border-primary/40 p-5 text-center">
                <p className="text-[11px] uppercase tracking-[0.2em] text-rose-deep">Código</p>
                <p className="font-mono text-2xl font-bold tracking-widest mt-1">{aberto.codigo}</p>
                <p className="font-display text-3xl text-primary mt-2">{formatMZN(aberto.saldo)}</p>
                <p className="text-xs text-muted-foreground">de {formatMZN(aberto.valorInicial)} · <EstadoValeBadge v={aberto} /></p>
              </div>
              <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-muted-foreground">Para</dt><dd>{aberto.beneficiarioNome ?? "—"} {aberto.beneficiarioEmail && <span className="text-muted-foreground">· {aberto.beneficiarioEmail}</span>}</dd>
                <dt className="text-muted-foreground">Comprado por</dt><dd>{aberto.compradorNome ?? "—"} {aberto.compradorContacto && <span className="text-muted-foreground">· {aberto.compradorContacto}</span>}</dd>
                <dt className="text-muted-foreground">Válido até</dt><dd>{aberto.validoAte ? formatDateShort(aberto.validoAte) : "—"}</dd>
                {aberto.mensagem && (<><dt className="text-muted-foreground">Mensagem</dt><dd className="italic">“{aberto.mensagem}”</dd></>)}
              </dl>
              <DialogFooter className="gap-2">
                {aberto.estado === "ATIVO" && (
                  <Button variant="outline" className="text-destructive" disabled={anular.isPending}
                    onClick={async () => {
                      try {
                        setAberto(await anular.mutateAsync(aberto.id));
                        toast.success("Vale anulado.");
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}>
                    <Ban className="h-4 w-4 mr-1.5" /> Anular
                  </Button>
                )}
                <Button className="rounded-full bg-primary" onClick={() => copiar(aberto.codigo)}><Copy className="h-4 w-4 mr-1.5" /> Copiar código</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function NovoValeDialog({ open, onOpenChange, onCriado }: { open: boolean; onOpenChange: (v: boolean) => void; onCriado: (v: Vale) => void }) {
  const criar = useCriarVale();
  const [valor, setValor] = useState("");
  const [compradorNome, setCompradorNome] = useState("");
  const [compradorContacto, setCompradorContacto] = useState("");
  const [beneficiarioNome, setBeneficiarioNome] = useState("");
  const [beneficiarioEmail, setBeneficiarioEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [validoAte, setValidoAte] = useState("");

  useEffect(() => {
    if (open) return;
    setValor(""); setCompradorNome(""); setCompradorContacto(""); setBeneficiarioNome("");
    setBeneficiarioEmail(""); setMensagem(""); setValidoAte("");
  }, [open]);

  const valorNum = Number(valor);
  const valido = valorNum >= 50;

  async function submeter() {
    try {
      const v = await criar.mutateAsync({
        valor: valorNum,
        compradorNome: compradorNome.trim() || undefined,
        compradorContacto: compradorContacto.trim() || undefined,
        beneficiarioNome: beneficiarioNome.trim() || undefined,
        beneficiarioEmail: beneficiarioEmail.trim() || undefined,
        mensagem: mensagem.trim() || undefined,
        validoAte: validoAte || undefined,
      });
      toast.success(beneficiarioEmail.trim() ? `Vale ${v.codigo} emitido e enviado por email.` : `Vale ${v.codigo} emitido.`);
      onOpenChange(false);
      onCriado(v);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Novo vale-oferta</DialogTitle>
          <DialogDescription>Registe o vale depois de receber o pagamento. Se indicar o email de quem recebe, o vale segue por email.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="space-y-1.5">
            <Label htmlFor="vale-valor">Valor (MZN) *</Label>
            <Input id="vale-valor" type="number" min={50} step={50} value={valor} onChange={(e) => setValor(e.target.value)} className="h-9" placeholder="1000" />
            {valor !== "" && !valido && <p className="text-xs text-destructive">Mínimo 50 MZN.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vale-validade">Válido até</Label>
            <Input id="vale-validade" type="date" value={validoAte} onChange={(e) => setValidoAte(e.target.value)} className="h-9" />
            <p className="text-[11px] text-muted-foreground">Vazio = 1 ano.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vale-comprador">Quem compra</Label>
            <Input id="vale-comprador" value={compradorNome} maxLength={120} onChange={(e) => setCompradorNome(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vale-contacto">Contacto de quem compra</Label>
            <Input id="vale-contacto" value={compradorContacto} maxLength={120} onChange={(e) => setCompradorContacto(e.target.value)} className="h-9" placeholder="Telefone ou email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vale-para">Para quem é</Label>
            <Input id="vale-para" value={beneficiarioNome} maxLength={120} onChange={(e) => setBeneficiarioNome(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vale-email">Email de quem recebe</Label>
            <Input id="vale-email" type="email" value={beneficiarioEmail} maxLength={180} onChange={(e) => setBeneficiarioEmail(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="vale-msg">Mensagem</Label>
            <Textarea id="vale-msg" rows={2} maxLength={300} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Feliz aniversário! (opcional)" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={criar.isPending}>Cancelar</Button>
          <Button className="rounded-full bg-primary" disabled={!valido || criar.isPending} onClick={submeter}>
            {criar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />} Emitir vale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Programa() {
  const config = useFidelizacaoConfig();
  const guardar = useGuardarFidelizacaoConfig();
  const [ativo, setAtivo] = useState(true);
  const [visitas, setVisitas] = useState("10");
  const [valor, setValor] = useState("500");

  useEffect(() => {
    if (!config.data) return;
    setAtivo(config.data.ativo);
    setVisitas(String(config.data.visitasPorRecompensa));
    setValor(String(config.data.valorRecompensa));
  }, [config.data]);

  const visitasNum = Number(visitas);
  const valorNum = Number(valor);
  const valido = visitasNum >= 2 && visitasNum <= 50 && valorNum > 0;

  if (config.isError) return <QueryError query={config} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] max-w-4xl">
      <div className="rounded-2xl border border-border p-6 space-y-5">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span>
            <span className="font-medium">Programa ativo</span>
            <span className="block text-xs text-muted-foreground">Cada fatura emitida conta como uma visita (um carimbo).</span>
          </span>
          <Switch checked={ativo} onCheckedChange={setAtivo} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fid-visitas">Visitas para a recompensa</Label>
            <Input id="fid-visitas" type="number" min={2} max={50} value={visitas} onChange={(e) => setVisitas(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fid-valor">Valor da recompensa (MZN)</Label>
            <Input id="fid-valor" type="number" min={1} value={valor} onChange={(e) => setValor(e.target.value)} className="h-10" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          A recompensa é descontada no fecho de conta (botão "Usar recompensa"), antes do adiantamento.
          Mudar estes valores não apaga as visitas já feitas.
        </p>
        <Button className="rounded-full bg-primary" disabled={!valido || guardar.isPending}
          onClick={async () => {
            try {
              await guardar.mutateAsync({ ativo, visitasPorRecompensa: visitasNum, valorRecompensa: valorNum });
              toast.success("Programa de fidelização guardado.");
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}>
          {guardar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Guardar
        </Button>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-rose-deep">Como a cliente vê</p>
        <p className="font-display text-2xl mt-1">Cartão Chuanga</p>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {Array.from({ length: Math.min(Math.max(visitasNum || 0, 0), 50) }, (_, i) => (
            <span key={i} className={`h-7 w-7 rounded-full border-2 ${i < Math.ceil((visitasNum || 0) * 0.6) ? "bg-primary border-primary" : "border-primary/30"}`} />
          ))}
        </div>
        <p className="text-sm mt-4">
          À {visitasNum || "?"}.ª visita, ganha <strong>{valorNum > 0 ? formatMZN(valorNum) : "—"}</strong> de desconto.
        </p>
      </div>
    </div>
  );
}
