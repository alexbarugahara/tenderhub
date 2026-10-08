"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import LotForm, {
  LotFormValues,
} from "@/components/lots/LotForm";
import LotList, {
  LotListItem,
} from "@/components/lots/LotList";
import Button from "@/components/ui/Button";

interface SolicitationSummary {
  id: string;
  solicitationNumber: string;
  title: string;
  description?: string | null;
  status: string;
  procurement?: {
    id: string;
    title: string;
    referenceNumber: string;
    currency?: {
      code: string;
      name: string;
      symbol?: string | null;
    } | null;
  } | null;
  currency?: {
    code: string;
    name: string;
    symbol?: string | null;
  } | null;
}

interface LotApiItem {
  id: string;
  number: number;
  title: string;
  description?: string | null;
  estimatedValue?: string | number | null;
  status:
    | "OPEN"
    | "CLOSED"
    | "AWARDED"
    | "CANCELLED";
  solicitation?: {
    id: string;
    solicitationNumber: string;
    title: string;
    status: string;
  };
  _count?: {
    requirements: number;
    bids: number;
    awards: number;
  };
}

function getErrorMessage(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return fallback;
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function statusClass(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700";

    case "PUBLISHED":
      return "bg-blue-100 text-blue-700";

    case "OPEN":
      return "bg-emerald-100 text-emerald-700";

    case "UNDER_EVALUATION":
      return "bg-amber-100 text-amber-700";

    case "CLOSED":
      return "bg-slate-200 text-slate-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function SolicitationLotsPage() {
  const params = useParams<{
    id: string;
  }>();

  const solicitationId = params.id;

  const [solicitation, setSolicitation] =
    useState<SolicitationSummary | null>(
      null,
    );

  const [lots, setLots] = useState<
    LotApiItem[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [editingLot, setEditingLot] =
    useState<LotApiItem | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const loadData = useCallback(
    async () => {
      if (!solicitationId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          solicitationResponse,
          lotsResponse,
        ] = await Promise.all([
          fetch(
            `/api/solicitations/${solicitationId}`,
            {
              cache: "no-store",
            },
          ),

          fetch(
            `/api/lots?solicitationId=${encodeURIComponent(
              solicitationId,
            )}`,
            {
              cache: "no-store",
            },
          ),
        ]);

        const solicitationData =
          await solicitationResponse.json();

        const lotsData =
          await lotsResponse.json();

        if (!solicitationResponse.ok) {
          throw new Error(
            getErrorMessage(
              solicitationData,
              "Failed to load solicitation.",
            ),
          );
        }

        if (!lotsResponse.ok) {
          throw new Error(
            getErrorMessage(
              lotsData,
              "Failed to load lots.",
            ),
          );
        }

        setSolicitation(
          solicitationData.data ??
            solicitationData,
        );

        const returnedLots =
          lotsData.data ??
          lotsData.lots ??
          [];

        setLots(
          Array.isArray(returnedLots)
            ? returnedLots
            : [],
        );
      } catch (loadError) {
        console.error(
          "Failed to load solicitation lots:",
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load lots.",
        );
      } finally {
        setLoading(false);
      }
    },
    [solicitationId],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const isDraft =
    solicitation?.status === "DRAFT";

  const currencyCode =
    solicitation?.currency?.code ??
    solicitation?.procurement?.currency
      ?.code ??
    null;

  const currencySymbol =
    solicitation?.currency?.symbol ??
    solicitation?.procurement?.currency
      ?.symbol ??
    null;

  const currencyLabel = currencyCode
    ? `${currencyCode}${
        currencySymbol
          ? ` (${currencySymbol})`
          : ""
      }`
    : "Not specified";

  /*
   * Individual lot detail route.
   */
  const getLotHref = useCallback(
    (lotId: string) =>
      `/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}`,
    [solicitationId],
  );

  /*
   * Individual lot requirements route.
   */
  const getLotRequirementsHref =
    useCallback(
      (lotId: string) =>
        `/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}/requirements`,
      [solicitationId],
    );

  /*
   * Individual lot evaluation criteria route.
   */
  const getLotEvaluationCriteriaHref =
    useCallback(
      (lotId: string) =>
        `/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}/evaluation-criteria`,
      [solicitationId],
    );

  const listItems: LotListItem[] =
    useMemo(
      () =>
        lots.map((lot) => ({
          id: lot.id,
          number: lot.number,
          title: lot.title,
          description: lot.description,
          status: lot.status,
          estimatedValue:
            lot.estimatedValue,
          currencyCode,

          solicitationNumber:
            solicitation?.solicitationNumber ??
            null,

          solicitationTitle:
            solicitation?.title ?? null,

          href: getLotHref(lot.id),
        })),
      [
        lots,
        currencyCode,
        solicitation,
        getLotHref,
      ],
    );

  async function handleSubmit(
    values: LotFormValues,
  ) {
    if (!isDraft) {
      setError(
        "Lots can only be configured while the solicitation is in Draft status.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const isEditing =
        Boolean(editingLot);

      const url = isEditing
        ? `/api/lots/${editingLot!.id}`
        : "/api/lots";

      const method = isEditing
        ? "PATCH"
        : "POST";

      const payload = {
        solicitationId,
        number: Number(values.number),
        title: values.title.trim(),
        description:
          values.description?.trim() ||
          null,

        estimatedValue:
          values.estimatedValue === "" ||
          values.estimatedValue === null ||
          values.estimatedValue ===
            undefined
            ? null
            : Number(
                values.estimatedValue,
              ),

        status: values.status,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data =
        await response.json();

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          getErrorMessage(
            data,
            isEditing
              ? "Failed to update lot."
              : "Failed to create lot.",
          ),
        );
      }

      setShowForm(false);
      setEditingLot(null);

      await loadData();
    } catch (submitError) {
      console.error(
        "Failed to save lot:",
        submitError,
      );

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save lot.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(
    lot: LotApiItem,
  ) {
    if (!isDraft) {
      setError(
        "Lots can only be deleted while the solicitation is in Draft status.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete Lot ${lot.number} "${lot.title}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(lot.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/lots/${lot.id}`,
        {
          method: "DELETE",
        },
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to delete lot.",
          ),
        );
      }

      await loadData();
    } catch (deleteError) {
      console.error(
        "Failed to delete lot:",
        deleteError,
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete lot.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function startCreate() {
    if (!isDraft) {
      setError(
        "Lots can only be configured while the solicitation is in Draft status.",
      );
      return;
    }

    setEditingLot(null);
    setError(null);
    setShowForm(true);
  }

  function startEdit(
    lot: LotApiItem,
  ) {
    if (!isDraft) {
      setError(
        "Lots can only be edited while the solicitation is in Draft status.",
      );
      return;
    }

    setEditingLot(lot);
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingLot(null);
    setError(null);
  }

  const initialValues:
    Partial<LotFormValues> =
    editingLot
      ? {
          number: String(
            editingLot.number,
          ),

          title: editingLot.title,

          description:
            editingLot.description ??
            "",

          estimatedValue:
            editingLot.estimatedValue !==
              null &&
            editingLot.estimatedValue !==
              undefined
              ? String(
                  editingLot.estimatedValue,
                )
              : "",

          status: editingLot.status,
        }
      : {
          status: "OPEN",
        };

  const totalRequirements =
    lots.reduce(
      (total, lot) =>
        total +
        (lot._count
          ?.requirements ?? 0),
      0,
    );

  const totalBids =
    lots.reduce(
      (total, lot) =>
        total +
        (lot._count?.bids ?? 0),
      0,
    );

  const totalAwards =
    lots.reduce(
      (total, lot) =>
        total +
        (lot._count?.awards ?? 0),
      0,
    );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500">
            Loading solicitation lots...
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />

          <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-100" />

          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!solicitation) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-800">
          Solicitation not found
        </h1>

        <p className="mt-2 text-sm text-red-700">
          The solicitation could not be
          loaded.
        </p>

        <Link
          href="/dashboard/organization/solicitations"
          className="mt-4 inline-block text-sm font-semibold text-tenderhub-navy hover:text-tenderhub-gold"
        >
          Back to solicitations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link
              href="/dashboard/organization/solicitations"
              className="hover:text-tenderhub-gold"
            >
              Solicitations
            </Link>

            <span>/</span>

            <Link
              href={`/dashboard/organization/solicitations/${solicitationId}`}
              className="hover:text-tenderhub-gold"
            >
              {
                solicitation.solicitationNumber
              }
            </Link>

            <span>/</span>

            <span>Lots</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-tenderhub-navy">
              Configure Lots
            </h1>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                solicitation.status,
              )}`}
            >
              {formatStatus(
                solicitation.status,
              )}
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Define the lots included in
            this solicitation. Each lot
            belongs automatically to the
            current solicitation.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}`}
          >
            <Button variant="outline">
              Back to Solicitation
            </Button>
          </Link>

          {isDraft && !showForm && (
            <Button
              variant="primary"
              onClick={startCreate}
            >
              Add Lot
            </Button>
          )}
        </div>
      </div>

      {/* Solicitation Context */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Solicitation
            </p>

            <h2 className="mt-1 text-lg font-bold text-tenderhub-navy">
              {
                solicitation.solicitationNumber
              }
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              {solicitation.title}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Currency
            </p>

            <p className="mt-1 text-sm font-semibold text-tenderhub-navy">
              {currencyLabel}
            </p>
          </div>
        </div>

        {!isDraft && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              Lot configuration is locked
            </p>

            <p className="mt-1 text-sm text-amber-800">
              This solicitation is no
              longer in Draft status. Lots
              can only be created, edited,
              or deleted while the
              solicitation is being
              prepared.
            </p>
          </div>
        )}
      </section>

      {/* Error */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Form */}

      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-tenderhub-navy">
                {editingLot
                  ? "Edit Lot"
                  : "Add Lot"}
              </h2>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Draft Preparation
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              This lot will belong to{" "}
              <span className="font-semibold text-slate-700">
                {
                  solicitation.solicitationNumber
                }
              </span>
              . The parent solicitation
              cannot be changed from this
              form.
            </p>
          </div>

          <LotForm
            initialValues={initialValues}
            currencyCode={currencyCode}
            submitLabel={
              editingLot
                ? "Update Lot"
                : "Create Lot"
            }
            cancelLabel="Cancel"
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            onCancel={cancelForm}
          />
        </section>
      )}

      {/* Lots */}

      {!showForm && (
        <section>
          <div className="mb-5">
            <div>
              <h2 className="text-xl font-bold text-tenderhub-navy">
                Lots
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {lots.length === 0
                  ? "No lots have been configured yet."
                  : `${lots.length} lot${
                      lots.length === 1
                        ? ""
                        : "s"
                    } configured.`}
              </p>
            </div>
          </div>

          <LotList
            lots={listItems}
            emptyTitle="No lots configured"
            emptyDescription="Add the first lot for this solicitation to define what vendors can bid on."
          />

          {/* Summary */}

          {lots.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Total Lots
                </p>

                <p className="mt-1 text-2xl font-bold text-tenderhub-navy">
                  {lots.length}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Lot Requirements
                </p>

                <p className="mt-1 text-2xl font-bold text-tenderhub-navy">
                  {totalRequirements}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Bids
                </p>

                <p className="mt-1 text-2xl font-bold text-tenderhub-navy">
                  {totalBids}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Awards
                </p>

                <p className="mt-1 text-2xl font-bold text-tenderhub-navy">
                  {totalAwards}
                </p>
              </div>
            </div>
          )}

          {/* Management */}

          {lots.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-tenderhub-navy">
                    Lot Management
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Use lots to divide the
                    solicitation into
                    separately bid items or
                    groups. Requirements and
                    evaluation criteria can
                    apply specifically to each
                    lot.
                  </p>
                </div>

                {!isDraft && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Configuration locked
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-3">
                {lots.map((lot) => (
                  <div
                    key={lot.id}
                    className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-tenderhub-navy px-2 py-1 text-xs font-bold text-white">
                          Lot {lot.number}
                        </span>

                        <h4 className="font-semibold text-slate-800">
                          {lot.title}
                        </h4>

                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass(
                            lot.status,
                          )}`}
                        >
                          {formatStatus(
                            lot.status,
                          )}
                        </span>
                      </div>

                      {lot.description && (
                        <p className="mt-2 text-sm leading-5 text-slate-600">
                          {lot.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          Requirements:{" "}
                          {lot._count
                            ?.requirements ??
                            0}
                        </span>

                        <span>
                          Bids:{" "}
                          {lot._count?.bids ??
                            0}
                        </span>

                        <span>
                          Awards:{" "}
                          {lot._count
                            ?.awards ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {/* View Lot */}

                      <Link
                        href={getLotHref(
                          lot.id,
                        )}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          View Lot
                        </Button>
                      </Link>

                      {/* Lot-specific Requirements */}

                      <Link
                        href={getLotRequirementsHref(
                          lot.id,
                        )}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          Configure Requirements
                        </Button>
                      </Link>

                      {/* Lot-specific Evaluation Criteria */}

                      <Link
                        href={getLotEvaluationCriteriaHref(
                          lot.id,
                        )}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          Evaluation Criteria
                        </Button>
                      </Link>

                      {isDraft && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              startEdit(lot)
                            }
                            disabled={
                              deletingId ===
                              lot.id
                            }
                          >
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void handleDelete(
                                lot,
                              )
                            }
                            disabled={
                              deletingId ===
                              lot.id
                            }
                          >
                            {deletingId ===
                            lot.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements Navigation */}

          {lots.length > 0 && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">
                    Lot Requirements
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Configure requirements for
                    each individual lot using the
                    <strong>
                      {" "}
                      Configure Requirements
                    </strong>{" "}
                    button above. These
                    requirements apply only to
                    that specific lot.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                  {totalRequirements} lot
                  requirement
                  {totalRequirements === 1
                    ? ""
                    : "s"}
                </span>
              </div>
            </div>
          )}

          {/* Solicitation-wide Requirements */}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-tenderhub-navy">
                  Solicitation-wide Requirements
                </h3>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                  Configure requirements that
                  apply across the entire
                  solicitation rather than to one
                  particular lot.
                </p>
              </div>

              <Link
                href={`/dashboard/organization/solicitations/${solicitationId}/requirements`}
                className="shrink-0"
              >
                <Button variant="outline">
                  Configure Solicitation Requirements
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}