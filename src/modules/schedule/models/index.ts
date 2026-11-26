// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export interface Disponibilidade {
  data: string;
  aberto: boolean;
  /** Porque é que não há horas (dia fechado, sem vagas...). */
  motivo: string | null;
  duracaoMinutos: number;
  horarios: { hora: string; disponivel: boolean }[];
}

/** Um dia da semana: 1 = segunda ... 7 = domingo. Horas "HH:mm" ou "HH:mm:ss". */
export interface HorarioDia {
  diaSemana: number;
  aberto: boolean;
  abre: string | null;
  fecha: string | null;
  pausaInicio: string | null;
  pausaFim: string | null;
}

export interface ConfiguracaoHorario {
  semana: HorarioDia[];
  diasFechados: { id: string; data: string; motivo: string | null }[];
  intervaloMinutos: number;
  diasAntecedenciaMaxima: number;
}
