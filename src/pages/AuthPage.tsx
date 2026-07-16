import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Logo } from "@/atoms/Logo";
import { z } from "zod";
import { useNavigate } from "react-router";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") {
        const emailSchema = z.string().trim().email().max(120);
        const check = emailSchema.safeParse(form.email);
        if (!check.success) return toast.error("Email inválido.");
        const u = await signIn(form.email, form.password);
        toast.success("Bem-vinda de volta.");
        navigate(u.role === "admin" ? "/admin" : "/minha-area");
      } else {
        const schema = z.object({
          name: z.string().trim().min(2, "Nome muito curto").max(80),
          email: z.string().trim().email("Email inválido").max(120),
          phone: z.string().trim().min(6, "Telefone inválido").max(30),
          password: z.string().min(4, "Mínimo 4 caracteres").max(64),
        });
        const parsed = schema.safeParse(form);
        if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
        const u = await signUp(parsed.data);
        toast.success("Conta criada com sucesso.");
        navigate("/minha-area");
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function google() {
    const u = signInWithGoogle();
    toast.success(`Sessão iniciada com Google (demo)`);
    navigate(u.role === "admin" ? "/admin" : "/minha-area");
  }

  return (
    <>
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
            <Button
              onClick={google}
              variant="outline"
              className="w-full h-11 rounded-full mb-6 gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8h3.5c2.1-1.9 3.3-4.7 3.3-8.2z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.9C4 20 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2.1 0-.7.1-1.4.4-2.1V6.9H2.1C1.4 8.4 1 10.1 1 12s.4 3.6 1.1 5.1L5.7 14z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 2.2 15 1 12 1 7.7 1 4 4 2.1 6.9L5.7 9.8C6.6 7.2 9.1 5.4 12 5.4z" /></svg>
              Continuar com Google
            </Button>
            <div className="ornamental-rule text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-6">
              ou com email
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 mt-1.5" />
                </div>
              )}
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 mt-1.5" />
              </div>
              {mode === "signup" && (
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 mt-1.5" placeholder="+258 8..." />
                </div>
              )}
              <div>
                <Label>Palavra-passe</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11 mt-1.5" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-full bg-primary">
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
            {mode === "login" && (
              <p className="text-[11px] text-center text-muted-foreground mt-4">
                Admin demo: <code>angela@chuanga.mz</code> / <code>admin</code>
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground mt-2">
              Prefere marcar direto? <Link to="/reservar" className="text-primary story-link">Reservar</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
