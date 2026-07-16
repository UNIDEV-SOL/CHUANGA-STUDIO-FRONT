import { useMemo, useState } from "react";
import { formatMZN } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_META } from "@/data/mock-services";
import type { Service } from "@/types";
import { uid } from "@/lib/store";
import type { Servico, ServicoRequest } from "@/types/api";
import { useAdminDeleteServico, useAdminServicos, useAdminUpsertServico } from "@/hooks/useServicesApi";

const EMPTY: Service = {
  id: "",
  name: "",
  category: "maos",
  price: 0,
  duration: 30,
  description: "",
  featured: false,
};

export default function AdminServicesPage() {
  // Mantém auth/role intacto via AuthContext atual
  const { isAdmin } = useAuth();

  const { data, isLoading } = useAdminServicos();
  const upsert = useAdminUpsertServico();
  const del = useAdminDeleteServico();

  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const services: Service[] = useMemo(() => {
    const api = (data ?? []) as Servico[];
    // API usa campos: categoria, duracaoMinutos, destaque, ativo, descricao
    // UI usa: category, duration, featured, description
    return api.map((s) => ({
      id: s.id,
      name: s.nome,
      category: s.categoria as any,
      price: s.preco,
      duration: s.duracaoMinutos,
      description: s.descricao ?? "",
      featured: !!s.destaque,
    }));
  }, [data]);

  function startNew() {
    setEditing({ ...EMPTY, id: uid("s") });
    setOpen(true);
  }

  function startEdit(s: Service) {
    setEditing(s);
    setOpen(true);
  }

  function toRequest(s: Service): ServicoRequest {
    return {
      nome: s.name,
      categoria: s.category as any,
      descricao: s.description ?? null,
      preco: s.price,
      duracaoMinutos: s.duration,
      destaque: !!s.featured,
      ativo: true,
    };
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Nome obrigatório");

    try {
      const payload = toRequest(editing);
      if (!editing.id || editing.id.startsWith("s-")) {
        // O backend vai devolver um UUID; mas para manter UI, aceitamos o id local e usamos POST.
        await upsert.mutateAsync({ method: "POST", payload });
        toast.success("Serviço guardado");
      } else {
        await upsert.mutateAsync({ method: "PUT", id: editing.id, payload });
        toast.success("Serviço atualizado");
      }
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Eliminar este serviço?")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Serviço eliminado");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const byCat = useMemo(
    () => Object.entries(CATEGORY_META).map(([cat, meta]) => ({
      cat,
      meta,
      items: services.filter((s) => s.category === cat),
    })),
    [services],
  );

  if (!isAdmin) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Acesso negado.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Menu do estúdio</p>
          <h1 className="font-display text-4xl mt-1">Serviços</h1>
        </div>
        <Button onClick={startNew} className="rounded-full bg-primary" disabled={isLoading}>
          <Plus className="h-4 w-4 mr-1" /> Novo serviço
        </Button>
      </div>

      <div className="space-y-8">
        {byCat.map(({ cat, meta, items }) => (
          <div key={cat}>
            <h3 className="text-xs uppercase tracking-widest text-rose-deep font-semibold mb-3">
              {meta.icon} {meta.label} <span className="text-muted-foreground">· {items.length}</span>
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              {items.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-card border border-border/60 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {s.name} {s.featured && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/30 text-rose-deep">Destaque</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.duration} min · {formatMZN(s.price)}</p>
                  </div>
                  <button onClick={() => startEdit(s)} className="p-2 hover:bg-secondary rounded-lg">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(s.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground italic">Sem serviços nesta categoria.</p>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing?.name ? "Editar" : "Novo"} serviço</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-10 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as any })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_META).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label>Destaque na home</Label>
                  <Switch checked={!!editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço (MZN)</Label>
                  <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="h-10 mt-1" />
                </div>
                <div>
                  <Label>Duração (min)</Label>
                  <Input type="number" value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: Number(e.target.value) })} className="h-10 mt-1" />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button className="rounded-full bg-primary" onClick={save} disabled={upsert.isPending}>
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

