// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export interface ApiResponse<T> {
  sucesso: boolean;
  mensagem?: string | null;
  dados: T;
  timestamp: string;
}
