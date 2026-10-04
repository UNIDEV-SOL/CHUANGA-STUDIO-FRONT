import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowRight, ArrowLeft, Copy, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { formatDate, formatHora, formatMZN, todayIso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { OfflineNotice } from "@/components/OfflineNotice";
import { useCatalogo, usePublicProfissionais } from "@/hooks/useServicesApi";
import { SeletorHorario } from "@/components/SeletorHorario";
import { MoradaFields } from "@/components/MoradaFields";
import { moradaParaApi, type Morada } from "@/lib/morada";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import { useCriarMarcacao } from "@/hooks/useMinhaAreaApi";
import { groupByCategory, type NormalizedService } from "@/lib/normalizeServico";
import type { Marcacao, MetodoPagamento, Profissional } from "@/types/api";
import { usePaginaTitulo } from "@/lib/seo";

const STEPS = ["Serviços", "Data & hora", "Contacto", "Adiantamento", "Confirmado"] as const;

const ADIANTAMENTO = 150;

const PAGAMENTOS: { metodo: MetodoPagamento; label: string; num: string; nome: string }[] = [
  { metodo: "MPESA", label: "M-Pesa", num: "84 658 9542", nome: "Angela Mazive" },
  { metodo: "EMOLA", label: "e-Mola", num: "87 658 9542", nome: "Angela Mazive" },
];

const isPast = (date: string, time: string) => new Date(`${date}T${time}`).getTime() < Date.now();

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").max(80),
  phone: z.string().trim().min(6, "Telefone inválido.").max(30),
  email: z.string().trim().email("Email inválido.").max(120),
});

const passwordSchema = z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres.").max(64);

export default function BookingPage() {
  usePaginaTitulo("Marcar online", { descricao: "Marque o seu atendimento no Chuanga Studio em poucos minutos: escolha o serviço, o dia e a hora." });
  const { services, isLoading: loadingServicos, isFallback } = useCatalogo();

  const [searchParams] = useSearchParams();
  const serviceIdFromUrl = searchParams.get("service") || undefined;

  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const queryClient = useQueryClient();
  const createMarcacao = useCriarMarcacao();

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState<string>("");
  const [profissionalId, setProfissionalId] = useState<string>("");
  const profissionaisQuery = usePublicProfissionais();
  const profissionais = profissionaisQuery.data ?? [];
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [morada, setMorada] = useState<Morada>({ provinciaId: "", distritoId: "" });
  const [payment, setPayment] = useState<{ metodo: MetodoPagamento; referencia: string }>({
    metodo: "MPESA",
    referencia: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Marcacao | null>(null);

  // Pré-preenche o contacto quando a sessão fica disponível.
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name,
        email: f.email || user.email,
        phone: f.phone || user.phone || "",
      }));
    }
  }, [user]);

  // Seleciona o serviço vindo de /servicos assim que o catálogo carregar.
  useEffect(() => {
    if (serviceIdFromUrl && services.some((s) => s.id === serviceIdFromUrl)) {
      setSelected((prev) => (prev.includes(serviceIdFromUrl) ? prev : [...prev, serviceIdFromUrl]));
    }
  }, [serviceIdFromUrl, services]);

  // Se o horário escolhido ficar no passado (ex: mudou para hoje), limpa-o.
  useEffect(() => {
    if (time && isPast(date, time)) setTime("");
  }, [date, time]);

  const selectedServices = useMemo(
    () => services.filter((s) => selected.includes(s.id)),
    [services, selected],
  );
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const duration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  function validateStep(): string | null {
    if (step === 0) {
      if (isFallback) return "O catálogo está offline. Tente novamente mais tarde.";
      if (selectedServices.length === 0) return "Escolha pelo menos um serviço.";
    }
    if (step === 1) {
      if (!date || !time) return "Escolha data e hora.";
      if (isPast(date, time)) return "Escolha uma data e hora futuras.";
    }
    if (step === 2) {
      const parsed = contactSchema.safeParse(form);
      if (!parsed.success) return parsed.error.issues[0]?.message ?? "Dados inválidos.";
      if (!user) {
        const pwd = passwordSchema.safeParse(form.password);
        if (!pwd.success) return pwd.error.issues[0]?.message ?? "Palavra-passe inválida.";
      }
    }
    if (step === 3 && payment.referencia.trim().length < 4) {
      return "Indique a referência da transação (mínimo 4 caracteres).";
    }
    return null;
  }

  async function submitBooking() {
    setSubmitting(true);
    try {
      // Sem sessão, a conta é criada pelo backend na mesma transação da marcação:
      // se o horário falhar, não fica uma conta criada sem reserva. Depois entra-se
      // com ela para a cliente acompanhar tudo na "Minha área".
      const res = await createMarcacao.mutateAsync({
        servicosIds: selectedServices.map((s) => s.id),
        data: date,
        hora: time,
        metodoPagamento: payment.metodo,
        referenciaPagamento: payment.referencia.trim(),
        ...(profissionalId ? { profissionalId } : {}),
        ...(user ? {} : { nome: form.name.trim(), email: form.email.trim(), telefone: form.phone.trim(), senha: form.password, ...moradaParaApi(morada) }),
      });
      if (!user) {
        try {
          await signIn(form.email.trim(), form.password);
        } catch {
          // A reserva ficou feita; se a entrada automática falhar, a cliente entra depois.
        }
      }
      setBooking(res);
      setStep(4);
    } catch (e) {
      const mensagem = (e as Error).message;
      toast.error(mensagem);
      // Alguém ficou com o horário entretanto: volta à escolha de hora, com as vagas atualizadas.
      if (/horário|hora|fechado|abre/i.test(mensagem)) {
        setTime("");
        void queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.disponibilidade] });
        setStep(1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }
    if (step === 3) {
      void submitBooking();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <section className="py-16 gradient-hero min-h-[70vh]">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Reserva online</p>
          <h1 className="font-display text-4xl md:text-5xl mt-3">
            O seu momento em <em className="text-gradient-rose italic">4 passos.</em>
          </h1>
        </div>
        <ol className="flex items-center justify-between mb-10 gap-1">
          {STEPS.map((s, i) => (
            <li key={s} className={cn("flex items-center gap-2", i < STEPS.length - 1 && "flex-1")}>
              <div
                className={cn(
                  "h-8 w-8 shrink-0 rounded-full grid place-items-center text-[11px] font-semibold border transition",
                  i < step && "bg-primary text-primary-foreground border-primary",
                  i === step && "bg-accent text-primary border-accent shadow-petal",
                  i > step && "bg-card text-muted-foreground border-border",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("hidden sm:block text-xs font-medium whitespace-nowrap", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
              {i < STEPS.length - 1 && <div className={cn("h-px flex-1 mx-1", i < step ? "bg-primary" : "bg-border")} />}
            </li>
          ))}
        </ol>

        <div className="bg-card rounded-3xl border border-border/60 shadow-elegant p-6 md:p-10">
          {step === 0 && (
            <StepServices
              services={services}
              selected={selected}
              toggle={toggle}
              loading={loadingServicos}
              offline={isFallback}
            />
          )}
          {step === 1 && (
            <StepDateTime
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              duration={duration}
              servicosIds={selectedServices.map((s) => s.id)}
              enabled={!isFallback}
              profissionais={profissionais}
              profissionalId={profissionalId}
              setProfissionalId={setProfissionalId}
            />
          )}
          {step === 2 && <StepContact form={form} setForm={setForm} hasAccount={!!user} morada={morada} setMorada={setMorada} />}
          {step === 3 && <StepPayment total={total} payment={payment} setPayment={setPayment} />}
          {step === 4 && booking && (
            <StepDone booking={booking} onDashboard={() => navigate("/minha-area")} />
          )}

          {step < STEPS.length - 1 && (
            <div className="mt-10 pt-6 border-t border-border flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={back} disabled={step === 0 || submitting} className="rounded-full">
                <ArrowLeft className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total estimado</p>
                <p className="font-display text-xl text-primary">{formatMZN(total)}</p>
              </div>
              <Button onClick={next} disabled={submitting} className="rounded-full bg-primary px-6">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {step === 3 ? "Confirmar reserva" : "Continuar"}
                {!submitting && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StepServices({
  services,
  selected,
  toggle,
  loading,
  offline,
}: {
  services: NormalizedService[];
  selected: string[];
  toggle: (id: string) => void;
  loading: boolean;
  offline: boolean;
}) {
  const grouped = useMemo(() => groupByCategory(services), [services]);

  if (loading) {
    return (
      <div className="py-12 grid place-items-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (services.length === 0) {
    return <p className="text-sm text-muted-foreground py-8">Nenhum serviço disponível de momento.</p>;
  }

  return (
    <div>
      <h3 className="font-display text-2xl mb-1">Escolha os serviços</h3>
      <p className="text-sm text-muted-foreground mb-6">Pode selecionar vários. Os preços somam-se.</p>
      {offline && <OfflineNotice />}
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
                    aria-pressed={on}
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
                      <p className="text-sm font-display text-primary whitespace-nowrap">{formatMZN(s.price)}</p>
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

function StepDateTime({
  profissionais,
  profissionalId,
  setProfissionalId,
  ...props
}: {
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  duration: number;
  servicosIds: string[];
  enabled: boolean;
  profissionais: Profissional[];
  profissionalId: string;
  setProfissionalId: (v: string) => void;
}) {
  // Com uma só pessoa na equipa não há escolha a fazer.
  const opcoes = profissionais.length > 1 ? [{ id: "", nome: "Qualquer profissional" }, ...profissionais] : [];
  return (
    <div>
      <h3 className="font-display text-2xl mb-1">Quando prefere?</h3>
      {opcoes.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest mb-2 text-muted-foreground">Com quem</p>
          <div className="flex flex-wrap gap-2">
            {opcoes.map((p) => (
              <button
                key={p.id || "qualquer"}
                type="button"
                onClick={() => setProfissionalId(p.id)}
                aria-pressed={profissionalId === p.id}
                className={cn(
                  "h-9 px-4 rounded-full border text-sm transition",
                  profissionalId === p.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40",
                )}
              >
                {p.nome}
              </button>
            ))}
          </div>
        </div>
      )}
      <SeletorHorario {...props} profissionalId={profissionalId || undefined} />
    </div>
  );
}

type ContactForm = { name: string; phone: string; email: string; password: string };

function StepContact({
  form,
  setForm,
  hasAccount,
  morada,
  setMorada,
}: {
  form: ContactForm;
  setForm: React.Dispatch<React.SetStateAction<ContactForm>>;
  hasAccount: boolean;
  morada: Morada;
  setMorada: (m: Morada) => void;
}) {
  const set = (k: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <h3 className="font-display text-2xl mb-1">Os seus dados</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {hasAccount ? (
          "A reserva fica associada à sua conta."
        ) : (
          <>
            Vamos criar a sua conta para acompanhar as marcações. Já tem conta?{" "}
            <Link to="/entrar" state={{ from: "/reservar" }} className="text-primary story-link">Entrar</Link>
          </>
        )}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="bk-name">Nome completo</Label>
          <Input id="bk-name" autoComplete="name" value={form.name} onChange={set("name")} disabled={hasAccount} className="h-11 mt-1.5" />
        </div>
        <div>
          <Label htmlFor="bk-phone">Telefone / WhatsApp</Label>
          <Input id="bk-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} disabled={hasAccount} className="h-11 mt-1.5" placeholder="+258 8..." />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="bk-email">Email</Label>
          <Input id="bk-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} disabled={hasAccount} className="h-11 mt-1.5" />
        </div>
        {!hasAccount && (
          <div className="md:col-span-2">
            <Label htmlFor="bk-password">Palavra-passe (para a sua conta)</Label>
            <Input id="bk-password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} className="h-11 mt-1.5" />
            <p className="text-[11px] text-muted-foreground mt-1">Mínimo 6 caracteres.</p>
          </div>
        )}
        {!hasAccount && (
          <div className="md:col-span-2">
            <MoradaFields value={morada} onChange={setMorada} />
          </div>
        )}
      </div>
    </div>
  );
}

function StepPayment({
  total,
  payment,
  setPayment,
}: {
  total: number;
  payment: { metodo: MetodoPagamento; referencia: string };
  setPayment: React.Dispatch<React.SetStateAction<{ metodo: MetodoPagamento; referencia: string }>>;
}) {
  const copy = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v.replace(/\s/g, ""));
      toast.success("Número copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div>
      <h3 className="font-display text-2xl mb-1">Adiantamento de {formatMZN(ADIANTAMENTO)}</h3>
      <p className="text-sm text-muted-foreground mb-6">
        O adiantamento garante o seu horário e é abatido no valor final ({formatMZN(total)}).
        Escolha o método, envie o valor e cole a referência da transação abaixo.
      </p>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Método de pagamento">
        {PAGAMENTOS.map((c) => {
          const on = payment.metodo === c.metodo;
          return (
            <div
              key={c.metodo}
              role="radio"
              aria-checked={on}
              tabIndex={0}
              onClick={() => setPayment((p) => ({ ...p, metodo: c.metodo }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPayment((p) => ({ ...p, metodo: c.metodo }));
                }
              }}
              className={cn(
                "p-5 rounded-2xl border cursor-pointer transition outline-none focus-visible:ring-2 ring-ring",
                on ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-secondary/30 hover:border-primary/40",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-rose-deep font-semibold">{c.label}</p>
                <div className={cn("h-4 w-4 rounded-full border-2 grid place-items-center", on ? "bg-primary border-primary" : "border-muted-foreground/40")}>
                  {on && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </div>
              <p className="font-display text-2xl mt-1">{c.num}</p>
              <p className="text-xs text-muted-foreground">{c.nome}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); void copy(c.num); }}
                className="mt-3 text-xs inline-flex items-center gap-1.5 text-primary story-link"
              >
                <Copy className="h-3 w-3" /> Copiar número
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <Label htmlFor="bk-ref">Referência / número da transação</Label>
        <Input
          id="bk-ref"
          value={payment.referencia}
          onChange={(e) => setPayment((p) => ({ ...p, referencia: e.target.value }))}
          placeholder="Ex: 8ABC1234XY"
          className="h-11 mt-1.5"
        />
        <p className="text-[11px] text-muted-foreground mt-2">
          A marcação fica "Aguarda confirmação" até validarmos o pagamento. Ligamos a confirmar o horário.
        </p>
      </div>
    </div>
  );
}

function StepDone({ booking, onDashboard }: { booking: Marcacao; onDashboard: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto h-16 w-16 rounded-full bg-accent/20 grid place-items-center mb-6">
        <Sparkles className="h-7 w-7 text-rose-deep" />
      </div>
      <h3 className="font-display text-3xl">Reserva registada!</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        {formatDate(booking.data)} às {formatHora(booking.hora)} · {formatMZN(booking.valorTotal)}
        <br />
        Código <span className="font-mono text-foreground">#{booking.id.slice(-6)}</span>. Vamos ligar em breve para
        confirmar. Também pode acompanhar tudo na sua área pessoal.
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
