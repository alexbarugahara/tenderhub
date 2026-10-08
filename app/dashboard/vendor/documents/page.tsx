import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileCheck2,
  FileText,
  Plus,
  ShieldAlert,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorDocumentsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Card>
            <div className="p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Sign In Required
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Please sign in to manage your vendor documents.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
          documents: {
            select: {
              id: true,
              name: true,
              category: true,
              fileUrl: true,
              mimeType: true,
              fileSize: true,
              status: true,
              issuedAt: true,
              expiryDate: true,
              rejectionReason: true,
              uploadedAt: true,
              updatedAt: true,
            },
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!user?.vendor) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Card>
            <div className="p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Complete your vendor profile before managing company
                documents.
              </p>

              <Link
                href="/dashboard/vendor/profile"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Complete Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const documents = user.vendor.documents;
  const now = new Date();

  const approvedCount = documents.filter((document) => {
    const status = String(document.status).toUpperCase();

    return status === "APPROVED" || status === "VERIFIED";
  }).length;

  const pendingCount = documents.filter(
    (document) =>
      String(document.status).toUpperCase() === "PENDING",
  ).length;

  const rejectedCount = documents.filter(
    (document) =>
      String(document.status).toUpperCase() === "REJECTED",
  ).length;

  const expiredCount = documents.filter(
    (document) =>
      document.expiryDate &&
      document.expiryDate.getTime() < now.getTime(),
  ).length;

  const getStatusClasses = (status: string) => {
    const normalized = status.toUpperCase();

    if (
      normalized === "APPROVED" ||
      normalized === "VERIFIED"
    ) {
      return "bg-green-50 text-green-700";
    }

    if (
      normalized === "REJECTED" ||
      normalized === "EXPIRED"
    ) {
      return "bg-red-50 text-red-700";
    }

    return "bg-amber-50 text-amber-700";
  };

  const getExpiryState = (expiryDate: Date | null) => {
    if (!expiryDate) {
      return null;
    }

    const difference =
      expiryDate.getTime() - now.getTime();

    const days = Math.ceil(
      difference / (1000 * 60 * 60 * 24),
    );

    if (days < 0) {
      return {
        label: "Expired",
        classes: "text-red-600",
      };
    }

    if (days <= 30) {
      return {
        label: `Expires in ${days} day${days === 1 ? "" : "s"}`,
        classes: "text-amber-600",
      };
    }

    return {
      label: `Expires ${expiryDate.toLocaleDateString()}`,
      classes: "text-slate-500",
    };
  };

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-tenderhub-gold">
              Vendor Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Documents
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage the documents used for your vendor profile and
              compliance requirements.
            </p>

            <div className="mt-4">
              <span className="rounded-full bg-tenderhub-navy px-3 py-1.5 text-xs font-semibold text-white">
                {user.vendor.companyName}
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/vendor/documents/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="h-4 w-4" />

                <p className="text-sm">
                  Total Documents
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {documents.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <FileCheck2 className="h-4 w-4" />

                <p className="text-sm">
                  Approved
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {approvedCount}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarDays className="h-4 w-4" />

                <p className="text-sm">
                  Pending
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {pendingCount}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldAlert className="h-4 w-4" />

                <p className="text-sm">
                  Attention
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {expiredCount + rejectedCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {expiredCount} expired · {rejectedCount} rejected
              </p>
            </div>
          </Card>
        </div>

        {documents.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No documents uploaded
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Upload registration, tax, licensing, insurance,
                financial, or other supporting documents required for
                procurement.
              </p>

              <Link
                href="/dashboard/vendor/documents/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Upload Document
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="border-b border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900">
                Company Documents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {documents.length} document
                {documents.length === 1 ? "" : "s"} in your vendor
                profile.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {documents.map((document) => {
                const expiry = getExpiryState(
                  document.expiryDate,
                );

                const status = String(document.status);

                return (
                  <div
                    key={document.id}
                    className="p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {document.name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                              status,
                            )}`}
                          >
                            {status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {String(document.category).replace(
                            /_/g,
                            " ",
                          )}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                          <span className="text-slate-400">
                            Uploaded{" "}
                            {document.uploadedAt.toLocaleDateString()}
                          </span>

                          {document.issuedAt && (
                            <span className="text-slate-400">
                              Issued{" "}
                              {document.issuedAt.toLocaleDateString()}
                            </span>
                          )}

                          {expiry && (
                            <span className={expiry.classes}>
                              {expiry.label}
                            </span>
                          )}

                          {document.fileSize && (
                            <span className="text-slate-400">
                              {Math.ceil(
                                document.fileSize / 1024,
                              )}{" "}
                              KB
                            </span>
                          )}
                        </div>

                        {document.rejectionReason && (
                          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            <span className="font-medium">
                              Rejection reason:
                            </span>{" "}
                            {document.rejectionReason}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-tenderhub-navy"
                        >
                          View
                        </a>

                        <Link
                          href={`/dashboard/vendor/documents/${document.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-3 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          Details
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
