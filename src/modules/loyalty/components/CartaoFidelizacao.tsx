import { Check, Gift, Stamp } from "lucide-react";
import { formatMZN } from "@/shared/lib/format";
import { useMinhaFidelizacao } from "@/modules/loyalty/hooks/useLoyaltyApi";

/** Cartão de carimbos na "Minha área": um carimbo por visita faturada. */
export function CartaoFidelizacao() {
  const { data } = useMinhaFidelizacao();
  if (!data?.ativo) return null;
  const faltam = data.visitasPorRecompensa - data.carimbos;
  return (
    <div className="mb-10 p-6 rounded-2xl bg-card border border-border/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Stamp className="h-4 w-4" /> Cartão de fidelização</p>
          <p className="font-display text-2xl mt-1">
            {data.recompensasDisponiveis > 0
              ? <>Tem <em className="text-gradient-rose italic">{formatMZN(Number(data.valorRecompensa) * data.recompensasDisponiveis)}</em> de desconto à espera</>
              : <>Faltam {faltam} {faltam === 1 ? "visita" : "visitas"} para ganhar {formatMZN(data.valorRecompensa)}</>}
          </p>
        </div>
        {data.recompensasDisponiveis > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs">
            <Gift className="h-3.5 w-3.5" /> Peça na caixa ao pagar
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-5" aria-label={`${data.carimbos} de ${data.visitasPorRecompensa} carimbos`}>
        {Array.from({ length: data.visitasPorRecompensa }, (_, i) => {
          const feito = i < data.carimbos;
          const ultimo = i === data.visitasPorRecompensa - 1;
          return (
            <span key={i} className={`h-9 w-9 rounded-full border-2 grid place-items-center ${feito ? "bg-primary border-primary text-primary-foreground" : ultimo ? "border-primary border-dashed text-primary" : "border-border"}`}>
              {feito ? <Check className="h-4 w-4" /> : ultimo ? <Gift className="h-4 w-4" /> : null}
            </span>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">{data.visitas} {data.visitas === 1 ? "visita" : "visitas"} no total. Cada atendimento faturado conta um carimbo.</p>
    </div>
  );
}
