import Link from "next/link";
import {
  Building2,
  CreditCard,
  Lock,
  Settings,
  Users,
  ChevronRight,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

const settingsSections = [
  {
    title: "General",
    description:
      "Manage your organization's basic information, contact details, and operating information.",
    href: "/dashboard/organization/settings/general",
    icon: Building2,
  },
  {
    title: "Billing",
    description:
      "View your subscription, payment history, and organization billing information.",
    href: "/dashboard/organization/settings/billing",
    icon: CreditCard,
  },
  {
    title: "Security",
    description:
      "Review account security information and organization access controls.",
    href: "/dashboard/organization/settings/security",
    icon: Lock,
  },
];

export default async function OrganizationSettingsPage() {
  const membership = await prisma.organizationMember.findFirst({
    select: {
      id: true,
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!membership) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Card>
            <div className="p-10 text-center">
              <Settings className="mx-auto h-10 w-10 text-slate-400" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Organization Settings
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                No organization membership could be found for this account.
              </p>

              <Link
                href="/dashboard/organization"
                className="mt-6 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Back to Dashboard
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/dashboard/organization"
              className="hover:text-tenderhub-navy"
            >
              Organization
            </Link>
            <span>/</span>
            <span>Settings</span>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Organization Settings
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Configure your organization and manage account-related settings.
            </p>
          </div>
        </div>

        <Card>
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
              <Building2 className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current Organization
              </p>

              <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
                {membership.organization.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your organization settings apply to this organization.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-5">
          {settingsSections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.href}
                href={section.href}
                className="group block"
              >
                <Card>
                  <div className="flex items-center gap-5 p-6 transition group-hover:bg-slate-50">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-tenderhub-navy group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-slate-900">
                        {section.title}
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {section.description}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-tenderhub-navy" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card>
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Organization Members
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Manage users who have access to your organization's
                  procurement workspace.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/organization/members"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Manage Members
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}