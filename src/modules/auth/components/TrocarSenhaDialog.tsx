import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { useTrocarSenha } from "@/modules/auth/hooks/useAuthApi";
import { SENHA_DICA, erroSenha } from "@/modules/auth/lib/senha";

/** Alterar a própria palavra-passe (admin ou cliente). */
export function TrocarSenhaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const trocar = useTrocarSenha();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [repetir, setRepetir] = useState("");

  useEffect(() => {
    if (open) {
      setAtual("");
      setNova("");
      setRepetir("");
    }
  }, [open]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const erro = erroSenha(nova);
    if (erro) return toast.error(erro);
    if (nova !== repetir) return toast.error("As palavras-passe não coincidem.");
    try {
      await trocar.mutateAsync({ senhaAtual: atual, novaSenha: nova });
      toast.success("Palavra-passe alterada. As sessões noutros dispositivos foram terminadas.");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Alterar palavra-passe</DialogTitle>
          <DialogDescription>Esqueceu-se da atual? Saia e use "Esqueci-me da palavra-passe" na página de entrada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-3" noValidate>
          <div>
            <Label htmlFor="senha-atual">Palavra-passe atual</Label>
            <Input id="senha-atual" type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} className="h-10 mt-1" />
          </div>
          <div>
            <Label htmlFor="senha-nova">Nova palavra-passe</Label>
            <Input id="senha-nova" type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} className="h-10 mt-1" />
            <p className="text-[11px] text-muted-foreground mt-1">{SENHA_DICA}</p>
          </div>
          <div>
            <Label htmlFor="senha-repetir">Repita a nova</Label>
            <Input id="senha-repetir" type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} className="h-10 mt-1" />
          </div>
          <DialogFooter>
            <Button type="submit" className="rounded-full bg-primary w-full" disabled={trocar.isPending || !atual}>
              {trocar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
