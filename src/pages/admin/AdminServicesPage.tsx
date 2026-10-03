import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { formatMZN } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CATEGORY_META } from "@/data/mock-services";
import { groupByCategory, resolveCategory } from "@/lib/normalizeServico";
import type { Servico, ServicoRequest } from "@/types/api";
import { useAdminEliminarServico, useAdminServicos, useAdminSalvarServico } from "@/hooks/useServicesApi";

interface Draft {
  id?: string;
  nome: string;
  categoria: string;
  descricao: string;
  preco: string;
  duracaoMinutos: string;
  destaque: boolean;
  ativo: boolean;
}

const EMPTY: Draft = {
  nome: "",
  categoria: "maos",
  descricao: "",
  preco: "",
  duracaoMinutos: "30",
  destaque: false,
  ativo: true,
};

// Mesmas regras do ServicoRequest no backend.
const schema = z.object({
  nome: z.string().trim().min(2, "Nome obrigatório."),
  categoria: z.string().trim().min(1, "Categoria obrigatória."),
  descricao: z.string().trim().max(500, "Descrição demasiado longa."),
  preco: z.coerce.number({ invalid_type_error: "Preço inválido." }).positive("O preço deve ser positivo."),
  duracaoMinutos: z.coerce.number({ invalid_type_error: "Duração inválida." }).int("Duração em minutos inteiros.").positive("A duração deve ser positiva."),
  destaque: z.boolean(),
  ativo: z.boolean(),
});

const toDraft = (s: Servico): Draft => ({
  id: s.id,
  nome: s.nome,
  categoria: s.categoria,
  descricao: s.descricao ?? "",
  preco: String(s.preco),
  duracaoMinutos: String(s.duracaoMinutos),
  destaque: s.destaque,
  ativo: s.ativo,
});

export default function AdminServicesPage() {
  const servicosQuery = useAdminServicos();
  const salvar = useAdminSalvarServico();
  const eliminar = useAdminEliminarServico();

  const [editing, setEditing] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<Servico | null>(null);

  // Agrupa pela categoria resolvida — categorias desconhecidas vão para
  // "Outros" em vez de desaparecerem do painel.
  const byCat = useMemo(
    () =>
      groupByCategory(
        (servicosQuery.data ?? []).map((s) => ({ ...s, category: resolveCategory(s.categoria) })),
      ),
    [servicosQuery.data],
  );

  async function save() {
    if (!editing) return;
    const parsed = schema.safeParse(editing);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const payload: ServicoRequest = { ...parsed.data, descricao: parsed.data.descricao || null };
    try {
      await salvar.mutateAsync({ id: editing.id, payload });
      toast.success(editing.id ? "Serviço atualizado." : "Serviço criado.");
      setEditing(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await eliminar.mutateAsync(toDelete.id);
      toast.success("Serviço eliminado.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setToDelete(null);
    }
  }

  // Ao editar um serviço cuja categoria não está no menu, mantém-se a original
  // como opção para não a sobrescrever sem querer.
  const customCategory =
    editing && !(editing.categoria in CATEGORY_META) ? editing.categoria : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Menu do estúdio</p>
          <h1 className="font-display text-4xl mt-1">Serviços</h1>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY })} className="rounded-full bg-primary">
          <Plus className="h-4 w-4 mr-1" /> Novo serviço
        </Button>
      </div>

      {servicosQuery.isError && <QueryError query={servicosQuery} className="mb-4" />}

      {servicosQuery.isLoading && (
        <div className="grid gap-2 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      )}

      {servicosQuery.isSuccess && byCat.length === 0 && (
        <div className="p-10 rounded-2xl border border-dashed border-border text-center text-muted-foreground bg-card">
          Ainda não há serviços. Crie o primeiro.
        </div>
      )}

      <div className="space-y-8">
        {byCat.map(({ cat, meta, items }) => (
          <div key={cat}>
            <h3 className="text-xs uppercase tracking-widest text-rose-deep font-semibold mb-3">
              {meta.icon} {meta.label} <span className="text-muted-foreground">· {items.length}</span>
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              {items.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl bg-card border border-border/60 flex items-center gap-3 ${s.ativo ? "" : "opacity-60"}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{s.nome}</span>
                      {s.destaque && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-accent/30 text-rose-deep">Destaque</span>}
                      {!s.ativo && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground inline-flex items-center gap-1">
                          <EyeOff className="h-2.5 w-2.5" /> Inativo
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.duracaoMinutos} min · {formatMZN(s.preco)}
                      {cat === "outros" && ` · ${s.categoria}`}
                    </p>
                  </div>
                  <button onClick={() => setEditing(toDraft(s))} className="p-2 hover:bg-secondary rounded-lg" aria-label={`Editar ${s.nome}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setToDelete(s)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg" aria-label={`Eliminar ${s.nome}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing?.id ? "Editar" : "Novo"} serviço</DialogTitle>
            <DialogDescription className="sr-only">Formulário do serviço</DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <div>
                <Label htmlFor="sv-nome">Nome</Label>
                <Input id="sv-nome" value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} className="h-10 mt-1" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={editing.categoria} onValueChange={(v) => setEditing({ ...editing, categoria: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {customCategory && <SelectItem value={customCategory}>{customCategory} (atual)</SelectItem>}
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sv-preco">Preço (MZN)</Label>
                  <Input id="sv-preco" type="number" inputMode="decimal" min={1} step="any" value={editing.preco} onChange={(e) => setEditing({ ...editing, preco: e.target.value })} className="h-10 mt-1" />
                </div>
                <div>
                  <Label htmlFor="sv-dur">Duração (min)</Label>
                  <Input id="sv-dur" type="number" inputMode="numeric" min={1} step={5} value={editing.duracaoMinutos} onChange={(e) => setEditing({ ...editing, duracaoMinutos: e.target.value })} className="h-10 mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="sv-desc">Descrição</Label>
                <Textarea id="sv-desc" value={editing.descricao} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border cursor-pointer">
                  <span className="text-sm">Destaque na home</span>
                  <Switch checked={editing.destaque} onCheckedChange={(v) => setEditing({ ...editing, destaque: v })} />
                </label>
                <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border cursor-pointer">
                  <span className="text-sm">Visível no site</span>
                  <Switch checked={editing.ativo} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} />
                </label>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit" className="rounded-full bg-primary" disabled={salvar.isPending}>
                  {salvar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar "{toDelete?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              O serviço deixa de aparecer no site e no painel. Marcações antigas mantêm o histórico.
              Se só quer escondê-lo temporariamente, edite-o e desligue "Visível no site".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmDelete(); }}
              disabled={eliminar.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
