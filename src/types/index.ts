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

export type BookingStatus =
  | "aguardando_pagamento"
  | "confirmada"
  | "pendente_ausencia"
  | "concluida"
  | "cancelada";

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceIds: string[];
  date: string; 
  time: string; 
  status: BookingStatus;
  totalPrice: number;
  advancePaid: boolean;
  advanceProof?: string;
  notes?: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceIds: string[];
  message?: string;
  estimatedTotal: number;
  status: "novo" | "respondido" | "arquivado";
  createdAt: string;
}

export type UserRole = "cliente" | "admin";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}
