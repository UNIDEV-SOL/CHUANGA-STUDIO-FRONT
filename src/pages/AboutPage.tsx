import { SectionTitle } from "@/atoms/SectionTitle";
import studio from "@/assets/studio-interior.jpg";
import technician from "@/assets/technician.jpg";
import { ShieldCheck, Sparkles, HeartHandshake, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <section className="pt-20 pb-24 gradient-hero">
        <div className="mx-auto max-w-6xl px-6 md:px-8 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium mb-5">
              O estúdio
            </p>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">
              Onde a beleza se torna <em className="text-gradient-rose italic">ritual.</em>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
              O Chuanga Studio nasceu do desejo de oferecer, em Maputo, uma experiência
              de cuidado que junta técnica, biossegurança e atenção genuína a cada cliente.
              Um espaço para desacelerar e sair a sentir-se ainda mais você.
            </p>
          </div>
          <div className="rounded-[2rem] overflow-hidden shadow-elegant aspect-[4/5]">
            <img src={studio} alt="Interior do Chuanga Studio" className="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-8 grid lg:grid-cols-2 gap-14 items-center">
          <div className="rounded-[2rem] overflow-hidden aspect-[4/5] order-2 lg:order-1">
            <img src={technician} alt="Angela Mazive em atendimento" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="order-1 lg:order-2">
            <SectionTitle
              align="left"
              eyebrow="Fundadora"
              title={<>Angela <em className="text-gradient-rose italic">Mazive</em></>}
              className="max-w-none mb-6"
            />
            <p className="text-muted-foreground leading-relaxed">
              Nail designer com anos de experiência e uma paixão que se vê em cada
              detalhe. Angela conduz o estúdio com o compromisso de entregar sempre
              o melhor — do primeiro sorriso no acolhimento ao brilho final da unha.
            </p>
            <blockquote className="mt-8 p-6 rounded-2xl border-l-4 border-accent bg-secondary/40 font-display italic text-xl leading-snug">
              "Cuidar de si é uma forma de dizer 'eu importo'. É esse cuidado
              que trago para cada atendimento."
            </blockquote>
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <SectionTitle
            eyebrow="Como trabalhamos"
            title="Quatro princípios que nunca negociamos"
            className="mb-14"
          />
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { icon: ShieldCheck, t: "Higiene", d: "Esterilização a cada atendimento." },
              { icon: Sparkles, t: "Estética", d: "Um olhar apurado em cada acabamento." },
              { icon: HeartHandshake, t: "Empatia", d: "Escutar antes de decidir." },
              { icon: Award, t: "Excelência", d: "Formação contínua da equipa." },
            ].map((i) => (
              <div key={i.t} className="p-7 rounded-2xl bg-card border border-border/60 hover-lift">
                <i.icon className="h-7 w-7 text-rose-deep" strokeWidth={1.5} />
                <h3 className="font-display text-xl mt-4">{i.t}</h3>
                <p className="text-sm text-muted-foreground mt-1.5">{i.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
