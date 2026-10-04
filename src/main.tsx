import React from "react";
import ReactDOM from "react-dom/client";

import "./styles.css";

import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ApiError } from "./lib/httpClient.ts";
import { RequireAuth } from "./components/RequireAuth.tsx";

import AdminQuotationsPage from "./pages/admin/AdminQuotationsPage.tsx";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage.tsx";
import AdminInvoicesPage from "./pages/admin/AdminInvoicesPage.tsx";
import AdminSchedulePage from "./pages/admin/AdminSchedulePage.tsx";
import AdminReportsPage from "./pages/admin/AdminReportsPage.tsx";
import AdminTeamPage from "./pages/admin/AdminTeamPage.tsx";
import AdminClientsPage from "./pages/admin/AdminClientPage.tsx";
import AdminServicesPage from "./pages/admin/AdminServicesPage.tsx";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage.tsx";
import { AdminLayout } from "./layouts/AdminLayout.tsx";
import HomePage from "./pages/HomePage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import ServicesPage from "./pages/ServicePage.tsx";
import BookingPage from "./pages/BookingPage.tsx";
import ClientDashboardPage from "./pages/ClientDashboard.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import { RecuperarSenhaPage, RedefinirSenhaPage } from "./pages/RecuperarSenhaPage.tsx";
import QuotationPage from "./pages/QuotationPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import GalleryPage from "./pages/GalleryPage.tsx";
import ClientChatPage from "./pages/ClientChatPage.tsx";
import AdminChatPage from "./pages/admin/AdminChatPage.tsx";
import AdminGalleryPage from "./pages/admin/AdminGalleryPage.tsx";
import AdminLoyaltyPage from "./pages/admin/AdminLoyaltyPage.tsx";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage.tsx";
import AvaliarPage from "./pages/AvaliarPage.tsx";
import ValesPage from "./pages/ValesPage.tsx";
import { PublicLayout } from "./layouts/PublicLayout.tsx";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Não insiste em erros de autorização/validação — só em falhas de rede/5xx.
      retry: (count, error) => {
        const status = error instanceof ApiError ? error.status : undefined;
        if (status && status < 500) return false;
        return count < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
