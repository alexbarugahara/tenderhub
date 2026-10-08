import type { ReactNode } from "react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthSessionProvider from "@/components/providers/SessionProvider";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />

        <main className="min-w-0 flex-1">{children}</main>

        <Footer />
      </div>
    </AuthSessionProvider>
  );
}