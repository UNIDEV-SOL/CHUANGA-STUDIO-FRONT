import { useState } from "react";
import { formatMZN, formatDate } from "@/lib/format";
import { StatusBadge } from "@/atoms/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Trash2, Check, Clock, Phone, User } from "lucide-react";
import type { BookingStatus } from "@/types";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { bookingsStore, deleteBooking, servicesStore, updateBooking } from "@/data/store";

const STATUS_OPTIONS: { v: BookingStatus | "todas"; label: string }[] = [
  { v: "todas", label: "Todas" },
  { v: "aguardando_pagamento", label: "Aguarda pagamento" },
  { v: "confirmada", label: "Confirmada" },
  { v: "pendente_ausencia", label: "Reserva pendente (não veio)" },
  { v: "concluida", label: "Concluída" },
  { v: "cancelada", label: "Cancelada" },
];

export default function AdminBookingsPage() {
  const bookings = bookingsStore.useValue();
  const services = servicesStore.useValue();
  const [status, setStatus] = useState<BookingStatus | "todas">("todas");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = bookings
    .filter((b) => status === "todas" || b.status === status)
    .filter((b) => !q || b.clientName.toLowerCase().includes(q.toLowerCase()) || b.clientPhone.includes(q))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const open = openId ? bookings.find((b) => b.id === openId) : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Agenda</p>
          <h1 className="font-display text-4xl mt-1">Marcações</h1>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar cliente ou telefone..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger className="w-[220px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Cliente</th>
              <th className="text-left px-5 py-3">Data</th>
              <th className="text-left px-5 py-3">Serviços</th>
              <th className="text-left px-5 py-3">Estado</th>
              <th className="text-right px-5 py-3">Total</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma marcação.</td></tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id} className="border-t border-border/40 hover:bg-secondary/20 cursor-pointer" onClick={() => setOpenId(b.id)}>
                <td className="px-5 py-4">
                  <p className="font-medium">{b.clientName}</p>
                  <p className="text-xs text-muted-foreground">{b.clientPhone}</p>
                </td>
                <td className="px-5 py-4">
                  <p>{formatDate(b.date)}</p>
                  <p className="text-xs text-muted-foreground">{b.time}</p>
                </td>
                <td className="px-5 py-4 text-xs max-w-[240px]">
                  <span className="line-clamp-2">
                    {b.serviceIds.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(", ")}
                  </span>
                </td>
                <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-4 text-right font-display text-primary">{formatMZN(b.totalPrice)}</td>
                <td className="px-5 py-4 text-right text-muted-foreground text-xs">→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Marcação #{open.id.slice(-6)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-accent/20 text-rose-deep grid place-items-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{open.clientName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {open.clientPhone}</p>
                  </div>
                  <StatusBadge status={open.status} />
                </div>
                <div className="p-4 rounded-xl bg-secondary/40">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1"><Clock className="inline h-3 w-3 mr-1" /> Quando</p>
                  <p className="font-display text-lg">{formatDate(open.date)} · {open.time}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Serviços</p>
                  <ul className="space-y-1">
                    {open.serviceIds.map((id:any) => {
                      const s = services.find((x:any) => x.id === id);
                      return s ? <li key={id} className="flex justify-between"><span>{s.name}</span><span className="text-primary">{formatMZN(s.price)}</span></li> : null;
                    })}
                  </ul>
                  <div className="border-t border-dashed border-border mt-3 pt-3 flex justify-between font-display text-lg">
                    <span>Total</span><span className="text-primary">{formatMZN(open.totalPrice)}</span>
                  </div>
                </div>
                {open.notes && (
                  <div className="p-3 rounded-lg bg-accent/10 text-sm italic">
                    "{open.notes}"
                  </div>
                )}
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">Adiantamento (150 MT)</p>
                  <p className="text-sm">
                    {open.advancePaid ? "✓ Confirmado" : open.advanceProof ? `Referência: ${open.advanceProof}` : "Não enviado"}
                  </p>
                  {!open.advancePaid && open.advanceProof && (
                    <Button size="sm" className="mt-2 rounded-full bg-primary" onClick={() => { updateBooking(open.id, { advancePaid: true, status: "confirmada" }); toast.success("Pagamento confirmado"); }}>
                      <Check className="h-3 w-3 mr-1" /> Confirmar pagamento
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Select value={open.status} onValueChange={(v) => { updateBooking(open.id, { status: v as BookingStatus }); toast.success("Estado atualizado"); }}>
                    <SelectTrigger className="flex-1 min-w-[200px] h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((s) => s.v !== "todas").map((s) => (
                        <SelectItem key={s.v} value={s.v as string}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="icon" onClick={() => { deleteBooking(open.id); toast.success("Marcação eliminada"); setOpenId(null); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
