import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Logo } from "@/shared/components/Logo";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { apiClient, extractApiData } from "@/shared/api/httpClient";
import { API_ENDPOINTS } from "@/shared/api/apiEndpoints";
import { SENHA_DICA, erroSenha } from "@/modules/auth/lib/senha";

/** Segundos até poder pedir outro código. */
const ESPERA_REENVIO = 60;

function Moldura({ titulo, subtitulo, passo, children }: { titulo: string; subtitulo: string; passo: number; children: React.ReactNode }) {
  return (
    <section className="py-16 md:py-24 gradient-hero min-h-[80vh]">
      <div className="mx-auto max-w-md px-6">
        <div className="bg-card rounded-3xl border border-border/60 shadow-elegant p-8 md:p-10">
          <div className="text-center mb-8">
            <Logo compact className="items-center" />
            <p className="text-xs text-muted-foreground mt-6">Passo {passo} de 3</p>
            <h1 className="font-display text-3xl mt-1">{titulo}</h1>
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

/**
 * Recuperação da palavra-passe por código OTP:
 * 1) email da conta → 2) código de 6 dígitos recebido por email → 3) nova palavra-passe + confirmação → entra na plataforma.
 */
export function RecuperarSenhaPage() {
  const navigate = useNavigate();
  const { redefinirSenha } = useAuth();
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [token, setToken] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [validade, setValidade] = useState(10);
  const [espera, setEspera] = useState(0);
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function pedirCodigo(e?: React.FormEvent) {
    e?.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Indique um email válido.");
      return;
    }
    setAEnviar(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.recuperarSenha, { email: parsed.data });
      setValidade(extractApiData<{ validadeMinutos: number }>(res.data)?.validadeMinutos ?? 10);
      setCodigo("");
      setEspera(ESPERA_REENVIO);
      if (passo === 2) toast.success("Enviámos um novo código. O anterior deixou de valer.");
      setPasso(2);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAEnviar(false);
    }
  }

  async function confirmarCodigo(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      toast.error("O código tem 6 dígitos.");
      return;
    }
    setAEnviar(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.verificarCodigo, { email: email.trim(), codigo });
      setToken(extractApiData<{ token: string }>(res.data).token);
      setPasso(3);
    } catch (err) {
      setCodigo("");
      toast.error((err as Error).message);
    } finally {
      setAEnviar(false);
    }
  }

  async function guardarSenha(e: React.FormEvent) {
    e.preventDefault();
    const erro = erroSenha(senha);
    if (erro) return toast.error(erro);
    if (senha !== confirmacao) return toast.error("As palavras-passe não coincidem.");
    setAEnviar(true);
    try {
      const u = await redefinirSenha(token, senha, confirmacao);
      toast.success(`Palavra-passe alterada. Bem-vinda de volta, ${u.name.split(" ")[0]}.`);
      navigate(u.role === "admin" ? "/admin" : "/minha-area", { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAEnviar(false);
    }
  }

  if (passo === 1) {
    return (
      <Moldura passo={1} titulo="Esqueceu-se da palavra-passe?" subtitulo="Enviamos-lhe um código para o email da sua conta">
        <form onSubmit={pedirCodigo} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="rec-email">Email da sua conta</Label>
            <Input id="rec-email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 mt-1.5" />
          </div>
          <Button type="submit" disabled={aEnviar} className="w-full h-11 rounded-full bg-primary">
            {aEnviar && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar código
          </Button>
        </form>
      </Moldura>
    );
  }

  if (passo === 2) {
    return (
      <Moldura passo={2} titulo="Introduza o código" subtitulo={`Válido durante ${validade} minutos`}>
        <div className="text-center text-sm text-muted-foreground space-y-2 mb-6">
          <MailCheck className="h-8 w-8 mx-auto text-rose-deep" />
          <p>
            Se existir uma conta com <span className="text-foreground font-medium">{email.trim()}</span>, enviámos um código de 6 dígitos.
            Veja também a pasta de spam.
          </p>
        </div>
        <form onSubmit={confirmarCodigo} className="space-y-5" noValidate>
          <div className="flex justify-center">
            <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={codigo} onChange={setCodigo} autoFocus
              onComplete={() => void confirmarCodigo()} disabled={aEnviar}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" disabled={aEnviar || codigo.length !== 6} className="w-full h-11 rounded-full bg-primary">
            {aEnviar && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar código
          </Button>
        </form>
        <div className="flex items-center justify-between mt-5 text-sm">
          <button type="button" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => { setPasso(1); setCodigo(""); }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Mudar email
          </button>
          <button type="button" disabled={espera > 0 || aEnviar} onClick={() => void pedirCodigo()}
            className="text-primary disabled:text-muted-foreground">
            {espera > 0 ? `Reenviar código (${espera}s)` : "Reenviar código"}
          </button>
        </div>
      </Moldura>
    );
  }

  return (
    <Moldura passo={3} titulo="Nova palavra-passe" subtitulo="Escolha uma palavra-passe que não use noutros sites">
      <form onSubmit={guardarSenha} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="nova-senha">Nova palavra-passe</Label>
          <Input id="nova-senha" type="password" autoComplete="new-password" autoFocus value={senha} onChange={(e) => setSenha(e.target.value)} className="h-11 mt-1.5" />
          <p className="text-[11px] text-muted-foreground mt-1">{SENHA_DICA}</p>
        </div>
        <div>
          <Label htmlFor="confirmar-senha">Confirme a palavra-passe</Label>
          <Input id="confirmar-senha" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="h-11 mt-1.5" />
          {confirmacao && senha !== confirmacao && <p className="text-[11px] text-destructive mt-1">As palavras-passe não coincidem.</p>}
        </div>
        <Button type="submit" disabled={aEnviar} className="w-full h-11 rounded-full bg-primary">
          {aEnviar && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar e entrar
        </Button>
      </form>
    </Moldura>
  );
}

/** Links antigos (/redefinir-senha?token=...) já não existem: a recuperação é por código. */
export function RedefinirSenhaPage() {
  return <Navigate to="/recuperar-senha" replace />;
}
