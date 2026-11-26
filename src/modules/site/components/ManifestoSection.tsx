import { Target, Eye, Gem, Handshake } from "lucide-react";
import atelierImg from "@/assets/atelier-flatlay.jpg";
import { SectionTitle } from "@/shared/components/SectionTitle";

const PILLARS = [
  {
    icon: Target,
    title: "Missão",
    text: "Realçar a beleza e autoestima das nossas clientes através de serviços de qualidade, atendimento personalizado e um ambiente acolhedor, proporcionando experiências únicas e memoráveis.",
  },
  {
    icon: Eye,
    title: "Visão",
    text: "Ser referência em beleza e excelência no atendimento em Moçambique, reconhecida pela qualidade, inovação e dedicação, inspirando confiança e fidelizando clientes.",
  },
  {
    icon: Gem,
    title: "Valores",
    text: "Fé em Deus, Excelência, Respeito, Ética e Transparência, Inovação, Amor pelo que fazemos, Valorização das clientes.",
  },
];

export function ManifestoSection() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-14 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="rounded-[2rem] overflow-hidden shadow-petal aspect-[4/5] max-w-md mx-auto">
              <img
                src={atelierImg}
                alt="Frasco de verniz azul sobre mármore com pétalas rosa"
                loading="lazy"
                width={1408}
                height={1008}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden lg:block absolute -bottom-8 -right-4 max-w-[240px] bg-primary text-primary-foreground p-6 rounded-3xl shadow-elegant">
              <p className="font-display italic text-xl leading-snug">
                "Aqui, tem Deus em cada detalhe."
              </p>
              <p className="text-xs mt-3 opacity-70 uppercase tracking-widest">Angela Mazive</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <SectionTitle
              align="left"
              eyebrow="O nosso propósito"
              title={<>Um estúdio pensado <br /><em className="text-gradient-rose italic">até no último gesto.</em></>}
              description="Combinamos técnica, higiene rigorosa e um olhar atento para transformar cada visita numa pausa cuidadosamente sua."
              className="mb-10 max-w-none"
            />
            <div className="space-y-5">
              {PILLARS.map((p) => (
                <div key={p.title} className="group flex gap-5 p-5 rounded-2xl border border-border/60 bg-card hover-lift">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-accent/20 text-rose-deep grid place-items-center group-hover:bg-accent group-hover:text-primary transition">
                    <p.icon className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-foreground">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-5 p-5 rounded-2xl bg-primary text-primary-foreground shadow-elegant">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-accent/30 text-accent grid place-items-center">
                  <Handshake className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="font-display text-xl">Compromisso</h3>
                  <p className="text-sm opacity-85 mt-1 leading-relaxed">
                    Serviços de beleza com alto padrão de qualidade, higiene e segurança —
                    superando expectativas e promovendo bem-estar, autoestima e satisfação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
