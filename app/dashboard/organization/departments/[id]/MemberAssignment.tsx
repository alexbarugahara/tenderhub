"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  assignMembersToDepartment,
  removeMemberFromDepartment,
} from "./actions";

interface DepartmentMember {
  id: string;
  role: string;
  name: string | null;
  email: string;
}

interface AvailableMember extends DepartmentMember {
  departmentName: string | null;
}

interface MemberAssignmentProps {
  departmentId: string;
  currentMembers: DepartmentMember[];
  availableMembers: AvailableMember[];
}

function formatRole(role: string) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function roleClasses(role: string) {
  switch (role) {
    case "OWNER":
      return "bg-tenderhub-gold/15 text-slate-900 ring-1 ring-inset ring-tenderhub-gold/40";

    case "ADMIN":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";

    case "PROCUREMENT_MANAGER":
      return "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200";

    case "EVALUATOR":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";

    case "FINANCE":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";

    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function getInitials(name: string | null) {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function MemberAssignment({
  departmentId,
  currentMembers,
  availableMembers,
}: MemberAssignmentProps) {
  const router = useRouter();

  const [selectedMembers, setSelectedMembers] =
    useState<string[]>([]);

  const [isPending, startTransition] =
    useTransition();

  const [error, setError] = useState<string | null>(
    null,
  );

  const [success, setSuccess] = useState<string | null>(
    null,
  );

  const allAvailableSelected =
    availableMembers.length > 0 &&
    availableMembers.every((member) =>
      selectedMembers.includes(member.id),
    );

  function toggleMember(memberId: string) {
    setError(null);
    setSuccess(null);

    setSelectedMembers((current) => {
      if (current.includes(memberId)) {
        return current.filter(
          (id) => id !== memberId,
        );
      }

      return [...current, memberId];
    });
  }

  function toggleAllAvailable() {
    setError(null);
    setSuccess(null);

    if (allAvailableSelected) {
      setSelectedMembers([]);
      return;
    }

    setSelectedMembers(
      availableMembers.map((member) => member.id),
    );
  }

  function handleAssign() {
    if (selectedMembers.length === 0) {
      setError("Select at least one member.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await assignMembersToDepartment(
          departmentId,
          selectedMembers,
        );

        setSelectedMembers([]);

        setSuccess(
          `${selectedMembers.length} member${
            selectedMembers.length === 1 ? "" : "s"
          } assigned successfully.`,
        );

        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to assign members.",
        );
      }
    });
  }

  function handleRemove(memberId: string) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await removeMemberFromDepartment(
          departmentId,
          memberId,
        );

        setSuccess(
          "Member removed from this department.",
        );

        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to remove member.",
        );
      }
    });
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Department Members
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Members assigned to this department.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 px-4 py-2">
              <p className="text-xs font-medium text-slate-500">
                Members
              </p>

              <p className="text-lg font-bold text-slate-900">
                {currentMembers.length}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">
              {success}
            </p>
          </div>
        )}

        {currentMembers.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg">
              👥
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No members assigned
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              This department does not have any members
              assigned yet. Select organization members
              below to assign them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {currentMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-semibold text-white">
                    {getInitials(member.name)}
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {member.name || "Unknown user"}
                    </p>

                    <p className="truncate text-sm text-slate-500">
                      {member.email}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses(
                        member.role,
                      )}`}
                    >
                      {formatRole(member.role)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    handleRemove(member.id)
                  }
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Assign Organization Members
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select existing organization members to
                assign to this department.
              </p>
            </div>

            {availableMembers.length > 0 && (
              <button
                type="button"
                disabled={isPending}
                onClick={toggleAllAvailable}
                className="text-sm font-semibold text-tenderhub-navy hover:underline disabled:opacity-50"
              >
                {allAvailableSelected
                  ? "Clear Selection"
                  : "Select All"}
              </button>
            )}
          </div>
        </div>

        {availableMembers.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              ✓
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              All organization members are assigned
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              There are no other organization members
              available to assign to this department.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {availableMembers.map((member) => {
                const selected =
                  selectedMembers.includes(member.id);

                return (
                  <label
                    key={member.id}
                    className={`flex cursor-pointer flex-col gap-4 px-6 py-5 transition sm:flex-row sm:items-center ${
                      selected
                        ? "bg-slate-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={isPending}
                        onChange={() =>
                          toggleMember(member.id)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-tenderhub-navy focus:ring-tenderhub-navy"
                      />

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                        {getInitials(member.name)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {member.name || "Unknown user"}
                      </p>

                      <p className="text-sm text-slate-500">
                        {member.email}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses(
                            member.role,
                          )}`}
                        >
                          {formatRole(member.role)}
                        </span>

                        {member.departmentName ? (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                            Currently:{" "}
                            {member.departmentName}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  {selectedMembers.length === 0
                    ? "No members selected."
                    : `${selectedMembers.length} member${
                        selectedMembers.length === 1
                          ? ""
                          : "s"
                      } selected.`}
                </p>

                <button
                  type="button"
                  disabled={
                    isPending ||
                    selectedMembers.length === 0
                  }
                  onClick={handleAssign}
                  className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending
                    ? "Saving..."
                    : "Assign Selected Members"}
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                If a selected member already belongs to
                another department, assigning them here will
                move them to this department.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}