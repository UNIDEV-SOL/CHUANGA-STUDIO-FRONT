// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export type StatusFatura = "PENDENTE" | "PAGA" | "ANULADA";

/** Como o cliente pagou a fatura na caixa. */
export type FormaPagamento = "NUMERARIO" | "MPESA" | "EMOLA" | "CARTAO" | "TRANSFERENCIA";

export interface FaturaItem {
  servicoId: string | null;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
}

export interface Fatura {
  id: string;
  numero: string;
  status: StatusFatura;
  marcacaoId: string;
  dataMarcacao: string;
  horaMarcacao: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  clienteNuit: string | null;
  dataEmissao: string;
  subtotal: number;
  desconto: number;
  adiantamentoDeduzido: number;
  descontoFidelizacao?: number;
  valeCodigo?: string | null;
  valorVale?: number;
  totalAPagar: number;
  formaPagamento: FormaPagamento | null;
  referenciaPagamento: string | null;
  pagoEm: string | null;
  observacoes: string | null;
  /** Link público do PDF (sem login), para partilhar. */
  pdfUrl: string;
  itens: FaturaItem[];
}

export interface EmitirFaturaItem {
  servicoId?: string | null;
  descricao?: string;
  precoUnitario?: number;
  quantidade: number;
}

export interface EmitirFaturaRequest {
  itens: EmitirFaturaItem[];
  desconto?: number;
  observacoes?: string;
  /** Preenchido = o cliente já pagou na caixa (a fatura sai como paga). */
  formaPagamento?: FormaPagamento;
  referenciaPagamento?: string;
  clienteNuit?: string;
  aplicarFidelizacao?: boolean;
  codigoVale?: string;
}

// --- Fidelização, vales e avaliações ---

export interface RegistarPagamentoFaturaRequest {
  formaPagamento: FormaPagamento;
  referenciaPagamento?: string;
}
