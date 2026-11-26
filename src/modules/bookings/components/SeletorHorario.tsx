import { useEffect } from "react";
import { Calendar as CalIcon, CalendarX, Clock, Loader2 } from "lucide-react";
import { formatHora, todayIso } from "@/shared/lib/format";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";
import { useDisponibilidade } from "@/modules/schedule/hooks/useScheduleApi";

/** Data + horas livres vindas do backend (horário, pausa, dias fechados e ocupação). */
export function SeletorHorario({
  date,
  setDate,
  time,
  setTime,
  duration,
  servicosIds,
  enabled = true,
  ignorarMarcacaoId,
  profissionalId,
}: {
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  duration: number;
  servicosIds: string[];
  enabled?: boolean;
  /** Ao remarcar, a própria marcação não ocupa o horário. */
  ignorarMarcacaoId?: string;
  /** Só horas em que esta profissional está livre. */
  profissionalId?: string;
}) {
  const disponibilidade = useDisponibilidade(date, servicosIds, enabled, ignorarMarcacaoId, profissionalId);
  const dados = disponibilidade.data;

  // A hora escolhida deixou de estar livre (mudou o dia ou os serviços): limpa-a.
  useEffect(() => {
    if (!time || !dados) return;
    const livre = dados.horarios.some((h) => h.hora.startsWith(time) && h.disponivel);
    if (!livre) setTime("");
  }, [dados, time, setTime]);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Duração estimada: {dados?.duracaoMinutos ?? duration} min. Só mostramos as horas em que cabe todo o atendimento.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="booking-date" className="text-xs uppercase tracking-widest mb-2 block">Data</Label>
          <div className="relative">
            <CalIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="booking-date"
              type="date"
              min={todayIso()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-11 h-12 rounded-xl"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest mb-2 block">
            <Clock className="inline h-3.5 w-3.5 mr-1" /> Hora
          </Label>
          {disponibilidade.isLoading ? (
            <div className="h-24 grid place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : disponibilidade.isError ? (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm">
              Não foi possível ver as horas livres.{" "}
              <button type="button" className="text-primary story-link" onClick={() => disponibilidade.refetch()}>Tentar de novo</button>
            </div>
          ) : dados && !dados.aberto ? (
            <div className="p-4 rounded-xl bg-secondary/50 text-sm flex gap-3">
              <CalendarX className="h-5 w-5 text-rose-deep shrink-0" />
              <span>{dados.motivo ?? "Sem marcações neste dia."} Escolha outra data.</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {dados?.horarios.map((h) => {
                  const t = formatHora(h.hora);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!h.disponivel}
                      onClick={() => setTime(t)}
                      title={h.disponivel ? undefined : "Ocupado"}
                      className={cn(
                        "h-11 rounded-xl border text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed disabled:line-through",
                        time === t
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              {dados?.motivo && <p className="text-xs text-muted-foreground mt-3">{dados.motivo}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
