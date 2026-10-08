"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export interface VendorProfileData {
  id: string;
  companyName: string;
  legalName?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  businessType?: string | null;
  numberOfEmployees?: number | null;
  yearsOperating?: number | null;
  operatingLocations?: string | null;
  portfolioDescription?: string | null;
  verifiedAt?: Date | string | null;
}

export interface VendorProfileProps {
  vendor: VendorProfileData;
  showActions?: boolean;
  showContactInformation?: boolean;
  showBusinessInformation?: boolean;
  showPortfolio?: boolean;
  onEdit?: () => void;
  onContact?: () => void;
  className?: string;
}

function formatDate(value?: Date | string | null): string {
  if (!value) {
    return "Not available";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function displayValue(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

export default function VendorProfile({
  vendor,
  showActions = false,
  showContactInformation = true,
  showBusinessInformation = true,
  showPortfolio = true,
  onEdit,
  onContact,
  className = "",
}: VendorProfileProps) {
  const initials = vendor.companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-xl font-bold text-white">
              {initials || "V"}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-tenderhub-navy">
                  {vendor.companyName}
                </h1>

                {vendor.verifiedAt && (
                  <Badge variant="success" size="sm" dot>
                    Verified
                  </Badge>
                )}
              </div>

              {vendor.legalName &&
                vendor.legalName !== vendor.companyName && (
                  <p className="mt-1 text-sm text-gray-500">
                    Legal name: {vendor.legalName}
                  </p>
                )}

              {vendor.description && (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                  {vendor.description}
                </p>
              )}

              {vendor.verifiedAt && (
                <p className="mt-3 text-xs text-gray-500">
                  Verified on {formatDate(vendor.verifiedAt)}
                </p>
              )}
            </div>
          </div>

          {showActions && (onEdit || onContact) && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {onContact && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onContact}
                >
                  Contact Vendor
                </Button>
              )}

              {onEdit && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={onEdit}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {showContactInformation && (
        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-tenderhub-navy">
                Contact Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Business contact details for this vendor.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Email
                </p>

                {vendor.email ? (
                  <a
                    href={`mailto:${vendor.email}`}
                    className="mt-1 block break-words text-sm font-medium text-tenderhub-navy hover:underline"
                  >
                    {vendor.email}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-gray-700">
                    Not provided
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Phone
                </p>

                {vendor.phone ? (
                  <a
                    href={`tel:${vendor.phone}`}
                    className="mt-1 block text-sm font-medium text-tenderhub-navy hover:underline"
                  >
                    {vendor.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-gray-700">
                    Not provided
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Website
                </p>

                {vendor.website ? (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-sm font-medium text-tenderhub-navy hover:underline"
                  >
                    {vendor.website}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-gray-700">
                    Not provided
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Address
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {displayValue(vendor.address)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {showBusinessInformation && (
        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-tenderhub-navy">
                Business Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Registration and operational information provided by the
                vendor.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Business Type
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {displayValue(vendor.businessType)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Registration Number
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {displayValue(vendor.registrationNumber)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Tax Number
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {displayValue(vendor.taxNumber)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Employees
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {vendor.numberOfEmployees !== null &&
                  vendor.numberOfEmployees !== undefined
                    ? vendor.numberOfEmployees.toLocaleString()
                    : "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Years Operating
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {vendor.yearsOperating !== null &&
                  vendor.yearsOperating !== undefined
                    ? `${vendor.yearsOperating} ${
                        vendor.yearsOperating === 1
                          ? "year"
                          : "years"
                      }`
                    : "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Operating Locations
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {displayValue(vendor.operatingLocations)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {showPortfolio && (
        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-tenderhub-navy">
                Portfolio & Experience
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Information about the vendor&apos;s capabilities and
                previous work.
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Portfolio Description
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {vendor.portfolioDescription ||
                  "No portfolio information has been provided."}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Vendor ID
            </p>

            <p className="mt-1 break-all font-mono text-sm text-gray-700">
              {vendor.id}
            </p>
          </div>

          <div>
            <Badge
              variant={vendor.verifiedAt ? "success" : "default"}
              size="sm"
              dot
            >
              {vendor.verifiedAt ? "Verified Vendor" : "Unverified Vendor"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}