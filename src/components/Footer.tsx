import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Clock, Heart } from "lucide-react";
import { Logo } from "@/atoms/Logo";

export function Footer() {
  return (
    <footer className="mt-24 gradient-ink text-porcelain">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo tone="light" />
          <p className="mt-5 text-porcelain/75 max-w-md leading-relaxed">
            A beleza que realça a sua essência. No Chuanga Studio cuidamos de
            cada detalhe para que se sinta única, confiante e ainda mais especial.
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-accent">
            Aqui, tem Deus em cada detalhe
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg text-porcelain mb-4">Estúdio</h4>
          <ul className="space-y-3 text-sm text-porcelain/75">
            <li className="flex gap-2.5 items-start"><MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" /> Maputo – Moçambique</li>
            <li className="flex gap-2.5 items-start"><Phone className="h-4 w-4 mt-0.5 text-accent shrink-0" /> +258 84 123 4567</li>
            <li className="flex gap-2.5 items-start"><Clock className="h-4 w-4 mt-0.5 text-accent shrink-0" /> Seg – Sáb · 8h00 às 19h00</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg text-porcelain mb-4">Navegar</h4>
          <ul className="space-y-2.5 text-sm text-porcelain/75">
            <li><Link to="/servicos" className="story-link">Serviços</Link></li>
            <li><Link to="/sobre" className="story-link">O Estúdio</Link></li>
            <li><Link to="/reservar" className="story-link">Reservar</Link></li>
            <li><Link to="/cotacao" className="story-link">Cotação online</Link></li>
            <li><Link to="/contacto" className="story-link">Contacto</Link></li>
          </ul>
          <div className="flex gap-3 mt-6">
            <a href="#" aria-label="Instagram" className="h-9 w-9 grid place-items-center rounded-full border border-porcelain/20 hover:bg-accent hover:border-accent hover:text-primary transition">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className="h-9 w-9 grid place-items-center rounded-full border border-porcelain/20 hover:bg-accent hover:border-accent hover:text-primary transition">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-porcelain/10">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-porcelain/60">
          <span>© {new Date().getFullYear()} Chuanga Studio · Angela Mazive</span>
          <span className="flex items-center gap-1.5">
            Feito com <Heart className="h-3 w-3 fill-accent text-accent" /> em Maputo
          </span>
        </div>
      </div>
    </footer>
  );
}
