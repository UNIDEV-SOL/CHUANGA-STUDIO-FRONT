import { useEffect, useState } from "react";
import { Check, CheckCheck, Loader2, Search, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useAbrirConversaCom, useContactos, useConversas, useCriarGrupo, useEncaminhar, useFavoritas, useGestaoGrupo, useInfoMensagem,
} from "@/hooks/useChatApi";
import type { ContactoChat, MensagemChat } from "@/types/api";
import { AvatarConversa } from "./AvatarConversa";
import { horaDe, quando, rotuloDia } from "./util";

function ListaContactos({
  busca, setBusca, contactos, aCarregar, escolhidos, onEscolher, multipla, excluir = [],
}: {
  busca: string;
  setBusca: (v: string) => void;
  contactos: ContactoChat[];
  aCarregar: boolean;
  escolhidos: string[];
  onEscolher: (c: ContactoChat) => void;
  multipla: boolean;
  excluir?: string[];
}) {
  const lista = contactos.filter((c) => c.usuarioId && !excluir.includes(c.usuarioId));
  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input autoFocus placeholder="Procurar pelo nome..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 h-10" />
      </div>
      <div className="max-h-[50vh] overflow-y-auto -mx-2">
        {aCarregar ? (
          <div className="py-8 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : lista.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Ninguém encontrado.</p>
        ) : lista.map((c) => {
          const sel = escolhidos.includes(c.usuarioId!);
          return (
            <button key={c.usuarioId} type="button" onClick={() => onEscolher(c)}
              className={cn("w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/60 text-left", sel && "bg-secondary")}>
              <Avatar className="h-9 w-9"><AvatarFallback className={cn("text-xs", c.equipa ? "bg-primary text-primary-foreground" : "bg-accent/30 text-primary")}>{initials(c.nome)}</AvatarFallback></Avatar>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium">{c.nome}</span>
                {c.equipa && <span className="block text-[11px] text-rose-deep">Equipa do estúdio</span>}
              </span>
              {multipla && (
                <span className={cn("h-5 w-5 rounded-full border-2 grid place-items-center", sel ? "bg-primary border-primary text-primary-foreground" : "border-border")}>
                  {sel && <Check className="h-3 w-3" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Nova conversa: escolher uma pessoa (cliente dos seus grupos, ou a equipa). */
export function NovaConversaDialog({ open, onOpenChange, onAberta, onNovoGrupo }: {
  open: boolean; onOpenChange: (v: boolean) => void; onAberta: (id: string) => void; onNovoGrupo: () => void;
}) {
  const [q, setQ] = useState("");
  const busca = useDebounce(q);
  const contactos = useContactos(busca, open);
  const abrir = useAbrirConversaCom();
  useEffect(() => { if (!open) setQ(""); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Nova conversa</DialogTitle>
          <DialogDescription>Escreva a uma pessoa dos seus grupos ou à equipa do estúdio.</DialogDescription>
        </DialogHeader>
        <button type="button" onClick={() => { onOpenChange(false); onNovoGrupo(); }}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/60 text-left -mx-2">
          <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center"><Users className="h-4 w-4" /></span>
          <span className="text-sm font-medium">Novo grupo</span>
        </button>
        <ListaContactos busca={q} setBusca={setQ} contactos={contactos.data ?? []} aCarregar={contactos.isLoading} escolhidos={[]} multipla={false}
          onEscolher={async (c) => {
            try {
              const id = await abrir.mutateAsync(c.usuarioId!);
              onOpenChange(false);
              onAberta(id);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }} />
      </DialogContent>
    </Dialog>
  );
}

/** Novo grupo em dois passos: escolher pessoas, depois nome/descrição/definições. */
export function NovoGrupoDialog({ open, onOpenChange, onCriado, equipa }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCriado: (id: string) => void; equipa: boolean;
}) {
  const [passo, setPasso] = useState<1 | 2>(1);
  const [q, setQ] = useState("");
  const busca = useDebounce(q);
  const contactos = useContactos(busca, open);
  const criar = useCriarGrupo();
  const [escolhidos, setEscolhidos] = useState<ContactoChat[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [comunidade, setComunidade] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [bloqueada, setBloqueada] = useState(false);

  useEffect(() => {
    if (open) return;
    setPasso(1); setQ(""); setEscolhidos([]); setTitulo(""); setDescricao(""); setComunidade(false); setAberto(false); setBloqueada(false);
  }, [open]);

  async function submeter() {
    try {
      const id = await criar.mutateAsync({
        titulo: titulo.trim(), descricao: descricao.trim() || undefined, membros: escolhidos.map((c) => c.usuarioId!),
        comunidade: equipa ? comunidade : undefined, aberto: equipa ? aberto : undefined, bloqueada,
      });
      toast.success("Grupo criado.");
      onOpenChange(false);
      onCriado(id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{passo === 1 ? "Adicionar pessoas" : "Novo grupo"}</DialogTitle>
          <DialogDescription>{passo === 1 ? "Escolha quem entra no grupo (pode adicionar mais depois)." : "Dê um nome e, se quiser, uma descrição."}</DialogDescription>
        </DialogHeader>
        {passo === 1 ? (
          <>
            {escolhidos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {escolhidos.map((c) => (
                  <button key={c.usuarioId} onClick={() => setEscolhidos((l) => l.filter((x) => x.usuarioId !== c.usuarioId))}
                    className="text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-destructive/10">{c.nome} ✕</button>
                ))}
              </div>
            )}
            <ListaContactos busca={q} setBusca={setQ} contactos={(contactos.data ?? []).filter((c) => !c.nome.startsWith("Chuanga Studio"))}
              aCarregar={contactos.isLoading} multipla escolhidos={escolhidos.map((c) => c.usuarioId!)}
              onEscolher={(c) => setEscolhidos((l) => l.some((x) => x.usuarioId === c.usuarioId) ? l.filter((x) => x.usuarioId !== c.usuarioId) : [...l, c])} />
            <DialogFooter>
              <Button className="rounded-full bg-primary" onClick={() => setPasso(2)}>Seguinte ({escolhidos.length})</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 text-sm">
              <div className="space-y-1.5">
                <Label htmlFor="g-nome">Nome do grupo</Label>
                <Input id="g-nome" autoFocus maxLength={120} value={titulo} onChange={(e) => setTitulo(e.target.value)} className="h-10" placeholder="Ex.: Noivas de dezembro" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-desc">Descrição</Label>
                <Textarea id="g-desc" rows={2} maxLength={500} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Opcional" />
              </div>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span>Só as administradoras enviam mensagens</span>
                <Switch checked={bloqueada} onCheckedChange={setBloqueada} />
              </label>
              {equipa && (
                <>
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span>Mostrar na comunidade</span>
                    <Switch checked={comunidade} onCheckedChange={setComunidade} />
                  </label>
                  {comunidade && (
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span>Qualquer cliente pode entrar</span>
                      <Switch checked={aberto} onCheckedChange={setAberto} />
                    </label>
                  )}
                </>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPasso(1)}>Voltar</Button>
              <Button className="rounded-full bg-primary" disabled={!titulo.trim() || criar.isPending} onClick={submeter}>
                {criar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar grupo
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AdicionarMembrosDialog({ grupoId, open, onOpenChange, jaMembros }: {
  grupoId: string; open: boolean; onOpenChange: (v: boolean) => void; jaMembros: string[];
}) {
  const [q, setQ] = useState("");
  const busca = useDebounce(q);
  const contactos = useContactos(busca, open);
  const gestao = useGestaoGrupo(grupoId);
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  useEffect(() => { if (!open) { setQ(""); setEscolhidos([]); } }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Adicionar ao grupo</DialogTitle>
          <DialogDescription>Escolha uma ou mais pessoas.</DialogDescription>
        </DialogHeader>
        <ListaContactos busca={q} setBusca={setQ} contactos={(contactos.data ?? []).filter((c) => !c.nome.startsWith("Chuanga Studio"))}
          aCarregar={contactos.isLoading} multipla escolhidos={escolhidos} excluir={jaMembros}
          onEscolher={(c) => setEscolhidos((l) => l.includes(c.usuarioId!) ? l.filter((x) => x !== c.usuarioId) : [...l, c.usuarioId!])} />
        <DialogFooter>
          <Button className="rounded-full bg-primary" disabled={escolhidos.length === 0 || gestao.isPending}
            onClick={async () => {
              try {
                toast.success(await gestao.mutateAsync({ tipo: "adicionar", usuarios: escolhidos }));
                onOpenChange(false);
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}>
            {gestao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Adicionar ({escolhidos.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Reencaminhar para até 5 conversas. */
export function EncaminharDialog({ mensagem, onOpenChange }: { mensagem: MensagemChat | null; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const busca = useDebounce(q);
  const conversas = useConversas(busca, "todas", !!mensagem);
  const encaminhar = useEncaminhar();
  const [escolhidas, setEscolhidas] = useState<string[]>([]);
  useEffect(() => { if (!mensagem) { setQ(""); setEscolhidas([]); } }, [mensagem]);
  const disponiveis = conversas.items.filter((c) => !(c.tipo === "GRUPO" && c.bloqueada && !c.souAdmin));
  return (
    <Dialog open={!!mensagem} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Reencaminhar para…</DialogTitle>
          <DialogDescription>Escolha até 5 conversas.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Procurar..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="max-h-[50vh] overflow-y-auto -mx-2">
          {disponiveis.map((c) => {
            const sel = escolhidas.includes(c.id);
            return (
              <button key={c.id} type="button"
                onClick={() => setEscolhidas((l) => sel ? l.filter((x) => x !== c.id) : l.length >= 5 ? l : [...l, c.id])}
                className={cn("w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/60 text-left", sel && "bg-secondary")}>
                <AvatarConversa id={c.id} tipo={c.tipo} titulo={c.titulo} temFoto={c.temFoto} sistema={c.sistema} servicoId={c.servicoId} versao={c.atualizadoEm} className="h-9 w-9" />
                <span className="flex-1 truncate text-sm font-medium">{c.titulo}</span>
                <span className={cn("h-5 w-5 rounded-full border-2 grid place-items-center", sel ? "bg-primary border-primary text-primary-foreground" : "border-border")}>
                  {sel && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button className="rounded-full bg-primary" disabled={escolhidas.length === 0 || encaminhar.isPending}
            onClick={async () => {
              try {
                toast.success(await encaminhar.mutateAsync({ id: mensagem!.id, conversas: escolhidas }));
                onOpenChange(false);
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}>
            {encaminhar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar ({escolhidas.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "Dados da mensagem": quem já leu e quando. */
export function InfoMensagemDialog({ mensagem, onOpenChange }: { mensagem: MensagemChat | null; onOpenChange: (v: boolean) => void }) {
  const info = useInfoMensagem(mensagem?.id ?? null);
  return (
    <Dialog open={!!mensagem} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Dados da mensagem</DialogTitle>
          <DialogDescription className="line-clamp-2">{mensagem?.conteudo ?? "Anexo"} · {mensagem && horaDe(mensagem.criadoEm)}</DialogDescription>
        </DialogHeader>
        {info.isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /> : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-sky-700 font-semibold"><CheckCheck className="h-4 w-4" /> Vista por</p>
              {(info.data?.lidaPor ?? []).length === 0 ? <p className="text-muted-foreground mt-1">Ainda ninguém.</p> : (
                <ul className="mt-1 divide-y divide-border/60">
                  {info.data!.lidaPor.map((l) => (
                    <li key={l.usuarioId} className="py-1.5 flex justify-between gap-3"><span>{l.nome}</span><span className="text-muted-foreground text-xs">{rotuloDia(l.lidaEm)} {horaDe(l.lidaEm)}</span></li>
                  ))}
                </ul>
              )}
            </div>
            {(info.data?.porLer ?? []).length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold"><Check className="h-4 w-4" /> Entregue a</p>
                <p className="mt-1 text-muted-foreground">
                  {info.data!.porLer.slice(0, 12).join(", ")}{info.data!.porLer.length > 12 && ` e mais ${info.data!.porLer.length - 12}`}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function FavoritasDialog({ open, onOpenChange, conversaId, onAbrir }: {
  open: boolean; onOpenChange: (v: boolean) => void; conversaId: string | null; onAbrir: (conversaId: string, mensagemId: string) => void;
}) {
  const favoritas = useFavoritas(conversaId, open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2"><Star className="h-5 w-5 text-gold fill-gold" /> Mensagens favoritas</DialogTitle>
          <DialogDescription>{conversaId ? "Desta conversa." : "De todas as conversas."} Marque mensagens no menu de cada uma.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto -mx-2">
          {favoritas.isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            : (favoritas.data ?? []).length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Ainda não tem mensagens favoritas.</p>
            : favoritas.data!.map(({ mensagem: m, conversaTitulo }) => (
              <button key={m.id} type="button" onClick={() => { onOpenChange(false); onAbrir(m.conversaId, m.id); }}
                className="w-full text-left px-2 py-2.5 rounded-lg hover:bg-secondary/60 border-b border-border/40">
                <span className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="truncate">{m.minha ? "Você" : m.remetenteNome} ▸ {conversaTitulo}</span><span>{quando(m.criadoEm)}</span>
                </span>
                <span className="block text-sm mt-0.5 line-clamp-2">{m.conteudo ?? (m.tipo === "IMAGEM" ? "📷 Foto" : m.tipo === "AUDIO" ? "🎤 Mensagem de voz" : "📄 " + (m.anexoNome ?? "Documento"))}</span>
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
