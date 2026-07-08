import { CtaSection } from "@/home/CtaSection";
import { DifferentialsSection } from "@/home/DifferentialsSection";
import { HeroSection } from "@/home/HeroSection";
import { ManifestoSection } from "@/home/ManifestoSection";
import { PortfolioSection } from "@/home/PortfolioSection";
import { ServicesShowcase } from "@/home/ServicesShowcase";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ManifestoSection />
      <ServicesShowcase />
      <PortfolioSection />
      <DifferentialsSection />
      <CtaSection />
    </>
  );
}