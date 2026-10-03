import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function PublicLayout() {
  const { pathname } = useLocation();

  // SPA: volta ao topo ao navegar entre páginas.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
