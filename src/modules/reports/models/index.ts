// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export interface RelatorioCaixa {
  inicio: string;
  fim: string;
  faturado: number;
  recebido: number;
  descontos: number;
  adiantamentosDeduzidos: number;
  porReceber: number;
  faturasPorReceber: number;
  atendimentos: number;
  ticketMedio: number;
  marcacoesCanceladas: number;
  porForma: { forma: string; rotulo: string; total: number; quantidade: number }[];
  porDia: { data: string; faturado: number; recebido: number }[];
  topServicos: { descricao: string; quantidade: number; total: number }[];
}

export interface EstatisticasAdmin {
  marcacoesHoje: number;
  receitaDoMes: number;
  totalClientes: number;
  totalCotacoes: number;
}
