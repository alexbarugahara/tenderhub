"use client";

import React, { FormEvent, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export type OrganizationMemberRole =
  | "OWNER"
  | "ADMIN"
  | "PROCUREMENT_MANAGER"
  | "EVALUATOR"
  | "FINANCE"
  | "MEMBER";

export interface OrganizationMemberData {
  id: string;
  name: string;
  email: string;
  role: OrganizationMemberRole | string;
  userId?: string;
  joinedAt?: string | Date | null;
  image?: string | null;
}

export interface OrganizationMemberRoleOption {
  value: string;
  label: string;
}

export interface OrganizationMembersProps {
  members?: OrganizationMemberData[];
  roleOptions?: OrganizationMemberRoleOption[];
  loading?: boolean;
  submitting?: boolean;
  canManage?: boolean;
  error?: string | null;
  onAdd?: (
    values: {
      name: string;
      email: string;
      role: string;
    },
  ) => void | Promise<void>;
  onEdit?: (member: OrganizationMemberData) => void;
  onRemove?: (
    member: OrganizationMemberData,
  ) => void | Promise<void>;
  className?: string;
}

const defaultRoleOptions: OrganizationMemberRoleOption[] = [
  {
    value: "MEMBER",
    label: "Member",
  },
  {
    value: "ADMIN",
    label: "Admin",
  },
  {
    value: "PROCUREMENT_MANAGER",
    label: "Procurement Manager",
  },
  {
    value: "EVALUATOR",
    label: "Evaluator",
  },
  {
    value: "FINANCE",
    label: "Finance",
  },
];

function formatRole(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function formatDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getRoleVariant(
  role: string,
): "success" | "warning" | "default" {
  const normalized = role.toUpperCase();

  if (normalized === "OWNER") {
    return "success";
  }

  if (
    normalized === "ADMIN" ||
    normalized === "PROCUREMENT_MANAGER"
  ) {
    return "warning";
  }

  return "default";
}

export default function OrganizationMembers({
  members = [],
  roleOptions = defaultRoleOptions,
  loading = false,
  submitting = false,
  canManage = true,
  error = null,
  onAdd,
  onEdit,
  onRemove,
  className = "",
}: OrganizationMembersProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [formError, setFormError] =
    useState<string | null>(null);

  function resetForm() {
    setName("");
    setEmail("");
    setRole("MEMBER");
    setFormError(null);
    setShowForm(false);
  }

  function validate(): string | null {
    if (!name.trim()) {
      return "Member name is required.";
    }

    if (!email.trim()) {
      return "Member email is required.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim(),
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (!role) {
      return "Please select a member role.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage = validate();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    if (!onAdd) {
      return;
    }

    setFormError(null);

    try {
      await onAdd({
        name: name.trim(),
        email: email.trim(),
        role,
      });

      resetForm();
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "The member could not be added.",
      );
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Organization Members
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage people who have access to this organization.
            </p>
          </div>

          {canManage && onAdd && !showForm && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              Add Member
            </Button>
          )}
        </div>

        {showForm && canManage && (
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-gray-900">
                Add Organization Member
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Enter the member&apos;s details and assign an organization
                role.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Input
                  label="Name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter member name"
                  required
                  disabled={submitting}
                />

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="member@example.com"
                  required
                  disabled={submitting}
                />

                <Select
                  label="Role"
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value)
                  }
                  options={roleOptions}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={resetForm}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Adding..."
                    : "Add Member"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : members.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState
              title="No organization members"
              description="No members have been added to this organization yet."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {members.map((member) => {
              const isOwner =
                member.role.toUpperCase() === "OWNER";

              return (
                <div
                  key={member.id}
                  className="px-6 py-5 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-semibold text-white">
                          {member.name
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-gray-900">
                            {member.name}
                          </h3>

                          <Badge
                            variant={getRoleVariant(
                              member.role,
                            )}
                          >
                            {formatRole(
                              member.role,
                            )}
                          </Badge>
                        </div>

                        <p className="mt-1 truncate text-sm text-gray-500">
                          {member.email}
                        </p>

                        {member.joinedAt && (
                          <p className="mt-1 text-xs text-gray-400">
                            Joined{" "}
                            {formatDate(
                              member.joinedAt,
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {onEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onEdit(member)
                            }
                          >
                            Edit
                          </Button>
                        )}

                        {onRemove && !isOwner && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              onRemove(member)
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}