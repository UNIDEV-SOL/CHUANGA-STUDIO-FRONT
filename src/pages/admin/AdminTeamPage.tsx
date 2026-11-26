import { useState } from "react";
import { KeyRound, Loader2, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import { TrocarSenhaDialog } from "@/components/TrocarSenhaDialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAdminAtivarUtilizador,
  useAdminCriarUtilizador,
  useAdminGuardarProfissional,
  useAdminProfissionais,
  useAdminRemoverProfissional,
  useAdminUtilizadores,
} from "@/hooks/useAdminApi";
import type { Profissional } from "@/types/api";
import { SENHA_DICA, erroSenha } from "@/lib/senha";

type ProfForm = { id?: string; nome: string; telefone: string; ativo: boolean; ordem: number };

export default function AdminTeamPage() {
  const { user } = useAuth();
  const profsQuery = useAdminProfissionais();
  const guardarProf = useAdminGuardarProfissional();
  const removerProf = useAdminRemoverProfissional();
  const utilizadoresQuery = useAdminUtilizadores();
  const criarUtilizador = useAdminCriarUtilizador();
  const ativarUtilizador = useAdminAtivarUtilizador();

  const [editando, setEditando] = useState<ProfForm | null>(null);
  const [aRemover, setARemover] = useState<Profissional | null>(null);
  const [novoAdmin, setNovoAdmin] = useState<{ nome: string; email: string; telefone: string; senha: string } | null>(null);
  const [trocarSenha, setTrocarSenha] = useState(false);

  async function run(acao: Promise<unknown>, sucesso: string) {
    try {
      await acao;
      toast.success(sucesso);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  }

  async function guardarProfissional() {
    if (!editando || !editando.nome.trim()) return toast.error("Indique o nome.");
    const ok = await run(guardarProf.mutateAsync({
      id: editando.id,
      nome: editando.nome.trim(),
      telefone: editando.telefone.trim() || null,
      ativo: editando.ativo,
      ordem: editando.ordem,
    }), editando.id ? "Profissional atualizada." : "Profissional adicionada.");
    if (ok) setEditando(null);
  }

  async function criarAdmin() {
    if (!novoAdmin) return;
    const erro = erroSenha(novoAdmin.senha);
    if (erro) return toast.error(erro);
    const ok = await run(criarUtilizador.mutateAsync({
      nome: novoAdmin.nome.trim(),
      email: novoAdmin.email.trim(),
      telefone: novoAdmin.telefone.trim() || undefined,
      senha: novoAdmin.senha,
    }), "Utilizador criado. Partilhe a palavra-passe por um canal seguro.");
    if (ok) setNovoAdmin(null);
  }

  const profissionais = profsQuery.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Estúdio</p>
          <h1 className="font-display text-4xl mt-1">Equipa</h1>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => setTrocarSenha(true)}>
          <KeyRound className="h-4 w-4 mr-2" /> Alterar a minha palavra-passe
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-card border border-border/60 p-5">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="font-display text-2xl">Profissionais</h2>
            <Button size="sm" className="rounded-full bg-primary" onClick={() => setEditando({ nome: "", telefone: "", ativo: true, ordem: profissionais.length + 1 })}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Quem faz os atendimentos. O nº de profissionais ativas é quantas marcações cabem à mesma hora.
            Com mais de uma, a cliente pode escolher com quem marcar.
          </p>
          {profsQuery.isError && <QueryError query={profsQuery} className="mb-3" />}
          {profsQuery.isLoading && <Skeleton className="h-24 w-full" />}
          {profsQuery.isSuccess && profissionais.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sem equipa registada: vale o valor de atendimentos simultâneos da configuração (1).
            </p>
          )}
          <ul className="divide-y divide-border/60">
            {profissionais.map((p) => (
              <li key={p.id} className="py-3 flex items-center gap-3">
                <span className="flex-1 min-w-0">
                  <span className="font-medium">{p.nome}</span>
                  {!p.ativo && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">inativa</span>}
                  {p.telefone && <span className="block text-xs text-muted-foreground">{p.telefone}</span>}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Editar ${p.nome}`}
                  onClick={() => setEditando({ id: p.id, nome: p.nome, telefone: p.telefone ?? "", ativo: p.ativo, ordem: p.ordem })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={`Remover ${p.nome}`} onClick={() => setARemover(p)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-card border border-border/60 p-5">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="font-display text-2xl">Acesso ao painel</h2>
            <Button size="sm" className="rounded-full bg-primary" onClick={() => setNovoAdmin({ nome: "", email: "", telefone: "", senha: "" })}>
              <UserPlus className="h-4 w-4 mr-1" /> Novo utilizador
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Contas que entram no painel. Desativar tira o acesso logo.</p>
          {utilizadoresQuery.isError && <QueryError query={utilizadoresQuery} className="mb-3" />}
          {utilizadoresQuery.isLoading && <Skeleton className="h-24 w-full" />}
          <ul className="divide-y divide-border/60">
            {(utilizadoresQuery.data ?? []).map((u) => {
              const eu = u.email === user?.email;
              return (
                <li key={u.id} className="py-3 flex items-center gap-3">
                  <span className="flex-1 min-w-0">
                    <span className="font-medium">{u.nome}</span>
                    {eu && <span className="ml-2 text-[10px] uppercase tracking-wider text-rose-deep">você</span>}
                    <span className="block text-xs text-muted-foreground truncate">{u.email} · desde {formatDate(u.criadoEm)}</span>
                  </span>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    {u.contaAtiva ? "Ativa" : "Desativada"}
                    <Switch
                      checked={u.contaAtiva}
                      disabled={eu || ativarUtilizador.isPending}
                      onCheckedChange={(v) => run(ativarUtilizador.mutateAsync({ id: u.id, ativo: v }), v ? "Conta reativada." : "Conta desativada.")}
                      aria-label={`Conta de ${u.nome} ativa`}
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editando?.id ? "Editar profissional" : "Nova profissional"}</DialogTitle>
            <DialogDescription>A ordem define quem recebe primeiro as marcações sem preferência.</DialogDescription>
          </DialogHeader>
          {editando && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="prof-nome">Nome</Label>
                <Input id="prof-nome" value={editando.nome} maxLength={120} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} className="h-10 mt-1" />
              </div>
              <div>
                <Label htmlFor="prof-tel">Telefone (opcional)</Label>
                <Input id="prof-tel" type="tel" value={editando.telefone} maxLength={30} onChange={(e) => setEditando({ ...editando, telefone: e.target.value })} className="h-10 mt-1" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24">
                  <Label htmlFor="prof-ordem">Ordem</Label>
                  <Input id="prof-ordem" type="number" min={0} value={editando.ordem} onChange={(e) => setEditando({ ...editando, ordem: Number(e.target.value) || 0 })} className="h-10 mt-1" />
                </div>
                <label className="flex items-center gap-2 mt-5 text-sm cursor-pointer">
                  <Switch checked={editando.ativo} onCheckedChange={(v) => setEditando({ ...editando, ativo: v })} /> Ativa
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="rounded-full bg-primary w-full" disabled={guardarProf.isPending} onClick={guardarProfissional}>
              {guardarProf.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!novoAdmin} onOpenChange={(v) => !v && setNovoAdmin(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Novo utilizador do painel</DialogTitle>
            <DialogDescription>Crie uma palavra-passe provisória e partilhe-a com a pessoa; ela pode alterá-la depois em Equipa.</DialogDescription>
          </DialogHeader>
          {novoAdmin && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="adm-nome">Nome</Label>
                <Input id="adm-nome" value={novoAdmin.nome} onChange={(e) => setNovoAdmin({ ...novoAdmin, nome: e.target.value })} className="h-10 mt-1" />
              </div>
              <div>
                <Label htmlFor="adm-email">Email</Label>
                <Input id="adm-email" type="email" autoComplete="off" value={novoAdmin.email} onChange={(e) => setNovoAdmin({ ...novoAdmin, email: e.target.value })} className="h-10 mt-1" />
              </div>
              <div>
                <Label htmlFor="adm-tel">Telefone (opcional)</Label>
                <Input id="adm-tel" type="tel" value={novoAdmin.telefone} onChange={(e) => setNovoAdmin({ ...novoAdmin, telefone: e.target.value })} className="h-10 mt-1" />
              </div>
              <div>
                <Label htmlFor="adm-senha">Palavra-passe provisória</Label>
                <Input id="adm-senha" type="password" autoComplete="new-password" value={novoAdmin.senha} onChange={(e) => setNovoAdmin({ ...novoAdmin, senha: e.target.value })} className="h-10 mt-1" />
                <p className="text-[11px] text-muted-foreground mt-1">{SENHA_DICA}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="rounded-full bg-primary w-full" disabled={criarUtilizador.isPending || !novoAdmin?.nome.trim() || !novoAdmin?.email.trim()} onClick={criarAdmin}>
              {criarUtilizador.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar utilizador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aRemover} onOpenChange={(v) => !v && setARemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {aRemover?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Deixa de aparecer na reserva e de contar para a capacidade. As marcações antigas continuam a mostrar o nome.
              Se for só uma ausência temporária, prefira desativar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removerProf.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (aRemover) void run(removerProf.mutateAsync(aRemover.id), "Profissional removida.").then((ok) => ok && setARemover(null));
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TrocarSenhaDialog open={trocarSenha} onOpenChange={setTrocarSenha} />
    </div>
  );
}
