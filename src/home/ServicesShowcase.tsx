import { useMemo } from "react";
import { SectionTitle } from "@/atoms/SectionTitle";
import { getCategoryMeta } from "@/lib/normalizeServico";
import { normalizeServicos } from "@/lib/normalizeServico";
import { usePublicServicos } from "@/hooks/useServicesApi";
import { servicesStore } from "@/data/store";
import { formatMZN } from "@/lib/format";
import { Link } from "react-router-dom";

import { ArrowUpRight } from "lucide-react";

export function ServicesShowcase() {
  const { data: apiServices } = usePublicServicos();
  const localServices = servicesStore.useValue();

  const services = useMemo(
    () => normalizeServicos(apiServices ?? localServices),
    [apiServices, localServices],
  );

  const featured = services.filter((s) => s.featured).slice(0, 8);

  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <SectionTitle
            align="left"
            eyebrow="Menu do atelier"
            title={<>Serviços em <em className="text-gradient-rose italic">destaque</em></>}
            description="Uma seleção do nosso menu completo. Explore todas as categorias para descobrir o serviço perfeito."
            className="max-w-xl"
          />
          <Link
            to="/servicos"
            className="story-link text-sm font-medium text-primary self-start md:self-end inline-flex items-center gap-1.5"
          >
            Ver todos os serviços <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((s, i) => (
            <Link
              key={s.id}
              to="/servicos"
              className="group relative rounded-3xl bg-card border border-border/60 p-6 flex flex-col hover-lift animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="text-[10px] uppercase tracking-[0.22em] text-rose-deep font-semibold">
                {getCategoryMeta(s.category).label}
              </div>

              <h3 className="font-display text-2xl mt-3 text-foreground group-hover:text-primary transition">
                {s.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">
                {s.description ?? "Executado com técnica, higiene e todo o cuidado que merece."}
              </p>
              <div className="mt-6 pt-5 border-t border-dashed border-border flex items-center justify-between">
                <span className="font-display text-xl text-primary">{formatMZN(s.price)}</span>
                <span className="text-xs text-muted-foreground">{s.duration} min</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}