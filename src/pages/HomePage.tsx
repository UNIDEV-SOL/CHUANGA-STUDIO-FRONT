import { CtaSection } from "@/home/CtaSection";
import { DifferentialsSection } from "@/home/DifferentialsSection";
import { HeroSection } from "@/home/HeroSection";
import { ManifestoSection } from "@/home/ManifestoSection";
import { PortfolioSection } from "@/home/PortfolioSection";
import { ServicesShowcase } from "@/home/ServicesShowcase";
import { TestemunhosSection } from "@/home/TestemunhosSection";
import { usePaginaTitulo } from "@/lib/seo";

export default function HomePage() {
  usePaginaTitulo(null);
  return (
    <>
      <HeroSection />
      <ManifestoSection />
      <ServicesShowcase />
      <PortfolioSection />
      <TestemunhosSection />
      <DifferentialsSection />
      <CtaSection />
    </>
  );
}