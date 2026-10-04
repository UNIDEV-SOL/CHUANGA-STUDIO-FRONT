import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Mail, MessageCircle, MessagesSquare, Phone, Receipt, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAbrirConversaComCliente } from "@/hooks/useChatApi";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { formatDate, formatHora, formatMZN, whatsappLink } from "@/lib/format";
import { StatusBadge } from "@/atoms/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAdminClienteDetalhe, useAdminGuardarNotasCliente } from "@/hooks/useAdminApi";

function Numero({ label, valor, alerta }: { label: string; valor: string | number; alerta?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-secondary/40 text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-display text-xl ${alerta ? "text-destructive" : "text-primary"}`}>{valor}</p>
    </div>
  );
}

/** Ficha da cliente para a equipa: contactos, notas internas, números e histórico. */
export function FichaClienteDialog({ clienteId, onOpenChange }: { clienteId: string | null; onOpenChange: (v: boolean) => void }) {
  const ficha = useAdminClienteDetalhe(clienteId);
  const guardar = useAdminGuardarNotasCliente();
  const abrirConversa = useAbrirConversaComCliente();
  const navigate = useNavigate();
  const [notas, setNotas] = useState("");
  const c = ficha.data;

  useEffect(() => {
    setNotas(c?.notasInternas ?? "");
  }, [c?.id, c?.notasInternas]);

  async function guardarNotas() {
    if (!clienteId) return;
    try {
      await guardar.mutateAsync({ id: clienteId, notas });
      toast.success("Notas guardadas.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={!!clienteId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        {!c ? (
          <div className="space-y-3 py-4">
            <DialogTitle className="sr-only">Ficha da cliente</DialogTitle>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl">{c.nome}</DialogTitle>
              <DialogDescription>
                Cliente desde {formatDate(c.criadoEm)}
                {c.ultimaVisita && <> · última visita {formatDate(c.ultimaVisita)}</>}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 text-sm">
              <Button size="sm" variant="outline" className="rounded-full" disabled={abrirConversa.isPending}
                onClick={() => abrirConversa.mutateAsync(c.id).then((id) => navigate(`/admin/mensagens?conversa=${id}`)).catch((e: Error) => toast.error(e.message))}>
                <MessagesSquare className="h-4 w-4 mr-1.5" /> Enviar mensagem pelo site
              </Button>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"><Mail className="h-3 w-3" /> {c.email}</a>
                {c.telefone && (
                  <>
                    <a href={`tel:${c.telefone}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"><Phone className="h-3 w-3" /> {c.telefone}</a>
                    <a href={whatsappLink(c.telefone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary story-link"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Numero label="Marcações" valor={c.totalMarcacoes} />
                <Numero label="Concluídas" valor={c.concluidas} />
                <Numero label="Faltas" valor={c.faltas} alerta={c.faltas > 0} />
                <Numero label="Faturado" valor={formatMZN(c.totalFaturado)} />
              </div>

              {c.faltas > 0 && (
                <p className="text-xs flex gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Faltou {c.faltas} vez{c.faltas > 1 ? "es" : ""} sem avisar.
                </p>
              )}

              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Notas internas (só a equipa vê)</p>
                <Textarea
                  rows={3}
                  maxLength={2000}
                  placeholder="Alergias, formato e cor preferidos, cuidados especiais..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
                <Button size="sm" className="mt-2 rounded-full bg-primary" disabled={guardar.isPending || notas === (c.notasInternas ?? "")} onClick={guardarNotas}>
                  {guardar.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  Guardar notas
                </Button>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Histórico</p>
                {c.marcacoes.length === 0 ? (
                  <p className="text-muted-foreground text-xs">Sem marcações.</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {c.marcacoes.map((m) => (
                      <li key={m.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0">
                          {formatDate(m.data)} · {formatHora(m.hora)}
                          <span className="block text-xs text-muted-foreground truncate">
                            {m.servicos.map((s) => s.nome).join(", ")}{m.profissionalNome && ` · com ${m.profissionalNome}`}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <StatusBadge status={m.status} />
                          <span className="text-primary whitespace-nowrap">{formatMZN(m.valorTotal)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {c.faturas.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Faturas</p>
                  <ul className="space-y-1">
                    {c.faturas.map((f) => (
                      <li key={f.id}>
                        <Link to={`/admin/faturas?id=${f.id}`} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-secondary/40">
                          <span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-rose-deep" /> {f.numero}</span>
                          <span className="flex items-center gap-2">
                            <StatusBadge kind="fatura" status={f.status} />
                            <span className="text-primary">{formatMZN(f.totalAPagar)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
