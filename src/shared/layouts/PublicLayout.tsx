import { Footer } from "@/shared/components/Footer";
import { Navbar } from "@/shared/components/Navbar";
import { useEffect, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PageLoader } from "@/shared/components/PageLoader";

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
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
