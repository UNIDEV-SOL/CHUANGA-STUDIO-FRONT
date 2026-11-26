// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export type StatusCotacao = "NOVO" | "RESPONDIDO" | "ARQUIVADO";

export interface Cotacao {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  mensagem: string | null;
  totalEstimado: number;
  status: StatusCotacao;
  criadoEm: string;
  servicosNomes: string[];
}

export interface CriarCotacaoRequest {
  nome: string;
  telefone: string;
  email?: string | null;
  mensagem?: string | null;
  servicosIds: string[];
}
