import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  FileBarChart,
  FileText,
  Gavel,
  PieChart,
  TrendingUp,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function OrganizationReportsPage() {
  const membership = await prisma.organizationMember.findFirst({
    select: {
      organizationId: true,
    },
  });

  if (!membership) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-8 text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-slate-400" />
              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Reports
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                No organization membership was found for this account.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const [
    procurementCount,
    solicitationCount,
    bidCount,
    evaluationCount,
    contractCount,
    awardCount,
  ] = await Promise.all([
    prisma.procurement.count({
      where: {
        organizationId: membership.organizationId,
      },
    }),
    prisma.solicitation.count({
      where: {
        procurement: {
          organizationId: membership.organizationId,
        },
      },
    }),
    prisma.bid.count({
      where: {
        solicitation: {
          procurement: {
            organizationId: membership.organizationId,
          },
        },
      },
    }),
    prisma.evaluation.count({
      where: {
        bid: {
          solicitation: {
            procurement: {
              organizationId: membership.organizationId,
            },
          },
        },
      },
    }),
    prisma.contract.count({
      where: {
        award: {
          solicitation: {
            procurement: {
              organizationId: membership.organizationId,
            },
          },
        },
      },
    }),
    prisma.award.count({
      where: {
        solicitation: {
          procurement: {
            organizationId: membership.organizationId,
          },
        },
      },
    }),
  ]);

  const reports = [
    {
      title: "Procurement Report",
      description:
        "Review procurement activity, methods, values, statuses, timelines, and organizational purchasing activity.",
      href: "/dashboard/organization/reports/procurement",
      icon: BriefcaseBusiness,
      metric: procurementCount,
      label: "Procurements",
    },
    {
      title: "Bid Report",
      description:
        "Analyze bid volumes, vendor participation, bid statuses, submissions, and procurement competition.",
      href: "/dashboard/organization/reports/bids",
      icon: Gavel,
      metric: bidCount,
      label: "Bids",
    },
    {
      title: "Evaluation Report",
      description:
        "Review evaluations, scoring activity, evaluation criteria, evaluator activity, and completed assessments.",
      href: "/dashboard/organization/reports/evaluations",
      icon: ClipboardCheck,
      metric: evaluationCount,
      label: "Evaluations",
    },
    {
      title: "Contract Report",
      description:
        "Monitor awarded contracts, contract values, lifecycle dates, payments, milestones, and documents.",
      href: "/dashboard/organization/reports/contracts",
      icon: FileText,
      metric: contractCount,
      label: "Contracts",
    },
  ];

  const summaryCards = [
    {
      title: "Procurements",
      value: procurementCount,
      icon: BriefcaseBusiness,
    },
    {
      title: "Solicitations",
      value: solicitationCount,
      icon: FileBarChart,
    },
    {
      title: "Bids",
      value: bidCount,
      icon: Gavel,
    },
    {
      title: "Evaluations",
      value: evaluationCount,
      icon: ClipboardCheck,
    },
    {
      title: "Awards",
      value: awardCount,
      icon: PieChart,
    },
    {
      title: "Contracts",
      value: contractCount,
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
              <BarChart3 className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Reports & Analytics
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Review procurement performance and operational activity across
                your organization.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title}>
                <div className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {item.value}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Available Reports
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a report to explore detailed procurement data.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {reports.map((report) => {
              const Icon = report.icon;

              return (
                <Link
                  key={report.href}
                  href={report.href}
                  className="group block"
                >
                  <Card className="h-full transition-shadow group-hover:shadow-md">
                    <div className="flex h-full flex-col p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">
                            {report.metric}
                          </p>
                          <p className="text-xs text-slate-500">
                            {report.label}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
                          {report.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {report.description}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-tenderhub-navy">
                        Open report
                        <TrendingUp className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <Card>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <BarChart3 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Reporting Overview
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  TenderHub reporting connects procurement, solicitation,
                  bidding, evaluation, award, and contract activity so your
                  organization can review the procurement lifecycle from a
                  single reporting area.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}