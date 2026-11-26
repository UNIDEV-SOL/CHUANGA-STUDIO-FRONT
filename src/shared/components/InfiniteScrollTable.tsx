import * as React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * Tabela com scroll infinito (adaptada do InfiniteScrollTable do SPO-FRONT):
 * carrega a página seguinte ao chegar perto do fim, e enche o ecrã sozinha se a primeira página for curta.
 */
export interface InfiniteTableColumn<T> {
  id: string;
  label: React.ReactNode;
  minWidth?: number;
  align?: "left" | "right" | "center";
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: InfiniteTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: React.ReactNode;
  /** Altura máxima da área com scroll (o cabeçalho fica fixo). */
  maxHeight?: string;
  total?: number;
}

const alinhamento = (a?: "left" | "right" | "center") =>
  a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

export function InfiniteScrollTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  emptyMessage = "Nenhum registo encontrado.",
  maxHeight = "calc(100vh - 290px)",
  total,
}: Props<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const carregarMais = React.useCallback(() => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;
    onLoadMore();
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Primeira página não enche a área? Pede a seguinte (senão nunca haveria scroll).
  React.useEffect(() => {
    const el = containerRef.current;
    if (el && hasMore && !isLoadingMore && el.scrollHeight <= el.clientHeight) carregarMais();
  }, [data.length, hasMore, isLoadingMore, carregarMais]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const aoRolar = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) carregarMais();
    };
    el.addEventListener("scroll", aoRolar, { passive: true });
    return () => el.removeEventListener("scroll", aoRolar);
  }, [carregarMais]);

  return (
    <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
      <div ref={containerRef} style={{ maxHeight, minHeight: 240 }} className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.id} style={{ minWidth: c.minWidth }} className={cn("px-5 py-3 font-medium", alinhamento(c.align))}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              <>
                {data.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => e.key === "Enter" && onRowClick(row) : undefined}
                    className={cn(
                      "border-t border-border/40",
                      onRowClick && "hover:bg-secondary/30 cursor-pointer focus-visible:outline-none focus-visible:bg-secondary/40",
                    )}
                  >
                    {columns.map((c) => (
                      <td key={c.id} className={cn("px-5 py-3.5 align-middle", alinhamento(c.align), c.className)}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
                {isLoadingMore && (
                  <tr>
                    <td colSpan={columns.length} className="py-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="inline h-4 w-4 mr-2 animate-spin" /> A carregar mais registos...
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {total !== undefined && data.length > 0 && (
        <div className="px-5 py-2.5 border-t border-border/40 text-xs text-muted-foreground flex justify-between">
          <span>A mostrar {data.length} de {total}</span>
          {!hasMore && data.length >= total && <span>Fim da lista</span>}
        </div>
      )}
    </div>
  );
}
