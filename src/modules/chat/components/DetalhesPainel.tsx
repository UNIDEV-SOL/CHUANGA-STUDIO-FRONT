import { useEffect, useRef, useState } from "react";
import {
  Archive, ArchiveRestore, BellOff, Camera, Check, ChevronRight, FileText, Loader2, LogOut, Mail, MessageCircle, MoreVertical,
  Pencil, Phone, Pin, PinOff, Shield, ShieldOff, Star, Trash2, UserMinus, UserPlus, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { formatDate, initials } from "@/shared/lib/format";
import { redimensionar } from "@/shared/lib/imagem";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  descarregarAnexo, useAbrirConversaCom, useAnexoMensagem, useDetalhesConversa, useGestaoGrupo, useMidia, usePreferencias,
} from "@/modules/chat/hooks/useChatApi";
import type { MensagemChat } from "@/modules/chat/models";
import { AvatarConversa } from "@/modules/chat/components/AvatarConversa";
import { AdicionarMembrosDialog, FavoritasDialog } from "@/modules/chat/components/Dialogos";
import { quando, tamanho, vistoPorUltimo } from "@/modules/chat/components/util";

function Miniatura({ m, onAbrir }: { m: MensagemChat; onAbrir: (url: string) => void }) {
  const img = useAnexoMensagem(m.id, true);
  return (
    <button type="button" onClick={() => img.data && onAbrir(img.data)} className="aspect-square rounded-md overflow-hidden bg-secondary">
      {img.data ? <img src={img.data} alt="" className="h-full w-full object-cover" /> : <Loader2 className="h-4 w-4 m-auto animate-spin text-muted-foreground" />}
    </button>
  );
}

function Seccao({ titulo, children, className }: { titulo?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("bg-card px-5 py-4", className)}>
      {titulo && <p className="text-xs text-muted-foreground mb-2">{titulo}</p>}
      {children}
    </section>
  );
}

export function DetalhesPainel({ conversaId, modo, onFechar, onAbrirConversa, onIrPara, onAbrirImagem, onSaiu }: {
  conversaId: string;
  modo: "admin" | "cliente";
  onFechar: () => void;
  onAbrirConversa: (id: string) => void;
  onIrPara: (mensagemId: string) => void;
  onAbrirImagem: (url: string) => void;
  onSaiu: () => void;
}) {
  const q = useDetalhesConversa(conversaId, true);
  const gestao = useGestaoGrupo(conversaId);
  const prefs = usePreferencias();
  const abrirCom = useAbrirConversaCom();
  const [separador, setSeparador] = useState<"IMAGEM" | "DOCUMENTO">("IMAGEM");
  const midia = useMidia(conversaId, separador, true);
  const [editarNome, setEditarNome] = useState(false);
  const [editarDesc, setEditarDesc] = useState(false);
  const [nome, setNome] = useState("");
  const [desc, setDesc] = useState("");
  const [adicionar, setAdicionar] = useState(false);
  const [favoritas, setFavoritas] = useState(false);
  const [confirmar, setConfirmar] = useState<null | "sair" | "apagar">(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  const c = q.data?.conversa;
  const d = q.data?.detalhes;
  useEffect(() => {
    if (!c) return;
    setNome(c.titulo);
    setDesc(c.descricao ?? "");
  }, [c?.titulo, c?.descricao]); // eslint-disable-line react-hooks/exhaustive-deps

  async function executar(p: Promise<string | void>, ok?: string) {
    try {
      const r = await p;
      toast.success(ok ?? (typeof r === "string" ? r : "Feito."));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (!c || !d) {
    return (
      <aside className="w-full md:w-[360px] border-l border-border/60 bg-secondary/30 grid place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </aside>
    );
  }

  const grupo = c.tipo === "GRUPO";
  const membrosIds = d.membros.map((m) => m.usuarioId);

  return (
    <aside className="w-full md:w-[360px] border-l border-border/60 bg-secondary/40 flex flex-col min-h-0">
      <header className="h-14 px-4 flex items-center gap-3 bg-card border-b border-border/60 shrink-0">
        <button onClick={onFechar} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" aria-label="Fechar"><X className="h-4 w-4" /></button>
        <span className="font-medium">{grupo ? "Dados do grupo" : "Dados do contacto"}</span>
      </header>

      <div className="flex-1 overflow-y-auto space-y-2">
        <Seccao className="text-center py-6">
          <div className="relative inline-block">
            <AvatarConversa id={c.id} tipo={c.tipo} titulo={c.titulo} temFoto={c.temFoto} sistema={c.sistema} servicoId={c.servicoId}
              versao={c.atualizadoEm} className="h-28 w-28 text-2xl" online={!grupo && d.contacto?.online} />
            {d.podeEditarInfo && (
              <>
                <button onClick={() => fotoRef.current?.click()} aria-label="Mudar foto do grupo"
                  className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow">
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={fotoRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  const { blob } = await redimensionar(f, 640, 0.85);
                  await executar(gestao.mutateAsync({ tipo: "foto", imagem: blob }));
                }} />
              </>
            )}
          </div>
          {editarNome ? (
            <div className="flex gap-2 mt-3">
              <Input value={nome} maxLength={120} onChange={(e) => setNome(e.target.value)} className="h-9" autoFocus />
              <Button size="icon" className="h-9 w-9 shrink-0" disabled={!nome.trim()}
                onClick={async () => { await executar(gestao.mutateAsync({ tipo: "atualizar", dados: { titulo: nome.trim() } })); setEditarNome(false); }}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h3 className="font-display text-2xl mt-3 flex items-center justify-center gap-2">
              {c.titulo}
              {d.podeEditarInfo && <button onClick={() => setEditarNome(true)} aria-label="Mudar nome"><Pencil className="h-4 w-4 text-muted-foreground" /></button>}
            </h3>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {grupo
              ? `Grupo · ${c.totalMembros} ${c.totalMembros === 1 ? "membro" : "membros"}`
              : d.contacto?.online ? "online" : d.contacto?.vistoEm ? vistoPorUltimo(d.contacto.vistoEm) : d.contacto?.equipa ? "Equipa do estúdio" : ""}
          </p>
          {c.sistema === "AVISOS" && <p className="text-xs text-rose-deep mt-1">Grupo de avisos da comunidade</p>}
          {c.servicoId && <p className="text-xs text-rose-deep mt-1">Grupo do serviço · entra quem o marca</p>}
        </Seccao>

        {grupo && (
          <Seccao titulo="Descrição">
            {editarDesc ? (
              <div className="space-y-2">
                <Textarea rows={3} maxLength={500} value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditarDesc(false)}>Cancelar</Button>
                  <Button size="sm" onClick={async () => { await executar(gestao.mutateAsync({ tipo: "atualizar", dados: { descricao: desc } })); setEditarDesc(false); }}>Guardar</Button>
                </div>
              </div>
            ) : (
              <button className="w-full text-left text-sm whitespace-pre-wrap flex gap-2" disabled={!d.podeEditarInfo} onClick={() => setEditarDesc(true)}>
                <span className="flex-1">{c.descricao || (d.podeEditarInfo ? <span className="text-primary">Adicionar descrição</span> : <span className="text-muted-foreground">Sem descrição</span>)}</span>
                {d.podeEditarInfo && c.descricao && <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>
            )}
            <p className="text-[11px] text-muted-foreground mt-3">Criado a {formatDate(c.criadoEm)}</p>
          </Seccao>
        )}

        {!grupo && d.contacto && (
          <Seccao titulo="Contacto">
            <ul className="space-y-2 text-sm">
              {d.contacto.telefone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <a href={`tel:${d.contacto.telefone}`} className="hover:underline">{d.contacto.telefone}</a></li>}
              {d.contacto.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <a href={`mailto:${d.contacto.email}`} className="hover:underline truncate">{d.contacto.email}</a></li>}
              {d.contacto.clienteDesde && <li className="text-muted-foreground text-xs">Cliente desde {formatDate(d.contacto.clienteDesde)}</li>}
              {d.contacto.visitas != null && <li className="text-muted-foreground text-xs">{d.contacto.visitas} {d.contacto.visitas === 1 ? "visita concluída" : "visitas concluídas"}</li>}
              {!d.contacto.telefone && !d.contacto.email && <li className="text-muted-foreground text-xs">{d.contacto.equipa ? "A equipa responde por aqui no horário do estúdio." : "Cliente do Chuanga Studio."}</li>}
            </ul>
          </Seccao>
        )}

        <Seccao>
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1 text-xs">
              {(["IMAGEM", "DOCUMENTO"] as const).map((t) => (
                <button key={t} onClick={() => setSeparador(t)}
                  className={cn("px-2.5 py-1 rounded-full", separador === t ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                  {t === "IMAGEM" ? `Fotos (${d.totalFotos})` : `Documentos e voz (${d.totalDocumentos})`}
                </button>
              ))}
            </div>
          </div>
          {midia.isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
            : (midia.data?.content ?? []).length === 0 ? <p className="text-xs text-muted-foreground py-2">Nada partilhado ainda.</p>
            : separador === "IMAGEM" ? (
              <div className="grid grid-cols-3 gap-1">{midia.data!.content.slice(0, 12).map((m) => <Miniatura key={m.id} m={m} onAbrir={onAbrirImagem} />)}</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {midia.data!.content.slice(0, 15).map((m) => (
                  <li key={m.id}>
                    <button className="w-full flex items-center gap-2 py-2 text-left text-sm" onClick={() => void descarregarAnexo(m)}>
                      <FileText className="h-4 w-4 text-rose-deep shrink-0" />
                      <span className="flex-1 truncate">{m.tipo === "AUDIO" ? "🎤 Mensagem de voz" : m.anexoNome}</span>
                      <span className="text-[10px] text-muted-foreground">{tamanho(m.anexoTamanho)} · {quando(m.criadoEm)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          <button onClick={() => setFavoritas(true)} className="mt-3 w-full flex items-center gap-3 text-sm py-1.5">
            <Star className="h-4 w-4 text-muted-foreground" /> <span className="flex-1 text-left">Mensagens favoritas</span> <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          {c.mensagemFixadaId && (
            <button onClick={() => onIrPara(c.mensagemFixadaId!)} className="w-full flex items-center gap-3 text-sm py-1.5">
              <Pin className="h-4 w-4 text-muted-foreground" /> <span className="flex-1 text-left truncate">{c.mensagemFixadaPreview}</span>
            </button>
          )}
        </Seccao>

        <Seccao>
          <label className="flex items-center gap-3 text-sm py-1.5 cursor-pointer">
            <BellOff className="h-4 w-4 text-muted-foreground" /> <span className="flex-1">Silenciar notificações</span>
            <Switch checked={c.silenciada} onCheckedChange={(v) => void executar(prefs.mutateAsync({ id: c.id, silenciada: v }), v ? "Conversa silenciada." : "Notificações ativas.")} />
          </label>
          <button className="w-full flex items-center gap-3 text-sm py-1.5" onClick={() => void executar(prefs.mutateAsync({ id: c.id, fixada: !c.fixada }), c.fixada ? "Conversa desafixada." : "Conversa fixada no topo.")}>
            {c.fixada ? <PinOff className="h-4 w-4 text-muted-foreground" /> : <Pin className="h-4 w-4 text-muted-foreground" />}
            <span className="flex-1 text-left">{c.fixada ? "Desafixar conversa" : "Fixar conversa no topo"}</span>
          </button>
          <button className="w-full flex items-center gap-3 text-sm py-1.5" onClick={() => void executar(prefs.mutateAsync({ id: c.id, arquivada: !c.arquivada }), c.arquivada ? "Conversa desarquivada." : "Conversa arquivada.")}>
            {c.arquivada ? <ArchiveRestore className="h-4 w-4 text-muted-foreground" /> : <Archive className="h-4 w-4 text-muted-foreground" />}
            <span className="flex-1 text-left">{c.arquivada ? "Desarquivar" : "Arquivar conversa"}</span>
          </button>
        </Seccao>

        {grupo && c.souAdmin && (
          <Seccao titulo="Definições do grupo">
            <label className="flex items-center justify-between gap-3 text-sm py-1.5 cursor-pointer">
              <span>Só as administradoras enviam mensagens</span>
              <Switch checked={c.bloqueada} onCheckedChange={(v) => void executar(gestao.mutateAsync({ tipo: "atualizar", dados: { bloqueada: v } }))} />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm py-1.5 cursor-pointer">
              <span>Só as administradoras mudam nome, foto e descrição</span>
              <Switch checked={c.soAdminsEditam} onCheckedChange={(v) => void executar(gestao.mutateAsync({ tipo: "atualizar", dados: { soAdminsEditam: v } }))} />
            </label>
            {modo === "admin" && !c.sistema && (
              <>
                <label className="flex items-center justify-between gap-3 text-sm py-1.5 cursor-pointer">
                  <span>Mostrar na comunidade</span>
                  <Switch checked={c.comunidade} onCheckedChange={(v) => void executar(gestao.mutateAsync({ tipo: "atualizar", dados: { comunidade: v } }))} />
                </label>
                {c.comunidade && (
                  <label className="flex items-center justify-between gap-3 text-sm py-1.5 cursor-pointer">
                    <span>Qualquer cliente pode entrar</span>
                    <Switch checked={c.aberto} onCheckedChange={(v) => void executar(gestao.mutateAsync({ tipo: "atualizar", dados: { aberto: v } }))} />
                  </label>
                )}
              </>
            )}
          </Seccao>
        )}

        {grupo && (
          <Seccao titulo={`${c.totalMembros} ${c.totalMembros === 1 ? "membro" : "membros"}`}>
            {c.souAdmin && (
              <button onClick={() => setAdicionar(true)} className="w-full flex items-center gap-3 py-2 text-sm text-left">
                <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center"><UserPlus className="h-4 w-4" /></span> Adicionar pessoas
              </button>
            )}
            <ul>
              {d.membros.map((m) => (
                <li key={m.usuarioId} className="flex items-center gap-3 py-2">
                  <span className="relative">
                    <Avatar className="h-9 w-9"><AvatarFallback className={cn("text-xs", m.equipa ? "bg-primary text-primary-foreground" : "bg-accent/30 text-primary")}>{initials(m.nome)}</AvatarFallback></Avatar>
                    {m.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-sm">{m.eu ? "Você" : m.nome}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">
                      {m.equipa ? "Equipa do estúdio" : m.online ? "online" : m.telefone ?? (m.vistoEm ? vistoPorUltimo(m.vistoEm) : "")}
                    </span>
                  </span>
                  {m.admin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">Admin</span>}
                  {!m.eu && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-7 w-7 grid place-items-center rounded-full hover:bg-secondary" aria-label={`Opções para ${m.nome}`}><MoreVertical className="h-4 w-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={async () => {
                          try { onAbrirConversa(await abrirCom.mutateAsync(m.usuarioId)); } catch (e) { toast.error((e as Error).message); }
                        }}><MessageCircle className="h-4 w-4 mr-2" /> Enviar mensagem</DropdownMenuItem>
                        {c.souAdmin && !m.equipa && (
                          <DropdownMenuItem onClick={() => void executar(gestao.mutateAsync({ tipo: "admin", usuarioId: m.usuarioId, admin: !m.admin }))}>
                            {m.admin ? <><ShieldOff className="h-4 w-4 mr-2" /> Retirar administradora</> : <><Shield className="h-4 w-4 mr-2" /> Tornar administradora</>}
                          </DropdownMenuItem>
                        )}
                        {c.souAdmin && (!m.equipa || modo === "admin") && (
                          <DropdownMenuItem className="text-destructive focus:text-destructive"
                            onClick={() => void executar(gestao.mutateAsync({ tipo: "remover", usuarioId: m.usuarioId }))}>
                            <UserMinus className="h-4 w-4 mr-2" /> Remover do grupo
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              ))}
            </ul>
          </Seccao>
        )}

        {!grupo && d.gruposEmComum.length > 0 && (
          <Seccao titulo={modo === "admin" ? "Grupos" : "Grupos em comum"}>
            <ul>
              {d.gruposEmComum.map((g) => (
                <li key={g.id}>
                  <button onClick={() => onAbrirConversa(g.id)} className="w-full flex items-center gap-3 py-1.5 text-sm text-left">
                    <AvatarConversa id={g.id} tipo="GRUPO" titulo={g.titulo} className="h-8 w-8" /> <span className="truncate">{g.titulo}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Seccao>
        )}

        {(d.podeSair || d.podeApagar) && (
          <Seccao className="space-y-1">
            {d.podeSair && (
              <button onClick={() => setConfirmar("sair")} className="w-full flex items-center gap-3 text-sm py-1.5 text-destructive">
                <LogOut className="h-4 w-4" /> {grupo ? "Sair do grupo" : "Apagar conversa"}
              </button>
            )}
            {d.podeApagar && (
              <button onClick={() => setConfirmar("apagar")} className="w-full flex items-center gap-3 text-sm py-1.5 text-destructive">
                <Trash2 className="h-4 w-4" /> Apagar grupo para todas
              </button>
            )}
          </Seccao>
        )}
      </div>

      <AdicionarMembrosDialog grupoId={c.id} open={adicionar} onOpenChange={setAdicionar} jaMembros={membrosIds} />
      <FavoritasDialog open={favoritas} onOpenChange={setFavoritas} conversaId={c.id} onAbrir={(_, mid) => onIrPara(mid)} />
      <AlertDialog open={!!confirmar} onOpenChange={(v) => !v && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmar === "apagar" ? `Apagar o grupo "${c.titulo}"?` : grupo ? `Sair do grupo "${c.titulo}"?` : "Apagar esta conversa?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmar === "apagar" ? "O grupo desaparece para todas as pessoas." : grupo
                ? "Deixa de receber mensagens deste grupo. Pode voltar a entrar pela comunidade (se o grupo for aberto) ou se alguém a adicionar."
                : "A conversa sai da sua lista. Se voltar a escrever, ela reaparece."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                await executar(gestao.mutateAsync({ tipo: confirmar === "apagar" ? "apagar" : "sair" }));
                setConfirmar(null);
                onSaiu();
              }}>
              {confirmar === "apagar" ? "Apagar" : grupo ? "Sair" : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
