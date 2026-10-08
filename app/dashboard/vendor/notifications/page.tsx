import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Info,
  ShieldAlert,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorNotificationsPage() {
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      name: true,
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
              <Bell className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                A vendor profile is required to access your notifications.
              </p>

              <Link
                href="/dashboard/vendor/profile"
                className="mt-6 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Complete Vendor Profile
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      read: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const readCount = notifications.length - unreadCount;

  const getNotificationIcon = (type: string) => {
    const normalized = type.toUpperCase();

    if (
      normalized.includes("SUCCESS") ||
      normalized.includes("AWARD") ||
      normalized.includes("APPROVED")
    ) {
      return (
        <CheckCircle2 className="h-5 w-5 text-green-600" />
      );
    }

    if (
      normalized.includes("WARNING") ||
      normalized.includes("EXPIR") ||
      normalized.includes("COMPLIANCE")
    ) {
      return (
        <ShieldAlert className="h-5 w-5 text-amber-600" />
      );
    }

    if (
      normalized.includes("DEADLINE") ||
      normalized.includes("CLOSING")
    ) {
      return <Clock3 className="h-5 w-5 text-orange-600" />;
    }

    return <Info className="h-5 w-5 text-blue-600" />;
  };

  const getNotificationBackground = (type: string) => {
    const normalized = type.toUpperCase();

    if (
      normalized.includes("SUCCESS") ||
      normalized.includes("AWARD") ||
      normalized.includes("APPROVED")
    ) {
      return "bg-green-50";
    }

    if (
      normalized.includes("WARNING") ||
      normalized.includes("EXPIR") ||
      normalized.includes("COMPLIANCE")
    ) {
      return "bg-amber-50";
    }

    if (
      normalized.includes("DEADLINE") ||
      normalized.includes("CLOSING")
    ) {
      return "bg-orange-50";
    }

    return "bg-blue-50";
  };

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                <Bell className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Vendor Portal
                </p>

                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Notifications
                </h1>
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Stay informed about your bids, opportunities, awards,
              contracts, and compliance activity.
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-tenderhub-navy px-3 py-1.5 text-xs font-medium text-white">
              <Bell className="h-3.5 w-3.5" />
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Bell className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Total
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {notifications.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Unread
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {unreadCount}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Read
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {readCount}
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                Notification Center
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Notifications for {user.vendor.companyName}.
              </p>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No notifications
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You do not have any notifications at the moment. Important
                updates about your procurement activity will appear here.
              </p>

              <Link
                href="/dashboard/vendor/opportunities"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ExternalLink className="h-4 w-4" />
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {notifications.map((notification) => {
                const type = String(notification.type).toUpperCase();

                return (
                  <div
                    key={notification.id}
                    className={`p-6 transition ${
                      notification.read
                        ? "bg-white hover:bg-slate-50/70"
                        : "bg-blue-50/30 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getNotificationBackground(
                          type,
                        )}`}
                      >
                        {getNotificationIcon(type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-medium ${
                                notification.read
                                  ? "text-slate-900"
                                  : "text-slate-950"
                              }`}
                            >
                              {notification.title}
                            </h3>

                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-tenderhub-gold" />
                            )}
                          </div>

                          <span className="shrink-0 text-xs text-slate-400">
                            {notification.createdAt.toLocaleString()}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {notification.message}
                        </p>

                        <div className="mt-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                            {type.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}