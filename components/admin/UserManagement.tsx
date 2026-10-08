"use client";
import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";

export type ManagedUserRole =
  | "ADMIN"
  | "ORGANIZATION"
  | "VENDOR";

export type ManagedUserStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DELETED";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  role: ManagedUserRole;
  status: ManagedUserStatus;
  emailVerified?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface UserManagementProps {
  users?: ManagedUser[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onView?: (user: ManagedUser) => void;
  onEdit?: (user: ManagedUser) => void;
  onStatusChange?: (
    user: ManagedUser,
    status: ManagedUserStatus,
  ) => void;
  onDelete?: (user: ManagedUser) => void;
  onCreate?: () => void;
  className?: string;
}

function formatDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function getStatusVariant(
  status: ManagedUserStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "ACTIVE":
      return "success";

    case "PENDING":
      return "warning";

    case "SUSPENDED":
    case "DELETED":
      return "danger";

    default:
      return "default";
  }
}

function getRoleLabel(
  role: ManagedUserRole,
): string {
  switch (role) {
    case "ADMIN":
      return "Admin";

    case "ORGANIZATION":
      return "Organization";

    case "VENDOR":
      return "Vendor";

    default:
      return role;
  }
}

function getStatusLabel(
  status: ManagedUserStatus,
): string {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "ACTIVE":
      return "Active";

    case "SUSPENDED":
      return "Suspended";

    case "DELETED":
      return "Deleted";

    default:
      return status;
  }
}

export default function UserManagement({
  users = [],
  loading = false,
  error = null,
  page = 1,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  onCreate,
  className = "",
}: UserManagementProps) {
  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] =
    useState<ManagedUserRole | "ALL">("ALL");

  const [statusFilter, setStatusFilter] =
    useState<ManagedUserStatus | "ALL">("ALL");

  const [statusUser, setStatusUser] =
    useState<ManagedUser | null>(null);

  const [nextStatus, setNextStatus] =
    useState<ManagedUserStatus>("ACTIVE");

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        user.status === statusFilter;

      if (!matchesRole || !matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        user.name,
        user.email,
        user.phone,
        user.role,
        user.status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  const openStatusDialog = (
    user: ManagedUser,
  ) => {
    setStatusUser(user);

    setNextStatus(
      user.status === "ACTIVE"
        ? "SUSPENDED"
        : "ACTIVE",
    );
  };

  const confirmStatusChange = () => {
    if (!statusUser || !onStatusChange) {
      return;
    }

    onStatusChange(
      statusUser,
      nextStatus,
    );

    setStatusUser(null);
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="flex min-h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              User Management
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage TenderHub user accounts,
              roles, and account status.
            </p>
          </div>

          {onCreate && (
            <Button
              type="button"
              variant="primary"
              onClick={onCreate}
            >
              Add User
            </Button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label
              htmlFor="user-management-search"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Search
            </label>

            <input
              id="user-management-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Name, email, phone..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
            />
          </div>

          <div>
            <label
              htmlFor="user-management-role"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Role
            </label>

            <select
              id="user-management-role"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value as
                    | ManagedUserRole
                    | "ALL",
                )
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
            >
              <option value="ALL">
                All roles
              </option>

              <option value="ADMIN">
                Admin
              </option>

              <option value="ORGANIZATION">
                Organization
              </option>

              <option value="VENDOR">
                Vendor
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="user-management-status"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="user-management-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | ManagedUserStatus
                    | "ALL",
                )
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
            >
              <option value="ALL">
                All statuses
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="SUSPENDED">
                Suspended
              </option>

              <option value="DELETED">
                Deleted
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          {filteredUsers.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title={
                  users.length === 0
                    ? "No users found"
                    : "No matching users"
                }
                description={
                  users.length === 0
                    ? "User accounts will appear here once they are created."
                    : "Try changing your search or filters."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left">
                    <th
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      User
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Role
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Status
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Joined
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <div className="flex min-w-56 items-center gap-3">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt=""
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-semibold text-white"
                                aria-hidden="true"
                              >
                                {user.name
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">
                                {user.name}
                              </p>

                              <p className="truncate text-sm text-gray-500">
                                {user.email}
                              </p>

                              {user.phone && (
                                <p className="truncate text-xs text-gray-400">
                                  {user.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <Badge variant="default">
                            {getRoleLabel(
                              user.role,
                            )}
                          </Badge>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <Badge
                            variant={getStatusVariant(
                              user.status,
                            )}
                          >
                            {getStatusLabel(
                              user.status,
                            )}
                          </Badge>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {formatDate(
                            user.createdAt,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {onView && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  onView(user)
                                }
                              >
                                View
                              </Button>
                            )}

                            {onEdit && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onEdit(user)
                                }
                              >
                                Edit
                              </Button>
                            )}

                            {onStatusChange &&
                              user.status !==
                                "DELETED" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    openStatusDialog(
                                      user,
                                    )
                                  }
                                >
                                  {user.status ===
                                  "ACTIVE"
                                    ? "Suspend"
                                    : "Activate"}
                                </Button>
                              )}

                            {onDelete &&
                              user.status !==
                                "DELETED" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onDelete(user)
                                  }
                                >
                                  Delete
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages &&
          totalPages > 1 &&
          onPageChange && (
            <div className="mt-6 border-t border-gray-200 pt-5">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
      </Card>

      {statusUser && (
        <Modal
          isOpen={true}
          onClose={() =>
            setStatusUser(null)
          }
          title={
            nextStatus === "SUSPENDED"
              ? "Suspend User"
              : "Activate User"
          }
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-gray-600">
              {nextStatus === "SUSPENDED"
                ? `Are you sure you want to suspend ${statusUser.name}'s account?`
                : `Are you sure you want to activate ${statusUser.name}'s account?`}
            </p>

            <div>
              <label
                htmlFor="user-management-next-status"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                New status
              </label>

              <select
                id="user-management-next-status"
                value={nextStatus}
                onChange={(event) =>
                  setNextStatus(
                    event.target
                      .value as ManagedUserStatus,
                  )
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              >
                <option value="ACTIVE">
                  Active
                </option>

                <option value="SUSPENDED">
                  Suspended
                </option>

                <option value="PENDING">
                  Pending
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setStatusUser(null)
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={
                  confirmStatusChange
                }
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
