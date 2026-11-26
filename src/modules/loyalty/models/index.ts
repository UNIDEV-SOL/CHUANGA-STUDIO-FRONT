// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export interface FidelizacaoConfig {
  ativo: boolean;
  visitasPorRecompensa: number;
  valorRecompensa: number;
}

export interface EstadoFidelizacao {
  ativo: boolean;
  visitas: number;
  visitasPorRecompensa: number;
  carimbos: number;
  recompensasDisponiveis: number;
  valorRecompensa: number;
}

export type EstadoVale = "ATIVO" | "ESGOTADO" | "ANULADO";

export interface Vale {
  id: string;
  codigo: string;
  valorInicial: number;
  saldo: number;
  compradorNome: string | null;
  compradorContacto: string | null;
  beneficiarioNome: string | null;
  beneficiarioEmail: string | null;
  mensagem: string | null;
  validoAte: string | null;
  estado: EstadoVale;
  expirado: boolean;
  criadoEm: string;
}

export interface SaldoVale {
  codigo: string;
  saldo: number;
  validoAte: string | null;
  estado: EstadoVale;
  expirado: boolean;
}

export interface CriarValeRequest {
  valor: number;
  compradorNome?: string;
  compradorContacto?: string;
  beneficiarioNome?: string;
  beneficiarioEmail?: string;
  mensagem?: string;
  validoAte?: string;
}
