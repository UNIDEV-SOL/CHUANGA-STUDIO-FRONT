import { useEffect, useState } from "react";
import { CalendarX, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatHora, todayIso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import {
  useAdminAdicionarDiaFechado,
  useAdminGuardarHorario,
  useAdminHorario,
  useAdminRemoverDiaFechado,
} from "@/hooks/useAdminApi";
import type { HorarioDia } from "@/types/api";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

/** Inputs type="time" usam "HH:mm"; o backend devolve "HH:mm:ss". */
const hhmm = (v: string | null) => (v ? formatHora(v) : "");

export default function AdminSchedulePage() {
  const horarioQuery = useAdminHorario();
  const guardar = useAdminGuardarHorario();
  const adicionarFechado = useAdminAdicionarDiaFechado();
  const removerFechado = useAdminRemoverDiaFechado();

  const [semana, setSemana] = useState<HorarioDia[]>([]);
  const [novoDia, setNovoDia] = useState("");
  const [novoMotivo, setNovoMotivo] = useState("");

  useEffect(() => {
    if (horarioQuery.data) {
      setSemana(horarioQuery.data.semana.map((d) => ({
        ...d,
        abre: hhmm(d.abre), fecha: hhmm(d.fecha), pausaInicio: hhmm(d.pausaInicio), pausaFim: hhmm(d.pausaFim),
      })));
    }
  }, [horarioQuery.data]);

  const alterar = (dia: number, patch: Partial<HorarioDia>) =>
    setSemana((s) => s.map((d) => (d.diaSemana === dia ? { ...d, ...patch } : d)));

  async function guardarSemana() {
    try {
      await guardar.mutateAsync(semana.map((d) => ({
        ...d,
        abre: d.abre || null,
        fecha: d.fecha || null,
        pausaInicio: d.pausaInicio || null,
        pausaFim: d.pausaFim || null,
      })));
      toast.success("Horário guardado. As reservas passam a seguir este horário.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function adicionar() {
    if (!novoDia) {
      toast.error("Escolha a data.");
      return;
    }
    try {
      await adicionarFechado.mutateAsync({ data: novoDia, motivo: novoMotivo.trim() || undefined });
      toast.success("Dia fechado adicionado.");
      setNovoDia("");
      setNovoMotivo("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remover(id: string) {
    try {
      await removerFechado.mutateAsync(id);
      toast.success("Dia reaberto.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Agenda</p>
        <h1 className="font-display text-4xl mt-1">Horário</h1>
        <p className="text-sm text-muted-foreground mt-1">
          As clientes só conseguem reservar horas dentro deste horário, fora da pausa e dos dias fechados.
        </p>
      </div>

      {horarioQuery.isError && <QueryError query={horarioQuery} className="mb-4" />}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl bg-card border border-border/60 p-5">
          <h2 className="font-display text-2xl mb-4">Semana</h2>
          {horarioQuery.isLoading ? (
            <div className="space-y-3">{DIAS.map((d) => <Skeleton key={d} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {semana.map((d) => (
                <div key={d.diaSemana} className="rounded-xl border border-border/60 p-3 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 w-[130px] cursor-pointer">
                    <Switch checked={d.aberto} onCheckedChange={(v) => alterar(d.diaSemana, { aberto: v })} aria-label={`${DIAS[d.diaSemana - 1]} aberto`} />
                    <span className="font-medium text-sm">{DIAS[d.diaSemana - 1]}</span>
                  </label>
                  {d.aberto ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Input type="time" value={d.abre ?? ""} onChange={(e) => alterar(d.diaSemana, { abre: e.target.value })} className="h-9 w-[110px]" aria-label="Abre" />
                      <span className="text-muted-foreground">às</span>
                      <Input type="time" value={d.fecha ?? ""} onChange={(e) => alterar(d.diaSemana, { fecha: e.target.value })} className="h-9 w-[110px]" aria-label="Fecha" />
                      <span className="text-muted-foreground ml-2">pausa</span>
                      <Input type="time" value={d.pausaInicio ?? ""} onChange={(e) => alterar(d.diaSemana, { pausaInicio: e.target.value })} className="h-9 w-[110px]" aria-label="Início da pausa" />
                      <span className="text-muted-foreground">–</span>
                      <Input type="time" value={d.pausaFim ?? ""} onChange={(e) => alterar(d.diaSemana, { pausaFim: e.target.value })} className="h-9 w-[110px]" aria-label="Fim da pausa" />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Fechado</span>
                  )}
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">A pausa é opcional (ex.: almoço). Deixe em branco se não houver.</p>
              <Button className="rounded-full bg-primary" disabled={guardar.isPending || semana.length === 0} onClick={guardarSemana}>
                {guardar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar horário
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-5">
          <h2 className="font-display text-2xl mb-1">Dias fechados</h2>
          <p className="text-xs text-muted-foreground mb-4">Feriados, férias, formação... ninguém consegue reservar nesses dias.</p>
          <div className="space-y-2 mb-4">
            <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
              <div>
                <Label htmlFor="dia-fechado" className="text-xs">Data</Label>
                <Input id="dia-fechado" type="date" min={todayIso()} value={novoDia} onChange={(e) => setNovoDia(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label htmlFor="motivo-fechado" className="text-xs">Motivo (aparece à cliente)</Label>
                <Input id="motivo-fechado" placeholder="Ex.: Feriado" maxLength={150} value={novoMotivo} onChange={(e) => setNovoMotivo(e.target.value)} className="h-9" />
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" disabled={adicionarFechado.isPending} onClick={adicionar}>
              {adicionarFechado.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Fechar este dia
            </Button>
          </div>
          {horarioQuery.data?.diasFechados.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dia fechado marcado.</p>
          )}
          <ul className="divide-y divide-border/60">
            {horarioQuery.data?.diasFechados.map((d) => (
              <li key={d.id} className="py-2.5 flex items-center gap-3 text-sm">
                <CalendarX className="h-4 w-4 text-rose-deep shrink-0" />
                <span className="flex-1">
                  {formatDate(d.data)}
                  {d.motivo && <span className="text-muted-foreground"> · {d.motivo}</span>}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Reabrir dia"
                  disabled={removerFechado.isPending} onClick={() => remover(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
