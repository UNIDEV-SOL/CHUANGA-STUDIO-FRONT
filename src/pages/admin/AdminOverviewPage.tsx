import { useEffect, useMemo, useState } from "react";
import { formatMZN, formatTime, relative } from "@/lib/format";
import { StatusBadge } from "@/atoms/StatusBadge";
import { Calendar, TrendingUp, Users, MessageSquare, Radio } from "lucide-react";
import { bookingsStore, quotationsStore, servicesStore, usersStore } from "@/data/store";

export default function AdminOverviewPage() {
  const bookings = bookingsStore.useValue();
  const services = servicesStore.useValue();
  const quotations = quotationsStore.useValue();
  const users = usersStore.useValue();
  const [pulse, setPulse] = useState(false);

  // Realtime pulse — visual indicator that the panel is live
  useEffect(() => {
    const id = setInterval(() => { setPulse((p) => !p); }, 1500);
    return () => clearInterval(id);
  }, []);

  const today = new Date().toDateString();
  const todaysBookings = bookings.filter((b) => new Date(b.date).toDateString() === today);
  const revenueMonth = useMemo(() => {
    const m = new Date().getMonth();
    return bookings
      .filter((b) => new Date(b.date).getMonth() === m && b.status !== "cancelada")
      .reduce((sum, b) => sum + b.totalPrice, 0);
  }, [bookings]);
  const clientsCount = users.filter((u) => u.role === "cliente").length;

  const stats = [
    { icon: Calendar, label: "Marcações hoje", value: todaysBookings.length, tone: "accent" },
    { icon: TrendingUp, label: "Receita do mês", value: formatMZN(revenueMonth), tone: "primary" },
    { icon: Users, label: "Clientes", value: clientsCount, tone: "sky" },
    { icon: MessageSquare, label: "Cotações", value: quotations.length, tone: "gold" },
  ];

  const upcoming = bookings
    .filter((b) => new Date(b.date).getTime() > Date.now() && b.status !== "cancelada")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  const recentActivity = bookings.slice(0, 8);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Painel do estúdio</p>
          <h1 className="font-display text-4xl mt-1">Visão geral</h1>
        </div>
        <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition ${pulse ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700" : "border-border bg-card"}`}>
          <Radio className={`h-3.5 w-3.5 ${pulse ? "text-emerald-600 animate-pulse" : ""}`} /> Em tempo real
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="p-6 rounded-2xl bg-card border border-border/60 hover-lift">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
              <div className="h-9 w-9 rounded-xl bg-accent/20 text-rose-deep grid place-items-center">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-3xl mt-3">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="p-6 rounded-2xl bg-card border border-border/60">
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">Próximas marcações</h3>
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Sem marcações futuras.</p>}
          <div className="space-y-3">
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 hover:border-primary/30 transition">
                <div className="text-center min-w-[56px]">
                  <p className="font-display text-2xl text-primary leading-none">{new Date(b.date).getDate()}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {new Intl.DateTimeFormat("pt-PT", { month: "short" }).format(new Date(b.date))}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.clientName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {b.time} · {b.serviceIds.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={b.status} />
                  <p className="text-xs text-muted-foreground mt-1">{formatMZN(b.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/60">
          <h3 className="font-display text-xl mb-4">Atividade recente</h3>
          <ul className="space-y-3">
            {recentActivity.map((b) => (
              <li key={b.id} className="flex items-start gap-3 text-sm">
                <div className="h-2 w-2 mt-2 rounded-full bg-accent" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    <span className="font-medium">{b.clientName}</span>{" "}
                    <span className="text-muted-foreground">reservou</span>{" "}
                    {b.serviceIds.length} serviço(s)
                  </p>
                  <p className="text-[11px] text-muted-foreground">{relative(b.createdAt)} · {formatTime(b.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
