// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export interface Avaliacao {
  id: string;
  clienteNome: string;
  nota: number | null;
  comentario: string | null;
  respondidaEm: string | null;
  publicada: boolean;
  dataAtendimento: string;
  servicos: string;
}

export interface ResumoAvaliacoes {
  media: number;
  total: number;
}

export interface PedidoAvaliacao {
  primeiroNome: string;
  data: string;
  servicos: string;
  respondida: boolean;
  nota: number | null;
}
