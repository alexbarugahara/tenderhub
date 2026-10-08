import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getSelectedOrganizationId } from "@/components/layout/organization-switcher-actions";

type VerificationStatus =
  | "NOT_SUBMITTED"
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_INFORMATION"
  | "APPROVED"
  | "REJECTED";

export default async function OrganizationDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Organization Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Please sign in to access your organization workspace.
        </p>
      </div>
    );
  }

  const organizationId = await getSelectedOrganizationId(userId);

  if (!organizationId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Organization Dashboard
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your account is not currently connected to an organization.
          Contact an organization administrator to receive access.
        </p>
      </div>
    );
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
    include: {
      organization: true,
    },
  });

  if (!membership) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Organization Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          You do not have access to the selected organization.
        </p>
      </div>
    );
  }

  const [
    procurementCount,
    activeProcurementCount,
    solicitationCount,
    openSolicitationCount,
    bidCount,
    contractCount,
    recentProcurements,
    recentSolicitation,
    organizationVerification,
  ] = await Promise.all([
    prisma.procurement.count({
      where: {
        organizationId,
      },
    }),

    prisma.procurement.count({
      where: {
        organizationId,
        status: "ACTIVE",
      },
    }),

    prisma.solicitation.count({
      where: {
        organizationId,
      },
    }),

    prisma.solicitation.count({
      where: {
        organizationId,
        status: "OPEN",
      },
    }),

    prisma.bid.count({
      where: {
        solicitation: {
          organizationId,
        },
      },
    }),

    prisma.contract.count({
      where: {
        organizationId,
      },
    }),

    prisma.procurement.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        currency: true,
      },
    }),

    prisma.solicitation.findFirst({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        procurement: true,
      },
    }),

    prisma.organizationVerification.findUnique({
      where: {
        organizationId,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
        adminNotes: true,
      },
    }),
  ]);

  const organizationName =
    membership.organization.name ||
    membership.organization.legalName ||
    "Your Organization";

  const verificationStatus =
    (organizationVerification?.status ??
      "NOT_SUBMITTED") as VerificationStatus;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-tenderhub-gold">
          Organization Workspace
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {organizationName}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Manage your procurement activities from one workspace.
        </p>
      </section>

      {/* Organization Verification */}
      <section>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-tenderhub-gold">
                Organization Verification
              </p>

              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                {getVerificationTitle(
                  verificationStatus,
                )}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {getVerificationDescription(
                  verificationStatus,
                )}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-shrink-0">
              <span
                className={getVerificationBadgeClass(
                  verificationStatus,
                )}
              >
                {getVerificationLabel(
                  verificationStatus,
                )}
              </span>

              <Link
                href="/dashboard/organization/verification"
                className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {getVerificationActionLabel(
                  verificationStatus,
                )}
              </Link>
            </div>
          </div>

          {verificationStatus ===
            "NEEDS_INFORMATION" &&
            organizationVerification?.rejectionReason && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Additional information required
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  {
                    organizationVerification.rejectionReason
                  }
                </p>
              </div>
            )}

          {verificationStatus === "REJECTED" &&
            organizationVerification?.rejectionReason && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">
                  Verification was not approved
                </p>

                <p className="mt-1 text-sm leading-6 text-red-800">
                  {
                    organizationVerification.rejectionReason
                  }
                </p>
              </div>
            )}

          {verificationStatus === "UNDER_REVIEW" && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Verification is being reviewed
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                TenderHub administrators are reviewing
                your organization information and
                supporting documentation.
              </p>
            </div>
          )}

          {verificationStatus === "SUBMITTED" && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Application submitted
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Your verification application has been
                submitted successfully and is awaiting
                administrative review.
              </p>

              {organizationVerification?.submittedAt && (
                <p className="mt-2 text-xs text-blue-700">
                  Submitted{" "}
                  {formatDate(
                    organizationVerification.submittedAt,
                  )}
                </p>
              )}
            </div>
          )}

          {verificationStatus === "APPROVED" && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-900">
                Organization verified
              </p>

              <p className="mt-1 text-sm leading-6 text-green-800">
                Your organization has completed the
                TenderHub verification process.
              </p>

              {organizationVerification?.reviewedAt && (
                <p className="mt-2 text-xs text-green-700">
                  Reviewed{" "}
                  {formatDate(
                    organizationVerification.reviewedAt,
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Summary Metrics */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardMetric
            label="Procurements"
            value={procurementCount}
            description={`${activeProcurementCount} active`}
          />

          <DashboardMetric
            label="Solicitations"
            value={solicitationCount}
            description={`${openSolicitationCount} currently open`}
          />

          <DashboardMetric
            label="Bids"
            value={bidCount}
            description="Vendor bids received"
          />

          <DashboardMetric
            label="Contracts"
            value={contractCount}
            description="Organization contracts"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Start a new procurement process.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Link
            href="/dashboard/organization/procurements/new"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            New Procurement
          </Link>
        </div>
      </section>

      {/* Recent Procurement + Solicitation */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Recent Procurements */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Procurements
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest procurement activities.
              </p>
            </div>

            <Link
              href="/dashboard/organization/procurements"
              className="text-sm font-semibold text-tenderhub-navy hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentProcurements.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                No procurements have been created yet.
              </div>
            ) : (
              recentProcurements.map(
                (procurement) => (
                  <Link
                    key={procurement.id}
                    href={`/dashboard/organization/procurements/${procurement.id}`}
                    className="block px-6 py-5 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {
                            procurement.referenceNumber
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {procurement.title}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {procurement.status}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-slate-500">
                      {procurement.currency?.code ?? ""}
                      {procurement.estimatedValue != null
                        ? ` ${Number(
                            procurement.estimatedValue,
                          ).toLocaleString()}`
                        : ""}
                    </div>
                  </Link>
                ),
              )
            )}
          </div>
        </div>

        {/* Recent Solicitation */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Solicitation
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest solicitation activity.
              </p>
            </div>

            <Link
              href="/dashboard/organization/solicitations"
              className="text-sm font-semibold text-tenderhub-navy hover:underline"
            >
              View all
            </Link>
          </div>

          {recentSolicitation ? (
            <Link
              href={`/dashboard/organization/solicitations/${recentSolicitation.id}`}
              className="block px-6 py-6 transition hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-900">
                {
                  recentSolicitation.procurement
                    .referenceNumber
                }
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {recentSolicitation.title}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {recentSolicitation.status}
                </span>

                {recentSolicitation.type && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {recentSolicitation.type}
                  </span>
                )}
              </div>

              {recentSolicitation.procurement && (
                <p className="mt-4 text-xs text-slate-500">
                  Procurement:{" "}
                  <span className="font-medium text-slate-700">
                    {
                      recentSolicitation.procurement
                        .referenceNumber
                    }
                  </span>
                </p>
              )}
            </Link>
          ) : (
            <div className="px-6 py-8 text-sm text-slate-500">
              No solicitations have been created yet.
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Activity */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Upcoming Activity
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Important procurement activities and deadlines
          will appear here.
        </p>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            No upcoming activities
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Upcoming solicitation openings, closing dates,
            evaluations, and contract activities will be
            shown here.
          </p>
        </div>
      </section>
    </div>
  );
}

interface DashboardMetricProps {
  label: string;
  value: number | string;
  description: string;
}

function DashboardMetric({
  label,
  value,
  description,
}: DashboardMetricProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function formatDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function getVerificationLabel(
  status: VerificationStatus,
): string {
  switch (status) {
    case "DRAFT":
      return "Draft";

    case "SUBMITTED":
      return "Submitted";

    case "UNDER_REVIEW":
      return "Under review";

    case "NEEDS_INFORMATION":
      return "Action required";

    case "APPROVED":
      return "Verified";

    case "REJECTED":
      return "Rejected";

    case "NOT_SUBMITTED":
    default:
      return "Not submitted";
  }
}

function getVerificationTitle(
  status: VerificationStatus,
): string {
  switch (status) {
    case "DRAFT":
      return "Continue your organization verification";

    case "SUBMITTED":
      return "Verification application submitted";

    case "UNDER_REVIEW":
      return "Your organization is under review";

    case "NEEDS_INFORMATION":
      return "Additional information is required";

    case "APPROVED":
      return "Your organization is verified";

    case "REJECTED":
      return "Verification requires attention";

    case "NOT_SUBMITTED":
    default:
      return "Complete organization verification";
  }
}

function getVerificationDescription(
  status: VerificationStatus,
): string {
  switch (status) {
    case "DRAFT":
      return "Your verification application has been started but has not yet been submitted for administrative review.";

    case "SUBMITTED":
      return "Your verification application has been submitted and is waiting for administrative review.";

    case "UNDER_REVIEW":
      return "TenderHub administrators are currently reviewing your organization information and supporting documents.";

    case "NEEDS_INFORMATION":
      return "The administrator has requested additional information or documentation before verification can be completed.";

    case "APPROVED":
      return "Your organization has completed the TenderHub verification process.";

    case "REJECTED":
      return "Your verification application was not approved. Review the available information and make the required changes.";

    case "NOT_SUBMITTED":
    default:
      return "Submit your organization information and supporting documents so that TenderHub administrators can review your organization.";
  }
}

function getVerificationActionLabel(
  status: VerificationStatus,
): string {
  switch (status) {
    case "DRAFT":
      return "Continue Verification";

    case "SUBMITTED":
      return "View Verification";

    case "UNDER_REVIEW":
      return "View Verification";

    case "NEEDS_INFORMATION":
      return "Provide Information";

    case "APPROVED":
      return "View Verification";

    case "REJECTED":
      return "Review Verification";

    case "NOT_SUBMITTED":
    default:
      return "Start Verification";
  }
}

function getVerificationBadgeClass(
  status: VerificationStatus,
): string {
  switch (status) {
    case "APPROVED":
      return "inline-flex rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700";

    case "REJECTED":
      return "inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700";

    case "NEEDS_INFORMATION":
      return "inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700";

    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "inline-flex rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700";

    case "DRAFT":
      return "inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700";

    case "NOT_SUBMITTED":
    default:
      return "inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600";
  }
}