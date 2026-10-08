import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { prisma } from "@/lib/db/prisma";

interface ProcurementDocumentsPageProps {
  params: Promise<{
    id: string;
  }>;
}

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

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

export default async function ProcurementDocumentsPage({
  params,
}: ProcurementDocumentsPageProps) {
  const { id } = await params;

  const procurement = await prisma.procurement.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      organizationId: true,
      title: true,
      referenceNumber: true,

      solicitations: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,

          documents: {
            select: {
              id: true,
              name: true,
              category: true,
              fileUrl: true,
              mimeType: true,
              fileSize: true,
              version: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!procurement) {
    notFound();
  }

  const documents = procurement.solicitations.flatMap(
    (solicitation) =>
      solicitation.documents.map((document) => ({
        ...document,
        solicitation: {
          id: solicitation.id,
          solicitationNumber:
            solicitation.solicitationNumber,
          title: solicitation.title,
        },
      })),
  );

  const documentsWithFiles = documents.filter(
    (document) => Boolean(document.fileUrl),
  ).length;

  const documentCategories = documents.reduce<
    Record<string, number>
  >((accumulator, document) => {
    accumulator[document.category] =
      (accumulator[document.category] || 0) + 1;

    return accumulator;
  }, {});

  const totalFileSize = documents.reduce(
    (total, document) => {
      if (document.fileSize === null) {
        return total;
      }

      return total + Number(document.fileSize);
    },
    0,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/dashboard/organization/procurements/${procurement.id}`}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Procurement Details
          </Link>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Procurement Documents
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            {procurement.title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Reference: {procurement.referenceNumber}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/organization/procurements/${procurement.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Procurement Overview
          </Link>

          <Link
            href={`/dashboard/organization/solicitations?procurementId=${procurement.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            Manage Solicitations
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Documents"
          value={documents.length.toString()}
          detail="Across all solicitations"
        />

        <MetricCard
          label="With Files"
          value={documentsWithFiles.toString()}
          detail="Documents with uploaded files"
        />

        <MetricCard
          label="Categories"
          value={Object.keys(
            documentCategories,
          ).length.toString()}
          detail="Document categories"
        />

        <MetricCard
          label="Total File Size"
          value={formatFileSize(totalFileSize)}
          detail="Across uploaded files"
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Document Categories
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Categories of documents currently attached to
            solicitation records.
          </p>
        </div>

        {Object.keys(documentCategories).length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No document categories have been configured
            yet.
          </div>
        ) : (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.entries(documentCategories)
              .sort(([first], [second]) =>
                first.localeCompare(second),
              )
              .map(([category, count]) => (
                <div
                  key={category}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatLabel(category)}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {count}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {count === 1
                      ? "document"
                      : "documents"}
                  </p>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Solicitation Documents
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Documents belonging to the solicitations within
            this procurement.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
              +
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No documents yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Documents are attached to solicitations. Open a
              solicitation to add or manage its procurement
              documents.
            </p>

            <Link
              href={`/dashboard/organization/solicitations?procurementId=${procurement.id}`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Manage Solicitations
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Document</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Version</TableHeader>
                  <TableHeader>Solicitation</TableHeader>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Updated</TableHeader>
                  <TableHeader>Action</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {documents.map((document) => (
                  <tr
                    key={document.id}
                    className="hover:bg-slate-50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {document.name}
                        </p>

                        {document.mimeType && (
                          <p className="mt-1 text-xs text-slate-500">
                            {document.mimeType}
                          </p>
                        )}

                        {document.fileSize !== null && (
                          <p className="mt-1 text-xs text-slate-400">
                            {formatFileSize(
                              Number(document.fileSize),
                            )}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-slate-700">
                        {formatLabel(document.category)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                        v{document.version}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/dashboard/organization/solicitations/${document.solicitation.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-tenderhub-navy"
                      >
                        {document.solicitation.title}
                      </Link>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          document.solicitation
                            .solicitationNumber
                        }
                      </p>
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {formatDate(document.createdAt)}
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {formatDate(document.updatedAt)}
                    </TableCell>

                    <TableCell>
                      {document.fileUrl ? (
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-tenderhub-navy hover:underline"
                        >
                          View File
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No file
                        </span>
                      )}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Document Workflow
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <WorkflowCard
            number="1"
            title="Prepare"
            description="Prepare the procurement and solicitation documents required for the opportunity."
          />

          <WorkflowCard
            number="2"
            title="Publish"
            description="Make the appropriate solicitation documents available to eligible vendors."
          />

          <WorkflowCard
            number="3"
            title="Maintain"
            description="Keep procurement documentation organized and accessible throughout the procurement lifecycle."
          />
        </div>
      </section>

      <div>
        <Link
          href={`/dashboard/organization/procurements/${procurement.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to Procurement
        </Link>
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
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function WorkflowCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
        {number}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function TableHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-6 py-4 text-sm text-slate-600 ${className}`}
    >
      {children}
    </td>
  );
}

function formatFileSize(bytes: number) {
  if (bytes <= 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
}