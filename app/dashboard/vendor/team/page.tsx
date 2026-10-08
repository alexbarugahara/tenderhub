import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  ShieldCheck,
  User,
  Users,
  Mail,
  Phone,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorTeamPage() {
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      name: true,
      email: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
          teamMembers: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              position: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
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
              <Users className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your account is not currently associated with a vendor
                profile.
              </p>

              <Link
                href="/dashboard/vendor/profile"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                View Vendor Profile
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const teamMembers = user.vendor.teamMembers;

  const activeMembers = teamMembers.length;

  const positionCounts = teamMembers.reduce<Record<string, number>>(
    (counts, member) => {
      const position = member.position?.trim() || "Unspecified";

      counts[position] = (counts[position] ?? 0) + 1;

      return counts;
    },
    {},
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard/vendor/settings"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-tenderhub-navy"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Settings
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Vendor Portal
                </p>

                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Team
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              View the people associated with your vendor account and their
              positions.
            </p>
          </div>

          <button
            type="button"
            disabled
            title="Team member creation is not available yet"
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add Team Member
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Team Members
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {activeMembers}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Positions
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {Object.keys(positionCounts).length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tenderhub-gold/15 text-slate-700">
                <Building2Icon />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Vendor
              </p>

              <p className="mt-1 truncate text-lg font-bold text-slate-900">
                {user.vendor.companyName}
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                Team Members
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Members currently associated with {user.vendor.companyName}.
              </p>
            </div>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No team members
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                No team members are currently associated with this vendor
                account.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {teamMembers.map((member) => {
                const memberName = member.name || "Unnamed Team Member";
                const position = member.position?.trim() || "Position not specified";

                return (
                  <Link
                    key={member.id}
                    href={`/dashboard/vendor/team/${member.id}`}
                    className="block transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-tenderhub-navy text-sm font-semibold text-white">
                        {getInitials(memberName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <h3 className="truncate font-semibold text-slate-900">
                            {memberName}
                          </h3>

                          <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {position}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                          {member.email && (
                            <span className="flex items-center gap-2">
                              <Mail className="h-4 w-4 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </span>
                          )}

                          {member.phone && (
                            <span className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium text-tenderhub-navy">
                        View
                        <span aria-hidden="true">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {teamMembers.length > 0 && (
          <Card>
            <div className="border-b border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900">
                Team Position Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Distribution of positions across your vendor team.
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(positionCounts).map(([position, count]) => (
                <div
                  key={position}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />

                    <p className="text-sm font-medium text-slate-700">
                      {position}
                    </p>
                  </div>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Building2Icon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M9 7h1" />
      <path d="M14 7h1" />
      <path d="M9 11h1" />
      <path d="M14 11h1" />
      <path d="M9 15h1" />
      <path d="M14 15h1" />
      <path d="M11 21v-3h2v3" />
    </svg>
  );
}