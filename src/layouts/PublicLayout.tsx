import { Navbar } from "@/components/Navbar";
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom"; 

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
    </div>
  );
}