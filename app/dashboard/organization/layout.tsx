import { ReactNode } from "react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardFooter from "@/components/dashboard/DashboardFooter";

export default function OrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* Dashboard Header */}
      <DashboardHeader />

      {/* Dashboard Content */}
      <main className="flex-1 p-6">
        {children}
      </main>

      {/* Dashboard Footer */}
      <DashboardFooter />

    </div>
  );
}