import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCircle2,
  Mail,
  Settings,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorNotificationSettingsPage() {
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

  if (!user || !user.vendor) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <Bell className="mx-auto h-10 w-10 text-slate-400" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Notification Settings
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                A vendor profile is required before notification settings can
                be displayed.
              </p>

              <Link
                href="/dashboard/vendor/profile"
                className="mt-6 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Set Up Vendor Profile
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/vendor/settings"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tenderhub-navy text-white">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Notification Settings
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Manage how you receive important procurement and account
                notifications.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Settings className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Notification Preferences
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Notification controls can be connected to your account
                  preferences as the notification management workflow is
                  enabled.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            <div className="flex items-start gap-4 p-6">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <BellRing className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-900">
                  Procurement Opportunities
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Receive notifications about relevant solicitations,
                  procurement opportunities, and important opportunity updates.
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Available
              </span>
            </div>

            <div className="flex items-start gap-4 p-6">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Bell className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-900">
                  Bid Updates
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Stay informed about bid submissions, status changes,
                  evaluation activity, and other bid-related events.
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Available
              </span>
            </div>

            <div className="flex items-start gap-4 p-6">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-900">
                  Awards and Contracts
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Receive important updates concerning procurement awards,
                  contracts, milestones, and payments.
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Available
              </span>
            </div>

            <div className="flex items-start gap-4 p-6">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Mail className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-900">
                  Account Notifications
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Important account, security, compliance, and platform
                  notifications may be sent to your registered email address.
                </p>

                <p className="mt-2 break-all text-sm font-medium text-slate-700">
                  {user.email}
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Required
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="font-semibold text-slate-900">
              Notification Center
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Review notifications already generated for your vendor account
              from the notification center.
            </p>

            <Link
              href="/dashboard/vendor/notifications"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Bell className="h-4 w-4" />
              Open Notification Center
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}