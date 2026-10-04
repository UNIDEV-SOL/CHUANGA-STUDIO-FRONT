import { useState } from "react";
import { Check, Archive, Phone, Mail, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatMZN, relative, whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfiniteScrollTable } from "@/components/InfiniteScrollTable";
import { useDebounce } from "@/hooks/useDebounce";
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
  const atualizar = useAdminAtualizarCotacao();
  const [tab, setTab] = useState<StatusCotacao | "TODAS">("NOVO");
  const [q, setQ] = useState("");
  const busca = useDebounce(q);
  const lista = useAdminCotacoes({ status: tab === "TODAS" ? undefined : tab, busca });

  async function act(c: Cotacao, acao: "respondido" | "arquivar") {
    try {
      await atualizar.mutateAsync({ id: c.id, acao });
      toast.success(acao === "respondido" ? "Marcada como respondida." : "Cotação arquivada.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Interesse</p>
          <h1 className="font-display text-4xl mt-1">Cotações</h1>
        </div>
        <p className="text-sm text-muted-foreground">{lista.total} {lista.total === 1 ? "cotação" : "cotações"}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "px-4 h-9 rounded-full text-xs font-medium border transition",
                tab === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Nome, telefone ou email..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
      </div>

      {lista.query.isError && <QueryError query={lista.query} className="mb-4" />}

      <InfiniteScrollTable<Cotacao>
        data={lista.items}
        total={lista.total}
        getRowKey={(c) => c.id}
        isLoading={lista.isLoading}
        hasMore={lista.hasMore}
        isLoadingMore={lista.isLoadingMore}
        onLoadMore={lista.loadMore}
        emptyMessage={tab === "NOVO" ? "Nenhuma cotação por responder." : "Nada para mostrar aqui."}
        columns={[
          {
            id: "cliente", label: "Cliente", minWidth: 210,
            render: (c) => (
              <>
                <p className="font-medium">{c.nome}</p>
                <p className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
                  <a href={`tel:${c.telefone}`} className="inline-flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" /> {c.telefone}</a>
                  {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" /> {c.email}</a>}
                </p>
              </>
            ),
          },
          {
            id: "servicos", label: "Serviços", minWidth: 240,
            render: (c) => (
              <>
                <div className="flex flex-wrap gap-1">
                  {c.servicosNomes.slice(0, 4).map((nome, i) => (
                    <span key={`${nome}-${i}`} className="text-[11px] bg-secondary px-2 py-0.5 rounded-full">{nome}</span>
                  ))}
                  {c.servicosNomes.length > 4 && <span className="text-[11px] text-muted-foreground">+{c.servicosNomes.length - 4}</span>}
                </div>
                {c.mensagem && <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">"{c.mensagem}"</p>}
              </>
            ),
          },
          { id: "total", label: "Estimativa", align: "right", minWidth: 110, className: "font-display text-primary whitespace-nowrap", render: (c) => formatMZN(c.totalEstimado) },
          {
            id: "estado", label: "Estado", minWidth: 120,
            render: (c) => (<><StatusBadge status={c.status} kind="cotacao" /><p className="text-[10px] text-muted-foreground mt-1" title={formatDate(c.criadoEm)}>{relative(c.criadoEm)}</p></>),
          },
          {
            id: "acoes", label: "", align: "right", minWidth: 160,
            render: (c) => {
              const pending = atualizar.isPending && atualizar.variables?.id === c.id;
              return (
                <div className="flex justify-end gap-1">
                  <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-primary" title="Responder no WhatsApp">
                    <a href={whatsappLink(c.telefone)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a>
                  </Button>
                  {c.status === "NOVO" && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Marcar respondida" disabled={pending} onClick={() => act(c, "respondido")}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {c.status !== "ARQUIVADO" && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Arquivar" disabled={pending} onClick={() => act(c, "arquivar")}>
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
