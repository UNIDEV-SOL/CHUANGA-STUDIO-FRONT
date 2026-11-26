import { SectionTitle } from "@/shared/components/SectionTitle";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { usePaginaTitulo } from "@/shared/lib/seo";

export default function ContactPage() {
  usePaginaTitulo("Contacto", { descricao: "Fale com o Chuanga Studio em Maputo: telefone, WhatsApp e email." });
  return (

      <section className="pt-20 pb-24">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <SectionTitle
            eyebrow="Fale connosco"
            title={<>Vamos <em className="text-gradient-rose italic">conversar.</em></>}
            description="Ligue, escreva ou passe por cá. Estamos prontas para receber você."
          />
          <div className="mt-16 grid md:grid-cols-2 gap-6">
            {[
              { icon: MapPin, title: "Endereço", value: "Maputo — Moçambique", meta: "Zona a definir" },
              { icon: Clock, title: "Horário", value: "Seg – Sáb", meta: "8h00 às 19h00" },
              { icon: Phone, title: "Telefone", value: "+258 84 658 9542", meta: "WhatsApp disponível" },
              { icon: Mail, title: "Email", value: "atelier@chuanga.mz", meta: "Resposta em 24h" },
            ].map((c) => (
              <div key={c.title} className="p-8 rounded-3xl bg-card border border-border/60 flex gap-5 hover-lift">
                <div className="h-12 w-12 rounded-2xl bg-accent/20 text-rose-deep grid place-items-center shrink-0">
                  <c.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.title}</p>
                  <p className="font-display text-2xl mt-1">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.meta}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4 justify-center">
            <a href="#" className="h-11 w-11 grid place-items-center rounded-full border border-border hover:bg-accent hover:text-primary transition">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="h-11 w-11 grid place-items-center rounded-full border border-border hover:bg-accent hover:text-primary transition">
              <Facebook className="h-4 w-4" />
            </a>
            <span className="text-sm text-muted-foreground">@chuanga_studio</span>
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="rounded-full bg-primary h-12 px-8">
              <a href="https://wa.me/258846589542" target="_blank" rel="noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
   
  );
}
