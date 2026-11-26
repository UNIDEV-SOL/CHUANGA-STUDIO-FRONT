import { CtaSection } from "@/modules/site/components/CtaSection";
import { DifferentialsSection } from "@/modules/site/components/DifferentialsSection";
import { HeroSection } from "@/modules/site/components/HeroSection";
import { ManifestoSection } from "@/modules/site/components/ManifestoSection";
import { PortfolioSection } from "@/modules/site/components/PortfolioSection";
import { ServicesShowcase } from "@/modules/site/components/ServicesShowcase";
import { TestemunhosSection } from "@/modules/site/components/TestemunhosSection";
import { usePaginaTitulo } from "@/shared/lib/seo";

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