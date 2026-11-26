import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { toast } from "sonner";
import { Logo } from "@/shared/components/Logo";
import { MoradaFields } from "@/modules/locations/components/MoradaFields";
import { moradaParaApi, type Morada } from "@/modules/locations/lib/morada";
import { z } from "zod";
import type { AppUser } from "@/modules/auth/models";
import { usePaginaTitulo } from "@/shared/lib/seo";
import { SENHA_DICA, senhaNovaSchema } from "@/modules/auth/lib/senha";

// Regras alinhadas com LoginRequest / CadastroRequest do backend.
const loginSchema = z.object({
  email: z.string().trim().email("Email inválido.").max(120),
  password: z.string().min(1, "Indique a palavra-passe."),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").max(80),
  email: z.string().trim().email("Email inválido.").max(120),
  phone: z.string().trim().min(6, "Telefone inválido.").max(30),
  password: senhaNovaSchema,
});

export default function AuthPage() {
  usePaginaTitulo("Entrar", { indexar: false });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [morada, setMorada] = useState<Morada>({ provinciaId: "", distritoId: "" });
  const [submitting, setSubmitting] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const destinationFor = (u: AppUser) => {
    const home = u.role === "admin" ? "/admin" : "/minha-area";
    // Só volta à página de origem se pertencer à área do papel do utilizador.
    if (from && (u.role === "admin" ? from.startsWith("/admin") : !from.startsWith("/admin"))) return from;
    return home;
  };

  if (user && !submitting) return <Navigate to={destinationFor(user)} replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = (mode === "login" ? loginSchema : signupSchema).safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setSubmitting(true);
    try {
      const u =
        mode === "login"
          ? await signIn(form.email, form.password)
          : await signUp({ ...form, ...moradaParaApi(morada) });
      toast.success(mode === "login" ? `Bem-vinda de volta, ${u.name.split(" ")[0]}.` : "Conta criada com sucesso.");
      navigate(destinationFor(u), { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section className="py-16 md:py-24 gradient-hero min-h-[80vh]">
      <div className="mx-auto max-w-md px-6">
        <div className="bg-card rounded-3xl border border-border/60 shadow-elegant p-8 md:p-10">
          <div className="text-center mb-8">
            <Logo compact className="items-center" />
            <h1 className="font-display text-3xl mt-6">
              {mode === "login" ? "Bem-vinda de volta" : "Criar conta"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Aceda à sua área pessoal" : "Acompanhe as suas marcações"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <div>
                <Label htmlFor="auth-name">Nome</Label>
                <Input id="auth-name" autoComplete="name" value={form.name} onChange={set("name")} className="h-11 mt-1.5" />
              </div>
            )}
            <div>
              <Label htmlFor="auth-email">Email</Label>
              <Input id="auth-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} className="h-11 mt-1.5" />
            </div>
            {mode === "signup" && (
              <div>
                <Label htmlFor="auth-phone">Telefone</Label>
                <Input id="auth-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} className="h-11 mt-1.5" placeholder="+258 8..." />
              </div>
            )}
            {mode === "signup" && <MoradaFields value={morada} onChange={setMorada} />}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-password">Palavra-passe</Label>
                {mode === "login" && (
                  <Link to="/recuperar-senha" className="text-xs text-primary story-link">Esqueci-me da palavra-passe</Link>
                )}
              </div>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={form.password}
                onChange={set("password")}
                className="h-11 mt-1.5"
              />
              {mode === "signup" && <p className="text-[11px] text-muted-foreground mt-1">{SENHA_DICA}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11 rounded-full bg-primary">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-medium story-link"
            >
              {mode === "login" ? "Criar agora" : "Entrar"}
            </button>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Prefere marcar direto? <Link to="/reservar" className="text-primary story-link">Reservar</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
