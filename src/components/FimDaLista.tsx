import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

/** Sentinela para grelhas com scroll infinito: pede mais quando fica visível. */
export function FimDaLista({ hasMore, isLoadingMore, onLoadMore }: { hasMore: boolean; isLoadingMore: boolean; onLoadMore: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver((entradas) => {
      if (entradas[0]?.isIntersecting && !isLoadingMore) onLoadMore();
    }, { rootMargin: "300px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);
  return (
    <div ref={ref} className="py-6 text-center text-sm text-muted-foreground">
      {isLoadingMore && <><Loader2 className="inline h-4 w-4 mr-2 animate-spin" /> A carregar mais...</>}
    </div>
  );
}
