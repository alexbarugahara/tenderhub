import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface AdminContractDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(
  value: Date | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatValue(
  value: unknown,
  currency: string | null | undefined,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  if (!currency) {
    return numericValue.toLocaleString("en-US");
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${currency} ${numericValue.toLocaleString(
      "en-US",
    )}`;
  }
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
      return "success";

    case "DRAFT":
    case "PENDING_SIGNATURE":
    case "ON_HOLD":
      return "warning";

    case "TERMINATED":
      return "danger";

    default:
      return "default";
  }
}

function getStatusLabel(
  status: string,
): string {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default async function AdminContractDetailsPage({
  params,
}: AdminContractDetailsPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const contract = await prisma.contract.findUnique({
    where: {
      id,
    },
    include: {
      vendor: true,
      organization: true,
      award: {
        include: {
          bid: {
            include: {
              currency: true,
            },
          },
        },
      },
    },
  });

  if (!contract) {
    notFound();
  }

  const currencyCode =
    contract.award?.bid?.currency?.code ?? null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/contracts"
          className="text-sm font-medium text-tenderhub-gold hover:underline"
        >
          ← Back to Contracts
        </Link>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-tenderhub-gold">
              {contract.contractNumber}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-tenderhub-navy">
              {contract.title}
            </h1>

            {contract.description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                {contract.description}
              </p>
            )}
          </div>

          <Badge
            variant={getStatusVariant(
              contract.status,
            )}
          >
            {getStatusLabel(
              contract.status,
            )}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Contract Details
          </h2>

          <dl className="mt-5 divide-y divide-gray-100">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">
                Contract Number
              </dt>

              <dd className="text-right text-sm font-medium text-gray-900">
                {contract.contractNumber}
              </dd>
            </div>

            <div className="flex justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">
                Contract Value
              </dt>

              <dd className="text-right text-sm font-medium text-gray-900">
                {formatValue(
                  contract.contractValue,
                  currencyCode,
                )}
              </dd>
            </div>

            <div className="flex justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">
                Start Date
              </dt>

              <dd className="text-right text-sm text-gray-900">
                {formatDate(
                  contract.startDate,
                )}
              </dd>
            </div>

            <div className="flex justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">
                End Date
              </dt>

              <dd className="text-right text-sm text-gray-900">
                {formatDate(
                  contract.endDate,
                )}
              </dd>
            </div>

            <div className="flex justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">
                Signed At
              </dt>

              <dd className="text-right text-sm text-gray-900">
                {formatDate(
                  contract.signedAt,
                )}
              </dd>
            </div>

            <div className="flex justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">
                Created At
              </dt>

              <dd className="text-right text-sm text-gray-900">
                {formatDate(
                  contract.createdAt,
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Parties
          </h2>

          <dl className="mt-5 divide-y divide-gray-100">
            <div className="py-3">
              <dt className="text-sm text-gray-500">
                Vendor
              </dt>

              <dd className="mt-1 text-sm font-medium text-gray-900">
                {contract.vendor?.companyName ??
                  contract.vendor?.legalName ??
                  "—"}
              </dd>
            </div>

            <div className="py-3">
              <dt className="text-sm text-gray-500">
                Organization
              </dt>

              <dd className="mt-1 text-sm font-medium text-gray-900">
                {contract.organization?.name ??
                  "—"}
              </dd>
            </div>

            <div className="py-3">
              <dt className="text-sm text-gray-500">
                Award
              </dt>

              <dd className="mt-1 text-sm text-gray-900">
                {contract.award?.awardNumber ??
                  "—"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {(contract.terminatedAt ||
        contract.completedAt ||
        contract.terminationReason) && (
        <Card>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Contract Status History
          </h2>

          <dl className="mt-5 divide-y divide-gray-100">
            {contract.completedAt && (
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-sm text-gray-500">
                  Completed At
                </dt>

                <dd className="text-right text-sm text-gray-900">
                  {formatDate(
                    contract.completedAt,
                  )}
                </dd>
              </div>
            )}

            {contract.terminatedAt && (
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-sm text-gray-500">
                  Terminated At
                </dt>

                <dd className="text-right text-sm text-gray-900">
                  {formatDate(
                    contract.terminatedAt,
                  )}
                </dd>
              </div>
            )}

            {contract.terminationReason && (
              <div className="py-3">
                <dt className="text-sm text-gray-500">
                  Termination Reason
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {contract.terminationReason}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}
    </div>
  );
}