import { useEffect, useRef, useState } from "react";
import { Check, FileText, ImageIcon, Loader2, Lock, Mic, Paperclip, Pencil, Reply, Send, Smile, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { redimensionar } from "@/shared/lib/imagem";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useAvisarAEscrever, useEditarMensagem, useEnviarAnexo, useEnviarMensagem } from "@/modules/chat/hooks/useChatApi";
import type { MensagemChat } from "@/modules/chat/models";
import { EMOJIS, duracao } from "@/modules/chat/components/util";

const MAX_FICHEIRO = 10 * 1024 * 1024;

/**
 * Caixa de escrita ao estilo WhatsApp: texto (Enter envia, Shift+Enter muda de linha), emojis,
 * anexar foto ou documento, gravar mensagem de voz, responder e editar.
 */
export function Compositor({
  conversaId, bloqueado, respondendo, aEditar, onCancelar, onEnviada,
}: {
  conversaId: string;
  bloqueado: boolean;
  respondendo: MensagemChat | null;
  aEditar: MensagemChat | null;
  onCancelar: () => void;
  onEnviada: (m: MensagemChat) => void;
}) {
  const enviar = useEnviarMensagem();
  const enviarAnexo = useEnviarAnexo();
  const editar = useEditarMensagem();
  const avisar = useAvisarAEscrever(conversaId);
  const [texto, setTexto] = useState("");
  const fotoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // Gravação de voz (MediaRecorder do navegador, sem serviços pagos).
  const [aGravar, setAGravar] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const gravador = useRef<MediaRecorder | null>(null);
  const partes = useRef<Blob[]>([]);
  const inicio = useRef(0);
  const descartar = useRef(false);

  useEffect(() => {
    setTexto(aEditar?.conteudo ?? "");
    if (aEditar || respondendo) areaRef.current?.focus();
  }, [aEditar, respondendo]);

  useEffect(() => {
    setTexto("");
    return () => pararGravacao(true);
  }, [conversaId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!aGravar) return;
    const t = setInterval(() => setSegundos(Math.round((Date.now() - inicio.current) / 1000)), 250);
    return () => clearInterval(t);
  }, [aGravar]);

  const aEnviar = enviar.isPending || enviarAnexo.isPending || editar.isPending;

  async function submeter() {
    const t = texto.trim();
    if (!t) return;
    try {
      if (aEditar) {
        onEnviada(await editar.mutateAsync({ id: aEditar.id, texto: t }));
      } else {
        onEnviada(await enviar.mutateAsync({ conversaId, texto: t, respostaA: respondendo?.id }));
      }
      setTexto("");
      onCancelar();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function mandar(dados: FormData, rota: "imagens" | "ficheiros") {
    if (respondendo) dados.append("respostaA", respondendo.id);
    try {
      onEnviada(await enviarAnexo.mutateAsync({ conversaId, dados, rota }));
      onCancelar();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function escolherFoto(f: File | undefined) {
    if (!f) return;
    try {
      const { blob } = await redimensionar(f, 1600, 0.82);
      const dados = new FormData();
      dados.append("imagem", blob, "foto.jpg");
      if (texto.trim()) dados.append("legenda", texto.trim());
      await mandar(dados, "imagens");
      setTexto("");
    } finally {
      if (fotoRef.current) fotoRef.current.value = "";
    }
  }

  async function escolherDocumento(f: File | undefined) {
    if (docRef.current) docRef.current.value = "";
    if (!f) return;
    if (f.size > MAX_FICHEIRO) return void toast.error("O ficheiro pode ter até 10 MB.");
    const dados = new FormData();
    dados.append("ficheiro", f, f.name);
    await mandar(dados, "ficheiros");
  }

  async function gravar() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return void toast.error("Este navegador não permite gravar áudio.");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      partes.current = [];
      descartar.current = false;
      rec.ondataavailable = (e) => e.data.size && partes.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const s = Math.max(1, Math.round((Date.now() - inicio.current) / 1000));
        if (descartar.current || partes.current.length === 0) return;
        const mime = (rec.mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(partes.current, { type: mime });
        const dados = new FormData();
        dados.append("ficheiro", blob, `voz.${mime.includes("mp4") ? "m4a" : "webm"}`);
        dados.append("voz", "true");
        dados.append("duracao", String(s));
        void mandar(dados, "ficheiros");
      };
      gravador.current = rec;
      inicio.current = Date.now();
      setSegundos(0);
      rec.start();
      setAGravar(true);
    } catch {
      toast.error("Não foi possível usar o microfone. Verifique a autorização do navegador.");
    }
  }

  function pararGravacao(cancelar: boolean) {
    descartar.current = cancelar;
    if (gravador.current && gravador.current.state !== "inactive") gravador.current.stop();
    gravador.current = null;
    setAGravar(false);
  }

  if (bloqueado) {
    return (
      <footer className="p-3 border-t border-border/60 text-center text-sm text-muted-foreground bg-card shrink-0">
        <Lock className="inline h-4 w-4 mr-1" /> Só as administradoras podem enviar mensagens neste grupo.
      </footer>
    );
  }

  return (
    <div className="shrink-0 bg-card border-t border-border/60">
      {(respondendo || aEditar) && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg flex items-center gap-3 text-xs bg-secondary/60 border-l-[3px] border-rose-deep">
          {respondendo ? <Reply className="h-4 w-4 text-rose-deep shrink-0" /> : <Pencil className="h-4 w-4 text-rose-deep shrink-0" />}
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{respondendo ? (respondendo.minha ? "Você" : respondendo.remetenteNome) : "Editar mensagem"}</span>
            <span className="block truncate text-muted-foreground">
              {(respondendo ?? aEditar)?.conteudo ?? (respondendo?.tipo === "IMAGEM" ? "📷 Foto" : respondendo?.tipo === "AUDIO" ? "🎤 Mensagem de voz" : "📄 Documento")}
            </span>
          </span>
          <button onClick={() => { onCancelar(); if (aEditar) setTexto(""); }} aria-label="Cancelar"><X className="h-4 w-4" /></button>
        </div>
      )}

      <footer className="p-2.5 flex items-end gap-1.5">
        {aGravar ? (
          <>
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => pararGravacao(true)} aria-label="Cancelar gravação">
              <Trash2 className="h-5 w-5" />
            </Button>
            <div className="flex-1 h-10 rounded-full bg-secondary/60 flex items-center gap-2 px-4 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" /> A gravar… {duracao(segundos)}
            </div>
            <Button type="button" size="icon" className="h-10 w-10 rounded-full bg-primary" onClick={() => pararGravacao(false)} aria-label="Enviar mensagem de voz">
              <Send className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" aria-label="Emojis"><Smile className="h-5 w-5" /></Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-72 p-2 grid grid-cols-8 gap-0.5">
                {EMOJIS.map((e) => (
                  <button key={e} type="button" className="h-8 w-8 rounded hover:bg-secondary text-lg leading-none"
                    onClick={() => { setTexto((t) => t + e); areaRef.current?.focus(); }}>{e}</button>
                ))}
              </PopoverContent>
            </Popover>
            {!aEditar && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" disabled={aEnviar} aria-label="Anexar"><Paperclip className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start">
                  <DropdownMenuItem onClick={() => fotoRef.current?.click()}><ImageIcon className="h-4 w-4 mr-2 text-violet-600" /> Foto</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => docRef.current?.click()}><FileText className="h-4 w-4 mr-2 text-sky-600" /> Documento</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <input ref={fotoRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => void escolherFoto(e.target.files?.[0])} />
            <input ref={docRef} type="file" hidden
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.txt,.csv,application/pdf"
              onChange={(e) => void escolherDocumento(e.target.files?.[0])} />
            <Textarea
              ref={areaRef}
              value={texto}
              rows={1}
              maxLength={4000}
              placeholder="Escreva uma mensagem"
              onChange={(e) => { setTexto(e.target.value); if (e.target.value) avisar(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submeter();
                }
                if (e.key === "Escape" && (respondendo || aEditar)) onCancelar();
              }}
              onPaste={(e) => {
                const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/"));
                if (f) { e.preventDefault(); void escolherFoto(f); }
              }}
              className="min-h-[40px] max-h-36 resize-none rounded-2xl bg-secondary/40 border-transparent"
            />
            {texto.trim() || aEditar ? (
              <Button type="button" size="icon" className={cn("h-10 w-10 shrink-0 rounded-full bg-primary")} disabled={aEnviar || !texto.trim()} onClick={submeter}
                aria-label={aEditar ? "Guardar edição" : "Enviar"}>
                {aEnviar ? <Loader2 className="h-4 w-4 animate-spin" /> : aEditar ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </Button>
            ) : (
              <Button type="button" size="icon" className="h-10 w-10 shrink-0 rounded-full bg-primary" disabled={aEnviar} onClick={gravar} aria-label="Gravar mensagem de voz">
                {aEnviar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
          </>
        )}
      </footer>
    </div>
  );
}
