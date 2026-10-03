// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export type PapelUsuario = "ADMIN" | "CLIENTE";

export type StatusMarcacao =
  | "AGUARDA_CONFIRMACAO"
  | "CONFIRMADA"
  | "CONCLUIDA"
  | "CANCELADA";

export type MetodoPagamento = "MPESA" | "EMOLA";

export type StatusCotacao = "NOVO" | "RESPONDIDO" | "ARQUIVADO";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  papel: PapelUsuario;
  contaAtiva: boolean;
  criadoEm: string;
}

export interface AutenticacaoResponse {
  token: string;
  usuario: Usuario;
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
}

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
  servicos: MarcacaoServicoItem[];
}

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

export interface ClienteResumo {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  criadoEm: string;
  totalMarcacoes: number;
  totalInvestido: number;
}

export interface EstatisticasAdmin {
  marcacoesHoje: number;
  receitaDoMes: number;
  totalClientes: number;
  totalCotacoes: number;
}

export interface ApiResponse<T> {
  sucesso: boolean;
  mensagem?: string | null;
  dados: T;
  timestamp: string;
}

export interface ServicoRequest {
  nome: string;
  categoria: string;
  descricao?: string | null;
  preco: number;
  duracaoMinutos: number;
  destaque: boolean;
  ativo: boolean;
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
}

export interface CriarCotacaoRequest {
  nome: string;
  telefone: string;
  email?: string | null;
  mensagem?: string | null;
  servicosIds: string[];
}

export interface CadastroRequest {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}
