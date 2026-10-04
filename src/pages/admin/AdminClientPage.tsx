import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MessageCircle } from "lucide-react";
import { formatDateShort, formatMZN, initials, whatsappLink } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { QueryError } from "@/components/QueryError";
import { InfiniteScrollTable } from "@/components/InfiniteScrollTable";
import { FichaClienteDialog } from "@/components/FichaClienteDialog";
import { useAdminClientes } from "@/hooks/useAdminApi";
import { useDistritos, useProvincias } from "@/hooks/useServicesApi";
import { useDebounce } from "@/hooks/useDebounce";
import type { ClienteResumo } from "@/types/api";

export default function AdminClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [provinciaId, setProvinciaId] = useState("todas");
  const [distritoId, setDistritoId] = useState("todos");
  const busca = useDebounce(q);
  const provincias = useProvincias();
  const distritos = useDistritos(provinciaId !== "todas" ? provinciaId : null);

  // Paginação e filtros na API.
  const lista = useAdminClientes({ busca, provinciaId, distritoId });

  // ?id= (ex.: notificação "nova cliente") abre a ficha diretamente.
  const fichaId = searchParams.get("id");
  const abrirFicha = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("id", id); else next.delete("id");
    setSearchParams(next, { replace: true });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Base</p>
          <h1 className="font-display text-4xl mt-1">Clientes</h1>
        </div>
        <p className="text-sm text-muted-foreground">{lista.total} {lista.total === 1 ? "cliente" : "clientes"}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Nome, email ou telefone..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={provinciaId} onValueChange={(v) => { setProvinciaId(v); setDistritoId("todos"); }}>
          <SelectTrigger className="w-full sm:w-[190px] h-10" aria-label="Província"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as províncias</SelectItem>
            {(provincias.data ?? []).map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={distritoId} onValueChange={setDistritoId} disabled={provinciaId === "todas"}>
          <SelectTrigger className="w-full sm:w-[190px] h-10" aria-label="Distrito"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os distritos</SelectItem>
            {(distritos.data ?? []).map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {lista.query.isError && <QueryError query={lista.query} className="mb-4" />}

      <InfiniteScrollTable<ClienteResumo>
        data={lista.items}
        total={lista.total}
        getRowKey={(c) => c.id}
        onRowClick={(c) => abrirFicha(c.id)}
        isLoading={lista.isLoading}
        hasMore={lista.hasMore}
        isLoadingMore={lista.isLoadingMore}
        onLoadMore={lista.loadMore}
        emptyMessage={q || provinciaId !== "todas" ? "Nenhuma cliente com estes filtros." : "Ainda sem clientes registadas."}
        columns={[
          {
            id: "cliente", label: "Cliente", minWidth: 240,
            render: (c) => (
              <span className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-accent/40">
                  <AvatarFallback className="bg-accent/20 text-primary text-xs font-semibold">{initials(c.nome)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block font-medium truncate">{c.nome}</span>
                  <span className="block text-xs text-muted-foreground truncate">{c.email}</span>
                </span>
              </span>
            ),
          },
          {
            id: "contacto", label: "Contacto", minWidth: 150,
            render: (c) => c.telefone ? (
              <span className="text-xs">
                {c.telefone}
                <a href={whatsappLink(c.telefone)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                  className="ml-2 inline-flex items-center gap-1 text-primary story-link">
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </a>
              </span>
            ) : <span className="text-muted-foreground">—</span>,
          },
          {
            id: "local", label: "Localização", minWidth: 150,
            render: (c) => <span className="text-xs">{[c.distrito, c.provincia].filter(Boolean).join(", ") || "—"}</span>,
          },
          { id: "marcacoes", label: "Marcações", align: "right", minWidth: 90, render: (c) => c.totalMarcacoes },
          { id: "investido", label: "Investido", align: "right", minWidth: 110, className: "font-display text-primary whitespace-nowrap", render: (c) => formatMZN(c.totalInvestido) },
          {
            id: "faltas", label: "Faltas", align: "right", minWidth: 70,
            render: (c) => <span className={c.faltas > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}>{c.faltas}</span>,
          },
          { id: "desde", label: "Desde", minWidth: 100, className: "text-xs text-muted-foreground whitespace-nowrap", render: (c) => formatDateShort(c.criadoEm) },
        ]}
      />

      <FichaClienteDialog clienteId={fichaId} onOpenChange={(v) => !v && abrirFicha(null)} />
    </div>
  );
}
