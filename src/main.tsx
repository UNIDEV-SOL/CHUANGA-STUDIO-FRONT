import React from "react";
import ReactDOM from "react-dom/client";

import "@/styles.css";

import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/shared/providers/ThemeProvider";
import { AuthProvider } from "@/modules/auth/context/AuthContext";
import { ApiError } from "@/shared/api/httpClient";
import { router } from "@/routes";

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
