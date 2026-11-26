import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_META } from "@/modules/catalog/data/mock-services";
import { prepararFoto, tituloDoFicheiro } from "@/shared/lib/imagem";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { useCarregarFoto } from "@/modules/gallery/hooks/useGalleryApi";
import { useSugerirFoto } from "@/modules/gallery/hooks/useGalleryApi";

const CATEGORIAS = Object.entries(CATEGORY_META).map(([valor, m]) => ({ valor, label: m.label }));

interface Escolhida {
  ficheiro: File;
  preview: string;
  titulo: string;
}

/**
 * Mini-formulário para adicionar fotos: escolhe-se, vê-se a pré-visualização, preenche-se e só
 * depois se envia. A equipa publica diretamente; a cliente envia uma sugestão para curadoria.
 */
export function AdicionarFotosDialog({
  open,
  onOpenChange,
  modo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  modo: "admin" | "cliente";
}) {
  const carregar = useCarregarFoto();
  const sugerir = useSugerirFoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<Escolhida[]>([]);
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [publicado, setPublicado] = useState(true);
  const [destaque, setDestaque] = useState(false);
  const [enviando, setEnviando] = useState<{ feito: number; total: number } | null>(null);

  useEffect(() => {
    if (!open) {
      fotos.forEach((f) => URL.revokeObjectURL(f.preview));
      setFotos([]);
      setCategoria("");
      setDescricao("");
      setPublicado(true);
      setDestaque(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const maximo: number = modo === "cliente" ? 3 : 20;

  function escolher(lista: FileList | null) {
    if (!lista) return;
    const novas = Array.from(lista)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, maximo - fotos.length)
      .map((f) => ({ ficheiro: f, preview: URL.createObjectURL(f), titulo: tituloDoFicheiro(f.name) }));
    if (lista.length > novas.length) toast.message(`Máximo de ${maximo} fotos de cada vez.`);
    setFotos((atuais) => [...atuais, ...novas]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function enviar() {
    if (fotos.length === 0) return toast.error("Escolha pelo menos uma foto.");
    setEnviando({ feito: 0, total: fotos.length });
    let ok = 0;
    for (const [i, f] of fotos.entries()) {
      try {
        const dados = await prepararFoto(f.ficheiro);
        if (f.titulo.trim()) dados.append("titulo", f.titulo.trim());
        if (descricao.trim()) dados.append("descricao", descricao.trim());
        if (categoria) dados.append("categoria", categoria);
        if (modo === "admin") {
          dados.append("publicado", String(publicado));
          dados.append("destaque", String(destaque));
          await carregar.mutateAsync(dados);
        } else {
          await sugerir.mutateAsync(dados);
        }
        ok++;
      } catch (e) {
        toast.error((e as Error).message);
      }
      setEnviando({ feito: i + 1, total: fotos.length });
    }
    setEnviando(null);
    if (ok > 0) {
      toast.success(modo === "admin"
        ? `${ok} ${ok === 1 ? "foto adicionada" : "fotos adicionadas"} à galeria.`
        : "Obrigada! A equipa vai ver as fotos antes de as publicar.");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !enviando && onOpenChange(v)}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{modo === "admin" ? "Adicionar fotos" : "Sugerir fotos para a galeria"}</DialogTitle>
          <DialogDescription>
            {modo === "admin"
              ? "Escolha as fotos, dê-lhes um título e envie. Pode carregar várias de uma vez."
              : "Mostre-nos as suas unhas feitas no Chuanga Studio. A equipa revê as fotos antes de as publicar."}
          </DialogDescription>
        </DialogHeader>

        <input ref={inputRef} type="file" accept="image/*" multiple={maximo > 1} hidden onChange={(e) => escolher(e.target.files)} />

        {fotos.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); escolher(e.dataTransfer.files); }}
            className="w-full p-10 rounded-2xl border-2 border-dashed border-border text-center text-muted-foreground hover:border-primary/40"
          >
            <ImagePlus className="h-8 w-8 mx-auto mb-2" />
            Clique ou arraste fotos para aqui
            <span className="block text-xs mt-1">JPG, PNG ou WebP · até {maximo} {maximo === 1 ? "foto" : "fotos"}</span>
          </button>
        ) : (
          <div className="space-y-3">
            {fotos.map((f, i) => (
              <div key={f.preview} className="flex items-center gap-3">
                <img src={f.preview} alt="" className="h-16 w-16 rounded-xl object-cover shrink-0" />
                <Input
                  value={f.titulo}
                  maxLength={120}
                  placeholder="Título (ex.: Alongamento em gel nude)"
                  aria-label={`Título da foto ${i + 1}`}
                  onChange={(e) => setFotos((fs) => fs.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))}
                  className="h-10"
                />
                <Button type="button" variant="ghost" size="icon" aria-label="Retirar foto"
                  onClick={() => { URL.revokeObjectURL(f.preview); setFotos((fs) => fs.filter((_, j) => j !== i)); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fotos.length < maximo && (
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => inputRef.current?.click()}>
                <ImagePlus className="h-4 w-4 mr-1.5" /> Juntar mais fotos
              </Button>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Categoria</Label>
            <Select value={categoria || "nenhuma"} onValueChange={(v) => setCategoria(v === "nenhuma" ? "" : v)}>
              <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Sem categoria</SelectItem>
                {CATEGORIAS.map((c) => <SelectItem key={c.valor} value={c.valor}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {modo === "admin" && (
            <div className="flex items-end gap-6 text-sm pb-2">
              <label className="flex items-center gap-2 cursor-pointer"><Switch checked={publicado} onCheckedChange={setPublicado} /> Publicar já</label>
              <label className="flex items-center gap-2 cursor-pointer"><Switch checked={destaque} onCheckedChange={setDestaque} /> Destaque</label>
            </div>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="fotos-desc">Descrição {fotos.length > 1 && <span className="text-muted-foreground font-normal">(para todas)</span>}</Label>
            <Textarea id="fotos-desc" rows={2} maxLength={400} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="mt-1"
              placeholder={modo === "cliente" ? "Que serviço fez? (opcional)" : "Opcional"} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!enviando}>Cancelar</Button>
          <Button className="rounded-full bg-primary" disabled={!!enviando || fotos.length === 0} onClick={enviar}>
            {enviando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
            {enviando ? `A enviar ${enviando.feito}/${enviando.total}...` : modo === "admin" ? `Adicionar ${fotos.length || ""}`.trim() : "Enviar sugestão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
