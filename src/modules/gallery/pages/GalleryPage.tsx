import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ImageOff, ImagePlus, X } from "lucide-react";
import { CATEGORY_META } from "@/modules/catalog/data/mock-services";
import { urlDaApi } from "@/shared/lib/imagem";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { FimDaLista } from "@/shared/components/FimDaLista";
import { useGaleriaPublica } from "@/modules/gallery/hooks/useGalleryApi";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { AdicionarFotosDialog } from "@/modules/gallery/components/AdicionarFotosDialog";
import { usePaginaTitulo } from "@/shared/lib/seo";

const CATEGORIAS = Object.entries(CATEGORY_META).map(([valor, m]) => ({ valor, label: m.label }));

export default function GalleryPage() {
  usePaginaTitulo("Galeria", { descricao: "Fotos de unhas feitas no Chuanga Studio em Maputo: alongamentos, nail art, verniz gel e mais." });
  const [categoria, setCategoria] = useState("todas");
  const lista = useGaleriaPublica({ categoria });
  const [aberta, setAberta] = useState<number | null>(null);
  const [sugerir, setSugerir] = useState(false);
  const { user } = useAuth();
  const itens = lista.items;
  const atual = aberta !== null ? itens[aberta] : null;

  const mover = useCallback((delta: number) => {
    setAberta((i) => (i === null ? i : (i + delta + itens.length) % itens.length));
  }, [itens.length]);

  useEffect(() => {
    if (aberta === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") mover(1);
      if (e.key === "ArrowLeft") mover(-1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberta, mover]);

  return (
    <section className="py-16 gradient-hero min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Galeria</p>
          <h1 className="font-display text-4xl md:text-5xl mt-3">
            Trabalhos <em className="text-gradient-rose italic">feitos por nós.</em>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Inspire-se nas unhas que já saíram do estúdio e reserve o seu momento.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[{ valor: "todas", label: "Todas" }, ...CATEGORIAS].map((c) => (
            <button
              key={c.valor}
              onClick={() => setCategoria(c.valor)}
              className={cn(
                "h-9 px-4 rounded-full border text-sm transition",
                categoria === c.valor ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {lista.isLoading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="mb-4 h-56 rounded-2xl break-inside-avoid" />)}
          </div>
        ) : itens.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-border text-center text-muted-foreground bg-card">
            <ImageOff className="h-8 w-8 mx-auto mb-2" />
            Ainda não há fotos nesta categoria.
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {itens.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setAberta(i)}
                className="group relative mb-4 w-full overflow-hidden rounded-2xl break-inside-avoid bg-secondary block"
                style={item.largura && item.altura ? { aspectRatio: `${item.largura} / ${item.altura}` } : undefined}
              >
                <img src={urlDaApi(item.miniaturaUrl)} alt={item.titulo ?? "Trabalho do Chuanga Studio"} loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                {item.titulo && (
                  <span className="absolute inset-x-0 bottom-0 p-3 text-left text-white text-sm bg-gradient-to-t from-midnight/70 to-transparent opacity-0 group-hover:opacity-100 transition">
                    {item.titulo}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <FimDaLista hasMore={lista.hasMore} isLoadingMore={lista.isLoadingMore} onLoadMore={lista.loadMore} />

        <div className="text-center mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full bg-primary px-8 h-11"><Link to="/reservar">Reservar agora</Link></Button>
          {/* Clientes sugerem fotos; a equipa aprova antes de aparecerem aqui. */}
          {user?.role === "admin" ? null : user ? (
            <Button variant="outline" className="rounded-full px-6 h-11" onClick={() => setSugerir(true)}>
              <ImagePlus className="h-4 w-4 mr-2" /> Sugerir uma foto
            </Button>
          ) : (
            <Button asChild variant="outline" className="rounded-full px-6 h-11">
              <Link to="/entrar" state={{ from: "/galeria" }}><ImagePlus className="h-4 w-4 mr-2" /> Entrar para sugerir uma foto</Link>
            </Button>
          )}
        </div>
        <AdicionarFotosDialog open={sugerir} onOpenChange={setSugerir} modo="cliente" />
      </div>

      <Dialog open={!!atual} onOpenChange={(v) => !v && setAberta(null)}>
        <DialogContent className="max-w-5xl p-0 bg-midnight border-none overflow-hidden [&>button]:hidden">
          {atual && (
            <div className="relative">
              <DialogTitle className="sr-only">{atual.titulo ?? "Foto da galeria"}</DialogTitle>
              <DialogDescription className="sr-only">{atual.descricao ?? "Trabalho do Chuanga Studio"}</DialogDescription>
              <img src={urlDaApi(atual.imagemUrl)} alt={atual.titulo ?? ""} className="w-full max-h-[80vh] object-contain bg-midnight" />
              <button onClick={() => setAberta(null)} aria-label="Fechar" className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"><X className="h-5 w-5" /></button>
              {itens.length > 1 && (
                <>
                  <button onClick={() => mover(-1)} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"><ChevronLeft className="h-6 w-6" /></button>
                  <button onClick={() => mover(1)} aria-label="Seguinte" className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"><ChevronRight className="h-6 w-6" /></button>
                </>
              )}
              {(atual.titulo || atual.descricao) && (
                <div className="p-4 text-porcelain">
                  {atual.titulo && <p className="font-display text-xl">{atual.titulo}</p>}
                  {atual.descricao && <p className="text-sm opacity-80 mt-1">{atual.descricao}</p>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
