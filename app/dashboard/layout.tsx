import type { ReactNode } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

import DashboardSidebar from "@/components/layout/DashboardSidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";
import OrganizationSwitcher from "@/components/layout/OrganizationSwitcher";
import UserMenu from "@/components/layout/UserMenu";
import SessionProviderWrapper from "@/components/providers/SessionProvider";

import { getSelectedOrganizationId } from "@/components/layout/organization-switcher-actions";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();
  const userId = session?.user?.id;

  const memberships = userId
    ? await prisma.organizationMember.findMany({
        where: {
          userId,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      })
    : [];

  const organizations = memberships.map(
    (membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      logo: membership.organization.logo,
    }),
  );

  const selectedOrganizationId = userId
    ? await getSelectedOrganizationId(userId)
    : null;

  return (
    <SessionProviderWrapper>
      <div className="min-h-screen bg-tenderhub-background text-slate-900">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
            <DashboardSidebar />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <MobileSidebar />
                </div>

                <div className="hidden sm:block">
                  <OrganizationSwitcher
                    organizations={organizations}
                    currentOrganizationId={
                      selectedOrganizationId ??
                      organizations[0]?.id
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserMenu />
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-[1600px]">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </SessionProviderWrapper>
  );
}