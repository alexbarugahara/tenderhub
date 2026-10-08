import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Megaphone,
  Send,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface NoticeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(
  date: Date | null | undefined,
): string {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function publicationVariant(
  published: boolean,
): "success" | "warning" {
  return published ? "success" : "warning";
}

export default async function OrganizationNoticeDetailPage({
  params,
}: NoticeDetailPageProps) {
  const { id } = await params;

  const notice = await prisma.notice.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      solicitation: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
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
  });

  if (!notice) {
    notFound();
  }

  const solicitation = notice.solicitation;

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard/organization/notices"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Notices
          </Link>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                <Megaphone className="h-6 w-6" />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant={publicationVariant(
                      notice.published,
                    )}
                  >
                    {notice.published
                      ? "Published"
                      : "Draft"}
                  </Badge>

                  <span className="text-sm text-slate-500">
                    Notice #
                    {notice.id
                      .slice(-8)
                      .toUpperCase()}
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {notice.title}
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  {solicitation
                    ? `${formatLabel(notice.type)} associated with this solicitation.`
                    : `${formatLabel(notice.type)} notice without an associated solicitation.`}
                </p>
              </div>
            </div>

            {solicitation && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/organization/solicitations/${solicitation.id}`}
                >
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    View Solicitation
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Bell className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Notice Content
                    </h2>
                    <p className="text-sm text-slate-500">
                      Official communication associated
                      with this solicitation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {notice.content ? (
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {notice.content}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Bell className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No notice content has been provided.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Procurement Context
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  The procurement and solicitation connected
                  to this notice.
                </p>
              </div>

              {solicitation ? (
                <div className="divide-y divide-slate-200">
                  <div className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Procurement
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {solicitation.procurement.title}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/organization/procurements/${solicitation.procurement.id}`}
                      className="text-sm font-medium text-tenderhub-navy hover:underline"
                    >
                      {solicitation.procurement.referenceNumber}
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Solicitation
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {solicitation.title}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/organization/solicitations/${solicitation.id}`}
                      className="text-sm font-medium text-tenderhub-navy hover:underline"
                    >
                      {solicitation.solicitationNumber}
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Solicitation Status
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Current status of the associated
                        solicitation.
                      </p>
                    </div>

                    <Badge variant="default">
                      {formatLabel(
                        solicitation.status,
                      )}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No solicitation is associated
                      with this notice.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      The notice can still be viewed, but
                      there is no solicitation context to
                      display.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Notice Information
                </h2>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-slate-500" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Publication
                    </p>

                    <div className="mt-1">
                      <Badge
                        variant={publicationVariant(
                          notice.published,
                        )}
                      >
                        {notice.published
                          ? "Published"
                          : "Draft"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-slate-500" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Notice Type
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatLabel(notice.type)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Send className="mt-0.5 h-5 w-5 text-slate-500" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Published
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatDate(
                        notice.publishedAt,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-slate-500" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Created
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatDate(notice.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-slate-500" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Last Updated
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatDate(notice.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Notice Workflow
                </h2>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-tenderhub-gold" />

                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Notice created
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatDate(notice.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-tenderhub-gold" />

                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Notice published
                      </p>

                      <p className="text-xs text-slate-500">
                        {notice.published
                          ? formatDate(
                              notice.publishedAt,
                            )
                          : "Not published"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-tenderhub-gold" />

                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Last modification
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatDate(notice.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}