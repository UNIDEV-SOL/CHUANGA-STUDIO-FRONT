import { useEffect, useState } from "react";
import {
  Ban, Check, CheckCheck, ChevronDown, Copy, Download, FileText, Forward, Info, Loader2, Pause, Pencil, Pin, Play,
  Reply, SmilePlus, Star, StarOff, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseDate } from "@/lib/format";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { descarregarAnexo, useAnexoMensagem } from "@/hooks/useChatApi";
import type { MensagemChat } from "@/types/api";
import { EMOJIS_REACAO, corDe, duracao, formatarTexto, horaDe, tamanho } from "./util";

/** Fica verdadeiro até ao instante indicado e desliga-se sozinho. */
function useAte(ate: string | null) {
  const [ativo, setAtivo] = useState(() => !!ate && (parseDate(ate)?.getTime() ?? 0) > Date.now());
  useEffect(() => {
    if (!ate) return setAtivo(false);
    const resto = (parseDate(ate)?.getTime() ?? 0) - Date.now();
    if (resto <= 0) return setAtivo(false);
    setAtivo(true);
    const t = setTimeout(() => setAtivo(false), Math.min(resto, 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [ate]);
  return ativo;
}

function Imagem({ m, onAbrir }: { m: MensagemChat; onAbrir: (url: string) => void }) {
  const img = useAnexoMensagem(m.id, m.temAnexo);
  if (!img.data) return <div className="h-48 w-60 rounded-lg bg-black/10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin opacity-60" /></div>;
  return (
    <button type="button" onClick={() => onAbrir(img.data!)} className="block">
      <img src={img.data} alt="Foto enviada" className="max-h-72 max-w-[280px] rounded-lg object-cover" />
    </button>
  );
}

function Audio({ m, clara }: { m: MensagemChat; clara: boolean }) {
  const [carregar, setCarregar] = useState(false);
  const audio = useAnexoMensagem(m.id, carregar);
  const [el, setEl] = useState<HTMLAudioElement | null>(null);
  const [aTocar, setATocar] = useState(false);
  const [pos, setPos] = useState(0);
  useEffect(() => {
    if (audio.data && carregar && el && !aTocar) void el.play();
  }, [audio.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = m.duracaoSegundos ?? (el?.duration && Number.isFinite(el.duration) ? el.duration : 0);
  return (
    <div className="flex items-center gap-3 min-w-[220px] py-1">
      <button type="button" aria-label={aTocar ? "Pausar" : "Ouvir"}
        className={cn("h-10 w-10 rounded-full grid place-items-center shrink-0", clara ? "bg-white/20" : "bg-primary text-primary-foreground")}
        onClick={() => { if (!audio.data) setCarregar(true); else if (el?.paused) void el.play(); else el?.pause(); }}>
        {carregar && !audio.data ? <Loader2 className="h-4 w-4 animate-spin" /> : aTocar ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className={cn("h-1.5 rounded-full overflow-hidden", clara ? "bg-white/30" : "bg-border")}>
          <div className={cn("h-full", clara ? "bg-white" : "bg-primary")} style={{ width: `${total ? Math.min(100, (pos / total) * 100) : 0}%` }} />
        </div>
        <p className="text-[10px] mt-1 opacity-75">🎤 {duracao(aTocar || pos ? pos : total)}</p>
      </div>
      {audio.data && (
        <audio ref={setEl} src={audio.data} onPlay={() => setATocar(true)} onPause={() => setATocar(false)}
          onEnded={() => { setATocar(false); setPos(0); }} onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)} hidden />
      )}
    </div>
  );
}

function Documento({ m, clara }: { m: MensagemChat; clara: boolean }) {
  const [aBaixar, setABaixar] = useState(false);
  const ext = (m.anexoNome ?? "").split(".").pop()?.toUpperCase().slice(0, 4) ?? "";
  return (
    <button type="button" disabled={aBaixar}
      onClick={async () => { setABaixar(true); try { await descarregarAnexo(m); } finally { setABaixar(false); } }}
      className={cn("flex items-center gap-3 rounded-lg p-2.5 min-w-[220px] max-w-[280px] text-left", clara ? "bg-white/15" : "bg-secondary/70")}>
      <span className={cn("h-10 w-10 rounded-lg grid place-items-center shrink-0", clara ? "bg-white/20" : "bg-rose-deep/10 text-rose-deep")}>
        <FileText className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{m.anexoNome ?? "Documento"}</span>
        <span className="block text-[10px] opacity-75">{[ext, tamanho(m.anexoTamanho)].filter(Boolean).join(" · ")}</span>
      </span>
      {aBaixar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 opacity-70" />}
    </button>
  );
}

export interface AcoesBolha {
  onResponder: (m: MensagemChat) => void;
  onEditar: (m: MensagemChat) => void;
  onApagar: (m: MensagemChat, paraTodos: boolean) => void;
  onReagir: (m: MensagemChat, emoji: string | null) => void;
  onFavorita: (m: MensagemChat) => void;
  onEncaminhar: (m: MensagemChat) => void;
  onFixar: (m: MensagemChat) => void;
  onInfo: (m: MensagemChat) => void;
  onIrPara: (id: string) => void;
  onAbrirImagem: (url: string) => void;
  onCopiar: (m: MensagemChat) => void;
}

export function Bolha({
  m, grupo, podeFixar, lidaPorTodosAte, destacada, consecutiva, acoes,
}: {
  m: MensagemChat;
  grupo: boolean;
  podeFixar: boolean;
  lidaPorTodosAte: string | null;
  destacada: boolean;
  /** Mesma autora da mensagem anterior: sem repetir o nome. */
  consecutiva: boolean;
  acoes: AcoesBolha;
}) {
  const podeEditar = useAte(m.podeEditarAte);
  const podeApagarParaTodos = useAte(m.podeApagarAte) || m.podeApagarModeracao;

  if (m.tipo === "SISTEMA") {
    return (
      <div className="flex justify-center my-1.5" data-mensagem={m.id}>
        <span className="text-[11px] px-3 py-1 rounded-lg bg-card/90 border border-border/60 text-muted-foreground text-center max-w-[85%]">{m.conteudo}</span>
      </div>
    );
  }

  const clara = m.minha;
  const vista = m.minha && !!lidaPorTodosAte && m.criadoEm <= lidaPorTodosAte;
  const mostrarNome = grupo && !m.minha && !consecutiva;

  return (
    <div data-mensagem={m.id} className={cn("group flex", m.minha ? "justify-end" : "justify-start", consecutiva ? "mt-0.5" : "mt-2.5", m.reacoes.length > 0 && "mb-3.5")}>
      <div className={cn("max-w-[85%] md:max-w-[68%] flex items-start gap-1", m.minha && "flex-row-reverse")}>
        <div
          className={cn(
            "relative rounded-2xl px-3 py-1.5 shadow-sm text-sm transition-[box-shadow]",
            m.minha ? "bg-primary text-primary-foreground" : "bg-card border border-border/60",
            !consecutiva && (m.minha ? "rounded-tr-md" : "rounded-tl-md"),
            destacada && "ring-4 ring-gold/70",
          )}
        >
          {mostrarNome && (
            <p className={cn("text-xs font-semibold mb-0.5", corDe(m.remetenteNome))}>
              {m.remetenteNome}{m.remetenteEquipa && <span className="ml-1.5 text-[10px] font-medium px-1.5 py-px rounded-full bg-accent/30 text-rose-deep">Equipa</span>}
            </p>
          )}
          {!grupo && !m.minha && m.remetenteEquipa && !consecutiva && <p className="text-[10px] font-semibold text-rose-deep mb-0.5">{m.remetenteNome} · Equipa</p>}
          {m.encaminhada && !m.apagada && <p className="text-[10px] italic opacity-70 flex items-center gap-1 mb-0.5"><Forward className="h-3 w-3" /> Reencaminhada</p>}
          {m.respostaA && !m.apagada && (
            <button type="button" onClick={() => acoes.onIrPara(m.respostaA!)}
              className={cn("block w-full text-left mb-1.5 rounded-lg px-2 py-1 border-l-[3px] text-xs", m.minha ? "bg-white/15 border-white/60" : "bg-secondary border-rose-deep/60")}>
              <span className="block font-semibold opacity-90">{m.respostaNome}</span>
              <span className="block opacity-80 line-clamp-2">{m.respostaPreview}</span>
            </button>
          )}
          {m.apagada ? (
            <p className="italic opacity-70 flex items-center gap-1.5"><Ban className="h-3.5 w-3.5" /> {m.minha ? "Apagou esta mensagem" : "Esta mensagem foi apagada"}</p>
          ) : (
            <>
              {m.tipo === "IMAGEM" && m.temAnexo && <Imagem m={m} onAbrir={acoes.onAbrirImagem} />}
              {m.tipo === "AUDIO" && m.temAnexo && <Audio m={m} clara={clara} />}
              {m.tipo === "DOCUMENTO" && m.temAnexo && <Documento m={m} clara={clara} />}
              {m.conteudo && m.tipo !== "DOCUMENTO" && (
                <p className={cn("whitespace-pre-wrap break-words", m.tipo === "IMAGEM" && "mt-1.5")}>{formatarTexto(m.conteudo, clara)}</p>
              )}
            </>
          )}
          <p className={cn("text-[10px] mt-0.5 flex items-center justify-end gap-1", m.minha ? "opacity-80" : "text-muted-foreground")}>
            {m.favorita && <Star className="h-3 w-3 fill-current" />}
            {m.editada && !m.apagada && <span>editada</span>}
            <span>{horaDe(m.criadoEm)}</span>
            {m.minha && !m.apagada && (vista
              ? <CheckCheck className="h-3.5 w-3.5 text-sky-300" aria-label="Vista" />
              : <Check className="h-3.5 w-3.5" aria-label="Enviada" />)}
          </p>
          {m.reacoes.length > 0 && (
            <div className={cn("absolute -bottom-3 flex gap-0.5", m.minha ? "right-2" : "left-2")}>
              {m.reacoes.map((r) => (
                <button key={r.emoji} type="button" title={r.nomes.join(", ")}
                  onClick={() => acoes.onReagir(m, r.minha ? null : r.emoji)}
                  className={cn("h-5 px-1.5 rounded-full text-[11px] flex items-center gap-0.5 bg-card border shadow-sm text-foreground",
                    r.minha ? "border-primary/60" : "border-border")}>
                  {r.emoji}{r.total > 1 && <span className="text-[10px] text-muted-foreground">{r.total}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {!m.apagada && (
          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 transition pt-1">
            <Popover>
              <PopoverTrigger asChild>
                <button title="Reagir" className="h-7 w-7 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground"><SmilePlus className="h-4 w-4" /></button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-auto p-1.5 flex gap-0.5 rounded-full">
                {EMOJIS_REACAO.map((e) => (
                  <button key={e} type="button" onClick={() => acoes.onReagir(m, m.reacoes.some((r) => r.minha && r.emoji === e) ? null : e)}
                    className="h-8 w-8 rounded-full hover:bg-secondary text-lg leading-none transition-transform hover:scale-125">{e}</button>
                ))}
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button title="Mais opções" className="h-7 w-7 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground"><ChevronDown className="h-4 w-4" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={m.minha ? "end" : "start"} className="w-52">
                <DropdownMenuItem onClick={() => acoes.onResponder(m)}><Reply className="h-4 w-4 mr-2" /> Responder</DropdownMenuItem>
                {m.conteudo && m.tipo !== "DOCUMENTO" && <DropdownMenuItem onClick={() => acoes.onCopiar(m)}><Copy className="h-4 w-4 mr-2" /> Copiar</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => acoes.onEncaminhar(m)}><Forward className="h-4 w-4 mr-2" /> Reencaminhar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => acoes.onFavorita(m)}>
                  {m.favorita ? <><StarOff className="h-4 w-4 mr-2" /> Retirar das favoritas</> : <><Star className="h-4 w-4 mr-2" /> Marcar como favorita</>}
                </DropdownMenuItem>
                {podeFixar && <DropdownMenuItem onClick={() => acoes.onFixar(m)}><Pin className="h-4 w-4 mr-2" /> Fixar</DropdownMenuItem>}
                {m.minha && <DropdownMenuItem onClick={() => acoes.onInfo(m)}><Info className="h-4 w-4 mr-2" /> Dados da mensagem</DropdownMenuItem>}
                {podeEditar && <DropdownMenuItem onClick={() => acoes.onEditar(m)}><Pencil className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => acoes.onApagar(m, false)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Apagar para mim
                </DropdownMenuItem>
                {podeApagarParaTodos && (
                  <DropdownMenuItem onClick={() => acoes.onApagar(m, true)} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> {m.minha ? "Apagar para todos" : "Apagar para todos (administradora)"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
