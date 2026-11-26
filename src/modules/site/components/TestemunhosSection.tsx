import { Quote } from "lucide-react";
import { SectionTitle } from "@/shared/components/SectionTitle";
import { Estrelas } from "@/modules/reviews/components/Estrelas";
import { useAvaliacoesPublicas, useResumoAvaliacoes } from "@/modules/reviews/hooks/useReviewsApi";
import { useNotaNoJsonLd } from "@/shared/lib/seo";

/** Avaliações escolhidas pela equipa. Sem nenhuma publicada, a secção não aparece. */
export function TestemunhosSection() {
  const avaliacoes = useAvaliacoesPublicas(6);
  const resumo = useResumoAvaliacoes();
  useNotaNoJsonLd(resumo.data?.media, resumo.data?.total);
  const lista = avaliacoes.data ?? [];
  if (lista.length === 0) return null;
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <SectionTitle
          eyebrow="Avaliações"
          title={<>O que dizem <em className="text-gradient-rose italic">as clientes.</em></>}
          description={resumo.data && resumo.data.total > 0
            ? `${Number(resumo.data.media).toFixed(1)} de 5 em ${resumo.data.total} ${resumo.data.total === 1 ? "avaliação" : "avaliações"} de clientes atendidas no estúdio.`
            : undefined}
          className="mb-14"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lista.map((a) => (
            <figure key={a.id} className="p-7 rounded-3xl bg-card border border-border/60 flex flex-col">
              <Quote className="h-6 w-6 text-primary/40" />
              {a.nota && <Estrelas nota={a.nota} className="mt-3" />}
              <blockquote className="mt-3 text-[15px] leading-relaxed flex-1">{a.comentario ?? "Adorei!"}</blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-medium">{a.clienteNome}</span>
                <span className="block text-xs text-muted-foreground">{a.servicos}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
