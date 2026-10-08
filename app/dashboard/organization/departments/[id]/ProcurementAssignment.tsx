"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  assignProcurementsToDepartment,
  removeProcurementFromDepartment,
} from "./actions";

type ProcurementItem = {
  id: string;
  title: string;
  referenceNumber: string;
  status: string;
  estimatedValue: string | null;
};

type CurrentProcurement = ProcurementItem;

export default function ProcurementAssignment({
  departmentId,
  currentProcurements,
  availableProcurements,
}: {
  departmentId: string;
  currentProcurements: CurrentProcurement[];
  availableProcurements: ProcurementItem[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggleSelection(procurementId: string) {
    setSelectedIds((current) =>
      current.includes(procurementId)
        ? current.filter((id) => id !== procurementId)
        : [...current, procurementId],
    );
  }

  function selectAll() {
    setSelectedIds(availableProcurements.map((procurement) => procurement.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function handleAssign() {
    setError("");

    if (selectedIds.length === 0) {
      setError("Select at least one procurement.");
      return;
    }

    startTransition(async () => {
      try {
        await assignProcurementsToDepartment(
          departmentId,
          selectedIds,
        );

        setSelectedIds([]);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to assign procurements.",
        );
      }
    });
  }

  function handleRemove(procurementId: string) {
    setError("");

    startTransition(async () => {
      try {
        await removeProcurementFromDepartment(
          departmentId,
          procurementId,
        );

        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to remove procurement.",
        );
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Department Procurements
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Procurements currently assigned to this department.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {currentProcurements.length}{" "}
              {currentProcurements.length === 1
                ? "procurement"
                : "procurements"}
            </span>
          </div>
        </div>

        {currentProcurements.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              📋
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No procurements yet
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              No procurements have been assigned to this department.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {currentProcurements.map((procurement) => (
              <div
                key={procurement.id}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">
                    {procurement.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Reference: {procurement.referenceNumber}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {procurement.status}
                    </span>

                    {procurement.estimatedValue && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        Estimated value:{" "}
                        {procurement.estimatedValue}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(procurement.id)}
                  disabled={isPending}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Assign Organization Procurements
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Select existing organization procurements to assign
            to this department.
          </p>
        </div>

        {availableProcurements.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              ✓
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              All organization procurements are assigned
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              There are no other organization procurements
              available to assign to this department.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <p className="text-sm text-slate-600">
                {selectedIds.length} selected
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={isPending}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isPending}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {availableProcurements.map((procurement) => {
                const selected = selectedIds.includes(
                  procurement.id,
                );

                return (
                  <label
                    key={procurement.id}
                    className="flex cursor-pointer gap-4 px-6 py-5 transition hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleSelection(procurement.id)
                      }
                      disabled={isPending}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {procurement.title}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {procurement.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Reference: {procurement.referenceNumber}
                      </p>

                      {procurement.estimatedValue && (
                        <p className="mt-1 text-xs text-slate-500">
                          Estimated value:{" "}
                          {procurement.estimatedValue}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleAssign}
                disabled={
                  isPending || selectedIds.length === 0
                }
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending
                  ? "Assigning..."
                  : "Assign Selected Procurements"}
              </button>

              <p className="mt-3 text-xs text-slate-500">
                A procurement already assigned to another
                department will be moved to this department.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}