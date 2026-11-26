
// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export type ServiceCategory =
  | "maos"
  | "pes"
  | "verniz"
  | "alongamento"
  | "manutencao"
  | "remocao"
  | "nailart"
  | "tratamentos"
  | "especiais"
  | "premium";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  duration: number;
  description?: string;
  image?: string;
  featured?: boolean;
}

export interface Servico {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  preco: number;
  duracaoMinutos: number;
  destaque: boolean;
  ativo: boolean;
  /** Dias até ao lembrete de manutenção (null = sem lembrete). */
  manutencaoDias?: number | null;
}

export interface ServicoRequest {
  nome: string;
  categoria: string;
  descricao?: string | null;
  preco: number;
  duracaoMinutos: number;
  manutencaoDias?: number | null;
  destaque: boolean;
  ativo: boolean;
}
