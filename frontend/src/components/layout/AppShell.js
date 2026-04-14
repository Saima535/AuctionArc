"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return children;
  }

  return (
    <div className="site-shell">
      <Navbar />
      <main className="site-main">{children}</main>
      <Footer />
    </div>
  );
}
