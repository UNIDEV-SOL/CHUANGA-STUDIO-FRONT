import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/shared/lib/format";
import { usePaginaTitulo } from "@/shared/lib/seo";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Estrelas } from "@/modules/reviews/components/Estrelas";
import { usePedidoAvaliacao, useResponderAvaliacao } from "@/modules/reviews/hooks/useReviewsApi";

const LEGENDAS = ["", "Não gostei", "Podia ser melhor", "Bom", "Muito bom", "Adorei!"];

/** Página do link enviado por email depois do atendimento (sem login). */
export default function AvaliarPage() {
  usePaginaTitulo("Avaliar o atendimento", { indexar: false });
  const { token = "" } = useParams();
  const [searchParams] = useSearchParams();
  const pedido = usePedidoAvaliacao(token);
  const responder = useResponderAvaliacao(token);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  // As estrelas do email já trazem a nota escolhida (?nota=5).
  useEffect(() => {
    const n = Number(searchParams.get("nota"));
    if (n >= 1 && n <= 5) setNota(n);
  }, [searchParams]);

  async function enviar() {
    try {
      await responder.mutateAsync({ nota, comentario: comentario.trim() || undefined });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <section className="container mx-auto px-4 py-16 md:py-24 max-w-xl">
      {pedido.isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : pedido.isError || !pedido.data ? (
        <div className="text-center">
          <h1 className="font-display text-4xl">Link inválido</h1>
          <p className="text-muted-foreground mt-3">Este link de avaliação não existe ou foi copiado incompleto.</p>
          <Button asChild className="rounded-full mt-6"><Link to="/">Ir para o site</Link></Button>
        </div>
      ) : pedido.data.respondida ? (
        <div className="text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h1 className="font-display text-4xl mt-4">Obrigada, {pedido.data.primeiroNome}!</h1>
          {pedido.data.nota && <Estrelas nota={pedido.data.nota} tamanho="h-6 w-6" className="mt-4" />}
          <p className="text-muted-foreground mt-3">A sua avaliação foi recebida. Até à próxima visita!</p>
          <Button asChild className="rounded-full mt-6 bg-primary"><Link to="/reservar">Marcar a próxima visita</Link></Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-sm text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">A sua opinião</p>
          <h1 className="font-display text-4xl mt-2">Como correu, {pedido.data.primeiroNome}?</h1>
          <p className="text-sm text-muted-foreground mt-2">{formatDate(pedido.data.data)} · {pedido.data.servicos}</p>
          <Estrelas nota={nota} tamanho="h-9 w-9" onEscolher={setNota} className="mt-6" />
          <p className="h-5 text-sm text-rose-deep mt-1">{LEGENDAS[nota]}</p>
          <Textarea rows={4} maxLength={1000} value={comentario} onChange={(e) => setComentario(e.target.value)}
            placeholder="Conte-nos o que gostou (ou o que podemos melhorar). Opcional." className="mt-5 text-left" />
          <Button className="rounded-full bg-primary mt-5 w-full sm:w-auto px-10" disabled={nota === 0 || responder.isPending} onClick={enviar}>
            {responder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar avaliação
          </Button>
          <p className="text-[11px] text-muted-foreground mt-4">Se publicarmos a sua avaliação no site, mostramos só o primeiro nome e a inicial do apelido.</p>
        </div>
      )}
    </section>
  );
}
