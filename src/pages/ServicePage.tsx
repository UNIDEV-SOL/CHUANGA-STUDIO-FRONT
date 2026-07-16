import { useMemo, useState } from "react";

import { PublicLayout } from "@/layouts/PublicLayout";
import { SectionTitle } from "@/atoms/SectionTitle";

import { formatMZN } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Service } from "@/types";

import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/data/mock-services";
import { servicesStore } from "@/data/store";
import { usePublicServicos } from "@/hooks/useServicesApi";
import { normalizeServicos, getCategoryMeta } from "@/lib/normalizeServico";

const CATS = Object.entries(CATEGORY_META) as Array<[
  Service["category"],
  { label: string; tagline: string; icon: string }
]>;

export default function ServicesPage() {
  const { data: apiServices } = usePublicServicos();
  const localServices = servicesStore.useValue();

  // Normaliza SEMPRE os dados (API ou mock local) para o mesmo shape,
  // e traduz a categoria PT da API para as chaves internas do CATEGORY_META.
  const services = useMemo(
    () => normalizeServicos(apiServices ?? localServices),
    [apiServices, localServices],
  );

  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Service["category"] | "todos">("todos");

  const grouped = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = services.filter((s) => {
      if (active !== "todos" && s.category !== active) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });

    // Categorias conhecidas (na ordem definida em CATEGORY_META)
    const known = CATS.map(([cat, meta]) => ({
      cat,
      meta,
      items: filtered.filter((s) => s.category === cat),
    }));

    // Qualquer serviço cuja categoria não corresponda a nenhuma chave conhecida
    // (ex: categorias da API ainda não mapeadas) cai aqui, em vez de desaparecer.
    const orphanItems = filtered.filter(
      (s) => !CATS.some(([cat]) => cat === s.category),
    );
    const orphanGroup = orphanItems.length
      ? [{ cat: "outros" as const, meta: getCategoryMeta("outros"), items: orphanItems }]
      : [];

    return [...known, ...orphanGroup].filter((g) => g.items.length > 0);
  }, [services, query, active]);

  return (
    <>
      <section className="pt-16 md:pt-24 pb-8 gradient-hero">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <SectionTitle
            eyebrow="O menu completo"
            title={<>Todos os nossos <em className="text-gradient-rose italic">serviços</em></>}
            description="Do essencial ao ritual completo. Encontre o cuidado ideal, veja o preço e o tempo estimado, e reserve online."
          />
          <div className="mt-10 flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Procurar serviço..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-11 h-12 rounded-full bg-white/90 border-white/50 shadow-sm"
              />
            </div>
            <Button asChild size="lg" className="rounded-full bg-primary h-12 px-6">
              <Link to="/reservar">
                Reservar <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActive("todos")}
              className={cn(
                "px-4 h-9 rounded-full text-xs font-medium border transition",
                active === "todos"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white/70 border-border hover:border-primary/40",
              )}
            >
              Todos
            </button>
            {CATS.map(([cat, meta]) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={cn(
                  "px-4 h-9 rounded-full text-xs font-medium border transition",
                  active === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white/70 border-border hover:border-primary/40",
                )}
              >
                {meta.icon} {meta.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-8 space-y-16">
          {grouped.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              Nenhum serviço encontrado. Tente outra pesquisa.
            </p>
          )}
          {grouped.map(({ cat, meta, items }) => (
            <div key={cat} id={cat} className="scroll-mt-24">
              <div className="flex items-end justify-between mb-6 pb-5 border-b border-border">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-rose-deep font-medium mb-1.5">
                    {meta.icon} Categoria
                  </div>
                  <h3 className="font-display text-3xl md:text-4xl">{meta.label}</h3>
                  <p className="text-sm text-muted-foreground italic mt-1">{meta.tagline}</p>
                </div>
                <span className="text-xs text-muted-foreground">{items.length} serviços</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-start justify-between gap-6 py-5 px-5 rounded-xl hover:bg-secondary/40 transition"
                  >
                    <div className="flex-1">
                      <h4 className="font-display text-lg text-foreground group-hover:text-primary transition">
                        {s.name}
                      </h4>
                      {s.description && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {s.description}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground mt-2 inline-block">
                        · {s.duration} min
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-xl text-primary">{formatMZN(s.price)}</div>
                      <Link
                        to={`/reservar?service=${encodeURIComponent(s.id)}`}
                        className="text-[11px] uppercase tracking-widest text-rose-deep story-link"
                      >
                        Reservar
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}