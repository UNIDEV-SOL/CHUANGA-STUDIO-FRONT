import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/atoms/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/httpClient";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";

function Moldura({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  return (
    <section className="py-16 md:py-24 gradient-hero min-h-[80vh]">
      <div className="mx-auto max-w-md px-6">
        <div className="bg-card rounded-3xl border border-border/60 shadow-elegant p-8 md:p-10">
          <div className="text-center mb-8">
            <Logo compact className="items-center" />
            <h1 className="font-display text-3xl mt-6">{titulo}</h1>
            <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p>
          </div>
          {children}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Lembrou-se? <Link to="/entrar" className="text-primary font-medium story-link">Entrar</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Passo 1: pedir o link por email. A resposta é igual exista ou não a conta. */
export function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Indique um email válido.");
      return;
    }
    setEnviando(true);
    try {
      await apiClient.post(API_ENDPOINTS.auth.recuperarSenha, { email: parsed.data });
      setEnviado(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <Moldura titulo="Verifique o seu email" subtitulo="Enviámos-lhe um link">
        <div className="text-center space-y-3 text-sm text-muted-foreground">
          <MailCheck className="h-10 w-10 mx-auto text-rose-deep" />
          <p>
            Se existir uma conta com <span className="text-foreground font-medium">{email.trim()}</span>, vai receber
            um email com um link para escolher uma nova palavra-passe. O link é válido durante 1 hora.
          </p>
          <p className="text-xs">Não chegou? Veja na pasta de spam ou peça de novo daqui a alguns minutos.</p>
        </div>
      </Moldura>
    );
  }

  return (
    <Moldura titulo="Esqueceu-se da palavra-passe?" subtitulo="Enviamos-lhe um link para criar uma nova">
      <form onSubmit={submeter} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="rec-email">Email da sua conta</Label>
          <Input id="rec-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 mt-1.5" />
        </div>
        <Button type="submit" disabled={enviando} className="w-full h-11 rounded-full bg-primary">
          {enviando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Enviar link
        </Button>
      </form>
    </Moldura>
  );
}

/** Passo 2: o link do email traz ?token=...; aqui escolhe-se a nova palavra-passe. */
export function RedefinirSenhaPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      toast.error("As palavras-passe não coincidem.");
      return;
    }
    setEnviando(true);
    try {
      await apiClient.post(API_ENDPOINTS.auth.redefinirSenha, { token, novaSenha: senha });
      toast.success("Palavra-passe alterada. Já pode entrar.");
      navigate("/entrar", { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <Moldura titulo="Link inválido" subtitulo="Falta o código do link">
        <p className="text-center text-sm text-muted-foreground">
          Abra o link diretamente do email, ou <Link to="/recuperar-senha" className="text-primary story-link">peça um novo</Link>.
        </p>
      </Moldura>
    );
  }

  return (
    <Moldura titulo="Nova palavra-passe" subtitulo="Escolha uma palavra-passe que não use noutros sites">
      <form onSubmit={submeter} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="nova-senha">Nova palavra-passe</Label>
          <Input id="nova-senha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-11 mt-1.5" />
          <p className="text-[11px] text-muted-foreground mt-1">Mínimo 6 caracteres.</p>
        </div>
        <div>
          <Label htmlFor="confirmar-senha">Repita a palavra-passe</Label>
          <Input id="confirmar-senha" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="h-11 mt-1.5" />
        </div>
        <Button type="submit" disabled={enviando} className="w-full h-11 rounded-full bg-primary">
          {enviando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar palavra-passe
        </Button>
      </form>
    </Moldura>
  );
}
