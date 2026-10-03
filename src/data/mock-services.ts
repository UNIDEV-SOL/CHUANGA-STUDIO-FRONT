import type { Service, ServiceCategory } from "@/types";

// Preços em MZN — valores de referência, admin pode editar.
export const SEED_SERVICES: Service[] = [
  // Mãos
  { id: "s-manicure-tradicional", name: "Manicure Tradicional", category: "maos", price: 350, duration: 45, featured: true, description: "Corte, limagem e polimento clássicos para mãos impecáveis." },
  { id: "s-manicure-spa", name: "Manicure Spa", category: "maos", price: 650, duration: 75, featured: true, description: "Ritual completo com esfoliação, hidratação e massagem." },
  { id: "s-limpeza-unhas", name: "Limpeza das Unhas", category: "maos", price: 200, duration: 30 },
  { id: "s-corte-limagem", name: "Corte e Limagem", category: "maos", price: 150, duration: 20 },
  { id: "s-polimento-unhas", name: "Polimento das Unhas", category: "maos", price: 180, duration: 25 },
  { id: "s-trat-cuticulas", name: "Tratamento das Cutículas", category: "maos", price: 200, duration: 25 },
  { id: "s-esfoliacao-maos", name: "Esfoliação das Mãos", category: "maos", price: 250, duration: 25 },
  { id: "s-hidratacao-maos", name: "Hidratação Profunda das Mãos", category: "maos", price: 300, duration: 30 },
  { id: "s-massagem-maos", name: "Massagem Relaxante das Mãos", category: "maos", price: 350, duration: 30 },
  { id: "s-banho-parafina", name: "Banho de Parafina", category: "maos", price: 400, duration: 35 },

  // Pés
  { id: "s-pedicure-tradicional", name: "Pedicure Tradicional", category: "pes", price: 400, duration: 60, featured: true },
  { id: "s-pedicure-spa", name: "Pedicure Spa", category: "pes", price: 750, duration: 90, featured: true, description: "Escalda-pés aromático, remoção de calos, esfoliação e massagem." },
  { id: "s-limpeza-pes", name: "Limpeza Profunda dos Pés", category: "pes", price: 300, duration: 40 },
  { id: "s-corte-limagem-pes", name: "Corte e Limagem das Unhas", category: "pes", price: 200, duration: 25 },
  { id: "s-trat-cuticulas-pes", name: "Tratamento das Cutículas", category: "pes", price: 220, duration: 25 },
  { id: "s-remocao-calos", name: "Remoção de Calosidades", category: "pes", price: 350, duration: 40 },
  { id: "s-esfoliacao-pes", name: "Esfoliação dos Pés", category: "pes", price: 300, duration: 30 },
  { id: "s-hidratacao-pes", name: "Hidratação Profunda dos Pés", category: "pes", price: 350, duration: 30 },
  { id: "s-massagem-pes", name: "Massagem Relaxante dos Pés", category: "pes", price: 400, duration: 35 },
  { id: "s-calcanhares", name: "Tratamento de Calcanhares Ressecados", category: "pes", price: 380, duration: 35 },

  // Verniz
  { id: "s-verniz-tradicional", name: "Verniz Tradicional", category: "verniz", price: 200, duration: 25 },
  { id: "s-verniz-gel", name: "Verniz Gel", category: "verniz", price: 500, duration: 45, featured: true },
  { id: "s-verniz-semi", name: "Verniz Semi-Permanente", category: "verniz", price: 450, duration: 45 },
  { id: "s-cor-simples", name: "Aplicação de Cor Simples", category: "verniz", price: 250, duration: 30 },
  { id: "s-francesinha", name: "Francesinha", category: "verniz", price: 550, duration: 50, featured: true },
  { id: "s-baby-boomer", name: "Baby Boomer", category: "verniz", price: 600, duration: 55 },
  { id: "s-ombre", name: "Ombré", category: "verniz", price: 600, duration: 55 },
  { id: "s-efeitos-especiais", name: "Efeitos Especiais", category: "verniz", price: 700, duration: 60 },

  // Alongamento
  { id: "s-along-gel", name: "Alongamento em Gel", category: "alongamento", price: 900, duration: 90, featured: true },
  { id: "s-along-acrilico", name: "Alongamento em Pó Acrílico", category: "alongamento", price: 950, duration: 100 },
  { id: "s-fibra-vidro", name: "Fibra de Vidro", category: "alongamento", price: 1000, duration: 100 },
  { id: "s-molde-f1", name: "Molde F1", category: "alongamento", price: 1100, duration: 110 },
  { id: "s-tips", name: "Tips", category: "alongamento", price: 850, duration: 80 },
  { id: "s-polygel", name: "Polygel", category: "alongamento", price: 1050, duration: 100 },

  // Manutenção
  { id: "s-manut-gel", name: "Manutenção de Gel", category: "manutencao", price: 600, duration: 60 },
  { id: "s-manut-acrilico", name: "Manutenção de Acrílico", category: "manutencao", price: 650, duration: 70 },
  { id: "s-manut-polygel", name: "Manutenção de Polygel", category: "manutencao", price: 700, duration: 70 },
  { id: "s-manut-fibra", name: "Manutenção de Fibra", category: "manutencao", price: 700, duration: 70 },
  { id: "s-refill", name: "Preenchimento (Refill)", category: "manutencao", price: 500, duration: 60 },
  { id: "s-correcao-quebras", name: "Correção de Quebras", category: "manutencao", price: 250, duration: 20 },

  // Remoção
  { id: "s-rem-verniz-gel", name: "Remoção de Verniz Gel", category: "remocao", price: 200, duration: 25 },
  { id: "s-rem-gel", name: "Remoção de Gel", category: "remocao", price: 250, duration: 30 },
  { id: "s-rem-acrilico", name: "Remoção de Acrílico", category: "remocao", price: 300, duration: 35 },
  { id: "s-rem-polygel", name: "Remoção de Polygel", category: "remocao", price: 300, duration: 35 },
  { id: "s-rem-fibra", name: "Remoção de Fibra", category: "remocao", price: 300, duration: 35 },
  { id: "s-limpeza-pos-rem", name: "Limpeza Pós-Remoção", category: "remocao", price: 150, duration: 20 },

  // Nail art
  { id: "s-decor-personalizada", name: "Decoração Personalizada", category: "nailart", price: 300, duration: 30, featured: true },
  { id: "s-pedrarias", name: "Pedrarias", category: "nailart", price: 250, duration: 25 },
  { id: "s-glitter", name: "Glitter", category: "nailart", price: 180, duration: 20 },
  { id: "s-foil", name: "Foil", category: "nailart", price: 220, duration: 25 },
  { id: "s-cromado", name: "Cromado", category: "nailart", price: 350, duration: 30 },
  { id: "s-marmore", name: "Mármore", category: "nailart", price: 350, duration: 35 },
  { id: "s-flores", name: "Flores", category: "nailart", price: 300, duration: 30 },
  { id: "s-desenhos", name: "Desenhos Artísticos", category: "nailart", price: 400, duration: 40 },
  { id: "s-adesivos", name: "Adesivos", category: "nailart", price: 150, duration: 15 },
  { id: "s-carimbos", name: "Carimbos", category: "nailart", price: 180, duration: 20 },
  { id: "s-espelhado", name: "Efeito Espelhado", category: "nailart", price: 350, duration: 30 },
  { id: "s-cat-eye", name: "Efeito Cat Eye", category: "nailart", price: 320, duration: 30 },
  { id: "s-aurora", name: "Efeito Aurora", category: "nailart", price: 380, duration: 35 },

  // Tratamentos
  { id: "s-fortalecimento", name: "Fortalecimento das Unhas", category: "tratamentos", price: 400, duration: 40 },
  { id: "s-hidr-cuticulas", name: "Hidratação das Cutículas", category: "tratamentos", price: 250, duration: 25 },
  { id: "s-trat-fracas", name: "Tratamento para Unhas Fracas", category: "tratamentos", price: 450, duration: 45 },
  { id: "s-recuperacao", name: "Recuperação de Unhas Danificadas", category: "tratamentos", price: 500, duration: 50 },
  { id: "s-nutricao", name: "Nutrição das Unhas", category: "tratamentos", price: 350, duration: 35 },
  { id: "s-oleos", name: "Óleos para Cutículas", category: "tratamentos", price: 200, duration: 20 },

  // Especiais
  { id: "s-noivas", name: "Unhas para Noivas", category: "especiais", price: 1500, duration: 120, featured: true, description: "Serviço exclusivo para o seu grande dia, com prova prévia inclusa." },
  { id: "s-festas", name: "Unhas para Festas", category: "especiais", price: 900, duration: 90 },
  { id: "s-formaturas", name: "Unhas para Formaturas", category: "especiais", price: 1000, duration: 100 },
  { id: "s-pacote-eventos", name: "Pacotes para Eventos", category: "especiais", price: 2500, duration: 180 },
  { id: "s-personalizado", name: "Atendimento Personalizado", category: "especiais", price: 1200, duration: 120 },

  // Premium
  { id: "s-spa-maos", name: "Spa das Mãos", category: "premium", price: 800, duration: 80, featured: true },
  { id: "s-spa-pes", name: "Spa dos Pés", category: "premium", price: 900, duration: 90 },
  { id: "s-aromaterapia", name: "Aromaterapia", category: "premium", price: 700, duration: 60 },
  { id: "s-massagem-relax", name: "Massagem Relaxante", category: "premium", price: 850, duration: 60 },
  { id: "s-vip", name: "Atendimento VIP", category: "premium", price: 2000, duration: 150 },
  { id: "s-mensal", name: "Pacote Mensal", category: "premium", price: 3500, duration: 240 },
];

export const CATEGORY_META: Record<
  ServiceCategory,
  { label: string; tagline: string; icon: string }
> = {
  maos: { label: "Cuidados com as Mãos", tagline: "Delicadeza em cada gesto", icon: "✋" },
  pes: { label: "Cuidados com os Pés", tagline: "Do primeiro ao último passo", icon: "🦶" },
  verniz: { label: "Aplicação de Verniz", tagline: "Cor que expressa você", icon: "💅" },
  alongamento: { label: "Alongamento de Unhas", tagline: "Comprimento sob medida", icon: "✨" },
  manutencao: { label: "Manutenção", tagline: "Sempre impecável", icon: "🔄" },
  remocao: { label: "Remoção", tagline: "Cuidado até no final", icon: "🌿" },
  nailart: { label: "Nail Art", tagline: "Arte na ponta dos dedos", icon: "🎨" },
  tratamentos: { label: "Tratamentos", tagline: "Saúde antes da beleza", icon: "🌸" },
  especiais: { label: "Serviços Especiais", tagline: "Para os dias inesquecíveis", icon: "👰" },
  premium: { label: "Serviços Premium", tagline: "A experiência completa", icon: "⭐" },
};
