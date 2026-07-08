import { formatMZN, relative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Check, Archive, Phone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { quotationsStore, servicesStore, updateQuotation } from "@/data/store";

export default function AdminQuotationsPage() {
  const quotations = quotationsStore.useValue();
  const services = servicesStore.useValue();

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Interesse</p>
        <h1 className="font-display text-4xl mt-1">Cotações</h1>
      </div>
      {quotations.length === 0 && (
        <div className="p-10 rounded-2xl border border-dashed border-border text-center text-muted-foreground bg-card">
          Ainda não recebeu cotações.
        </div>
      )}
      <div className="space-y-3">
        {quotations.map((q) => (
          <div key={q.id} className={cn(
            "p-5 rounded-2xl border transition",
            q.status === "novo" ? "bg-accent/5 border-accent/40" : "bg-card border-border/60",
          )}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{q.clientName}</p>
                  {q.status === "novo" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-deep text-white uppercase tracking-widest">Novo</span>}
                  {q.status === "respondido" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700">Respondido</span>}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <Phone className="h-3 w-3" /> {q.clientPhone}
                  {q.clientEmail && <span>· {q.clientEmail}</span>}
                  <span>· {relative(q.createdAt)}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl text-primary">{formatMZN(q.estimatedTotal)}</p>
                <p className="text-xs text-muted-foreground">{q.serviceIds.length} serviço(s)</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {q.serviceIds.slice(0, 6).map((id) => {
                const s = services.find((x) => x.id === id);
                return s ? <span key={id} className="text-[11px] bg-secondary px-2 py-0.5 rounded-full">{s.name}</span> : null;
              })}
              {q.serviceIds.length > 6 && <span className="text-[11px] text-muted-foreground">+{q.serviceIds.length - 6}</span>}
            </div>
            {q.message && <p className="text-sm text-muted-foreground italic mt-3">"{q.message}"</p>}
            <div className="mt-4 flex gap-2">
              {q.status !== "respondido" && (
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => { updateQuotation(q.id, { status: "respondido" }); toast.success("Marcado como respondido"); }}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Marcar respondido
                </Button>
              )}
              {q.status !== "arquivado" && (
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { updateQuotation(q.id, { status: "arquivado" }); toast.success("Arquivado"); }}>
                  <Archive className="h-3.5 w-3.5 mr-1" /> Arquivar
                </Button>
              )}
              <a href={`https://wa.me/${q.clientPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <Button size="sm" className="rounded-full bg-primary">Responder no WhatsApp</Button>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
