import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAmount(value: unknown) {
  if (value === null || value === undefined) {
    return "Not specified";
  }

  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getStatusClasses(status: string) {
  const normalized = status.toUpperCase();

  if (
    normalized === "AWARDED" ||
    normalized === "APPROVED" ||
    normalized === "ACTIVE"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    normalized === "PENDING" ||
    normalized === "DRAFT" ||
    normalized === "UNDER_REVIEW" ||
    normalized === "PENDING_SIGNATURE"
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "REJECTED" ||
    normalized === "FAILED" ||
    normalized === "TERMINATED"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    normalized === "COMPLETED" ||
    normalized === "CLOSED" ||
    normalized === "EXPIRED"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default async function OrganizationAwardDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const award = await prisma.award.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      awardNumber: true,
      status: true,
      awardAmount: true,
      awardDate: true,
      notes: true,
      createdAt: true,
      updatedAt: true,

      vendor: {
        select: {
          id: true,
          companyName: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },

      bid: {
        select: {
          id: true,
          bidNumber: true,
          title: true,
          status: true,
          totalAmount: true,
          submittedAt: true,
          createdAt: true,

          vendor: {
            select: {
              id: true,
              companyName: true,
            },
          },

          solicitation: {
            select: {
              id: true,
              solicitationNumber: true,
              title: true,
              status: true,
              procurementMethod: true,
              publishedAt: true,
              openingDate: true,
              closingDate: true,
              estimatedValue: true,

              procurement: {
                select: {
                  id: true,
                  title: true,
                  referenceNumber: true,
                  status: true,

                  organization: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },

                  department: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },

                  country: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },

                  currency: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },

      lot: {
        select: {
          id: true,
          number: true,
          title: true,
          description: true,
          estimatedValue: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      contract: {
        select: {
          id: true,
          contractNumber: true,
          title: true,
          description: true,
          status: true,
          contractValue: true,
          startDate: true,
          endDate: true,
          signedAt: true,
          createdAt: true,
          updatedAt: true,

          vendor: {
            select: {
              id: true,
              companyName: true,
            },
          },

          documents: {
            select: {
              id: true,
              name: true,
              fileUrl: true,
              mimeType: true,
              fileSize: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },

          milestones: {
            select: {
              id: true,
              title: true,
              description: true,
              dueDate: true,
              status: true,
              completedAt: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              dueDate: "asc",
            },
          },

          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentDate: true,
              reference: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              paymentDate: "asc",
            },
          },
        },
      },
    },
  });

  if (!award) {
    notFound();
  }

  const solicitation = award.bid.solicitation;
  const procurement = solicitation.procurement;

  const bidAmount = Number(award.bid.totalAmount);
  const awardAmount = Number(award.awardAmount);

  const lotValue =
    award.lot?.estimatedValue !== null &&
    award.lot?.estimatedValue !== undefined
      ? Number(award.lot.estimatedValue)
      : null;

  const awardVsBidDifference = bidAmount - awardAmount;

  const awardVsBidPercentage =
    bidAmount !== 0 ? ((awardAmount - bidAmount) / bidAmount) * 100 : null;

  const totalContractPayments = award.contract
    ? award.contract.payments.reduce(
        (total, payment) => total + Number(payment.amount),
        0,
      )
    : 0;

  const paidContractPayments = award.contract
    ? award.contract.payments
        .filter((payment) => payment.status === "PAID")
        .reduce((total, payment) => total + Number(payment.amount), 0)
    : 0;

  const remainingContractValue = award.contract
    ? Number(award.contract.contractValue) - paidContractPayments
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link
              href="/dashboard/organization/awards"
              className="hover:text-tenderhub-navy"
            >
              Awards
            </Link>

            <span>/</span>

            <span>{award.awardNumber}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {award.awardNumber}
            </h1>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                award.status,
              )}`}
            >
              {formatLabel(award.status)}
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Award record for {award.vendor.companyName} under{" "}
            {solicitation.solicitationNumber}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/organization/solicitations/${solicitation.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Solicitation
          </Link>

          <Link
            href="/dashboard/organization/contracts"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Contracts
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Award Amount"
          value={formatAmount(award.awardAmount)}
          detail="Recorded award value"
        />

        <MetricCard
          label="Bid Amount"
          value={formatAmount(award.bid.totalAmount)}
          detail="Winning bid amount"
        />

        <MetricCard
          label="Award Date"
          value={formatDate(award.awardDate)}
          detail="Recorded decision date"
        />

        <MetricCard
          label="Vendor"
          value={award.vendor.companyName}
          detail="Awarded vendor"
        />

        <MetricCard
          label="Contract"
          value={award.contract ? "Linked" : "Not linked"}
          detail="Contract transition"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <SectionHeading
            title="Award Summary"
            description="Core information recorded for this award."
          />

          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <InfoItem label="Award Number" value={award.awardNumber} />

            <InfoItem
              label="Status"
              value={formatLabel(award.status)}
            />

            <InfoItem
              label="Award Amount"
              value={formatAmount(award.awardAmount)}
            />

            <InfoItem
              label="Award Date"
              value={formatDate(award.awardDate)}
            />

            <InfoItem
              label="Created"
              value={formatDateTime(award.createdAt)}
            />

            <InfoItem
              label="Last Updated"
              value={formatDateTime(award.updatedAt)}
            />
          </div>

          {award.notes ? (
            <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Award Notes
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {award.notes}
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading
            title="Awarded Vendor"
            description="Vendor associated with this award."
          />

          <div className="mt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tenderhub-navy text-lg font-bold text-white">
              {award.vendor.companyName.charAt(0).toUpperCase()}
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {award.vendor.companyName}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Awarded vendor
            </p>

            <div className="mt-5 space-y-3">
              <InfoItem
                label="Contact"
                value={award.vendor.user.name}
              />

              <InfoItem
                label="Email"
                value={award.vendor.user.email}
              />

              <InfoItem
                label="Phone"
                value={award.vendor.user.phone ?? "Not provided"}
              />
            </div>

            <Link
              href={`/dashboard/organization/vendors/${award.vendor.id}`}
              className="mt-5 inline-flex text-sm font-semibold text-tenderhub-navy hover:underline"
            >
              View Vendor
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeading
          title="Procurement Context"
          description="The solicitation and procurement associated with this award."
        />

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ContextCard
            label="Procurement"
            value={procurement.title}
            detail={procurement.referenceNumber}
            href={`/dashboard/organization/procurements/${procurement.id}`}
          />

          <ContextCard
            label="Solicitation"
            value={solicitation.title}
            detail={solicitation.solicitationNumber}
            href={`/dashboard/organization/solicitations/${solicitation.id}`}
          />

          <InfoCard
            label="Procurement Method"
            value={formatLabel(solicitation.procurementMethod)}
          />

          <InfoCard
            label="Department"
            value={
              procurement.department
                ? procurement.department.name
                : "Not assigned"
            }
          />

          <InfoCard
            label="Country"
            value={
              procurement.country
                ? procurement.country.name
                : "Not specified"
            }
          />

          <InfoCard
            label="Currency"
            value={
              procurement.currency
                ? `${procurement.currency.code} — ${procurement.currency.name}`
                : "Not specified"
            }
          />

          <InfoCard
            label="Solicitation Status"
            value={formatLabel(solicitation.status)}
          />

          <InfoCard
            label="Procurement Status"
            value={formatLabel(procurement.status)}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading
            title="Winning Bid"
            description="The bid from which this award was created."
          />

          <div className="mt-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {award.bid.bidNumber}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {award.bid.title ?? "Untitled bid"}
                </p>
              </div>

              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                  award.bid.status,
                )}`}
              >
                {formatLabel(award.bid.status)}
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <InfoItem
                label="Bid Amount"
                value={formatAmount(award.bid.totalAmount)}
              />

              <InfoItem
                label="Submitted"
                value={formatDateTime(award.bid.submittedAt)}
              />

              <InfoItem
                label="Created"
                value={formatDateTime(award.bid.createdAt)}
              />

              <InfoItem
                label="Bid Vendor"
                value={award.bid.vendor.companyName}
              />
            </div>

            <div className="border-t border-slate-200 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Award vs Bid
              </p>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <InfoItem
                  label="Difference"
                  value={formatAmount(awardVsBidDifference)}
                />

                <InfoItem
                  label="Percentage"
                  value={
                    awardVsBidPercentage === null
                      ? "Not available"
                      : `${awardVsBidPercentage.toFixed(2)}%`
                  }
                />
              </div>
            </div>

            <Link
              href={`/dashboard/organization/bids/${award.bid.id}`}
              className="inline-flex text-sm font-semibold text-tenderhub-navy hover:underline"
            >
              View Bid
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading
            title="Lot"
            description="Lot information associated with the award."
          />

          {award.lot ? (
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Lot
                </p>

                <p className="mt-2 text-base font-semibold text-slate-900">
                  {award.lot.number} — {award.lot.title}
                </p>
              </div>

              <InfoItem
                label="Status"
                value={formatLabel(award.lot.status)}
              />

              <InfoItem
                label="Estimated Value"
                value={formatAmount(lotValue)}
              />

              <InfoItem
                label="Created"
                value={formatDateTime(award.lot.createdAt)}
              />

              {award.lot.description ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {award.lot.description}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-lg bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-700">
                This award is not associated with a specific lot.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeading
          title="Contract Transition"
          description="Contract information associated with this award."
        />

        {award.contract ? (
          <div className="mt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Link
                  href={`/dashboard/organization/contracts/${award.contract.id}`}
                  className="text-lg font-semibold text-slate-900 hover:text-tenderhub-navy"
                >
                  {award.contract.contractNumber}
                </Link>

                <p className="mt-1 text-sm text-slate-600">
                  {award.contract.title}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                  award.contract.status,
                )}`}
              >
                {formatLabel(award.contract.status)}
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                label="Contract Value"
                value={formatAmount(award.contract.contractValue)}
              />

              <InfoItem
                label="Start Date"
                value={formatDate(award.contract.startDate)}
              />

              <InfoItem
                label="End Date"
                value={formatDate(award.contract.endDate)}
              />

              <InfoItem
                label="Signed"
                value={formatDate(award.contract.signedAt)}
              />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <SummaryCard
                title="Payments"
                value={formatAmount(totalContractPayments)}
                description={`${award.contract.payments.length} payment record${
                  award.contract.payments.length === 1 ? "" : "s"
                }`}
              />

              <SummaryCard
                title="Paid"
                value={formatAmount(paidContractPayments)}
                description="Payments recorded as paid"
              />

              <SummaryCard
                title="Remaining"
                value={
                  remainingContractValue === null
                    ? "Not available"
                    : formatAmount(remainingContractValue)
                }
                description="Contract value less paid payments"
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Milestones
                </h3>

                {award.contract.milestones.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No contract milestones have been recorded.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {award.contract.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {milestone.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Due {formatDate(milestone.dueDate)}
                            </p>
                          </div>

                          <span className="text-xs font-semibold text-slate-600">
                            {formatLabel(milestone.status)}
                          </span>
                        </div>

                        {milestone.description ? (
                          <p className="mt-3 text-sm leading-5 text-slate-500">
                            {milestone.description}
                          </p>
                        ) : null}

                        {milestone.completedAt ? (
                          <p className="mt-2 text-xs text-emerald-600">
                            Completed {formatDate(milestone.completedAt)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Payments
                </h3>

                {award.contract.payments.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No contract payments have been recorded.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {award.contract.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatAmount(payment.amount)}
                          </p>

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              payment.status,
                            )}`}
                          >
                            {formatLabel(payment.status)}
                          </span>
                        </div>

                        <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                          <span>
                            Payment Date:{" "}
                            {formatDate(payment.paymentDate)}
                          </span>

                          <span>
                            Reference:{" "}
                            {payment.reference ?? "Not provided"}
                          </span>
                        </div>

                        {payment.notes ? (
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {payment.notes}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/dashboard/organization/contracts/${award.contract.id}`}
                className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                View Contract
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h3 className="text-base font-semibold text-slate-900">
              No Contract Linked
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              This award does not currently have an associated contract
              record.
            </p>

            <Link
              href="/dashboard/organization/contracts"
              className="mt-5 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Contracts
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <SectionHeading
          title="Award Timeline"
          description="Key dates associated with this award."
        />

        <div className="mt-6 grid gap-5 md:grid-cols-4">
          <TimelineItem
            title="Award Created"
            date={award.createdAt}
            description="Award record created."
          />

          <TimelineItem
            title="Award Date"
            date={award.awardDate}
            description="Award decision date."
          />

          <TimelineItem
            title="Last Updated"
            date={award.updatedAt}
            description="Most recent award record update."
          />

          <TimelineItem
            title="Contract Signed"
            date={award.contract?.signedAt ?? null}
            description="Associated contract signing date."
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/organization/awards"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Awards
        </Link>

        <Link
          href={`/dashboard/organization/solicitations/${solicitation.id}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Solicitation
        </Link>

        {award.contract ? (
          <Link
            href={`/dashboard/organization/contracts/${award.contract.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            View Contract
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function InfoItem({
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

      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ContextCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </Link>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  description,
}: {
  title: string;
  date: Date | null;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
        •
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>

      <p className="mt-1 text-sm font-medium text-slate-700">
        {formatDateTime(date)}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}