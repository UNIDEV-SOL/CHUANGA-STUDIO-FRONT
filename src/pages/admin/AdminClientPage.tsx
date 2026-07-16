import { formatDate, formatMZN } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdminClientes } from "@/hooks/useAdminClientsApi";

export default function AdminClientsPage() {
  const clientesQuery = useAdminClientes();
  const clientes = (clientesQuery.data ?? []) as any[];

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Base</p>
        <h1 className="font-display text-4xl mt-1">Clientes</h1>
      </div>

      {clientes.length === 0 && (
        <p className="text-muted-foreground">Ainda sem clientes registados.</p>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {clientes.map((u) => {
          const initials = String(u?.name ?? "")
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("");

          return (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-card border border-border/60 hover-lift"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-accent/40">
                  <AvatarFallback className="bg-accent/20 text-primary text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/40 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Marcações
                  </p>
                  <p className="font-display text-xl text-primary">{u.count}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Investido
                  </p>
                  <p className="font-display text-xl text-primary">
                    {formatMZN(u.spent)}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-3">
                Desde {formatDate(u.createdAt)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

