// Temporary note: The project currently contains two different shapes for booking data:
// - Frontend mock store (src/types/index.ts): Booking { date,time,status,totalPrice,clientName,serviceIds,...,createdAt }
// - Admin endpoint types (src/types/api.ts): Marcacao { data,hora,status,valorTotal,clienteNome,servicos,... } and may omit createdAt.
// If the backend endpoints for /api/admin/* still return the mock-shaped fields, we must align types and UI.
// If they return the other shape, we must update types and UI accordingly.

