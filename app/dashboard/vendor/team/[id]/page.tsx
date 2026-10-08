import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

type VendorTeamMemberPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VendorTeamMemberPage({
  params,
}: VendorTeamMemberPageProps) {
  const { id } = await params;

  const member = await prisma.vendorTeamMember.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      position: true,
      createdAt: true,
      updatedAt: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
  });

  if (!member) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Team Member Not Found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                The requested vendor team member could not be found.
              </p>

              <Link
                href="/dashboard/vendor/team"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Team
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const memberName = member.name || "Unnamed Team Member";
  const memberInitials = memberName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "U";

  const position = member.position?.trim() || "Position not specified";

  const formatDate = (date: Date | null | undefined) => {
    if (!date) {
      return "Not available";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/vendor/team"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tenderhub-navy text-white">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Team Member
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                View vendor team member details and contact information.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-2xl font-bold text-white">
                {memberInitials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {memberName}
                  </h2>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {position}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {member.vendor.companyName}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <div className="border-b border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900">
                Contact Information
              </h2>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Mail className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-slate-900">
                    {member.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Phone className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {member.phone || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <UserRound className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Team Member ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-700">
                    {member.id}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900">
                Membership Information
              </h2>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Position
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {position}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <CalendarDays className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Joined Team
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatDate(member.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <CalendarDays className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatDate(member.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <h2 className="font-semibold text-slate-900">
              Vendor Account
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              This team member is associated with the following vendor
              account.
            </p>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Company
              </p>

              <p className="mt-2 text-lg font-semibold text-slate-900">
                {member.vendor.companyName}
              </p>

              <p className="mt-1 break-all font-mono text-xs text-slate-500">
                Vendor ID: {member.vendor.id}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}