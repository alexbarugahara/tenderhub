"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import { setSelectedOrganization } from "./organization-switcher-actions";

export interface OrganizationSwitcherOrganization {
  id: string;
  name: string;
  logo?: string | null;
}

export interface OrganizationSwitcherProps {
  organizations?: OrganizationSwitcherOrganization[];
  currentOrganizationId?: string;
  onOrganizationChange?: (organizationId: string) => void;
  loading?: boolean;
  className?: string;
}

export default function OrganizationSwitcher({
  organizations = [],
  currentOrganizationId,
  onOrganizationChange,
  loading = false,
  className = "",
}: OrganizationSwitcherProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentOrganization =
    organizations.find(
      (organization) =>
        organization.id === currentOrganizationId,
    ) || organizations[0];

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  const handleSelect = async (organizationId: string) => {
    if (
      changing ||
      organizationId === currentOrganization?.id
    ) {
      setOpen(false);
      return;
    }

    try {
      setChanging(true);
      setOpen(false);

      await setSelectedOrganization(
        organizationId,
      );

      onOrganizationChange?.(organizationId);

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to change organization:",
        error,
      );
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex h-11 items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 ${className}`}
      >
        <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />

        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white px-3 py-2.5 ${className}`}
      >
        <p className="text-sm font-medium text-gray-700">
          No organization selected
        </p>

        <Link
          href="/dashboard/organization/settings"
          className="mt-1 inline-block text-xs font-medium text-tenderhub-navy hover:underline"
        >
          Set up organization
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={changing}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-tenderhub-gold/30 disabled:cursor-wait disabled:opacity-70"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-tenderhub-navy text-sm font-bold text-tenderhub-gold">
          {currentOrganization.logo ? (
            <img
              src={currentOrganization.logo}
              alt={currentOrganization.name}
              className="h-full w-full object-cover"
            />
          ) : (
            currentOrganization.name
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-tenderhub-navy">
            {currentOrganization.name}
          </p>

          <p className="text-xs text-gray-500">
            Organization
          </p>
        </div>

        {changing ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-tenderhub-navy" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6 9 6 6 6-6"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select organization"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          <div className="max-h-72 overflow-y-auto p-1.5">
            {organizations.map((organization) => {
              const selected =
                organization.id ===
                currentOrganization.id;

              return (
                <button
                  key={organization.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() =>
                    handleSelect(organization.id)
                  }
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${
                    selected
                      ? "bg-tenderhub-navy/5"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-tenderhub-navy text-xs font-bold text-tenderhub-gold">
                    {organization.logo ? (
                      <img
                        src={organization.logo}
                        alt={organization.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      organization.name
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">
                    {organization.name}
                  </span>

                  {selected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4 shrink-0 text-tenderhub-gold"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m5 12 4 4L19 6"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 p-1.5">
            <Link
              href="/dashboard/organization/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-tenderhub-navy"
            >
              Organization Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}