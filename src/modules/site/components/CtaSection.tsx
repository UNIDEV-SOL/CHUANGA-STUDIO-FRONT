import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] p-10 md:p-16 text-center gradient-hero border border-border/60 shadow-elegant">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-accent/30 blur-3xl" aria-hidden />
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">
            Reserve o seu momento
          </p>
          <h2 className="font-display text-4xl md:text-6xl mt-4 leading-[1.05] text-foreground">
            Pronta para se sentir <br />
            <em className="text-gradient-rose italic">única?</em>
          </h2>
          <p className="mt-5 text-muted-foreground max-w-lg mx-auto">
            Marque online em poucos passos. Um adiantamento de 150 MT garante o seu horário
            e é abatido no valor final do serviço.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full h-12 px-7 bg-primary shadow-elegant">
              <Link to="/reservar">
                Reservar agora <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-7">
              <Link to="/cotacao">Pedir cotação</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
