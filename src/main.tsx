import React from "react";
import ReactDOM from "react-dom/client";

import "./styles.css";
import "@mantine/core/styles.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { PendingMessagesProvider } from "./context/pending-messages-context.tsx";
import { Toaster } from "./components/ui/toaster.tsx";

import { AuthProvider } from "./context/AuthContext.tsx"; 

import AdminQuotationsPage from "./pages/admin/AdminQuotationsPage.tsx";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage.tsx";
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
import QuotationPage from "./pages/QuotationPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
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
      { path: "minha-area", element: <ClientDashboardPage /> },
      { path: "entrar", element: <AuthPage /> },
      { path: "cotacao", element: <QuotationPage /> },
      { path: "contacto", element: <ContactPage /> },

      // Sub-rota para o Painel Administrativo com seu próprio Layout
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminOverviewPage /> },
          { path: "clientes", element: <AdminClientsPage /> },
          { path: "cotacoes", element: <AdminQuotationsPage /> },
          { path: "marcacoes", element: <AdminBookingsPage /> },
          { path: "servicos", element: <AdminServicesPage /> },
        ],
      },
    ],
  },
])

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <PendingMessagesProvider>
              <RouterProvider router={router} />
              <Toaster />
            </PendingMessagesProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>
);