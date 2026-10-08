import Link from "next/link";

import { prisma } from "@/lib/db/prisma";

interface OrganizationMembersPageProps {
  searchParams: Promise<{
    organizationId?: string;
  }>;
}

function formatRole(role: string) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roleClasses(role: string) {
  switch (role) {
    case "OWNER":
      return "bg-tenderhub-gold/15 text-slate-900 ring-1 ring-inset ring-tenderhub-gold/40";
    case "ADMIN":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
    case "PROCUREMENT_MANAGER":
      return "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200";
    case "EVALUATOR":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

export default async function OrganizationMembersPage({
  searchParams,
}: OrganizationMembersPageProps) {
  const params = await searchParams;
  const organizationId = params.organizationId;

  if (!organizationId) {
    return (
      <div className="space-y-8">
        <PageHeader />

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-base font-semibold text-amber-900">
            Organization not selected
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            Select an organization from the organization switcher before
            managing members.
          </p>
        </div>
      </div>
    );
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!organization) {
    return (
      <div className="space-y-8">
        <PageHeader />

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-base font-semibold text-red-900">
            Organization not found
          </h2>

          <p className="mt-2 text-sm text-red-800">
            The selected organization could not be found.
          </p>
        </div>
      </div>
    );
  }

  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId: organization.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const userIds = members.map((member) => member.userId);

  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: {
              in: userIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            emailVerified: true,
          },
        })
      : [];

  const userMap = new Map(users.map((user) => [user.id, user]));

  const owners = members.filter(
    (member) => member.role === "OWNER",
  ).length;

  const administrators = members.filter(
    (member) => member.role === "ADMIN",
  ).length;

  const procurementManagers = members.filter(
    (member) => member.role === "PROCUREMENT_MANAGER",
  ).length;

  const verified = members.filter(
    (member) => userMap.get(member.userId)?.emailVerified,
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader organizationName={organization.name} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MemberMetric
          label="Total Members"
          value={members.length}
          description="People with organization access"
        />

        <MemberMetric
          label="Owners"
          value={owners}
          description="Organization owners"
        />

        <MemberMetric
          label="Administrators"
          value={administrators}
          description="Administrative members"
        />

        <MemberMetric
          label="Verified"
          value={verified}
          description="Members with verified email"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Organization Members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage people who have access to {organization.name}.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-2">
            <p className="text-xs font-medium text-slate-500">
              Procurement Managers
            </p>

            <p className="text-sm font-semibold text-slate-900">
              {procurementManagers}
            </p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              👥
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No members yet
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              This organization does not currently have any membership
              records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Member</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Verification</TableHeader>
                  <TableHeader>Joined</TableHeader>
                  <TableHeader>Action</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {members.map((member) => {
                  const user = userMap.get(member.userId);

                  return (
                    <tr
                      key={member.id}
                      className="transition hover:bg-slate-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-semibold text-white">
                            {getInitials(user?.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-slate-900">
                              {user?.name || "Unknown user"}
                            </p>

                            <p className="text-xs text-slate-500">
                              Member ID: {member.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p>{user?.email || "No email available"}</p>

                          {user?.phone && (
                            <p className="mt-1 text-xs text-slate-400">
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses(
                            member.role,
                          )}`}
                        >
                          {formatRole(member.role)}
                        </span>
                      </TableCell>

                      <TableCell>
                        {user?.emailVerified ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                            Unverified
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {member.createdAt.toLocaleDateString("en-UG")}
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/dashboard/organization/members/${member.id}?organizationId=${organization.id}`}
                          className="font-medium text-tenderhub-navy hover:underline"
                        >
                          View
                        </Link>
                      </TableCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Membership Roles
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Roles determine the level of access a member has within the
          organization.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <RoleExplanation
            role="OWNER"
            description="Full organization ownership and administrative access."
          />

          <RoleExplanation
            role="ADMIN"
            description="Administrative access for managing organization operations."
          />

          <RoleExplanation
            role="PROCUREMENT_MANAGER"
            description="Access focused on procurement and solicitation workflows."
          />

          <RoleExplanation
            role="EVALUATOR"
            description="Access intended for procurement evaluation activities."
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Member Administration
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Adding members, changing roles and removing organization access
          should be performed through authorized organization administration
          workflows. The current page provides a secure read view of the
          membership records.
        </p>
      </section>
    </div>
  );
}

function PageHeader({
  organizationName,
}: {
  organizationName?: string;
}) {
  return (
    <div>
      <Link
        href="/dashboard/organization"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Organization Dashboard
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        Organization Members
      </h1>

      <p className="mt-1 text-sm text-slate-600">
        {organizationName
          ? `Manage access to ${organizationName}.`
          : "Manage people who have access to your organization."}
      </p>
    </div>
  );
}

function MemberMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function RoleExplanation({
  role,
  description,
}: {
  role: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses(
          role,
        )}`}
      >
        {formatRole(role)}
      </span>

      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}