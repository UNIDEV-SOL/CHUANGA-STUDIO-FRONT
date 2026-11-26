import portfolioFrench from "@/assets/portfolio-french.jpg";
import portfolioNeon from "@/assets/portfolio-neon.jpg";
import technician from "@/assets/technician.jpg";
import studio from "@/assets/studio-interior.jpg";
import { Link } from "react-router-dom";
import { SectionTitle } from "@/shared/components/SectionTitle";
import { useGaleriaPublica } from "@/modules/gallery/hooks/useGalleryApi";
import { urlDaApi } from "@/shared/lib/imagem";

const TILES = [
  { src: portfolioNeon, label: "Neon French", tall: true },
  { src: technician, label: "Bastidores", tall: false },
  { src: studio, label: "O nosso espaço", tall: false },
  { src: portfolioFrench, label: "French heart", tall: true },
];

export function PortfolioSection() {
  // Fotos destacadas na galeria do painel; enquanto não houver, ficam as imagens de exemplo.
  const destaques = useGaleriaPublica({ destaque: true }, 4);
  const tiles = destaques.items.length >= 2
    ? destaques.items.slice(0, 4).map((g, i) => ({ src: urlDaApi(g.miniaturaUrl), label: g.titulo ?? "Chuanga Studio", tall: i === 0 || i === 3 }))
    : TILES;
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <SectionTitle
          eyebrow="Portfólio"
          title={<>Obras <em className="text-gradient-rose italic">assinadas.</em></>}
          description="Cada conjunto é executado à medida da cliente. Estas são algumas das nossas peças mais recentes."
          className="mb-14"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {tiles.map((t, i) => (
            <figure
              key={i}
              className={`relative overflow-hidden rounded-2xl group animate-fade-up ${t.tall ? "row-span-2 aspect-[3/5]" : "aspect-square md:aspect-[4/5]"}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <img
                src={t.src}
                alt={t.label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-midnight/10 to-transparent" />
              <figcaption className="absolute bottom-4 left-4 right-4 text-porcelain">
                <span className="text-[10px] uppercase tracking-[0.24em] opacity-70">Chuanga Studio</span>
                <p className="font-display text-lg leading-tight mt-0.5">{t.label}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/galeria" className="text-primary story-link text-sm font-medium">Ver a galeria completa →</Link>
        </div>
      </div>
    </section>
  );
}
