// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".
import type { Marcacao } from "@/modules/bookings/models";
import type { Fatura } from "@/modules/invoices/models";

export interface ClienteResumo {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  criadoEm: string;
  provincia: string | null;
  distrito: string | null;
  totalMarcacoes: number;
  totalInvestido: number;
  faltas: number;
}

export interface ClienteDetalhe {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  criadoEm: string;
  notasInternas: string | null;
  totalMarcacoes: number;
  concluidas: number;
  canceladas: number;
  faltas: number;
  totalFaturado: number;
  ultimaVisita: string | null;
  marcacoes: Marcacao[];
  faturas: Fatura[];
}
