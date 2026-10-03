import { useMemo, useState } from "react";
import { Search, Phone, MessageCircle } from "lucide-react";
import { formatDate, formatMZN, initials, whatsappLink } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import { useAdminClientes } from "@/hooks/useAdminApi";

export default function AdminClientsPage() {
  const clientesQuery = useAdminClientes();
  const [q, setQ] = useState("");

  const clientes = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (clientesQuery.data ?? []).filter(
      (c) =>
        !term ||
        c.nome.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.telefone ?? "").includes(term),
    );
  }, [clientesQuery.data, q]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Base</p>
          <h1 className="font-display text-4xl mt-1">Clientes</h1>
        </div>
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Nome, email ou telefone..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
      </div>

      {clientesQuery.isError && <QueryError query={clientesQuery} className="mb-4" />}

      {clientesQuery.isLoading && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      )}

      {clientesQuery.isSuccess && clientes.length === 0 && (
        <div className="p-10 rounded-2xl border border-dashed border-border text-center text-muted-foreground bg-card">
          {q ? "Nenhum cliente corresponde à pesquisa." : "Ainda sem clientes registados."}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {clientes.map((c) => (
          <div key={c.id} className="p-5 rounded-2xl bg-card border border-border/60 hover-lift">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border border-accent/40">
                <AvatarFallback className="bg-accent/20 text-primary text-sm font-semibold">{initials(c.nome)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{c.email}</p>
              </div>
            </div>

            {c.telefone && (
              <div className="flex items-center gap-3 mt-3 text-xs">
                <a href={`tel:${c.telefone}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
                  <Phone className="h-3 w-3" /> {c.telefone}
                </a>
                <a href={whatsappLink(c.telefone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary story-link">
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/40 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Marcações</p>
                <p className="font-display text-xl text-primary">{c.totalMarcacoes}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Investido</p>
                <p className="font-display text-xl text-primary">{formatMZN(c.totalInvestido)}</p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-3">Cliente desde {formatDate(c.criadoEm)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
