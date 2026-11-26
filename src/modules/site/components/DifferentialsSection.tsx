import { SectionTitle } from "@/shared/components/SectionTitle";
import { ShieldCheck, Sparkles, HeartHandshake, Clock, Award, Leaf } from "lucide-react";

const ITEMS = [
  { icon: Leaf, title: "Ambiente acolhedor", text: "Espaço limpo, confortável e cuidadosamente iluminado." },
  { icon: Sparkles, title: "Materiais premium", text: "Marcas de referência, escolhidas com critério." },
  { icon: ShieldCheck, title: "Biossegurança total", text: "Equipamentos esterilizados a cada atendimento." },
  { icon: HeartHandshake, title: "Atendimento único", text: "Cada cliente recebe um plano à medida." },
  { icon: Award, title: "Profissionais qualificadas", text: "Formação contínua e paixão pela técnica." },
  { icon: Clock, title: "Pontualidade", text: "Respeitamos o seu tempo. Sempre." },
];

export function DifferentialsSection() {
  return (
    <section className="py-24 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.15]" aria-hidden>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-accent blur-[120px]" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-sky blur-[100px]" />
      </div>
      <div className="mx-auto max-w-7xl px-6 md:px-8 relative">
        <SectionTitle
          eyebrow="Diferenciais"
          title={<span className="text-porcelain">Porque escolher o <em className="italic text-accent">Chuanga Studio</em></span>}
          description={
            <span className="text-porcelain/75">
              Foco na saúde, beleza e bem-estar. Cada detalhe é pensado para si.
            </span>
          }
          className="mb-14"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((i) => (
            <div
              key={i.title}
              className="p-7 rounded-2xl bg-white/[0.04] backdrop-blur border border-white/10 hover:bg-white/[0.08] hover:border-accent/40 transition"
            >
              <div className="h-11 w-11 rounded-xl bg-accent/20 text-accent grid place-items-center mb-5">
                <i.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h3 className="font-display text-xl text-porcelain">{i.title}</h3>
              <p className="text-sm text-porcelain/70 mt-2 leading-relaxed">{i.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
