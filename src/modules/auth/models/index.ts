
// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export type UserRole = "cliente" | "admin";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export type PapelUsuario = "ADMIN" | "CLIENTE";

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

export interface CadastroRequest {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  provinciaId?: number;
  distritoId?: number;
}
