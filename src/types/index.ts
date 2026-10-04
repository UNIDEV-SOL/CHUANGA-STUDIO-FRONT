export type ServiceCategory =
  | "maos"
  | "pes"
  | "verniz"
  | "alongamento"
  | "manutencao"
  | "remocao"
  | "nailart"
  | "tratamentos"
  | "especiais"
  | "premium";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  duration: number;
  description?: string;
  image?: string;
  featured?: boolean;
}

export type UserRole = "cliente" | "admin";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}
