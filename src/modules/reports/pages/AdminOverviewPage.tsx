import { Link } from "react-router-dom";
import { Calendar, TrendingUp, Users, MessageSquare, ArrowUpRight } from "lucide-react";
import { formatDate, formatDay, formatHora, formatMZN, formatMonthShort } from "@/shared/lib/format";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Skeleton } from "@/shared/ui/skeleton";
import { QueryError } from "@/shared/components/QueryError";
import { useAdminAtividadeRecente, useAdminEstatisticas, useAdminMarcacoesProximas } from "@/modules/reports/hooks/useReportsApi";

export default function AdminOverviewPage() {
  const estatisticasQuery = useAdminEstatisticas();
  const proximasQuery = useAdminMarcacoesProximas();
  const recentesQuery = useAdminAtividadeRecente();

  const e = estatisticasQuery.data;
  const stats = [
    { icon: Calendar, label: "Marcações hoje", value: e?.marcacoesHoje ?? 0, to: "/admin/marcacoes" },
    { icon: TrendingUp, label: "Receita do mês", value: formatMZN(e?.receitaDoMes), to: "/admin/marcacoes" },
    { icon: Users, label: "Clientes", value: e?.totalClientes ?? 0, to: "/admin/clientes" },
    { icon: MessageSquare, label: "Cotações", value: e?.totalCotacoes ?? 0, to: "/admin/cotacoes" },
  ];

  const upcoming = (proximasQuery.data ?? []).slice(0, 6);
  const recentActivity = (recentesQuery.data ?? []).slice(0, 8);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Painel do estúdio</p>
          <h1 className="font-display text-4xl mt-1">Visão geral</h1>
        </div>
        <span
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          title="Os dados são atualizados automaticamente a cada 30 segundos"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Em tempo real
        </span>
      </div>

      {estatisticasQuery.isError && <QueryError query={estatisticasQuery} className="mb-6" />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="p-6 rounded-2xl bg-card border border-border/60 hover-lift block">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
              <div className="h-9 w-9 rounded-xl bg-accent/20 text-rose-deep grid place-items-center">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            {estatisticasQuery.isLoading ? (
              <Skeleton className="h-9 w-24 mt-3" />
            ) : (
              <p className="font-display text-3xl mt-3 truncate">{s.value}</p>
            )}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="p-6 rounded-2xl bg-card border border-border/60 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl">Próximas marcações</h3>
            <Link to="/admin/marcacoes" className="text-xs text-primary story-link inline-flex items-center gap-1">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {proximasQuery.isLoading && <ListSkeleton />}
          {proximasQuery.isError && <QueryError query={proximasQuery} />}
          {proximasQuery.isSuccess && upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem marcações futuras.</p>
          )}
          <div className="space-y-3">
            {upcoming.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 hover:border-primary/30 transition">
                <div className="text-center min-w-[56px]">
                  <p className="font-display text-2xl text-primary leading-none">{formatDay(m.data)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{formatMonthShort(m.data)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.clienteNome}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatHora(m.hora)} · {m.servicos.map((s) => s.nome).join(", ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={m.status} />
                  <p className="text-xs text-muted-foreground mt-1">{formatMZN(m.valorTotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/60 min-w-0">
          <h3 className="font-display text-xl mb-4">Atividade recente</h3>
          {recentesQuery.isLoading && <ListSkeleton />}
          {recentesQuery.isError && <QueryError query={recentesQuery} />}
          {recentesQuery.isSuccess && recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground">Ainda sem reservas.</p>
          )}
          <ul className="space-y-3">
            {recentActivity.map((m) => (
              <li key={m.id} className="flex items-start gap-3 text-sm">
                <div className="h-2 w-2 mt-2 rounded-full bg-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    <span className="font-medium">{m.clienteNome}</span>{" "}
                    <span className="text-muted-foreground">reservou</span>{" "}
                    {m.servicos.length} {m.servicos.length === 1 ? "serviço" : "serviços"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    para {formatDate(m.data)} às {formatHora(m.hora)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
    </div>
  );
}
