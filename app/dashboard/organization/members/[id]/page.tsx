import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

interface OrganizationMemberDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
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

export default async function OrganizationMemberDetailsPage({
  params,
  searchParams,
}: OrganizationMemberDetailsPageProps) {
  const { id } = await params;
  const { organizationId } = await searchParams;

  const member = await prisma.organizationMember.findUnique({
    where: {
      id,
    },
    include: {
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
          phone: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!member) {
    notFound();
  }

  if (organizationId && member.organizationId !== organizationId) {
    notFound();
  }

  const organization = member.organization;

  const organizationMembers = await prisma.organizationMember.findMany({
    where: {
      organizationId: organization.id,
    },
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const memberIndex = organizationMembers.findIndex(
    (organizationMember) => organizationMember.id === member.id,
  );

  const memberNumber = memberIndex >= 0 ? memberIndex + 1 : 1;

  const roleCount = organizationMembers.filter(
    (organizationMember) => organizationMember.role === member.role,
  ).length;

  const privileged =
    member.role === "OWNER" ||
    member.role === "ADMIN" ||
    member.role === "PROCUREMENT_MANAGER";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard/organization/members?organizationId=${organization.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Organization Members
        </Link>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-xl font-bold text-white">
            {getInitials(member.user.name)}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {member.user.name}
              </h1>

              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses(
                  member.role,
                )}`}
              >
                {formatRole(member.role)}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-600">
              Member of {organization.name}
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Member Number"
          value={`#${memberNumber}`}
          description="Organization membership"
        />

        <SummaryCard
          label="Role"
          value={formatRole(member.role)}
          description="Current organization role"
        />

        <SummaryCard
          label="Role Members"
          value={roleCount.toString()}
          description={`Members with ${formatRole(member.role)} role`}
        />

        <SummaryCard
          label="Access Level"
          value={privileged ? "Privileged" : "Standard"}
          description="Based on organization role"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Member Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Account information associated with this organization member.
          </p>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <DetailItem label="Full Name" value={member.user.name} />

          <DetailItem label="Email Address" value={member.user.email} />

          <DetailItem
            label="Phone Number"
            value={member.user.phone || "Not provided"}
          />

          <DetailItem
            label="Email Verification"
            value={member.user.emailVerified ? "Verified" : "Not verified"}
          />

          <DetailItem
            label="User ID"
            value={member.user.id}
          />

          <DetailItem
            label="Membership ID"
            value={member.id}
          />

          <DetailItem
            label="Joined Organization"
            value={member.createdAt.toLocaleDateString("en-UG")}
          />

          <DetailItem
            label="Account Created"
            value={member.user.createdAt.toLocaleDateString("en-UG")}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Organization Role
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            The role assigned to this member controls their organization-level
            access.
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${roleClasses(
                  member.role,
                )}`}
              >
                {formatRole(member.role)}
              </span>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {getRoleDescription(member.role)}
              </p>
            </div>

            <div className="shrink-0 text-sm text-slate-500">
              {roleCount} member{roleCount === 1 ? "" : "s"} with this role
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Account Verification
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current verification state of the member&apos;s user account.
          </p>
        </div>

        <div className="p-6">
          {member.user.emailVerified ? (
            <div className="flex gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                ✓
              </div>

              <div>
                <h3 className="text-sm font-semibold text-emerald-900">
                  Email verified
                </h3>

                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  This member&apos;s email address has been verified on their
                  user account.
                </p>

                <p className="mt-2 text-xs text-emerald-700">
                  Verified on{" "}
                  {member.user.emailVerified.toLocaleDateString("en-UG")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 rounded-lg border border-amber-200 bg-amber-50 p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                !
              </div>

              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  Email not verified
                </h3>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  This member&apos;s email address has not yet been verified.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Member Administration
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Changes to organization membership and roles should be performed
          through authorized membership-management workflows. This page
          currently provides a detailed read view of the membership record.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/dashboard/organization/members?organizationId=${organization.id}`}
            className="inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Back to Members
          </Link>

          <Link
            href={`/dashboard/organization/settings/security?organizationId=${organization.id}`}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Security Settings
          </Link>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-slate-900">
        {value}
      </p>
    </div>
  );
}

function getInitials(name: string | null) {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getRoleDescription(role: string) {
  switch (role) {
    case "OWNER":
      return "The organization owner has the highest level of organization access and is responsible for the organization account.";

    case "ADMIN":
      return "Administrators have administrative access to organization operations and management functions.";

    case "PROCUREMENT_MANAGER":
      return "Procurement managers have access focused on procurement, solicitation and related organization workflows.";

    case "EVALUATOR":
      return "Evaluators are assigned organization access for procurement evaluation activities.";

    default:
      return "This member has an organization role that determines their permitted access within the workspace.";
  }
}