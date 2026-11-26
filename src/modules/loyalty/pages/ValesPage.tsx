import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Gift, Loader2, Search } from "lucide-react";
import { formatDate, formatMZN } from "@/shared/lib/format";
import { usePaginaTitulo } from "@/shared/lib/seo";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { consultarVale } from "@/modules/loyalty/hooks/useLoyaltyApi";
import type { SaldoVale } from "@/modules/loyalty/models";

/** Vales-oferta: explica como oferecer e deixa consultar o saldo pelo código. */
export default function ValesPage() {
  usePaginaTitulo("Vales-oferta", {
    descricao: "Ofereça um vale do Chuanga Studio: manicure, pedicure e alongamento de unhas em Maputo. Consulte o saldo do seu vale.",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [codigo, setCodigo] = useState(searchParams.get("codigo") ?? "");
  const [resultado, setResultado] = useState<SaldoVale | null>(null);
  const [erro, setErro] = useState("");
  const [aConsultar, setAConsultar] = useState(false);

  async function consultar(c = codigo) {
    if (!c.trim()) return;
    setAConsultar(true);
    setErro("");
    try {
      setResultado(await consultarVale(c, false));
      setSearchParams({ codigo: c.trim().toUpperCase() }, { replace: true });
    } catch (e) {
      setResultado(null);
      setErro((e as Error).message);
    } finally {
      setAConsultar(false);
    }
  }

  useEffect(() => {
    if (searchParams.get("codigo")) consultar(searchParams.get("codigo")!);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const estado = resultado
    ? resultado.estado === "ANULADO" ? "Anulado"
      : resultado.expirado ? "Expirado"
      : resultado.estado === "ESGOTADO" ? "Já usado" : "Ativo"
    : "";

  return (
    <section className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
      <div className="text-center">
        <Gift className="h-10 w-10 text-primary mx-auto" />
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium mt-4">Ofereça cuidado</p>
        <h1 className="font-display text-5xl mt-2">Vales-oferta</h1>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Um vale do Chuanga Studio é o presente certo para aniversários, Dia da Mulher ou só porque sim.
          Compre no estúdio com o valor que quiser (a partir de 50 MZN); enviamos o código por email a quem o recebe.
          O vale vale 1 ano e pode ser usado em várias visitas até acabar o saldo.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Button asChild className="rounded-full bg-primary"><Link to="/contacto">Pedir um vale</Link></Button>
          <Button asChild variant="outline" className="rounded-full"><Link to="/servicos">Ver serviços</Link></Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 mt-14">
        <h2 className="font-display text-2xl">Consultar o saldo</h2>
        <form className="flex gap-2 mt-4" onSubmit={(e) => { e.preventDefault(); consultar(); }}>
          <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="CHG-XXXX-XXXX" maxLength={20}
            aria-label="Código do vale" className="h-11 font-mono uppercase" />
          <Button type="submit" className="h-11 rounded-full bg-primary" disabled={aConsultar || !codigo.trim()}>
            {aConsultar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">Consultar</span>
          </Button>
        </form>
        {erro && <p className="text-sm text-destructive mt-3">{erro}</p>}
        {resultado && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-primary/40 p-6 text-center">
            <p className="font-mono tracking-widest">{resultado.codigo}</p>
            <p className="font-display text-4xl text-primary mt-2">{formatMZN(resultado.saldo)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {estado}{resultado.validoAte && ` · válido até ${formatDate(resultado.validoAte)}`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
