import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

/** Aviso mostrado quando o catálogo vem do menu local (API indisponível). */
export function OfflineNotice() {
  return (
    <div className="mb-5 p-3 rounded-xl border border-gold/40 bg-gold/10 text-sm flex gap-2 items-start">
      <AlertTriangle className="h-4 w-4 mt-0.5 text-gold shrink-0" />
      <span>
        Não foi possível ligar ao servidor. Está a ver o menu de referência — os pedidos online ficam
        disponíveis assim que a ligação voltar. Pode também{" "}
        <Link to="/contacto" className="text-primary story-link">contactar-nos diretamente</Link>.
      </span>
    </div>
  );
}
