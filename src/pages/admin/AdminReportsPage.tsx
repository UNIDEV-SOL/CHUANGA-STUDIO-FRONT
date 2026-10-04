import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { formatDateShort, formatMZN, toIsoDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import { cn } from "@/lib/utils";
import { useAdminRelatorioCaixa } from "@/hooks/useAdminApi";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import { descarregarPdf } from "@/lib/pdf";

type Preset = "hoje" | "7d" | "mes" | "mesPassado" | "outro";

function intervalo(p: Preset): [string, string] {
  const hoje = new Date();
  const d = (y: number, m: number, dia: number) => toIsoDate(new Date(y, m, dia));
  switch (p) {
    case "hoje":
      return [toIsoDate(hoje), toIsoDate(hoje)];
    case "7d": {
      const ini = new Date(hoje);
      ini.setDate(hoje.getDate() - 6);
      return [toIsoDate(ini), toIsoDate(hoje)];
    }
    case "mesPassado":
      return [d(hoje.getFullYear(), hoje.getMonth() - 1, 1), d(hoje.getFullYear(), hoje.getMonth(), 0)];
    default:
      return [d(hoje.getFullYear(), hoje.getMonth(), 1), toIsoDate(hoje)];
  }
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "mes", label: "Este mês" },
  { id: "mesPassado", label: "Mês passado" },
  { id: "outro", label: "Outro" },
];

function Tile({ label, valor, nota }: { label: string; valor: string; nota?: string }) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border/60">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-3xl mt-2 tabular-nums">{valor}</p>
      {nota && <p className="text-xs text-muted-foreground mt-1">{nota}</p>}
    </div>
  );
}

export default function AdminReportsPage() {
  const [preset, setPreset] = useState<Preset>("mes");
  const [[inicio, fim], setPeriodo] = useState(() => intervalo("mes"));
  const relatorio = useAdminRelatorioCaixa(inicio, fim);
  const [baixando, setBaixando] = useState(false);

  async function baixarPdf() {
    setBaixando(true);
    try {
      const nome = inicio === fim ? `Relatorio-caixa-${inicio}.pdf` : `Relatorio-caixa-${inicio}-a-${fim}.pdf`;
      await descarregarPdf(`${API_ENDPOINTS.admin.relatorioCaixa}/pdf?inicio=${inicio}&fim=${fim}`, nome);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBaixando(false);
    }
  }
  const r = relatorio.data;

  const escolher = (p: Preset) => {
    setPreset(p);
    if (p !== "outro") setPeriodo(intervalo(p));
  };

  const dias = useMemo(
    () => (r?.porDia ?? []).map((d) => ({ ...d, rotulo: formatDateShort(d.data).slice(0, 5) })),
    [r?.porDia],
  );
  const maxForma = Math.max(1, ...(r?.porForma ?? []).map((f) => Number(f.total)));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Caixa</p>
          <h1 className="font-display text-4xl mt-1">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDateShort(inicio)}{inicio !== fim && ` a ${formatDateShort(fim)}`}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="rounded-full" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button className="rounded-full bg-primary" disabled={baixando || inicio > fim} onClick={baixarPdf}>
            {baixando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Descarregar PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6 print:hidden">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => escolher(p.id)}
            className={cn(
              "h-9 px-4 rounded-full border text-sm transition",
              preset === p.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40",
            )}
          >
            {p.label}
          </button>
        ))}
        {preset === "outro" && (
          <div className="flex items-center gap-2">
            <Input type="date" value={inicio} max={fim} onChange={(e) => setPeriodo([e.target.value, fim])} className="h-9 w-[150px]" aria-label="Início" />
            <span className="text-muted-foreground text-sm">a</span>
            <Input type="date" value={fim} min={inicio} onChange={(e) => setPeriodo([inicio, e.target.value])} className="h-9 w-[150px]" aria-label="Fim" />
          </div>
        )}
      </div>

      {relatorio.isError && <QueryError query={relatorio} className="mb-4" />}

      {relatorio.isLoading || !r ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Faturado" valor={formatMZN(r.faturado)} nota={`${r.atendimentos} atendimentos · ticket médio ${formatMZN(r.ticketMedio)}`} />
            <Tile label="Recebido na caixa" valor={formatMZN(r.recebido)} nota={`+ ${formatMZN(r.adiantamentosDeduzidos)} de adiantamentos já pagos`} />
            <Tile label="Por receber" valor={formatMZN(r.porReceber)} nota={`${r.faturasPorReceber} faturas por pagar (todas as datas)`} />
            <Tile label="Descontos dados" valor={formatMZN(r.descontos)} nota={`${r.marcacoesCanceladas} marcações canceladas no período`} />
          </div>

          {dias.length > 1 && (
            <div className="rounded-2xl bg-card border border-border/60 p-5">
              <h2 className="font-display text-2xl">Faturado por dia</h2>
              <p className="text-xs text-muted-foreground mb-4">Serviços faturados (sem descontos) em cada dia.</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dias} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
                    <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      interval="preserveStartEnd" minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} width={64} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}k` : String(v))} />
                    <Tooltip
                      cursor={{ fill: "var(--secondary)", opacity: 0.5 }}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--popover-foreground)" }}
                      labelFormatter={(_, p) => (p?.[0] ? formatDateShort(p[0].payload.data) : "")}
                      formatter={(v: number) => [formatMZN(v), "Faturado"]}
                    />
                    <Bar dataKey="faturado" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-card border border-border/60 p-5">
              <h2 className="font-display text-2xl mb-4">Recebido por forma de pagamento</h2>
              {r.porForma.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pagamento registado no período.</p>
              ) : (
                <ul className="space-y-3">
                  {r.porForma.map((f) => (
                    <li key={f.forma} className="text-sm">
                      <div className="flex justify-between gap-3">
                        <span>{f.rotulo} <span className="text-muted-foreground">· {f.quantidade}</span></span>
                        <span className="font-medium tabular-nums">{formatMZN(f.total)}</span>
                      </div>
                      <div className="h-1.5 mt-1.5 rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(Number(f.total) / maxForma) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl bg-card border border-border/60 p-5">
              <h2 className="font-display text-2xl mb-4">Serviços mais vendidos</h2>
              {r.topServicos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem faturas no período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium pb-2">Serviço</th>
                      <th className="text-right font-medium pb-2">Qtd</th>
                      <th className="text-right font-medium pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.topServicos.map((s) => (
                      <tr key={s.descricao} className="border-t border-border/40">
                        <td className="py-2">{s.descricao}</td>
                        <td className="py-2 text-right tabular-nums">{s.quantidade}</td>
                        <td className="py-2 text-right tabular-nums">{formatMZN(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
