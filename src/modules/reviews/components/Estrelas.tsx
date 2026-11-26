import { Star } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/** Estrelas só de leitura (ou clicáveis, com onEscolher). */
export function Estrelas({
  nota,
  tamanho = "h-4 w-4",
  onEscolher,
  className,
}: {
  nota: number;
  tamanho?: string;
  onEscolher?: (n: number) => void;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} role={onEscolher ? "radiogroup" : "img"} aria-label={`${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icone = <Star className={cn(tamanho, n <= Math.round(nota) ? "fill-gold text-gold" : "text-border")} />;
        return onEscolher ? (
          <button key={n} type="button" role="radio" aria-checked={n === nota} aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
            onClick={() => onEscolher(n)} className="p-1 transition-transform hover:scale-110">
            {icone}
          </button>
        ) : (
          <span key={n}>{icone}</span>
        );
      })}
    </span>
  );
}
