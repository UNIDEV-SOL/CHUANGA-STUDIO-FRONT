import { Building2, Code2, Mail, MapPin, Phone, UserRound } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/shared/ui/dialog";

const LINHAS = [
  { icon: Building2, titulo: "Propriedade & Edição", valor: "Chuanga Studio" },
  { icon: MapPin, titulo: "Sede & Endereço", valor: "Maputo – Moçambique" },
  {
    icon: Phone,
    titulo: "Contacto Oficial",
    valor: (
      <>
        <a href="tel:+258846589542" className="story-link">(+258) 84 658 9542</a>
        {" / "}
        <a href="mailto:unidevsolutions.tech@gmail.com" className="story-link">unidevsolutions.tech@gmail.com</a>
      </>
    ),
  },
  { icon: UserRound, titulo: "Responsável do Sistema", valor: "Angela Mazive" },
  { icon: Code2, titulo: "Equipa de Desenvolvimento", valor: "Unidev Solutions" },
];

/** Ficha técnica do site, aberta a partir do rodapé. */
export function FichaTecnicaDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="story-link">Ficha Técnica</button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Chuanga Studio</p>
          <DialogTitle className="font-display text-3xl">Ficha Técnica</DialogTitle>
          <DialogDescription className="sr-only">Propriedade, contactos e equipa responsável pelo site</DialogDescription>
        </DialogHeader>
        <dl className="divide-y divide-border">
          {LINHAS.map(({ icon: Icone, titulo, valor }) => (
            <div key={titulo} className="py-3.5 flex gap-3">
              <span className="h-9 w-9 shrink-0 rounded-full bg-accent/20 text-rose-deep grid place-items-center">
                <Icone className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{titulo}</dt>
                <dd className="text-sm font-medium mt-0.5 break-words">{valor}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
          <Mail className="h-3 w-3" /> Para assuntos técnicos do site, use o contacto oficial acima.
        </p>
      </DialogContent>
    </Dialog>
  );
}
