import { useState } from "react";
import { Eye, EyeOff, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import { formatDateShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/QueryError";
import { InfiniteScrollTable } from "@/components/InfiniteScrollTable";
import { Estrelas } from "@/components/Estrelas";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usePublicarAvaliacao, useAvaliacoesAdmin, useResumoAvaliacoes } from "@/hooks/useFidelizacaoApi";
import type { Avaliacao } from "@/types/api";

export default function AdminReviewsPage() {
  const [respondida, setRespondida] = useState("true");
  const [publicada, setPublicada] = useState("todas");
  const [nota, setNota] = useState("todas");
  const lista = useAvaliacoesAdmin({ respondida, publicada, nota });
  const resumo = useResumoAvaliacoes();
  const publicar = usePublicarAvaliacao();

  async function alternar(a: Avaliacao) {
    try {
      await publicar.mutateAsync({ id: a.id, publicada: !a.publicada });
      toast.success(a.publicada ? "Retirada do site." : "Publicada no site.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Clientes</p>
          <h1 className="font-display text-4xl mt-1">Avaliações</h1>
        </div>
        {resumo.data && resumo.data.total > 0 && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Estrelas nota={Number(resumo.data.media)} /> {Number(resumo.data.media).toFixed(1)} no site · {resumo.data.total} publicadas
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Depois de cada fatura, a cliente recebe um email a pedir a avaliação. Escolha aqui as que aparecem no site
        (só o primeiro nome e a inicial do apelido são mostrados).
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={respondida} onValueChange={setRespondida}>
          <SelectTrigger className="w-full sm:w-[200px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Respondidas</SelectItem>
            <SelectItem value="false">À espera de resposta</SelectItem>
            <SelectItem value="todas">Todos os pedidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={publicada} onValueChange={setPublicada}>
          <SelectTrigger className="w-full sm:w-[180px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">No site ou não</SelectItem>
            <SelectItem value="true">No site</SelectItem>
            <SelectItem value="false">Fora do site</SelectItem>
          </SelectContent>
        </Select>
        <Select value={nota} onValueChange={setNota}>
          <SelectTrigger className="w-full sm:w-[160px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as notas</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "estrela" : "estrelas"}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {lista.query.isError && <QueryError query={lista.query} className="mb-4" />}

      <InfiniteScrollTable<Avaliacao>
        data={lista.items}
        total={lista.total}
        getRowKey={(a) => a.id}
        isLoading={lista.isLoading}
        hasMore={lista.hasMore}
        isLoadingMore={lista.isLoadingMore}
        onLoadMore={lista.loadMore}
        emptyMessage={<span className="inline-flex items-center gap-2"><MessageSquareQuote className="h-4 w-4" /> Ainda não há avaliações com estes filtros.</span>}
        columns={[
          {
            id: "cliente", label: "Cliente", minWidth: 180,
            render: (a) => (<><p className="font-medium">{a.clienteNome}</p><p className="text-xs text-muted-foreground">{formatDateShort(a.dataAtendimento)} · {a.servicos}</p></>),
          },
          { id: "nota", label: "Nota", minWidth: 110, render: (a) => (a.nota ? <Estrelas nota={a.nota} /> : <span className="text-xs text-muted-foreground">Sem resposta</span>) },
          {
            id: "comentario", label: "Comentário", minWidth: 280,
            render: (a) => (a.comentario ? <p className="italic text-sm line-clamp-3">“{a.comentario}”</p> : <span className="text-muted-foreground">—</span>),
          },
          {
            id: "acao", label: "Site", align: "right", minWidth: 140,
            render: (a) => a.respondidaEm ? (
              <Button size="sm" variant={a.publicada ? "outline" : "default"} className="rounded-full" disabled={publicar.isPending}
                onClick={(e) => { e.stopPropagation(); alternar(a); }}>
                {a.publicada ? <><EyeOff className="h-3.5 w-3.5 mr-1" /> Retirar</> : <><Eye className="h-3.5 w-3.5 mr-1" /> Publicar</>}
              </Button>
            ) : null,
          },
        ]}
      />
    </div>
  );
}
