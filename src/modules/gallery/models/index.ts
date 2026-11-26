// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export interface GaleriaItem {
  id: string;
  titulo: string | null;
  descricao: string | null;
  categoria: string | null;
  largura: number | null;
  altura: number | null;
  ordem: number;
  publicado: boolean;
  destaque: boolean;
  estado: "PENDENTE" | "APROVADA" | "REJEITADA";
  sugeridoPorNome: string | null;
  motivoRejeicao: string | null;
  /** Caminhos relativos à API (/api/publico/galeria/...). */
  imagemUrl: string;
  miniaturaUrl: string;
  criadoEm: string;
}
