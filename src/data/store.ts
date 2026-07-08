import { createStore, uid } from "@/lib/store";
import type { AppUser, Booking, Quotation, Service } from "@/types";
import { SEED_SERVICES } from "./mock-services";

// Users
interface UserRecord extends AppUser {
  passwordHash?: string;
}
const SEED_USERS: UserRecord[] = [
  {
    id: "u-admin",
    name: "Angela Mazive",
    email: "angela@chuanga.mz",
    role: "admin",
    phone: "+258 84 123 4567",
    createdAt: new Date().toISOString(),
    passwordHash: "admin",
  },
];
export const usersStore = createStore<UserRecord[]>("chuanga:users", SEED_USERS);
export const sessionStore = createStore<{ userId: string | null }>(
  "chuanga:session",
  { userId: null },
);

// Services
export const servicesStore = createStore<Service[]>("chuanga:services", SEED_SERVICES);

// Bookings
const SEED_BOOKINGS: Booking[] = [
  {
    id: "b-001",
    clientId: "u-demo",
    clientName: "Maria Chissano",
    clientPhone: "+258 84 555 1122",
    serviceIds: ["s-manicure-spa", "s-verniz-gel"],
    date: new Date(Date.now() + 86400000).toISOString(),
    time: "10:00",
    status: "confirmada",
    totalPrice: 1150,
    advancePaid: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "b-002",
    clientId: "u-demo2",
    clientName: "Sara Machava",
    clientPhone: "+258 84 555 3344",
    serviceIds: ["s-along-gel", "s-decor-personalizada"],
    date: new Date(Date.now() + 172800000).toISOString(),
    time: "14:30",
    status: "aguardando_pagamento",
    totalPrice: 1200,
    advancePaid: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];
export const bookingsStore = createStore<Booking[]>("chuanga:bookings", SEED_BOOKINGS);

// Quotations
export const quotationsStore = createStore<Quotation[]>("chuanga:quotations", []);

// Helpers
export const auth = {
  signInWithPassword(email: string, password: string): UserRecord {
    const user = usersStore
      .get()
      .find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== password) {
      throw new Error("Credenciais inválidas.");
    }
    sessionStore.set({ userId: user.id });
    return user;
  },
  signUp(data: { name: string; email: string; phone?: string; password: string }): UserRecord {
    const existing = usersStore
      .get()
      .find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) throw new Error("Já existe uma conta com este email.");
    const user: UserRecord = {
      id: uid("u"),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: "cliente",
      createdAt: new Date().toISOString(),
      passwordHash: data.password,
    };
    usersStore.set((prev) => [...prev, user]);
    sessionStore.set({ userId: user.id });
    return user;
  },
  signInWithGoogleMock(): UserRecord {
    let user = usersStore.get().find((u) => u.email === "demo.google@chuanga.mz");
    if (!user) {
      user = {
        id: uid("u"),
        name: "Convidada Google",
        email: "demo.google@chuanga.mz",
        role: "cliente",
        createdAt: new Date().toISOString(),
      };
      usersStore.set((prev) => [...prev, user!]);
    }
    sessionStore.set({ userId: user.id });
    return user;
  },
  signOut() {
    sessionStore.set({ userId: null });
  },
};

export function createBooking(input: Omit<Booking, "id" | "createdAt" | "status" | "advancePaid"> & { status?: Booking["status"] }): Booking {
  const booking: Booking = {
    ...input,
    id: uid("b"),
    status: input.status ?? "aguardando_pagamento",
    advancePaid: false,
    createdAt: new Date().toISOString(),
  };
  bookingsStore.set((prev) => [booking, ...prev]);
  return booking;
}

export function updateBooking(id: string, patch: Partial<Booking>) {
  bookingsStore.set((prev) =>
    prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
  );
}
export function deleteBooking(id: string) {
  bookingsStore.set((prev) => prev.filter((b) => b.id !== id));
}

export function upsertService(s: Service) {
  servicesStore.set((prev) => {
    const idx = prev.findIndex((x) => x.id === s.id);
    if (idx === -1) return [...prev, s];
    const next = [...prev];
    next[idx] = s;
    return next;
  });
}
export function deleteService(id: string) {
  servicesStore.set((prev) => prev.filter((s) => s.id !== id));
}

export function createQuotation(input: Omit<Quotation, "id" | "createdAt" | "status">): Quotation {
  const q: Quotation = {
    ...input,
    id: uid("q"),
    status: "novo",
    createdAt: new Date().toISOString(),
  };
  quotationsStore.set((prev) => [q, ...prev]);
  return q;
}
export function updateQuotation(id: string, patch: Partial<Quotation>) {
  quotationsStore.set((prev) =>
    prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
  );
}
