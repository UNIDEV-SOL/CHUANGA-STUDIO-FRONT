import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-hands.jpg";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden gradient-hero">
      <div className="mx-auto max-w-7xl px-6 md:px-8 pt-16 md:pt-24 pb-20 md:pb-32 grid gap-12 lg:grid-cols-[1.05fr_1fr] items-center">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur border border-border/60 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.24em] text-rose-deep font-medium mb-8 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Atelier de beleza · Maputo
          </span>
          <h1 className="font-display text-[52px] md:text-[76px] leading-[0.95] font-medium text-foreground">
            A beleza que <br />
            realça a sua <br />
            <em className="text-gradient-rose not-italic italic font-semibold">essência.</em>
          </h1>
          <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
            No Chuanga Studio cuidamos de cada detalhe para que se sinta única,
            confiante e ainda mais especial. Manicure, pedicure, alongamentos e
            nail art de autor.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full h-12 px-7 bg-primary hover:bg-primary/90 shadow-elegant"
            >
              <Link to="/reservar">
                Marcar horário <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full h-12 px-7 border-primary/20 hover:bg-primary/5"
            >
              <Link to="/servicos">Explorar serviços</Link>
            </Button>
          </div>
          <dl className="mt-14 grid grid-cols-3 gap-6 max-w-md">
            {[
              { k: "8+", v: "anos de atelier" },
              { k: "80+", v: "serviços" },
              { k: "100%", v: "biossegurança" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="font-display text-3xl md:text-4xl text-primary">{s.k}</dt>
                <dd className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <div className="absolute -top-8 -left-8 h-56 w-56 rounded-full bg-accent/30 blur-3xl animate-float-slow" aria-hidden />
          <div className="absolute -bottom-10 -right-6 h-64 w-64 rounded-full bg-sky/40 blur-3xl animate-float-slow" style={{ animationDelay: "2s" }} aria-hidden />
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-elegant border border-white/50 aspect-[4/5]">
            <img
              src={heroImg}
              alt="Mãos delicadas com unhas brancas em ambiente sofisticado"
              className="w-full h-full object-cover"
              width={1600}
              height={1600}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-white/85 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-lg">
              <div className="h-12 w-12 rounded-full bg-accent/20 grid place-items-center shrink-0">
                <Sparkles className="h-5 w-5 text-rose-deep" />
              </div>
              <div className="text-sm">
                <p className="font-display text-lg leading-tight text-foreground">Reserva com adiantamento</p>
                <p className="text-xs text-muted-foreground">150 MT garantem o seu horário</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
