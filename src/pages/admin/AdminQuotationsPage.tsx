import { useMemo, useState } from "react";
import { Check, Archive, Phone, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatMZN, relative, whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/atoms/StatusBadge";
import { QueryError } from "@/components/QueryError";
import { useAdminAtualizarCotacao, useAdminCotacoes } from "@/hooks/useAdminApi";
import type { Cotacao, StatusCotacao } from "@/types/api";

const TABS: { value: StatusCotacao | "TODAS"; label: string }[] = [
  { value: "NOVO", label: "Novas" },
  { value: "RESPONDIDO", label: "Respondidas" },
  { value: "ARQUIVADO", label: "Arquivadas" },
  { value: "TODAS", label: "Todas" },
];

export default function AdminQuotationsPage() {
  const quotationsQuery = useAdminCotacoes();
  const atualizar = useAdminAtualizarCotacao();
  const [tab, setTab] = useState<StatusCotacao | "TODAS">("NOVO");

  const quotations = useMemo(() => quotationsQuery.data ?? [], [quotationsQuery.data]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { TODAS: quotations.length };
    for (const q of quotations) c[q.status] = (c[q.status] ?? 0) + 1;
    return c;
  }, [quotations]);

  const visible = useMemo(
    () =>
      quotations
        .filter((q) => tab === "TODAS" || q.status === tab)
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    [quotations, tab],
  );

  async function act(q: Cotacao, acao: "respondido" | "arquivar") {
    try {
      await atualizar.mutateAsync({ id: q.id, acao });
      toast.success(acao === "respondido" ? "Marcada como respondida." : "Cotação arquivada.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Interesse</p>
        <h1 className="font-display text-4xl mt-1">Cotações</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "px-4 h-9 rounded-full text-xs font-medium border transition inline-flex items-center gap-2",
              tab === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40",
            )}
          >
            {t.label}
            <span className={cn("text-[10px] rounded-full px-1.5", tab === t.value ? "bg-white/20" : "bg-secondary")}>
              {counts[t.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {quotationsQuery.isError && <QueryError query={quotationsQuery} className="mb-4" />}

      {quotationsQuery.isLoading && (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>
      )}

      {quotationsQuery.isSuccess && visible.length === 0 && (
        <div className="p-10 rounded-2xl border border-dashed border-border text-center text-muted-foreground bg-card">
          {tab === "NOVO" ? "Nenhuma cotação por responder." : "Nada para mostrar aqui."}
        </div>
      )}

      <div className="space-y-3">
        {visible.map((q) => {
          const pending = atualizar.isPending && atualizar.variables?.id === q.id;
          return (
            <div
              key={q.id}
              className={cn(
                "p-5 rounded-2xl border transition",
                q.status === "NOVO" ? "bg-accent/5 border-accent/40" : "bg-card border-border/60",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{q.nome}</p>
                    <StatusBadge status={q.status} kind="cotacao" />
                  </div>
                  <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    <a href={`tel:${q.telefone}`} className="inline-flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3 w-3" /> {q.telefone}
                    </a>
                    {q.email && (
                      <a href={`mailto:${q.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                        · <Mail className="h-3 w-3" /> {q.email}
                      </a>
                    )}
                    <span title={formatDate(q.criadoEm)}>· {relative(q.criadoEm)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl text-primary">{formatMZN(q.totalEstimado)}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.servicosNomes.length} {q.servicosNomes.length === 1 ? "serviço" : "serviços"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {q.servicosNomes.map((nome, i) => (
                  <span key={`${nome}-${i}`} className="text-[11px] bg-secondary px-2 py-0.5 rounded-full">{nome}</span>
                ))}
              </div>
              {q.mensagem && <p className="text-sm text-muted-foreground italic mt-3">"{q.mensagem}"</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-full bg-primary">
                  <a href={whatsappLink(q.telefone)} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> Responder no WhatsApp
                  </a>
                </Button>
                {q.status === "NOVO" && (
                  <Button size="sm" variant="outline" className="rounded-full" disabled={pending} onClick={() => act(q, "respondido")}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Marcar respondida
                  </Button>
                )}
                {q.status !== "ARQUIVADO" && (
                  <Button size="sm" variant="ghost" className="rounded-full" disabled={pending} onClick={() => act(q, "arquivar")}>
                    <Archive className="h-3.5 w-3.5 mr-1" /> Arquivar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
