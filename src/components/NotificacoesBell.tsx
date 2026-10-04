import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CalendarCheck, CalendarClock, CalendarPlus, CalendarX, CheckCheck, Loader2, MessageSquare, Receipt, UserPlus, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { relative } from "@/lib/format";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useMarcarNotificacaoLida,
  useMarcarTodasNotificacoesLidas,
  useNotificacoes,
  useNotificacoesResumo,
} from "@/hooks/useAdminApi";
import type { Notificacao } from "@/types/api";

const ICONES: Record<string, typeof Bell> = {
  MARCACAO_NOVA: CalendarPlus,
  MARCACAO_CONFIRMADA: CalendarCheck,
  MARCACAO_CANCELADA: CalendarX,
  MARCACAO_REMARCADA: CalendarClock,
  COTACAO_NOVA: MessageSquare,
  FATURA_EMITIDA: Receipt,
  FATURA_PAGA: Wallet,
  CLIENTE_NOVO: UserPlus,
};

/** Sino de notificações do sistema (marcações, cotações, faturas, pagamentos, novas clientes). */
export function NotificacoesBell({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [soNaoLidas, setSoNaoLidas] = useState(false);
  const resumo = useNotificacoesResumo();
  const lista = useNotificacoes(soNaoLidas, aberto);
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodas = useMarcarTodasNotificacoesLidas();
  const naoLidas = resumo.data?.naoLidas ?? 0;

  // Aviso discreto quando entram notificações novas enquanto o painel está aberto.
  const anterior = useRef<number | null>(null);
  useEffect(() => {
    if (resumo.data == null) return;
    if (anterior.current !== null && naoLidas > anterior.current) {
      const novas = naoLidas - anterior.current;
      toast(`${novas} ${novas === 1 ? "notificação nova" : "notificações novas"}`, {
        action: { label: "Ver", onClick: () => setAberto(true) },
      });
    }
    anterior.current = naoLidas;
  }, [naoLidas, resumo.data]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const aoRolar = () => {
    const el = scrollRef.current;
    if (el && lista.hasMore && !lista.isLoadingMore && el.scrollTop + el.clientHeight >= el.scrollHeight - 60) lista.loadMore();
  };

  function abrir(n: Notificacao) {
    if (!n.lida) marcarLida.mutate(n.id);
    setAberto(false);
    if (n.link) navigate(n.link);
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          aria-label={naoLidas > 0 ? `${naoLidas} notificações por ler` : "Notificações"}
          className={cn(
            "relative h-10 w-10 grid place-items-center rounded-full transition",
            tone === "light" ? "text-porcelain/90 hover:bg-white/10" : "text-foreground hover:bg-secondary",
          )}
        >
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-deep text-white text-[10px] font-semibold grid place-items-center">
              {naoLidas > 99 ? "99+" : naoLidas}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] max-w-[calc(100vw-24px)] p-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <div>
            <p className="font-display text-xl leading-none">Notificações</p>
            <p className="text-[11px] text-muted-foreground mt-1">{naoLidas} por ler</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoNaoLidas((v) => !v)}
              className={cn("text-[11px] px-2.5 h-7 rounded-full border", soNaoLidas ? "bg-primary text-primary-foreground border-primary" : "border-border")}
            >
              Só por ler
            </button>
            <button
              onClick={() => marcarTodas.mutate()}
              disabled={naoLidas === 0 || marcarTodas.isPending}
              title="Marcar todas como lidas"
              className="h-7 w-7 grid place-items-center rounded-full hover:bg-secondary disabled:opacity-40"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div ref={scrollRef} onScroll={aoRolar} className="max-h-[420px] overflow-y-auto">
          {lista.isLoading ? (
            <div className="py-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : lista.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{soNaoLidas ? "Está tudo lido." : "Ainda sem notificações."}</p>
          ) : (
            <ul>
              {lista.items.map((n) => {
                const Icone = ICONES[n.tipo] ?? Bell;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => abrir(n)}
                      className={cn("w-full text-left px-4 py-3 flex gap-3 border-b border-border/50 hover:bg-secondary/40", !n.lida && "bg-accent/10")}
                    >
                      <span className={cn("h-8 w-8 shrink-0 rounded-full grid place-items-center", n.lida ? "bg-secondary text-muted-foreground" : "bg-rose-deep/15 text-rose-deep")}>
                        <Icone className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm leading-snug", !n.lida && "font-semibold")}>{n.titulo}</span>
                        {n.mensagem && <span className="block text-xs text-muted-foreground truncate">{n.mensagem}</span>}
                        <span className="block text-[10px] text-muted-foreground mt-0.5">{relative(n.criadoEm)}</span>
                      </span>
                      {!n.lida && <span className="h-2 w-2 rounded-full bg-rose-deep mt-2 shrink-0" />}
                    </button>
                  </li>
                );
              })}
              {lista.isLoadingMore && (
                <li className="py-3 text-center"><Loader2 className="inline h-4 w-4 animate-spin text-muted-foreground" /></li>
              )}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
