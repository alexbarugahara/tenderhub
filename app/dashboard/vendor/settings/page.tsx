import Link from "next/link";
import {
  Bell,
  Building2,
  ChevronRight,
  FileCheck2,
  LockKeyhole,
  Settings,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorSettingsPage() {
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      name: true,
      email: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
  });

  if (!user?.vendor) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <Settings className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your account is not currently associated with a vendor
                profile.
              </p>

              <Link
                href="/dashboard/vendor/profile"
                className="mt-6 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                View Vendor Profile
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const settingsSections = [
    {
      title: "General Settings",
      description:
        "Manage your vendor company information and account details.",
      href: "/dashboard/vendor/profile",
      icon: Building2,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Notifications",
      description:
        "Review notification preferences and procurement updates.",
      href: "/dashboard/vendor/settings/notifications",
      icon: Bell,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      title: "Team",
      description:
        "View and manage users associated with your vendor account.",
      href: "/dashboard/vendor/team",
      icon: Users,
      iconClass: "bg-purple-50 text-purple-600",
    },
    {
      title: "Documents",
      description:
        "Manage company documents used for procurement and compliance.",
      href: "/dashboard/vendor/documents",
      icon: FileCheck2,
      iconClass: "bg-green-50 text-green-600",
    },
    {
      title: "Compliance",
      description:
        "Review compliance requirements and their current status.",
      href: "/dashboard/vendor/compliance",
      icon: FileCheck2,
      iconClass: "bg-teal-50 text-teal-600",
    },
    {
      title: "Security",
      description:
        "Review security-related account information and controls.",
      href: "/dashboard/vendor/settings/notifications",
      icon: LockKeyhole,
      iconClass: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
              <Settings className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Vendor Portal
              </p>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Settings
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Manage your vendor account, company information, team,
            notifications, documents, and compliance settings.
          </p>
        </div>

        <Card>
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
              <Building2 className="h-7 w-7" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Vendor Account
              </p>

              <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">
                {user.vendor.companyName}
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {user.name} · {user.email}
              </p>
            </div>

            <Link
              href="/dashboard/vendor/profile"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View Profile
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>

        <div>
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">
              Account Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a section to manage the corresponding part of your
              vendor account.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {settingsSections.map((section) => {
              const Icon = section.icon;

              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="group block"
                >
                  <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <div className="flex items-start gap-4 p-6">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${section.iconClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-slate-900">
                            {section.title}
                          </h3>

                          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-tenderhub-navy" />
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <Card>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Settings className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Account Settings
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Keep your company information, documents, compliance
                  records, and notification preferences up to date so that
                  your vendor profile remains ready for procurement
                  opportunities.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}