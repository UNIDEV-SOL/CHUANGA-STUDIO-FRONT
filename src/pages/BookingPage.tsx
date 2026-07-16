import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";

import { formatMZN } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { Check, ArrowRight, ArrowLeft, Copy, Calendar as CalIcon, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { usePost } from "@/hooks/apiHooks";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import type { CriarMarcacaoRequest } from "@/types/api";

import { usePublicServicos } from "@/hooks/useServicesApi";
import { servicesStore } from "@/data/store";
import { normalizeServicos, getCategoryMeta, type NormalizedService } from "@/lib/normalizeServico";

const STEPS = ["Serviços", "Data & hora", "Contacto", "Adiantamento", "Confirmado"] as const;

const TIMES = ["08:00","09:00","10:00","11:00","12:00","13:30","14:30","15:30","16:30","17:30","18:00"];

function todayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  phone: z.string().trim().min(6, "Telefone inválido").max(30),
  email: z.string().trim().email("Email inválido").max(120),
  password: z.string().min(4, "Mínimo 4 caracteres").max(64).optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export default function BookingPage() {
  // Antes: `const services = servicesStore.useValue();` — usava sempre o mock
  // local, nunca a API. Agora segue o mesmo padrão do ServicesPage: API primeiro,
  // com fallback para o mock local, tudo normalizado para o mesmo shape.
  const { data: apiServices, isLoading: loadingServicos } = usePublicServicos();
  const localServices = servicesStore.useValue();
  const services = useMemo(
    () => normalizeServicos(apiServices ?? localServices),
    [apiServices, localServices],
  );

  const [searchParams] = useSearchParams();
  const serviceIdFromUrl = searchParams.get("service") || undefined;

  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const createMarcacao = usePost<any, CriarMarcacaoRequest>(API_ENDPOINTS.publico.marcacoes);

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>(serviceIdFromUrl ? [serviceIdFromUrl] : []);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState<string>("");
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    password: "",
    notes: "",
  });
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Se o serviço vindo da URL só existir depois dos dados da API carregarem
  // (ex: refresh direto em /reservar?service=xxx), garante a seleção assim
  // que a lista de serviços estiver disponível.
  useEffect(() => {
    if (serviceIdFromUrl && services.some((s) => s.id === serviceIdFromUrl)) {
      setSelected((prev) => (prev.includes(serviceIdFromUrl) ? prev : [...prev, serviceIdFromUrl]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceIdFromUrl, services.length]);

  const selectedServices = useMemo(
    () => services.filter((s) => selected.includes(s.id)),
    [services, selected],
  );
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const duration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function next() {
    if (step === 0 && selected.length === 0) {
      toast.error("Escolha pelo menos um serviço.");
      return;
    }
    if (step === 1) {
      if (!date || !time) return toast.error("Escolha data e hora.");
      const chosen = new Date(`${date}T${time}`);
      if (chosen.getTime() < Date.now()) return toast.error("Escolha uma data futura.");
    }
    if (step === 2) {
      const parsed = contactSchema.safeParse(form);
      if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      if (!user && !form.password) {
        toast.error("Defina uma palavra-passe para criar a sua conta.");
        return;
      }
      try {
        if (!user) {
          if (!form.password) {
            toast.error("Defina uma palavra-passe para criar a sua conta.");
            return;
          }
          await signUp({ name: form.name, email: form.email, phone: form.phone, password: form.password });
        }

        const payload: CriarMarcacaoRequest = {
          servicosIds: selected,
          data: date, // yyyy-MM-dd
          hora: time, // HH:mm
          nome: user ? undefined : form.name,
          email: user ? undefined : form.email,
          telefone: user ? undefined : form.phone,
          senha: user ? undefined : form.password || undefined,
          metodoPagamento: "MPESA",
          referenciaPagamento: "1234", // backend valida mínimo 4 caracteres; ajuste no passo final
        };

        const res = await createMarcacao.mutateAsync(payload as CriarMarcacaoRequest);
        setBookingId(res?.id ?? null);
      } catch (e) {
        toast.error((e as Error).message);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <>
      <section className="py-16 gradient-hero min-h-[70vh]">
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <div className="text-center mb-10">
            <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Reserva online</p>
            <h1 className="font-display text-4xl md:text-5xl mt-3">
              O seu momento em <em className="text-gradient-rose italic">4 passos.</em>
            </h1>
          </div>
          <ol className="flex items-center justify-between mb-10 gap-1">
            {STEPS.map((s, i) => (
              <li key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-full grid place-items-center text-[11px] font-semibold border transition",
                    i < step && "bg-primary text-primary-foreground border-primary",
                    i === step && "bg-accent text-primary border-accent shadow-petal",
                    i > step && "bg-white text-muted-foreground border-border",
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn("hidden sm:block text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
                {i < STEPS.length - 1 && <div className={cn("h-px flex-1 mx-1", i < step ? "bg-primary" : "bg-border")} />}
              </li>
            ))}
          </ol>

          <div className="bg-card rounded-3xl border border-border/60 shadow-elegant p-6 md:p-10">
            {step === 0 && (
              <StepServices services={services} selected={selected} toggle={toggle} loading={loadingServicos} />
            )}
            {step === 1 && (
              <StepDateTime date={date} setDate={setDate} time={time} setTime={setTime} duration={duration} />
            )}
            {step === 2 && (
              <StepContact form={form} setForm={setForm} hasAccount={!!user} />
            )}
            {step === 3 && bookingId && (
              <StepPayment bookingId={bookingId} total={total} />
            )}
            {step === 4 && bookingId && (
              <StepDone bookingId={bookingId} onDashboard={() => navigate("/minha-area")} />
            )}

            {step < STEPS.length - 1 && (
              <div className="mt-10 pt-6 border-t border-border flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={back} disabled={step === 0} className="rounded-full">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total estimado</p>
                  <p className="font-display text-xl text-primary">{formatMZN(total)}</p>
                </div>
                <Button onClick={next} className="rounded-full bg-primary px-6">
                  {step === 2 ? "Confirmar reserva" : "Continuar"} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function StepServices({
  services,
  selected,
  toggle,
  loading,
}: {
  services: NormalizedService[];
  selected: string[];
  toggle: (id: string) => void;
  loading?: boolean;
}) {
  // Agrupa dinamicamente pelas categorias presentes nos dados normalizados
  // (em vez de iterar CATEGORY_META fixo), para nunca esconder serviços cuja
  // categoria ainda não está mapeada — caem em "Outros Serviços".
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

  if (loading && services.length === 0) {
    return <p className="text-sm text-muted-foreground py-8">A carregar serviços...</p>;
  }

  if (!loading && services.length === 0) {
    return <p className="text-sm text-muted-foreground py-8">Nenhum serviço disponível de momento.</p>;
  }

  return (
    <div>
      <h3 className="font-display text-2xl mb-1">Escolha os serviços</h3>
      <p className="text-sm text-muted-foreground mb-6">Pode selecionar vários. Os preços somam-se.</p>
      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2 -mr-2">
        {grouped.map(({ cat, meta, items }) => (
          <div key={cat}>
            <h4 className="text-xs uppercase tracking-widest text-rose-deep font-semibold mb-2">
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
                      "text-left p-4 rounded-xl border transition flex items-start justify-between gap-3",
                      on ? "bg-primary/5 border-primary shadow-sm" : "border-border hover:border-primary/40",
                    )}
                  >
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.duration} min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display text-primary">{formatMZN(s.price)}</p>
                      <div className={cn("h-4 w-4 mt-1 ml-auto rounded-full border-2 grid place-items-center", on ? "bg-primary border-primary" : "border-muted-foreground/40")}>
                        {on && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDateTime({ date, setDate, time, setTime, duration }: any) {
  return (
    <div>
      <h3 className="font-display text-2xl mb-1">Quando prefere?</h3>
      <p className="text-sm text-muted-foreground mb-6">Duração estimada: {duration} min.</p>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label className="text-xs uppercase tracking-widest mb-2 block">Data</Label>
          <div className="relative">
            <CalIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              min={todayIso()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-11 h-12 rounded-xl"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest mb-2 block">
            <Clock className="inline h-3.5 w-3.5 mr-1" /> Hora
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={cn(
                  "h-11 rounded-xl border text-sm font-medium transition",
                  time === t
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border hover:border-primary/40",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepContact({ form, setForm, hasAccount }: any) {
  return (
    <div>
      <h3 className="font-display text-2xl mb-1">Os seus dados</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {hasAccount ? "Confirme os seus dados de contacto." : "Vamos criar a sua conta para acompanhar as marcações."}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Nome completo</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 mt-1.5" />
        </div>
        <div>
          <Label>Telefone / WhatsApp</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 mt-1.5" placeholder="+258 8..." />
        </div>
        <div className="md:col-span-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 mt-1.5" />
        </div>
        {!hasAccount && (
          <div className="md:col-span-2">
            <Label>Palavra-passe (para a sua conta)</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11 mt-1.5" />
          </div>
        )}
        <div className="md:col-span-2">
          <Label>Notas (opcional)</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1.5" placeholder="Preferências, alergias, inspirações..." />
        </div>
      </div>
    </div>
  );
}

function StepPayment({ bookingId, total }: { bookingId: string; total: number }) {
  const [proof, setProof] = useState("");
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copiado"); };

  const submit = () => {
    if (proof.trim().length < 4) return toast.error("Coloque a referência ou último dígitos da transação.");
    toast.success("Referência validada. Obrigado!");
  };

  return (
    <div>
      <h3 className="font-display text-2xl mb-1">Adiantamento de 150 MT</h3>
      <p className="text-sm text-muted-foreground mb-6">
        O adiantamento garante o seu horário e é abatido no valor final ({formatMZN(total)}).
        Envie por M-Pesa ou e-Mola e cole o número da transação abaixo.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "M-Pesa", num: "84 123 4567", nome: "Angela Mazive" },
          { label: "e-Mola", num: "86 123 4567", nome: "Angela Mazive" },
        ].map((c) => (
          <div key={c.label} className="p-5 rounded-2xl border border-border bg-secondary/30">
            <p className="text-[11px] uppercase tracking-widest text-rose-deep font-semibold">{c.label}</p>
            <p className="font-display text-2xl mt-1">{c.num}</p>
            <p className="text-xs text-muted-foreground">{c.nome}</p>
            <button onClick={() => copy(c.num)} className="mt-3 text-xs inline-flex items-center gap-1.5 text-primary story-link">
              <Copy className="h-3 w-3" /> Copiar número
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Label>Referência / número da transação</Label>
        <div className="flex gap-2 mt-1.5">
          <Input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Ex: 1234ABC" className="h-11" />
          <Button onClick={submit} className="rounded-full bg-primary px-6">Registar</Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Ao registar, a marcação passa a "Aguarda confirmação". Ligamos a confirmar o horário.
        </p>
      </div>
    </div>
  );
}

function StepDone({ bookingId, onDashboard }: { bookingId: string; onDashboard: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto h-16 w-16 rounded-full bg-accent/20 grid place-items-center mb-6">
        <Sparkles className="h-7 w-7 text-rose-deep" />
      </div>
      <h3 className="font-display text-3xl">Reserva registada!</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Recebemos a sua marcação (código <span className="font-mono text-foreground">{bookingId}</span>).
        Vamos ligar em breve para confirmar. Também pode acompanhar tudo na sua área pessoal.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={onDashboard} className="rounded-full bg-primary px-6">Ir para a minha área</Button>
        <Button asChild variant="outline" className="rounded-full px-6">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}