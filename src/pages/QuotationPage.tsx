import { useMemo, useState } from "react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { SectionTitle } from "@/atoms/SectionTitle";
import { formatMZN } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { usePost } from "@/hooks/apiHooks";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type { CriarCotacaoRequest } from "@/types/api";

import { usePublicServicos } from "@/hooks/useServicesApi";
import { servicesStore } from "@/data/store";
import { normalizeServicos, getCategoryMeta, type NormalizedService } from "@/lib/normalizeServico";

const schema = z.object({
  clientName: z.string().trim().min(2).max(80),
  clientPhone: z.string().trim().min(6).max(30),
  clientEmail: z.string().trim().email().max(120).optional().or(z.literal("")),
  message: z.string().max(500).optional(),
});

export default function QuotationPage() {
  // Antes: `const services = servicesStore.useValue();` — só mock local,
  // igual ao bug já corrigido em ServicesPage/BookingPage. Mesmo padrão aqui.
  const { data: apiServices, isLoading: loadingServicos } = usePublicServicos();
  const localServices = servicesStore.useValue();
  const services = useMemo(
    () => normalizeServicos(apiServices ?? localServices),
    [apiServices, localServices],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ clientName: "", clientPhone: "", clientEmail: "", message: "" });
  const [done, setDone] = useState(false);

  const total = useMemo(
    () => services.filter((s) => selected.includes(s.id)).reduce((sum, s) => sum + s.price, 0),
    [services, selected],
  );

  // Agrupa dinamicamente pelas categorias presentes nos dados normalizados,
  // igual ao StepServices do BookingPage — nunca esconde serviços cuja
  // categoria ainda não esteja mapeada (caem em "Outros Serviços").
  const grouped = useMemo(() => {
    const byCat = new Map<string, NormalizedService[]>();
    for (const s of services) {
      const list = byCat.get(s.category) ?? [];
      list.push(s);
      byCat.set(s.category, list);
    }
    return Array.from(byCat.entries()).map(([cat, items]) => ({
      cat,
      meta: getCategoryMeta(cat),
      items,
    }));
  }, [services]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const createCotacao = usePost<any, CriarCotacaoRequest>(API_ENDPOINTS.publico.cotacoes);

  async function submit() {
    const parsed = schema.safeParse(form);

    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");

    if (selected.length === 0) return toast.error("Escolha pelo menos um serviço.");
    const payload: CriarCotacaoRequest = {
      nome: form.clientName,
      telefone: form.clientPhone,
      email: form.clientEmail || null,
      mensagem: form.message || null,
      servicosIds: selected,
    };

    await createCotacao.mutateAsync(payload);
    setDone(true);

    toast.success("Cotação enviada. Vamos responder em breve.");
  }

  if (done) {
    return (
      <section className="py-32">
        <div className="mx-auto max-w-lg px-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-accent/20 grid place-items-center mb-6">
            <Sparkles className="h-7 w-7 text-rose-deep" />
          </div>
          <h1 className="font-display text-4xl">Cotação enviada</h1>
          <p className="text-muted-foreground mt-3">
            Estimativa: <strong className="text-foreground">{formatMZN(total)}</strong>. Vamos entrar em contacto por telefone.
          </p>
          <Button
            onClick={() => {
              setDone(false);
              setSelected([]);
              setForm({ clientName: "", clientPhone: "", clientEmail: "", message: "" });
            }}
            className="mt-8 rounded-full bg-primary px-6"
          >
            Nova cotação
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="pt-16 pb-24 gradient-hero">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          <SectionTitle
            eyebrow="Cotação online"
            title={<>Monte o seu <em className="text-gradient-rose italic">pacote.</em></>}
            description="Selecione tudo o que deseja e receba uma estimativa imediata. Ajustamos consigo depois."
          />
          <div className="mt-12 grid lg:grid-cols-[1.4fr_1fr] gap-8">
            <div className="bg-card rounded-3xl border border-border/60 p-6 md:p-8 shadow-elegant max-h-[600px] overflow-y-auto">
              {loadingServicos && services.length === 0 && (
                <p className="text-sm text-muted-foreground py-8">A carregar serviços...</p>
              )}
              {!loadingServicos && services.length === 0 && (
                <p className="text-sm text-muted-foreground py-8">Nenhum serviço disponível de momento.</p>
              )}
              {grouped.map(({ cat, meta, items }) => (
                <div key={cat} className="mb-6 last:mb-0">
                  <h4 className="text-xs uppercase tracking-widest text-rose-deep font-semibold mb-3">
                    {meta.icon} {meta.label}
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((s) => {
                      const on = selected.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggle(s.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border text-left transition text-sm",
                            on ? "bg-primary/5 border-primary" : "border-border hover:border-primary/40",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className={cn("h-4 w-4 rounded-full border-2 grid place-items-center", on ? "bg-primary border-primary" : "border-muted-foreground/40")}>
                              {on && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                            </span>
                            {s.name}
                          </span>
                          <span className="text-xs text-primary font-medium">{formatMZN(s.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <aside className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-elegant self-start sticky top-24">
              <p className="text-[11px] uppercase tracking-widest text-accent">Estimativa</p>
              <p className="font-display text-5xl mt-2">{formatMZN(total)}</p>
              <p className="text-xs opacity-70 mt-1">{selected.length} serviço(s) selecionado(s)</p>
              <div className="mt-6 space-y-3">
                <div>
                  <Label className="text-primary-foreground/80 text-xs">Nome</Label>
                  <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="h-10 mt-1 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50" />
                </div>
                <div>
                  <Label className="text-primary-foreground/80 text-xs">Telefone</Label>
                  <Input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} className="h-10 mt-1 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50" />
                </div>
                <div>
                  <Label className="text-primary-foreground/80 text-xs">Email (opcional)</Label>
                  <Input value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} className="h-10 mt-1 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50" />
                </div>
                <div>
                  <Label className="text-primary-foreground/80 text-xs">Mensagem</Label>
                  <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50" />
                </div>
                <Button onClick={submit} className="w-full rounded-full bg-accent text-primary hover:bg-accent/90 mt-2 h-11">
                  Enviar cotação
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}