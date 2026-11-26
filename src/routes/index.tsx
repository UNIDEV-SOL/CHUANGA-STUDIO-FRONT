import { createBrowserRouter, Navigate } from "react-router-dom";

import { RequireAuth } from "@/modules/auth/components/RequireAuth";
import { AdminLayout } from "@/shared/layouts/AdminLayout";
import { PublicLayout } from "@/shared/layouts/PublicLayout";
import { lazyWithRetry } from "@/shared/lib/lazy-with-retry";

// Cada página é carregada só quando a rota é aberta (code splitting): quem visita o site
// não descarrega o código do painel de administração, e vice-versa.
// Nova página: const X = lazyWithRetry(() => import("...")); com export nomeado:
// lazyWithRetry(() => import("...").then((m) => ({ default: m.X })));

// Site público
const HomePage = lazyWithRetry(() => import("@/modules/site/pages/HomePage"));
const AboutPage = lazyWithRetry(() => import("@/modules/site/pages/AboutPage"));
const ContactPage = lazyWithRetry(() => import("@/modules/site/pages/ContactPage"));
const ServicesPage = lazyWithRetry(() => import("@/modules/catalog/pages/ServicePage"));
const BookingPage = lazyWithRetry(() => import("@/modules/bookings/pages/BookingPage"));
const QuotationPage = lazyWithRetry(() => import("@/modules/quotations/pages/QuotationPage"));
const GalleryPage = lazyWithRetry(() => import("@/modules/gallery/pages/GalleryPage"));
const ValesPage = lazyWithRetry(() => import("@/modules/loyalty/pages/ValesPage"));
const AvaliarPage = lazyWithRetry(() => import("@/modules/reviews/pages/AvaliarPage"));

// Autenticação
const AuthPage = lazyWithRetry(() => import("@/modules/auth/pages/AuthPage"));
const RecuperarSenhaPage = lazyWithRetry(() =>
  import("@/modules/auth/pages/RecuperarSenhaPage").then((m) => ({ default: m.RecuperarSenhaPage })),
);
const RedefinirSenhaPage = lazyWithRetry(() =>
  import("@/modules/auth/pages/RecuperarSenhaPage").then((m) => ({ default: m.RedefinirSenhaPage })),
);

// Área da cliente
const ClientDashboardPage = lazyWithRetry(() => import("@/modules/clients/pages/ClientDashboard"));
const ClientChatPage = lazyWithRetry(() => import("@/modules/chat/pages/ClientChatPage"));

// Painel de administração
const AdminOverviewPage = lazyWithRetry(() => import("@/modules/reports/pages/AdminOverviewPage"));
const AdminClientsPage = lazyWithRetry(() => import("@/modules/clients/pages/AdminClientPage"));
const AdminQuotationsPage = lazyWithRetry(() => import("@/modules/quotations/pages/AdminQuotationsPage"));
const AdminBookingsPage = lazyWithRetry(() => import("@/modules/bookings/pages/AdminBookingsPage"));
const AdminInvoicesPage = lazyWithRetry(() => import("@/modules/invoices/pages/AdminInvoicesPage"));
const AdminSchedulePage = lazyWithRetry(() => import("@/modules/schedule/pages/AdminSchedulePage"));
const AdminReportsPage = lazyWithRetry(() => import("@/modules/reports/pages/AdminReportsPage"));
const AdminTeamPage = lazyWithRetry(() => import("@/modules/team/pages/AdminTeamPage"));
const AdminGalleryPage = lazyWithRetry(() => import("@/modules/gallery/pages/AdminGalleryPage"));
const AdminLoyaltyPage = lazyWithRetry(() => import("@/modules/loyalty/pages/AdminLoyaltyPage"));
const AdminReviewsPage = lazyWithRetry(() => import("@/modules/reviews/pages/AdminReviewsPage"));
const AdminChatPage = lazyWithRetry(() => import("@/modules/chat/pages/AdminChatPage"));
const AdminServicesPage = lazyWithRetry(() => import("@/modules/catalog/pages/AdminServicesPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "sobre", element: <AboutPage /> },
      { path: "servicos", element: <ServicesPage /> },
      { path: "reservar", element: <BookingPage /> },
      {
        path: "minha-area",
        element: (
          <RequireAuth role="cliente">
            <ClientDashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "minha-area/mensagens",
        element: (
          <RequireAuth role="cliente">
            <ClientChatPage />
          </RequireAuth>
        ),
      },
      { path: "entrar", element: <AuthPage /> },
      { path: "recuperar-senha", element: <RecuperarSenhaPage /> },
      { path: "redefinir-senha", element: <RedefinirSenhaPage /> },
      { path: "cotacao", element: <QuotationPage /> },
      { path: "contacto", element: <ContactPage /> },
      { path: "galeria", element: <GalleryPage /> },
      { path: "vales", element: <ValesPage /> },
      { path: "avaliar/:token", element: <AvaliarPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  // O painel tem o seu próprio layout (sidebar) — fica fora do PublicLayout
  // para não herdar a navbar e o footer do site.
  {
    path: "/admin",
    element: (
      <RequireAuth role="admin">
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminOverviewPage /> },
      { path: "clientes", element: <AdminClientsPage /> },
      { path: "cotacoes", element: <AdminQuotationsPage /> },
      { path: "marcacoes", element: <AdminBookingsPage /> },
      { path: "faturas", element: <AdminInvoicesPage /> },
      { path: "horario", element: <AdminSchedulePage /> },
      { path: "relatorios", element: <AdminReportsPage /> },
      { path: "equipa", element: <AdminTeamPage /> },
      { path: "galeria", element: <AdminGalleryPage /> },
      { path: "fidelizacao", element: <AdminLoyaltyPage /> },
      { path: "avaliacoes", element: <AdminReviewsPage /> },
      { path: "mensagens", element: <AdminChatPage /> },
      { path: "servicos", element: <AdminServicesPage /> },
    ],
  },
]);
