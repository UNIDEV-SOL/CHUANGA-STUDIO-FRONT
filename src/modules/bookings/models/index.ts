// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".
import type { StatusFatura } from "@/modules/invoices/models";

export type StatusMarcacao =
  | "AGUARDA_CONFIRMACAO"
  | "CONFIRMADA"
  | "CONCLUIDA"
  | "CANCELADA"
  | "NAO_COMPARECEU";

export type MetodoPagamento = "MPESA" | "EMOLA";

export interface MarcacaoServicoItem {
  servicoId: string;
  nome: string;
  preco: number;
}

export interface Marcacao {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  data: string;
  hora: string;
  status: StatusMarcacao;
  valorTotal: number;
  valorAdiantamento: number;
  adiantamentoPago: boolean;
  metodoPagamento: MetodoPagamento | null;
  /** Soma das durações dos serviços. */
  duracaoMinutos: number;
  profissionalId?: string | null;
  profissionalNome?: string | null;
  // Só na lista do painel:
  faturaId?: string;
  faturaNumero?: string;
  faturaStatus?: StatusFatura;
  clienteFaltas?: number;
  servicos: MarcacaoServicoItem[];
}

export interface CriarMarcacaoRequest {
  servicosIds: string[];
  data: string; // yyyy-MM-dd
  hora: string; // HH:mm
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
  metodoPagamento: MetodoPagamento;
  referenciaPagamento: string;
  profissionalId?: string;
  provinciaId?: number;
  distritoId?: number;
}
