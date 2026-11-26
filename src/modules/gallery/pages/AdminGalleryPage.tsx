import { useRef, useState } from "react";
import { Check, Eye, EyeOff, ImagePlus, Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CATEGORY_META } from "@/modules/catalog/data/mock-services";
import { prepararFoto, urlDaApi } from "@/shared/lib/imagem";
import { AdicionarFotosDialog } from "@/modules/gallery/components/AdicionarFotosDialog";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { Skeleton } from "@/shared/ui/skeleton";
import { QueryError } from "@/shared/components/QueryError";
import { FimDaLista } from "@/shared/components/FimDaLista";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { useAdminGaleria, useAtualizarFoto, useCuradoriaFoto, useRemoverFoto, useSubstituirFoto, useSugestoesPendentes } from "@/modules/gallery/hooks/useGalleryApi";
import type { GaleriaItem } from "@/modules/gallery/models";

const CATEGORIAS = Object.entries(CATEGORY_META).map(([valor, m]) => ({ valor, label: m.label }));

export default function AdminGalleryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const separador = searchParams.get("separador") === "sugestoes" ? "sugestoes" : "galeria";
  const mudarSeparador = (s: "galeria" | "sugestoes") => {
    const next = new URLSearchParams(searchParams);
    if (s === "sugestoes") next.set("separador", s); else next.delete("separador");
    setSearchParams(next, { replace: true });
  };
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroPublicado, setFiltroPublicado] = useState<"todas" | "sim" | "nao">("todas");
  const lista = useAdminGaleria(separador === "sugestoes"
    ? { estado: "PENDENTE" }
    : {
        estado: "APROVADA",
        categoria: filtroCategoria,
        publicado: filtroPublicado === "todas" ? undefined : filtroPublicado === "sim",
      });
  const pendentes = useSugestoesPendentes();
  const atualizar = useAtualizarFoto();
  const remover = useRemoverFoto();
  const substituir = useSubstituirFoto();
  const curadoria = useCuradoriaFoto();

  const trocarRef = useRef<HTMLInputElement>(null);
  const [adicionar, setAdicionar] = useState(false);
  const [editar, setEditar] = useState<GaleriaItem | null>(null);
  const [aRemover, setARemover] = useState<GaleriaItem | null>(null);
  const [aRejeitar, setARejeitar] = useState<GaleriaItem | null>(null);
  const [motivo, setMotivo] = useState("");

  async function trocarFoto(ficheiros: FileList | null) {
    const f = ficheiros?.[0];
    if (!f || !editar) return;
    try {
      const atualizado = await substituir.mutateAsync({ id: editar.id, dados: await prepararFoto(f) });
      setEditar((e) => (e ? { ...e, miniaturaUrl: atualizado.miniaturaUrl, imagemUrl: atualizado.imagemUrl } : e));
      toast.success("Foto substituída.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      if (trocarRef.current) trocarRef.current.value = "";
    }
  }

  async function decidir(item: GaleriaItem, acao: "aprovar" | "rejeitar", motivoRejeicao?: string) {
    try {
      await curadoria.mutateAsync({ id: item.id, acao, motivo: motivoRejeicao });
      toast.success(acao === "aprovar" ? "Aprovada e publicada na galeria." : "Sugestão rejeitada.");
      setARejeitar(null);
      setMotivo("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function alternar(item: GaleriaItem, campo: "publicado" | "destaque") {
    try {
      await atualizar.mutateAsync({ id: item.id, titulo: item.titulo, descricao: item.descricao, categoria: item.categoria, [campo]: !item[campo] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function guardarEdicao() {
    if (!editar) return;
    try {
      await atualizar.mutateAsync({
        id: editar.id, titulo: editar.titulo, descricao: editar.descricao, categoria: editar.categoria,
        publicado: editar.publicado, destaque: editar.destaque, ordem: editar.ordem,
      });
      toast.success("Foto atualizada.");
      setEditar(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Site</p>
          <h1 className="font-display text-4xl mt-1">Galeria</h1>
          <p className="text-sm text-muted-foreground mt-1">Os trabalhos que aparecem na página Galeria do site. As destacadas aparecem também na página inicial.</p>
        </div>
        <Button className="rounded-full bg-primary" onClick={() => setAdicionar(true)}>
          <ImagePlus className="h-4 w-4 mr-2" /> Adicionar fotos
        </Button>
      </div>

      <div className="flex gap-2 mb-5" role="tablist">
        {([["galeria", "Galeria"], ["sugestoes", "Sugestões das clientes"]] as const).map(([valor, label]) => (
          <button
            key={valor}
            role="tab"
            aria-selected={separador === valor}
            onClick={() => mudarSeparador(valor)}
            className={cn(
              "h-9 px-4 rounded-full border text-sm inline-flex items-center gap-2",
              separador === valor ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40",
            )}
          >
            {label}
            {valor === "sugestoes" && (pendentes.data ?? 0) > 0 && (
              <span className="text-[10px] min-w-[18px] h-[18px] px-1 rounded-full bg-rose-deep text-white grid place-items-center">{pendentes.data}</span>
            )}
          </button>
        ))}
      </div>

      {separador === "galeria" && <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="h-10 w-[200px]" aria-label="Filtrar por categoria"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {CATEGORIAS.map((c) => <SelectItem key={c.valor} value={c.valor}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroPublicado} onValueChange={(v) => setFiltroPublicado(v as typeof filtroPublicado)}>
          <SelectTrigger className="h-10 w-[160px]" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="sim">Publicadas</SelectItem>
            <SelectItem value="nao">Escondidas</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground self-center">{lista.total} fotos</p>
      </div>}

      {lista.query.isError && <QueryError query={lista.query} className="mb-4" />}

      {lista.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      ) : lista.items.length === 0 ? (
        separador === "sugestoes" ? (
          <div className="p-12 rounded-2xl border border-dashed border-border text-center text-muted-foreground bg-card">
            Sem sugestões por rever. As clientes podem sugerir fotos na página Galeria do site.
          </div>
        ) : (
          <button
            onClick={() => setAdicionar(true)}
            className="w-full p-12 rounded-2xl border-2 border-dashed border-border text-center text-muted-foreground bg-card hover:border-primary/40"
          >
            <ImagePlus className="h-8 w-8 mx-auto mb-2" />
            Ainda sem fotos. Clique para adicionar os primeiros trabalhos.
          </button>
        )
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {lista.items.map((item) => (
            <figure key={item.id} className={cn("group relative rounded-2xl overflow-hidden bg-secondary aspect-square", !item.publicado && "opacity-60")}>
              <img src={urlDaApi(item.miniaturaUrl)} alt={item.titulo ?? "Trabalho do estúdio"} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent" />
              <div className="absolute top-2 left-2 flex gap-1">
                {item.destaque && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold text-midnight font-semibold">Destaque</span>}
                {!item.publicado && <span className="text-[10px] px-2 py-0.5 rounded-full bg-midnight/80 text-white">Escondida</span>}
              </div>
              <figcaption className="absolute bottom-0 inset-x-0 p-3 text-white">
                <p className="text-sm font-medium truncate">{item.titulo ?? "Sem título"}</p>
                <p className="text-[11px] opacity-75 truncate">{CATEGORY_META[item.categoria as keyof typeof CATEGORY_META]?.label ?? item.categoria ?? "—"}</p>
                {separador === "sugestoes" ? (
                  <div className="mt-2">
                    {item.sugeridoPorNome && <p className="text-[11px] opacity-80 mb-1.5">Sugerida por {item.sugeridoPorNome}</p>}
                    <div className="flex gap-1.5">
                      <button onClick={() => decidir(item, "aprovar")} disabled={curadoria.isPending}
                        className="h-7 px-3 rounded-full bg-emerald-500 text-white text-xs font-medium inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Aprovar</button>
                      <button onClick={() => setARejeitar(item)} className="h-7 px-3 rounded-full bg-white/20 text-xs font-medium">Rejeitar</button>
                      <button onClick={() => setEditar(item)} title="Editar antes de aprovar" className="h-7 w-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/30"><Pencil className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ) : (
                <div className="flex gap-1 mt-2">
                  <button onClick={() => alternar(item, "publicado")} title={item.publicado ? "Esconder do site" : "Publicar no site"} className="h-7 w-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/30">
                    {item.publicado ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => alternar(item, "destaque")} title="Destacar na página inicial" className={cn("h-7 w-7 grid place-items-center rounded-full hover:bg-white/30", item.destaque ? "bg-gold text-midnight" : "bg-white/15")}>
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditar(item)} title="Editar" className="h-7 w-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/30">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setARemover(item)} title="Remover" className="h-7 w-7 grid place-items-center rounded-full bg-white/15 hover:bg-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      <FimDaLista hasMore={lista.hasMore} isLoadingMore={lista.isLoadingMore} onLoadMore={lista.loadMore} />

      <Dialog open={!!editar} onOpenChange={(v) => !v && setEditar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Editar foto</DialogTitle>
            <DialogDescription>O título e a descrição aparecem quando a cliente abre a foto no site.</DialogDescription>
          </DialogHeader>
          {editar && (
            <div className="space-y-3">
              <div className="relative">
                <img src={urlDaApi(editar.miniaturaUrl)} alt="" className="w-full max-h-56 object-cover rounded-xl" />
                <input ref={trocarRef} type="file" accept="image/*" hidden onChange={(e) => void trocarFoto(e.target.files)} />
                <Button type="button" size="sm" variant="secondary" className="absolute bottom-2 right-2 rounded-full" disabled={substituir.isPending}
                  onClick={() => trocarRef.current?.click()}>
                  {substituir.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5 mr-1.5" />}
                  Substituir foto
                </Button>
              </div>
              <div>
                <Label htmlFor="g-titulo">Título</Label>
                <Input id="g-titulo" maxLength={120} value={editar.titulo ?? ""} onChange={(e) => setEditar({ ...editar, titulo: e.target.value })} className="h-10 mt-1" />
              </div>
              <div>
                <Label htmlFor="g-desc">Descrição</Label>
                <Textarea id="g-desc" rows={2} maxLength={400} value={editar.descricao ?? ""} onChange={(e) => setEditar({ ...editar, descricao: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={editar.categoria ?? "nenhuma"} onValueChange={(v) => setEditar({ ...editar, categoria: v === "nenhuma" ? null : v })}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhuma">Sem categoria</SelectItem>
                      {CATEGORIAS.map((c) => <SelectItem key={c.valor} value={c.valor}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="g-ordem">Ordem (maior aparece primeiro)</Label>
                  <Input id="g-ordem" type="number" value={editar.ordem} onChange={(e) => setEditar({ ...editar, ordem: Number(e.target.value) || 0 })} className="h-10 mt-1" />
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2 cursor-pointer"><Switch checked={editar.publicado} onCheckedChange={(v) => setEditar({ ...editar, publicado: v })} /> Publicada</label>
                <label className="flex items-center gap-2 cursor-pointer"><Switch checked={editar.destaque} onCheckedChange={(v) => setEditar({ ...editar, destaque: v })} /> Destaque</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="rounded-full bg-primary w-full" disabled={atualizar.isPending} onClick={guardarEdicao}>
              {atualizar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aRemover} onOpenChange={(v) => !v && setARemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta foto?</AlertDialogTitle>
            <AlertDialogDescription>Sai do site e é apagada. Se só a quer esconder por agora, use o botão do olho.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={remover.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!aRemover) return;
                remover.mutateAsync(aRemover.id)
                  .then(() => { toast.success("Foto removida."); setARemover(null); })
                  .catch((err: Error) => toast.error(err.message));
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AdicionarFotosDialog open={adicionar} onOpenChange={setAdicionar} modo="admin" />

      <Dialog open={!!aRejeitar} onOpenChange={(v) => !v && setARejeitar(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Rejeitar sugestão</DialogTitle>
            <DialogDescription>A cliente vê o motivo na área pessoal (opcional).</DialogDescription>
          </DialogHeader>
          <Textarea rows={3} maxLength={200} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: foto pouco nítida" />
          <DialogFooter>
            <Button className="rounded-full w-full" variant="destructive" disabled={curadoria.isPending}
              onClick={() => aRejeitar && decidir(aRejeitar, "rejeitar", motivo.trim() || undefined)}>
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
