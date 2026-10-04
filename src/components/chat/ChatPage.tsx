import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Archive, ArchiveRestore, ArrowDown, ArrowLeft, BellOff, CheckCheck, ChevronDown, Loader2, Lock, Megaphone, MessageCircle,
  MessageSquarePlus, MoreVertical, Pin, PinOff, Search, Star, Users, UsersRound, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useApagarMensagem, useComunidade, useConversa, useConversas, useFavoritar, useFixarMensagem, useGestaoGrupo,
  useMensagens, usePesquisaMensagens, usePreferencias, useReagir, type FiltroConversas,
} from "@/hooks/useChatApi";
import { useDebounce } from "@/hooks/useDebounce";
import type { ComunidadeItem, Conversa, MensagemChat } from "@/types/api";
import { AvatarConversa } from "./AvatarConversa";
import { Bolha, type AcoesBolha } from "./Bolha";
import { Compositor } from "./Compositor";
import { DetalhesPainel } from "./DetalhesPainel";
import { EncaminharDialog, FavoritasDialog, InfoMensagemDialog, NovaConversaDialog, NovoGrupoDialog } from "./Dialogos";
import { formatarTexto, horaDe, quando, rotuloDia, vistoPorUltimo } from "./util";

const FILTROS: { valor: FiltroConversas; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "nao-lidas", label: "Não lidas" },
  { valor: "grupos", label: "Grupos" },
  { valor: "arquivadas", label: "Arquivadas" },
];

function ItemConversa({ c, ativa, onClick }: { c: Conversa; ativa: boolean; onClick: () => void }) {
  const prefs = usePreferencias();
  const alterar = (p: { fixada?: boolean; arquivada?: boolean; silenciada?: boolean }, ok: string) =>
    prefs.mutateAsync({ id: c.id, ...p }).then(() => toast.success(ok)).catch((e: Error) => toast.error(e.message));
  return (
    <div className={cn("group relative border-b border-border/40 hover:bg-secondary/40", ativa && "bg-secondary/70")}>
      <button onClick={onClick} className="w-full text-left px-3 py-2.5 flex gap-3">
        <AvatarConversa id={c.id} tipo={c.tipo} titulo={c.titulo} temFoto={c.temFoto} sistema={c.sistema} servicoId={c.servicoId} versao={c.atualizadoEm} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className={cn("truncate text-sm", c.naoLidas > 0 ? "font-semibold" : "font-medium")}>{c.titulo}</span>
            <span className={cn("text-[10px] shrink-0", c.naoLidas > 0 && !c.silenciada ? "text-rose-deep font-semibold" : "text-muted-foreground")}>{quando(c.ultimaMensagemEm)}</span>
          </span>
          <span className="flex items-center justify-between gap-2 mt-0.5">
            <span className="truncate text-xs text-muted-foreground">
              {c.tipo === "GRUPO" && c.bloqueada && <Lock className="inline h-3 w-3 mr-1" />}
              {c.ultimaMensagem ?? (c.descricao ?? (c.tipo === "GRUPO" ? `${c.totalMembros} membros` : "Sem mensagens"))}
            </span>
            <span className="flex items-center gap-1 shrink-0 pr-5">
              {c.silenciada && <BellOff className="h-3.5 w-3.5 text-muted-foreground" />}
              {c.fixada && <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
              {c.naoLidas > 0 && (
                <span className={cn("min-w-[20px] h-5 px-1.5 rounded-full text-white text-[10px] font-semibold grid place-items-center", c.silenciada ? "bg-muted-foreground/60" : "bg-rose-deep")}>
                  {c.naoLidas > 99 ? "99+" : c.naoLidas}
                </span>
              )}
            </span>
          </span>
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute right-2 bottom-2.5 h-6 w-6 grid place-items-center rounded-full opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 hover:bg-card text-muted-foreground" aria-label="Opções da conversa">
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => alterar({ fixada: !c.fixada }, c.fixada ? "Conversa desafixada." : "Conversa fixada.")}>
            {c.fixada ? <><PinOff className="h-4 w-4 mr-2" /> Desafixar</> : <><Pin className="h-4 w-4 mr-2" /> Fixar conversa</>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => alterar({ silenciada: !c.silenciada }, c.silenciada ? "Notificações ativas." : "Conversa silenciada.")}>
            <BellOff className="h-4 w-4 mr-2" /> {c.silenciada ? "Ativar notificações" : "Silenciar"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => alterar({ arquivada: !c.arquivada }, c.arquivada ? "Conversa desarquivada." : "Conversa arquivada.")}>
            {c.arquivada ? <><ArchiveRestore className="h-4 w-4 mr-2" /> Desarquivar</> : <><Archive className="h-4 w-4 mr-2" /> Arquivar</>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ItemComunidade({ g, onAbrir }: { g: ComunidadeItem; onAbrir: (id: string) => void }) {
  const gestao = useGestaoGrupo(g.id);
  return (
    <div className="px-3 py-2.5 flex items-center gap-3 border-b border-border/40">
      <AvatarConversa id={g.id} tipo="GRUPO" titulo={g.titulo} temFoto={g.temFoto} sistema={g.sistema} servicoId={g.servicoId} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{g.titulo}</span>
        <span className="block truncate text-xs text-muted-foreground">{g.totalMembros} membros{g.descricao ? ` · ${g.descricao}` : ""}</span>
      </span>
      {g.membro ? (
        <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => onAbrir(g.id)}>Abrir</Button>
      ) : g.podeEntrar ? (
        <Button size="sm" className="rounded-full h-8 bg-primary" disabled={gestao.isPending}
          onClick={async () => {
            try {
              await gestao.mutateAsync({ tipo: "entrar" });
              onAbrir(g.id);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}>Entrar</Button>
      ) : (
        <span className="text-[10px] text-muted-foreground text-right w-20">Para quem fez o serviço</span>
      )}
    </div>
  );
}

/**
 * Chat ao estilo WhatsApp (sem chamadas): conversas e comunidade à esquerda, mensagens ao centro,
 * dados do grupo/contacto à direita. modo "admin": a equipa vê as conversas com o estúdio e todos os grupos.
 */
export function ChatPage({ modo }: { modo: "admin" | "cliente" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [separador, setSeparador] = useState<"conversas" | "comunidade">("conversas");
  const [filtro, setFiltro] = useState<FiltroConversas>("todas");
  const [q, setQ] = useState("");
  const busca = useDebounce(q);
  const conversas = useConversas(busca, filtro);
  const comunidade = useComunidade(separador === "comunidade");
  const conversaId = searchParams.get("conversa");
  const daLista = conversas.items.find((c) => c.id === conversaId);
  const umaConversa = useConversa(conversaId);
  const atual = umaConversa.data && umaConversa.data.id === conversaId ? umaConversa.data : daLista ?? null;

  const [painel, setPainel] = useState<null | "detalhes" | "pesquisa">(null);
  const [novaConversa, setNovaConversa] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState(false);
  const [favoritasGerais, setFavoritasGerais] = useState(false);

  const abrir = useCallback((id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("conversa", id); else next.delete("conversa");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!conversaId && conversas.items.length > 0 && window.matchMedia("(min-width: 768px)").matches) abrir(conversas.items[0].id);
  }, [conversaId, conversas.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mensagens, temMais, aCarregar, aCarregarAntigas, carregarAntigas, irPara, aplicar, remover, estado } = useMensagens(conversaId);
  const apagar = useApagarMensagem();
  const reagir = useReagir();
  const favoritar = useFavoritar();
  const fixar = useFixarMensagem();

  const [respondendo, setRespondendo] = useState<MensagemChat | null>(null);
  const [aEditar, setAEditar] = useState<MensagemChat | null>(null);
  const [imagemAberta, setImagemAberta] = useState<string | null>(null);
  const [aEncaminhar, setAEncaminhar] = useState<MensagemChat | null>(null);
  const [info, setInfo] = useState<MensagemChat | null>(null);
  const [destacada, setDestacada] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const pesquisaDebounced = useDebounce(pesquisa);
  const resultados = usePesquisaMensagens(painel === "pesquisa" ? conversaId : null, pesquisaDebounced);

  useEffect(() => {
    setRespondendo(null);
    setAEditar(null);
    setDestacada(null);
    setPesquisa("");
    setPainel((p) => (p === "pesquisa" ? null : p));
  }, [conversaId]);

  // Scroll: desce ao chegar mensagem nova (se já estava em baixo); mantém posição ao carregar antigas.
  const listaRef = useRef<HTMLDivElement>(null);
  const emBaixo = useRef(true);
  const [mostrarDescer, setMostrarDescer] = useState(false);
  const [novasEmBaixo, setNovasEmBaixo] = useState(0);
  const ultimaVista = useRef<string | null>(null);
  const alturaAntes = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = listaRef.current;
    if (!el) return;
    if (alturaAntes.current !== null) {
      el.scrollTop = el.scrollHeight - alturaAntes.current;
      alturaAntes.current = null;
    } else if (emBaixo.current && !destacada) {
      el.scrollTop = el.scrollHeight;
    }
    const ultima = mensagens[mensagens.length - 1]?.id ?? null;
    if (ultima && ultima !== ultimaVista.current && !emBaixo.current && ultimaVista.current) setNovasEmBaixo((n) => n + 1);
    ultimaVista.current = ultima;
  }, [mensagens]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { emBaixo.current = true; ultimaVista.current = null; setNovasEmBaixo(0); }, [conversaId]);
  const aoRolar = () => {
    const el = listaRef.current;
    if (!el) return;
    emBaixo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setMostrarDescer(!emBaixo.current);
    if (emBaixo.current) setNovasEmBaixo(0);
    if (el.scrollTop < 60 && temMais && !aCarregarAntigas) {
      alturaAntes.current = el.scrollHeight;
      void carregarAntigas();
    }
  };
  const descer = () => {
    const el = listaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setNovasEmBaixo(0);
  };

  /** Salta para uma mensagem (resposta, fixada, pesquisa, favorita) e destaca-a. */
  const irParaMensagem = useCallback(async (id: string) => {
    const ok = await irPara(id);
    if (!ok) return void toast.error("Não foi possível encontrar a mensagem.");
    emBaixo.current = false;
    setDestacada(id);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      listaRef.current?.querySelector(`[data-mensagem="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }));
    setTimeout(() => setDestacada((d) => (d === id ? null : d)), 2200);
  }, [irPara]);

  // Abrir uma favorita de outra conversa: espera que essa conversa carregue e salta para a mensagem.
  const [alvo, setAlvo] = useState<{ conversa: string; mensagem: string } | null>(null);
  useEffect(() => {
    if (alvo && alvo.conversa === conversaId && !aCarregar && mensagens.length > 0) {
      setAlvo(null);
      void irParaMensagem(alvo.mensagem);
    }
  }, [alvo, conversaId, aCarregar, mensagens.length, irParaMensagem]);

  const grupos = useMemo(() => {
    const porDia: { dia: string; itens: MensagemChat[] }[] = [];
    mensagens.forEach((m) => {
      const dia = rotuloDia(m.criadoEm);
      const ultimo = porDia[porDia.length - 1];
      if (ultimo?.dia === dia) ultimo.itens.push(m); else porDia.push({ dia, itens: [m] });
    });
    return porDia;
  }, [mensagens]);

  const acoes: AcoesBolha = {
    onResponder: (m) => { setAEditar(null); setRespondendo(m); },
    onEditar: (m) => { setRespondendo(null); setAEditar(m); },
    onApagar: async (m, paraTodos) => {
      try {
        await apagar.mutateAsync({ id: m.id, paraTodos });
        remover(m.id, paraTodos);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    onReagir: async (m, emoji) => {
      try { aplicar(await reagir.mutateAsync({ id: m.id, emoji })); } catch (e) { toast.error((e as Error).message); }
    },
    onFavorita: async (m) => {
      try {
        aplicar(await favoritar.mutateAsync({ id: m.id, favorita: !m.favorita }));
        toast.success(m.favorita ? "Retirada das favoritas." : "Marcada como favorita.");
      } catch (e) { toast.error((e as Error).message); }
    },
    onEncaminhar: setAEncaminhar,
    onFixar: async (m) => {
      if (!atual) return;
      try { await fixar.mutateAsync({ conversaId: atual.id, mensagemId: m.id }); toast.success("Mensagem fixada."); void umaConversa.refetch(); }
      catch (e) { toast.error((e as Error).message); }
    },
    onInfo: setInfo,
    onIrPara: (id) => void irParaMensagem(id),
    onAbrirImagem: setImagemAberta,
    onCopiar: async (m) => {
      try { await navigator.clipboard.writeText(m.conteudo ?? ""); toast.success("Copiada."); } catch { toast.error("Não foi possível copiar."); }
    },
  };

  const grupo = atual?.tipo === "GRUPO";
  const bloqueado = !!atual && grupo && atual.bloqueada && !atual.souAdmin;
  const podeFixar = !!atual && (!grupo || atual.souAdmin);
  const naoMembro = !!atual && grupo && !atual.membro && modo === "cliente";

  const subtitulo = !atual ? "" : estado.aEscrever.length > 0
    ? `${grupo ? estado.aEscrever.slice(0, 2).join(", ") + " " : ""}a escrever…`
    : grupo
      ? atual.sistema === "AVISOS" ? "Avisos da comunidade · só a equipa escreve"
        : `${atual.totalMembros} membros${atual.bloqueada ? " · só administradoras escrevem" : ""} · toque para ver os dados`
      : estado.online ? "online"
        : estado.vistoEm ? vistoPorUltimo(estado.vistoEm)
        : atual.tipo === "PRIVADA" ? (modo === "admin" ? "Conversa com a cliente" : "Equipa do estúdio") : "toque para ver os dados";

  return (
    <div className="h-[calc(100vh-180px)] min-h-[520px] rounded-2xl border border-border/60 bg-card overflow-hidden flex">
      {/* Lista de conversas / comunidade */}
      <aside className={cn("w-full md:w-[340px] md:border-r border-border/60 flex flex-col min-h-0", conversaId && "hidden md:flex")}>
        <div className="px-3 pt-3 pb-2 border-b border-border/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex rounded-full bg-secondary p-0.5 text-sm">
              <button onClick={() => setSeparador("conversas")} className={cn("px-3 py-1 rounded-full flex items-center gap-1.5", separador === "conversas" && "bg-card shadow-sm font-medium")}>
                <MessageCircle className="h-4 w-4" /> Conversas
              </button>
              <button onClick={() => setSeparador("comunidade")} className={cn("px-3 py-1 rounded-full flex items-center gap-1.5", separador === "comunidade" && "bg-card shadow-sm font-medium")}>
                <UsersRound className="h-4 w-4" /> Comunidade
              </button>
            </div>
            <div className="flex">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setNovaConversa(true)} aria-label="Nova conversa" title="Nova conversa">
                <MessageSquarePlus className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Mais opções"><MoreVertical className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setNovoGrupo(true)}><Users className="h-4 w-4 mr-2" /> Novo grupo</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFavoritasGerais(true)}><Star className="h-4 w-4 mr-2" /> Mensagens favoritas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSeparador("conversas"); setFiltro("arquivadas"); }}><Archive className="h-4 w-4 mr-2" /> Arquivadas</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {separador === "conversas" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Pesquisar conversa" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9 rounded-full bg-secondary/50 border-transparent" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {FILTROS.map((f) => (
                  <button key={f.valor} onClick={() => setFiltro(f.valor)}
                    className={cn("text-xs px-3 py-1 rounded-full whitespace-nowrap", filtro === f.valor ? "bg-primary/15 text-primary font-medium" : "bg-secondary text-muted-foreground")}>
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {separador === "conversas" ? (
          <div className="flex-1 overflow-y-auto" onScroll={(e) => {
            const el = e.currentTarget;
            if (conversas.hasMore && !conversas.isLoadingMore && el.scrollTop + el.clientHeight >= el.scrollHeight - 60) conversas.loadMore();
          }}>
            {conversas.isLoading ? (
              <div className="py-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : conversas.items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {filtro === "arquivadas" ? "Sem conversas arquivadas." : filtro === "nao-lidas" ? "Está tudo lido. ✨" : "Sem conversas."}
              </p>
            ) : conversas.items.map((c) => <ItemConversa key={c.id} c={c} ativa={c.id === conversaId} onClick={() => abrir(c.id)} />)}
            {conversas.isLoadingMore && <div className="py-3 grid place-items-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 flex items-center gap-3 bg-gradient-to-br from-primary/10 to-secondary">
              <span className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center"><UsersRound className="h-6 w-6" /></span>
              <span>
                <span className="block font-display text-xl leading-tight">Comunidade Chuanga Studio</span>
                <span className="block text-xs text-muted-foreground">Avisos, conversa geral e um grupo por serviço. Entra sozinha nos grupos dos serviços que marca.</span>
              </span>
            </div>
            {comunidade.isLoading ? (
              <div className="py-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {(comunidade.data ?? []).filter((g) => g.sistema).map((g) => <ItemComunidade key={g.id} g={g} onAbrir={(id) => { setSeparador("conversas"); abrir(id); }} />)}
                <p className="px-3 pt-4 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Grupos dos serviços e outros</p>
                {(comunidade.data ?? []).filter((g) => !g.sistema).map((g) => <ItemComunidade key={g.id} g={g} onAbrir={(id) => { setSeparador("conversas"); abrir(id); }} />)}
              </>
            )}
          </div>
        )}
      </aside>

      {/* Conversa */}
      <section className={cn("flex-1 flex flex-col min-w-0", (!conversaId || painel) && "hidden md:flex", painel && "lg:flex")}>
        {!atual ? (
          <div className="flex-1 grid place-items-center text-center text-muted-foreground p-6 bg-secondary/20">
            <div>
              {conversaId && umaConversa.isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
                <>
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-rose-deep/60" />
                  <p className="font-display text-3xl text-foreground">Chuanga Studio Chat</p>
                  <p className="text-sm mt-2 max-w-sm">Fale com a equipa, com outras clientes e nos grupos dos seus serviços. As mensagens ficam guardadas no seu perfil.</p>
                  <Button className="rounded-full mt-5 bg-primary" onClick={() => setNovaConversa(true)}><MessageSquarePlus className="h-4 w-4 mr-2" /> Nova conversa</Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <header className="px-3 h-14 border-b border-border/60 flex items-center gap-2 shrink-0 bg-card">
              <button className="md:hidden h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" onClick={() => abrir(null)} aria-label="Voltar às conversas">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => setPainel((p) => (p === "detalhes" ? null : "detalhes"))}>
                <AvatarConversa id={atual.id} tipo={atual.tipo} titulo={atual.titulo} temFoto={atual.temFoto} sistema={atual.sistema}
                  servicoId={atual.servicoId} versao={atual.atualizadoEm} online={!grupo && estado.online} className="h-10 w-10" />
                <span className="min-w-0">
                  <span className="block font-medium truncate">{atual.titulo}</span>
                  <span className={cn("block text-[11px] truncate", estado.aEscrever.length || estado.online ? "text-emerald-600" : "text-muted-foreground")}>{subtitulo}</span>
                </span>
              </button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setPainel((p) => (p === "pesquisa" ? null : "pesquisa"))} aria-label="Pesquisar na conversa">
                <Search className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Opções"><MoreVertical className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPainel("detalhes")}>{grupo ? "Dados do grupo" : "Dados do contacto"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPainel("pesquisa")}>Pesquisar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setPainel(null); abrir(null); }}>Fechar conversa</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>

            {atual.mensagemFixadaId && (
              <div className="px-4 py-2 border-b border-border/60 bg-card flex items-center gap-3 text-sm shrink-0">
                <Pin className="h-4 w-4 text-rose-deep shrink-0" />
                <button className="flex-1 min-w-0 text-left truncate" onClick={() => void irParaMensagem(atual.mensagemFixadaId!)}>{atual.mensagemFixadaPreview}</button>
                {podeFixar && (
                  <button aria-label="Desafixar" onClick={() => fixar.mutateAsync({ conversaId: atual.id, mensagemId: null }).then(() => umaConversa.refetch()).catch((e: Error) => toast.error(e.message))}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}

            <div className="relative flex-1 min-h-0">
              <div ref={listaRef} onScroll={aoRolar}
                className="absolute inset-0 overflow-y-auto px-3 md:px-6 py-3 bg-secondary/30 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border)/0.5)_1px,transparent_0)] [background-size:18px_18px]">
                {aCarregarAntigas && <div className="text-center py-2"><Loader2 className="inline h-4 w-4 animate-spin text-muted-foreground" /></div>}
                {atual.sistema === "AVISOS" && !temMais && !aCarregar && (
                  <div className="mx-auto my-3 max-w-sm text-center text-xs rounded-lg bg-gold/15 text-foreground px-3 py-2 flex items-center gap-2 justify-center">
                    <Megaphone className="h-4 w-4" /> Aqui a equipa partilha novidades, promoções e horários.
                  </div>
                )}
                {aCarregar ? (
                  <div className="py-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : mensagens.length === 0 ? (
                  <div className="py-10 text-center">
                    <span className="inline-block text-xs px-3 py-2 rounded-lg bg-card border border-border/60 text-muted-foreground">
                      <Lock className="inline h-3 w-3 mr-1" />{grupo ? "Seja a primeira a dizer olá ao grupo. 👋" : "Escreva a primeira mensagem."}
                    </span>
                  </div>
                ) : grupos.map((g) => (
                  <div key={g.dia} className="pb-3">
                    <div className="flex justify-center my-2 sticky top-0 z-10">
                      <span className="text-[11px] px-3 py-1 rounded-lg bg-card shadow-sm border border-border/60 text-muted-foreground">{g.dia}</span>
                    </div>
                    {g.itens.map((m, i) => {
                      const anterior = g.itens[i - 1];
                      const consecutiva = !!anterior && anterior.tipo !== "SISTEMA" && m.tipo !== "SISTEMA" && anterior.remetenteId === m.remetenteId
                        && new Date(m.criadoEm).getTime() - new Date(anterior.criadoEm).getTime() < 5 * 60_000 && anterior.reacoes.length === 0;
                      return (
                        <Bolha key={m.id} m={m} grupo={!!grupo} podeFixar={podeFixar} lidaPorTodosAte={estado.lidaPorTodosAte}
                          destacada={destacada === m.id} consecutiva={consecutiva} acoes={acoes} />
                      );
                    })}
                  </div>
                ))}
                {estado.aEscrever.length > 0 && (
                  <div className="flex mt-2">
                    <span className="rounded-2xl bg-card border border-border/60 px-3 py-2 text-xs text-muted-foreground flex items-center gap-1">
                      <span className="flex gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" /><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" /></span>
                      {grupo && <span className="ml-1">{estado.aEscrever[0]}</span>}
                    </span>
                  </div>
                )}
              </div>
              {mostrarDescer && (
                <button onClick={descer} aria-label="Ir para o fim"
                  className="absolute right-4 bottom-4 h-10 w-10 rounded-full bg-card shadow-md border border-border/60 grid place-items-center">
                  <ArrowDown className="h-4 w-4" />
                  {novasEmBaixo > 0 && <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-deep text-white text-[10px] grid place-items-center">{novasEmBaixo}</span>}
                </button>
              )}
            </div>

            {naoMembro ? (
              <footer className="p-3 border-t border-border/60 text-center text-sm text-muted-foreground bg-card">Já não faz parte deste grupo.</footer>
            ) : (
              <Compositor conversaId={atual.id} bloqueado={bloqueado} respondendo={respondendo} aEditar={aEditar}
                onCancelar={() => { setRespondendo(null); setAEditar(null); }}
                onEnviada={(m) => { emBaixo.current = true; aplicar(m); }} />
            )}
          </>
        )}
      </section>

      {/* Painel à direita: dados ou pesquisa */}
      {atual && painel === "detalhes" && (
        <DetalhesPainel conversaId={atual.id} modo={modo} onFechar={() => setPainel(null)}
          onAbrirConversa={(id) => { setPainel(null); abrir(id); }}
          onIrPara={(id) => { if (window.innerWidth < 1024) setPainel(null); void irParaMensagem(id); }}
          onAbrirImagem={setImagemAberta}
          onSaiu={() => { setPainel(null); abrir(null); }} />
      )}
      {atual && painel === "pesquisa" && (
        <aside className="w-full md:w-[340px] border-l border-border/60 flex flex-col min-h-0 bg-card">
          <header className="h-14 px-3 flex items-center gap-2 border-b border-border/60 shrink-0">
            <button onClick={() => setPainel(null)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" aria-label="Fechar"><X className="h-4 w-4" /></button>
            <span className="font-medium">Pesquisar mensagens</span>
          </header>
          <div className="p-3">
            <Input autoFocus placeholder="Pesquisar..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} className="h-9" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {pesquisa.trim().length < 2 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Pesquise mensagens em "{atual.titulo}".</p>
            ) : resultados.isLoading ? (
              <div className="py-8 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (resultados.data?.content ?? []).length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma mensagem encontrada.</p>
            ) : resultados.data!.content.map((m) => (
              <button key={m.id} onClick={() => { if (window.innerWidth < 1024) setPainel(null); void irParaMensagem(m.id); }}
                className="w-full text-left px-4 py-2.5 border-b border-border/40 hover:bg-secondary/40">
                <span className="flex justify-between text-[11px] text-muted-foreground"><span>{m.minha ? "Você" : m.remetenteNome}</span><span>{quando(m.criadoEm)} {horaDe(m.criadoEm)}</span></span>
                <span className="block text-sm line-clamp-2 mt-0.5">
                  {m.minha && <CheckCheck className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />}{formatarTexto(m.conteudo ?? "", false)}
                </span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <NovaConversaDialog open={novaConversa} onOpenChange={setNovaConversa} onAberta={(id) => { setSeparador("conversas"); setFiltro("todas"); abrir(id); }}
        onNovoGrupo={() => setNovoGrupo(true)} />
      <NovoGrupoDialog open={novoGrupo} onOpenChange={setNovoGrupo} equipa={modo === "admin"} onCriado={(id) => { setSeparador("conversas"); setFiltro("todas"); abrir(id); }} />
      <EncaminharDialog mensagem={aEncaminhar} onOpenChange={(v) => !v && setAEncaminhar(null)} />
      <InfoMensagemDialog mensagem={info} onOpenChange={(v) => !v && setInfo(null)} />
      <FavoritasDialog open={favoritasGerais} onOpenChange={setFavoritasGerais} conversaId={null}
        onAbrir={(cid, mid) => { setSeparador("conversas"); setAlvo({ conversa: cid, mensagem: mid }); abrir(cid); }} />

      <Dialog open={!!imagemAberta} onOpenChange={(v) => !v && setImagemAberta(null)}>
        <DialogContent className="max-w-4xl p-0 bg-midnight border-none overflow-hidden">
          <DialogTitle className="sr-only">Foto</DialogTitle>
          <DialogDescription className="sr-only">Foto enviada na conversa</DialogDescription>
          {imagemAberta && <img src={imagemAberta} alt="" className="w-full max-h-[85vh] object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
