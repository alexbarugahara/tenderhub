import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function OrganizationSecuritySettingsPage() {
  const membership = await prisma.organizationMember.findFirst({
    select: {
      id: true,
      role: true,
      createdAt: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
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
              <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Security Settings
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                No organization membership could be found for this account.
              </p>

              <Link
                href="/dashboard/organization/settings"
                className="mt-6 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Back to Settings
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const emailVerified = Boolean(membership.user.emailVerified);

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/organization/settings"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>

          <div className="mt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tenderhub-navy text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Security
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                  Review your account and organization access security.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Account Security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Security information for your TenderHub account.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Mail className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-medium text-slate-900">
                    Email verification
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {membership.user.email}
                  </p>
                </div>
              </div>

              {emailVerified ? (
                <Badge variant="success">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="warning">Not Verified</Badge>
              )}
            </div>

            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <UserCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-medium text-slate-900">
                    Organization role
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Your current access level within the organization.
                  </p>
                </div>
              </div>

              <Badge variant="default">
                {membership.role.replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Lock className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-medium text-slate-900">
                    Password protection
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Your account is protected by its configured authentication
                    credentials.
                  </p>
                </div>
              </div>

              <span className="text-sm font-medium text-slate-600">
                Enabled
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Organization Access
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your membership information for {membership.organization.name}.
            </p>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Organization
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {membership.organization.name}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Access Role
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {membership.role.replace(/_/g, " ")}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Membership Created
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {formatDate(membership.createdAt)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Account Created
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {formatDate(membership.user.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Manage Organization Members
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Review members and manage organization-level access from the
                members section.
              </p>
            </div>

            <Link
              href="/dashboard/organization/members"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Manage Members
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}