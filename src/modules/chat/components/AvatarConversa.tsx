import { Megaphone, Sparkles, Store, Users } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { initials } from "@/shared/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { useFotoConversa } from "@/modules/chat/hooks/useChatApi";

interface Props {
  id: string;
  tipo: string;
  titulo: string;
  temFoto?: boolean;
  sistema?: string | null;
  servicoId?: string | null;
  versao?: string | null;
  online?: boolean;
  className?: string;
}

/** Foto do grupo, ou um ícone/iniciais como no WhatsApp; ponto verde quando a pessoa está online. */
export function AvatarConversa({ id, tipo, titulo, temFoto, sistema, servicoId, versao, online, className }: Props) {
  const foto = useFotoConversa(id, !!temFoto, versao);
  const estudio = tipo === "PRIVADA" && titulo === "Chuanga Studio";
  return (
    <span className="relative inline-flex shrink-0">
      <Avatar className={cn("h-11 w-11", className)}>
        {foto.data && <AvatarImage src={foto.data} alt="" className="object-cover" />}
        <AvatarFallback className={cn("text-xs font-semibold",
          tipo === "GRUPO" ? sistema === "AVISOS" ? "bg-gold/30 text-primary" : "bg-primary text-primary-foreground" : "bg-accent/30 text-primary")}>
          {sistema === "AVISOS" ? <Megaphone className="h-4 w-4" />
            : estudio ? <Store className="h-4 w-4" />
            : tipo === "GRUPO" ? servicoId ? <Sparkles className="h-4 w-4" /> : <Users className="h-4 w-4" />
            : initials(titulo)}
        </AvatarFallback>
      </Avatar>
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" aria-label="online" />}
    </span>
  );
}
