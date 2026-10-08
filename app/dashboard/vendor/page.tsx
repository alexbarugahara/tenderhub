import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  Gavel,
  Heart,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Award,
  FileSignature,
  Clock3,
  CircleAlert,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function formatAmount(value: unknown) {
  if (value === null || value === undefined) {
    return "Not specified";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusVariant(status: string) {
  const normalized = status.toUpperCase();

  if (
    normalized === "ACTIVE" ||
    normalized === "OPEN" ||
    normalized === "SUBMITTED" ||
    normalized === "COMPLETED" ||
    normalized === "SATISFIED" ||
    normalized === "APPROVED" ||
    normalized === "ACCEPTED" ||
    normalized === "NOT_APPLICABLE"
  ) {
    return "success" as const;
  }

  if (
    normalized === "DRAFT" ||
    normalized === "PENDING" ||
    normalized === "IN_PROGRESS" ||
    normalized === "EXPIRING" ||
    normalized === "UNDER_REVIEW" ||
    normalized === "NEEDS_INFORMATION"
  ) {
    return "warning" as const;
  }

  if (
    normalized === "REJECTED" ||
    normalized === "WITHDRAWN" ||
    normalized === "EXPIRED"
  ) {
    return "danger" as const;
  }

  return "default" as const;
}

type RequirementStatus =
  | "OUTSTANDING"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SATISFIED"
  | "REJECTED"
  | "NEEDS_INFORMATION"
  | "NOT_APPLICABLE";

function getRequirementStatusLabel(status: RequirementStatus) {
  switch (status) {
    case "SATISFIED":
      return "Approved";

    case "SUBMITTED":
      return "Submitted";

    case "UNDER_REVIEW":
      return "Under review";

    case "REJECTED":
      return "Action required";

    case "NEEDS_INFORMATION":
      return "Information required";

    case "NOT_APPLICABLE":
      return "Not applicable";

    case "OUTSTANDING":
    default:
      return "Not submitted";
  }
}

function getRequirementStatusVariant(status: RequirementStatus) {
  switch (status) {
    case "SATISFIED":
    case "NOT_APPLICABLE":
      return "success" as const;

    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "warning" as const;

    case "REJECTED":
    case "NEEDS_INFORMATION":
      return "danger" as const;

    case "OUTSTANDING":
    default:
      return "default" as const;
  }
}

function getComplianceSummary(
  applicationStatus: string | null,
  requirements: Array<{
    status: RequirementStatus;
    required: boolean;
  }>,
  verifiedAt: Date | null,
) {
  if (verifiedAt || applicationStatus === "APPROVED") {
    return {
      label: "Verified",
      variant: "success" as const,
      icon: ShieldCheck,
      issues: 0,
    };
  }

  const required = requirements.filter(
    (requirement) => requirement.required,
  );

  const rejected = required.filter(
    (requirement) =>
      requirement.status === "REJECTED",
  );

  const informationRequired = required.filter(
    (requirement) =>
      requirement.status === "NEEDS_INFORMATION",
  );

  const outstanding = required.filter(
    (requirement) =>
      requirement.status === "OUTSTANDING",
  );

  if (rejected.length > 0) {
    return {
      label: "Action Required",
      variant: "danger" as const,
      icon: ShieldAlert,
      issues: rejected.length,
    };
  }

  if (informationRequired.length > 0) {
    return {
      label: "Information Required",
      variant: "warning" as const,
      icon: CircleAlert,
      issues: informationRequired.length,
    };
  }

  if (outstanding.length > 0) {
    return {
      label: "Verification Incomplete",
      variant: "warning" as const,
      icon: Clock3,
      issues: outstanding.length,
    };
  }

  if (
    applicationStatus === "SUBMITTED" ||
    applicationStatus === "UNDER_REVIEW"
  ) {
    return {
      label: "Under Review",
      variant: "warning" as const,
      icon: Clock3,
      issues: 0,
    };
  }

  if (applicationStatus === "REJECTED") {
    return {
      label: "Verification Rejected",
      variant: "danger" as const,
      icon: ShieldAlert,
      issues: 0,
    };
  }

  return {
    label: "Not Yet Verified",
    variant: "warning" as const,
    icon: ShieldAlert,
    issues: 0,
  };
}

export default async function VendorDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-10 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-slate-400" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Authentication Required
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Please sign in before accessing the vendor dashboard.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /*
   * Resolve the vendor from the authenticated user.
   *
   * Do NOT hard-code vendor@demovendor.com.
   */
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,

      vendor: {
        select: {
          id: true,
          companyName: true,
          verifiedAt: true,

          documents: {
            select: {
              id: true,
              name: true,
              status: true,
              expiryDate: true,
            },
            orderBy: {
              uploadedAt: "desc",
            },
            take: 5,
          },
        },
      },
    },
  });

  if (!user?.vendor) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-10 text-center">
              <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-400" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Dashboard
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                A vendor profile is required before vendor procurement
                activity can be displayed.
              </p>

              <div className="mt-6">
                <Link
                  href="/dashboard/vendor/profile"
                  className="inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Set Up Vendor Profile
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const vendorId = user.vendor.id;

  /*
   * Current vendor onboarding architecture:
   *
   * Vendor
   *   ↓
   * VendorApplication
   *   ↓
   * VendorApplicationRequirement
   *   ↓
   * VendorApplicationEvidence
   */
  const application = await prisma.vendorApplication.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      approvedAt: true,
      reviewedAt: true,

      requirementSet: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
        },
      },

      requirements: {
        orderBy: [
          {
            required: "desc",
          },
          {
            name: "asc",
          },
        ],
        select: {
          id: true,
          requirementId: true,
          code: true,
          name: true,
          description: true,
          category: true,
          required: true,
          status: true,
          notes: true,
          reviewedAt: true,

          requirement: {
            select: {
              id: true,
              code: true,
              name: true,
              description: true,
              category: true,
              required: true,
              active: true,
              validityDays: true,
              allowedDocumentCategories: true,
            },
          },

          evidence: {
            orderBy: {
              uploadedAt: "desc",
            },
            select: {
              id: true,
              name: true,
              category: true,
              status: true,
              expiryDate: true,
              rejectionReason: true,
              uploadedAt: true,
              reviewedAt: true,
            },
          },
        },
      },
    },
  });

  const applicationRequirements =
    application?.requirements ?? [];

  const requiredRequirements =
    applicationRequirements.filter(
      (requirement) => requirement.required,
    );

  const satisfiedRequired =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "SATISFIED" ||
        requirement.status === "NOT_APPLICABLE",
    ).length;

  const submittedRequired =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "SUBMITTED" ||
        requirement.status === "UNDER_REVIEW" ||
        requirement.status === "SATISFIED" ||
        requirement.status === "NOT_APPLICABLE",
    ).length;

  const actionRequiredRequirements =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "REJECTED" ||
        requirement.status === "NEEDS_INFORMATION" ||
        requirement.status === "OUTSTANDING",
    );

  const verificationProgress =
    requiredRequirements.length > 0
      ? Math.round(
          (satisfiedRequired /
            requiredRequirements.length) *
            100,
        )
      : 0;

  const complianceSummary = getComplianceSummary(
    application?.status ?? null,
    applicationRequirements.map((requirement) => ({
      status: requirement.status as RequirementStatus,
      required: requirement.required,
    })),
    user.vendor.verifiedAt,
  );

  const ComplianceIcon = complianceSummary.icon;

  /*
   * Recent evidence issues.
   *
   * Evidence is separate from requirement status.
   * PENDING means received but not yet verified.
   */
  const evidenceIssues =
    applicationRequirements.flatMap(
      (requirement) => requirement.evidence,
    ).filter((evidence) => {
      const status = evidence.status.toUpperCase();

      return (
        status === "REJECTED" ||
        status === "EXPIRED" ||
        status === "PENDING"
      );
    }).length;

  const [
    bidCount,
    submittedBidCount,
    activeBidCount,
    savedCount,
    contractCount,
    awardCount,
    openSolicitationCount,
    notificationCount,
  ] = await Promise.all([
    prisma.bid.count({
      where: {
        vendorId,
      },
    }),

    prisma.bid.count({
      where: {
        vendorId,
        submittedAt: {
          not: null,
        },
      },
    }),

    prisma.bid.count({
      where: {
        vendorId,
        status: {
          not: "DRAFT",
        },
      },
    }),

    prisma.savedSolicitation.count({
      where: {
        vendorId,
      },
    }),

    prisma.contract.count({
      where: {
        vendorId,
      },
    }),

    prisma.award.count({
      where: {
        vendorId,
      },
    }),

    prisma.solicitation.count({
      where: {
        status: "OPEN",
      },
    }),

    prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    }),
  ]);

  const recentBids = await prisma.bid.findMany({
    where: {
      vendorId,
    },
    select: {
      id: true,
      title: true,
      totalAmount: true,
      status: true,
      submittedAt: true,
      createdAt: true,

      solicitation: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          closingDate: true,

          procurement: {
            select: {
              id: true,
              title: true,
              referenceNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  const openSolicitations =
    await prisma.solicitation.findMany({
      where: {
        status: "OPEN",
      },
      select: {
        id: true,
        solicitationNumber: true,
        title: true,
        closingDate: true,
        estimatedValue: true,
        procurementMethod: true,

        procurement: {
          select: {
            id: true,
            title: true,
            referenceNumber: true,
          },
        },

        _count: {
          select: {
            bids: true,
            lots: true,
          },
        },
      },
      orderBy: {
        closingDate: "asc",
      },
      take: 5,
    });

  const unreadNotifications =
    await prisma.notification.findMany({
      where: {
        userId: user.id,
        read: false,
      },
      select: {
        id: true,
        title: true,
        message: true,
        createdAt: true,
        type: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
    });

  const documentIssues =
    user.vendor.documents.filter((document) => {
      const status = document.status.toUpperCase();

      return (
        status === "REJECTED" ||
        status === "EXPIRED" ||
        status === "PENDING"
      );
    }).length;

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">

        {/* =========================================================
            HEADER
        ========================================================= */}

        <section className="rounded-2xl bg-tenderhub-navy p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium text-slate-300">
                  Vendor Workspace
                </p>

                <Badge variant={complianceSummary.variant}>
                  {complianceSummary.label}
                </Badge>
              </div>

              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                Welcome, {user.vendor.companyName}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Manage opportunities, bids, compliance, documents,
                awards, and contracts from one procurement workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/vendor/opportunities"
                className="inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-tenderhub-navy transition hover:bg-slate-100"
              >
                <Search className="mr-2 h-4 w-4" />
                Find Opportunities
              </Link>

              <Link
                href="/dashboard/vendor/bids/new"
                className="inline-flex items-center rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Gavel className="mr-2 h-4 w-4" />
                Create Bid
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            VENDOR VERIFICATION
        ========================================================= */}

        <section>
          <Card>
            <div className="p-6 sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-tenderhub-navy">
                    <ShieldCheck className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Vendor Verification
                      </h2>

                      <Badge
                        variant={
                          user.vendor.verifiedAt
                            ? "success"
                            : application?.status === "UNDER_REVIEW" ||
                                application?.status === "SUBMITTED"
                              ? "warning"
                              : complianceSummary.variant
                        }
                      >
                        {user.vendor.verifiedAt
                          ? "Verified"
                          : application?.status ===
                                "UNDER_REVIEW" ||
                              application?.status === "SUBMITTED"
                            ? "Under review"
                            : complianceSummary.label}
                      </Badge>
                    </div>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                      Complete your TenderHub platform verification
                      requirements and submit supporting evidence for
                      administrator review.
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/vendor/compliance"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Open Verification
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              {!application ? (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Vendor onboarding has not been started
                      </p>

                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Your vendor profile exists, but there is no vendor
                        onboarding application yet.
                      </p>

                      <Link
                        href="/dashboard/vendor/onboarding"
                        className="mt-4 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2 text-sm font-medium text-white"
                      >
                        Start Vendor Onboarding
                      </Link>
                    </div>
                  </div>
                </div>
              ) : requiredRequirements.length > 0 ? (
                <>
                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Verification progress
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {satisfiedRequired} of{" "}
                          {requiredRequirements.length} required
                          requirements satisfied
                        </p>
                      </div>

                      <p className="text-sm font-bold text-tenderhub-navy">
                        {verificationProgress}%
                      </p>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-tenderhub-navy transition-all"
                        style={{
                          width: `${verificationProgress}%`,
                        }}
                      />
                    </div>

                    {actionRequiredRequirements.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-700">
                        <CircleAlert className="h-4 w-4" />

                        {actionRequiredRequirements.length} requirement
                        {actionRequiredRequirements.length === 1
                          ? ""
                          : "s"}{" "}
                        need
                        {actionRequiredRequirements.length === 1
                          ? "s"
                          : ""}{" "}
                        your attention.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200">
                    {requiredRequirements.map(
                      (requirement) => {
                        const status =
                          requirement.status as RequirementStatus;

                        return (
                          <div
                            key={requirement.id}
                            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-medium text-slate-900">
                                  {requirement.name}
                                </h3>

                                <Badge
                                  variant={getRequirementStatusVariant(
                                    status,
                                  )}
                                >
                                  {getRequirementStatusLabel(
                                    status,
                                  )}
                                </Badge>
                              </div>

                              {requirement.description && (
                                <p className="mt-1 text-sm leading-5 text-slate-500">
                                  {requirement.description}
                                </p>
                              )}

                              {requirement.evidence.length > 0 ? (
                                <p className="mt-2 text-xs text-slate-500">
                                  Evidence received:{" "}
                                  {requirement.evidence.length}{" "}
                                  document
                                  {requirement.evidence.length === 1
                                    ? ""
                                    : "s"}
                                  .{" "}
                                  {requirement.evidence[0]
                                    ?.status === "PENDING"
                                    ? "Pending verification."
                                    : ""}
                                </p>
                              ) : null}
                            </div>

                            <Link
                              href={`/dashboard/vendor/compliance/${requirement.id}`}
                              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              {status === "SATISFIED" ||
                              status === "NOT_APPLICABLE"
                                ? "View"
                                : status === "REJECTED" ||
                                    status ===
                                      "NEEDS_INFORMATION"
                                  ? "Resolve"
                                  : "Complete"}

                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </div>
                        );
                      },
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Verification requirements are not configured
                      </p>

                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Your vendor application does not currently have
                        any required platform verification requirements.
                        Please contact TenderHub administration if this
                        is unexpected.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* =========================================================
            PRIMARY KPI CARDS
        ========================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/vendor/opportunities"
            className="group"
          >
            <Card>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Open Opportunities
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {openSolicitationCount}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Available for participation
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>

          <Link
            href="/dashboard/vendor/bids"
            className="group"
          >
            <Card>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    My Bids
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {bidCount}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {submittedBidCount} submitted
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
                  <Gavel className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>

          <Link
            href="/dashboard/vendor/awards"
            className="group"
          >
            <Card>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Awards
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {awardCount}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Procurement awards
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
                  <Award className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>

          <Link
            href="/dashboard/vendor/contracts"
            className="group"
          >
            <Card>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Contracts
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {contractCount}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Vendor contracts
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
                  <FileSignature className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>
        </section>

        {/* =========================================================
            QUICK ACTIONS
        ========================================================= */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Access the areas you use most often.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Link
              href="/dashboard/vendor/opportunities"
              className="group"
            >
              <Card>
                <div className="p-4">
                  <Search className="h-5 w-5 text-slate-600" />

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Opportunities
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Find procurements
                  </p>
                </div>
              </Card>
            </Link>

            <Link
              href="/dashboard/vendor/bids"
              className="group"
            >
              <Card>
                <div className="p-4">
                  <Gavel className="h-5 w-5 text-slate-600" />

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    My Bids
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Manage submissions
                  </p>
                </div>
              </Card>
            </Link>

            <Link
              href="/dashboard/vendor/compliance"
              className="group"
            >
              <Card>
                <div className="p-4">
                  <ShieldCheck className="h-5 w-5 text-slate-600" />

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Compliance
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Resolve requirements
                  </p>
                </div>
              </Card>
            </Link>

            <Link
              href="/dashboard/vendor/documents"
              className="group"
            >
              <Card>
                <div className="p-4">
                  <FileText className="h-5 w-5 text-slate-600" />

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Documents
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Manage documents
                  </p>
                </div>
              </Card>
            </Link>

            <Link
              href="/dashboard/vendor/profile"
              className="group"
            >
              <Card>
                <div className="p-4">
                  <UserRound className="h-5 w-5 text-slate-600" />

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Vendor Profile
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Company information
                  </p>
                </div>
              </Card>
            </Link>

            <Link
              href="/dashboard/vendor/settings"
              className="group"
            >
              <Card>
                <div className="p-4">
                  <Settings className="h-5 w-5 text-slate-600" />

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Settings
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Account settings
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        {/* =========================================================
            RECENT BIDS + NOTIFICATIONS
        ========================================================= */}

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Bids
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your latest bid activity.
                </p>
              </div>

              <Link
                href="/dashboard/vendor/bids"
                className="text-sm font-medium text-tenderhub-navy hover:underline"
              >
                View all
              </Link>
            </div>

            {recentBids.length === 0 ? (
              <div className="p-10 text-center">
                <Gavel className="mx-auto h-9 w-9 text-slate-400" />

                <h3 className="mt-3 font-semibold text-slate-900">
                  No bids yet
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Start by exploring open procurement opportunities.
                </p>

                <Link
                  href="/dashboard/vendor/opportunities"
                  className="mt-5 inline-flex items-center text-sm font-medium text-tenderhub-navy hover:underline"
                >
                  Browse opportunities →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {recentBids.map((bid) => (
                  <div
                    key={bid.id}
                    className="p-5 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={getStatusVariant(
                              bid.status,
                            )}
                          >
                            {formatStatus(bid.status)}
                          </Badge>

                          <span className="text-xs font-medium text-slate-500">
                            {bid.solicitation.solicitationNumber}
                          </span>
                        </div>

                        <Link
                          href={`/dashboard/vendor/bids/${bid.id}`}
                          className="mt-2 block font-semibold text-slate-900 hover:text-tenderhub-navy"
                        >
                          {bid.title ?? bid.id}
                        </Link>

                        <p className="mt-1 text-sm text-slate-500">
                          {bid.solicitation.procurement.title}
                        </p>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <p className="text-xs text-slate-500">
                          Bid Amount
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {formatAmount(bid.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>
                        Created: {formatDate(bid.createdAt)}
                      </span>

                      <span>
                        Submitted: {formatDate(bid.submittedAt)}
                      </span>

                      <span>
                        Closing:{" "}
                        {formatDate(
                          bid.solicitation.closingDate,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Notifications
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Recent unread updates.
                  </p>
                </div>

                <div className="relative">
                  <Bell className="h-5 w-5 text-slate-500" />

                  {notificationCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-tenderhub-gold px-1 text-[10px] font-bold text-tenderhub-navy">
                      {notificationCount > 99
                        ? "99+"
                        : notificationCount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {unreadNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-slate-400" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  You are all caught up.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-5"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {notification.title}
                    </p>

                    <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-200 p-4">
              <Link
                href="/dashboard/notifications"
                className="block text-center text-sm font-medium text-tenderhub-navy hover:underline"
              >
                View notifications
              </Link>
            </div>
          </Card>
        </section>

        {/* =========================================================
            OPEN OPPORTUNITIES
        ========================================================= */}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Open Opportunities
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Procurement opportunities currently open for vendor
                participation.
              </p>
            </div>

            <Link
              href="/dashboard/vendor/opportunities"
              className="hidden text-sm font-medium text-tenderhub-navy hover:underline sm:block"
            >
              Browse all
            </Link>
          </div>

          {openSolicitations.length === 0 ? (
            <Card>
              <div className="p-10 text-center">
                <Search className="mx-auto h-9 w-9 text-slate-400" />

                <h3 className="mt-3 font-semibold text-slate-900">
                  No open opportunities
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  New opportunities will appear here when organizations
                  publish solicitations.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {openSolicitations.map((solicitation) => (
                <Card key={solicitation.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <FileText className="h-5 w-5" />
                      </div>

                      <Badge variant="success">
                        Open
                      </Badge>
                    </div>

                    <p className="mt-4 text-xs font-medium text-slate-500">
                      {solicitation.solicitationNumber}
                    </p>

                    <Link
                      href={`/dashboard/vendor/opportunities/${solicitation.id}`}
                      className="mt-1 block text-lg font-semibold text-slate-900 hover:text-tenderhub-navy"
                    >
                      {solicitation.title}
                    </Link>

                    <p className="mt-2 text-sm text-slate-600">
                      {solicitation.procurement.title}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Estimated Value
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatAmount(
                            solicitation.estimatedValue,
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Closing Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(
                            solicitation.closingDate,
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Lots
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {solicitation._count.lots}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-500">
                        {formatStatus(
                          solicitation.procurementMethod,
                        )}
                      </span>

                      <Link
                        href={`/dashboard/vendor/opportunities/${solicitation.id}`}
                        className="inline-flex items-center text-sm font-medium text-tenderhub-navy hover:underline"
                      >
                        View opportunity
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================
            COMPLIANCE / DOCUMENTS / AWARDS
        ========================================================= */}

        <section className="grid gap-6 lg:grid-cols-3">

          {/* Compliance */}

          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                    complianceSummary.variant === "danger"
                      ? "bg-red-50 text-red-600"
                      : complianceSummary.variant === "warning"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <ComplianceIcon className="h-5 w-5" />
                </div>

                <Badge variant={complianceSummary.variant}>
                  {complianceSummary.label}
                </Badge>
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                Compliance
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Keep required registrations, licenses, tax documents,
                and platform verification requirements current.
              </p>

              {complianceSummary.issues > 0 ? (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    {complianceSummary.issues} item
                    {complianceSummary.issues === 1
                      ? ""
                      : "s"} require attention
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Review your vendor verification requirements and
                    resolve outstanding items before participating in
                    procurements that require verified vendors.
                  </p>
                </div>
              ) : user.vendor.verifiedAt ? (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                    <p className="text-sm font-semibold text-emerald-900">
                      Vendor verification approved
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-amber-600" />

                    <p className="text-sm font-semibold text-amber-900">
                      Verification is still in progress
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-3">
                {requiredRequirements.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No vendor verification requirements are currently
                    assigned.
                  </p>
                ) : (
                  requiredRequirements
                    .slice(0, 3)
                    .map((requirement) => (
                      <div
                        key={requirement.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="truncate text-sm text-slate-700">
                          {requirement.name}
                        </span>

                        <Badge
                          variant={getRequirementStatusVariant(
                            requirement.status as RequirementStatus,
                          )}
                        >
                          {getRequirementStatusLabel(
                            requirement.status as RequirementStatus,
                          )}
                        </Badge>
                      </div>
                    ))
                )}
              </div>

              <Link
                href="/dashboard/vendor/compliance"
                className="mt-5 inline-flex items-center text-sm font-medium text-tenderhub-navy hover:underline"
              >
                Manage compliance
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </Card>

          {/* Documents */}

          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <FileCheck2 className="h-5 w-5" />
                </div>

                {documentIssues > 0 && (
                  <Badge variant="warning">
                    {documentIssues} issue
                    {documentIssues === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                Documents
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Manage documents supporting your vendor profile and
                procurement compliance.
              </p>

              <div className="mt-5 space-y-3">
                {user.vendor.documents.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No vendor documents available.
                  </p>
                ) : (
                  user.vendor.documents
                    .slice(0, 3)
                    .map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {document.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            Expires{" "}
                            {formatDate(
                              document.expiryDate,
                            )}
                          </p>
                        </div>

                        <Badge
                          variant={getStatusVariant(
                            document.status,
                          )}
                        >
                          {formatStatus(document.status)}
                        </Badge>
                      </div>
                    ))
                )}
              </div>

              <Link
                href="/dashboard/vendor/documents"
                className="mt-5 inline-flex items-center text-sm font-medium text-tenderhub-navy hover:underline"
              >
                Manage documents
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </Card>

          {/* Awards & Contracts */}

          <Card>
            <div className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Award className="h-5 w-5" />
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                Awards & Contracts
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Track procurement awards and your active contractual
                relationships.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard/vendor/awards"
                  className="rounded-lg bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <p className="text-xs text-slate-500">
                    Awards
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {awardCount}
                  </p>

                  <p className="mt-1 text-xs font-medium text-tenderhub-navy">
                    View awards →
                  </p>
                </Link>

                <Link
                  href="/dashboard/vendor/contracts"
                  className="rounded-lg bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <p className="text-xs text-slate-500">
                    Contracts
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {contractCount}
                  </p>

                  <p className="mt-1 text-xs font-medium text-tenderhub-navy">
                    View contracts →
                  </p>
                </Link>
              </div>
            </div>
          </Card>
        </section>

        {/* =========================================================
            SAVED OPPORTUNITIES
        ========================================================= */}

        <Card>
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Heart className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Saved Opportunities
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  You have {savedCount} saved procurement
                  {savedCount === 1 ? "" : "s"} for later review.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/vendor/opportunities"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View Saved Opportunities
            </Link>
          </div>
        </Card>

        {/* =========================================================
            ACTIVITY
        ========================================================= */}

        <Card>
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Gavel className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Vendor Activity
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  You currently have {activeBidCount} active bid
                  record
                  {activeBidCount === 1 ? "" : "s"} across TenderHub.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/vendor/bids"
              className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Manage Bids
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}