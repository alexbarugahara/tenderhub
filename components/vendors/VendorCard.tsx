"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export interface VendorCardData {
  id: string;
  companyName: string;
  legalName?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  businessType?: string | null;
  numberOfEmployees?: number | null;
  yearsOperating?: number | null;
  countryName?: string | null;
  verifiedAt?: Date | string | null;
  classificationNames?: string[];
  complianceStatus?:
    | "PENDING"
    | "COMPLIANT"
    | "NON_COMPLIANT"
    | "EXPIRED"
    | "EXPIRING"
    | "NOT_APPLICABLE";
}

export interface VendorCardProps {
  vendor: VendorCardData;
  href?: string;
  showContact?: boolean;
  showActions?: boolean;
  onView?: (vendor: VendorCardData) => void;
  onContact?: (vendor: VendorCardData) => void;
  className?: string;
}

const complianceLabels: Record<
  NonNullable<VendorCardData["complianceStatus"]>,
  string
> = {
  PENDING: "Pending",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  EXPIRED: "Expired",
  EXPIRING: "Expiring",
  NOT_APPLICABLE: "Not Applicable",
};

const complianceVariants: Record<
  NonNullable<VendorCardData["complianceStatus"]>,
  "default" | "success" | "danger" | "warning" | "info"
> = {
  PENDING: "default",
  COMPLIANT: "success",
  NON_COMPLIANT: "danger",
  EXPIRED: "danger",
  EXPIRING: "warning",
  NOT_APPLICABLE: "info",
};

export default function VendorCard({
  vendor,
  href = `/dashboard/vendor/profile`,
  showContact = true,
  showActions = true,
  onView,
  onContact,
  className = "",
}: VendorCardProps) {
  const initials = vendor.companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const content = (
    <Card
      className={`h-full transition ${
        href || onView
          ? "hover:-translate-y-0.5 hover:shadow-md"
          : ""
      } ${className}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-lg font-bold text-white">
            {initials || "V"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-tenderhub-navy">
                {vendor.companyName}
              </h3>

              {vendor.verifiedAt && (
                <Badge variant="success" size="sm" dot>
                  Verified
                </Badge>
              )}
            </div>

            {vendor.legalName &&
              vendor.legalName !== vendor.companyName && (
                <p className="mt-1 truncate text-xs text-gray-500">
                  {vendor.legalName}
                </p>
              )}

            {vendor.countryName && (
              <p className="mt-2 text-sm text-gray-600">
                {vendor.countryName}
              </p>
            )}
          </div>
        </div>

        {vendor.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
            {vendor.description}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Business Type
            </p>

            <p className="mt-1 truncate text-sm font-medium text-gray-800">
              {vendor.businessType || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Employees
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {vendor.numberOfEmployees !== null &&
              vendor.numberOfEmployees !== undefined
                ? vendor.numberOfEmployees.toLocaleString()
                : "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Experience
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {vendor.yearsOperating !== null &&
              vendor.yearsOperating !== undefined
                ? `${vendor.yearsOperating} ${
                    vendor.yearsOperating === 1 ? "year" : "years"
                  }`
                : "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Location
            </p>

            <p className="mt-1 truncate text-sm font-medium text-gray-800">
              {vendor.address || vendor.countryName || "Not provided"}
            </p>
          </div>
        </div>

        {vendor.classificationNames &&
          vendor.classificationNames.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Classifications
              </p>

              <div className="flex flex-wrap gap-1.5">
                {vendor.classificationNames
                  .slice(0, 4)
                  .map((classification) => (
                    <Badge
                      key={classification}
                      variant="default"
                      size="sm"
                    >
                      {classification}
                    </Badge>
                  ))}

                {vendor.classificationNames.length > 4 && (
                  <Badge variant="default" size="sm">
                    +{vendor.classificationNames.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

        {vendor.complianceStatus && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Compliance
            </span>

            <Badge
              variant={complianceVariants[vendor.complianceStatus]}
              size="sm"
              dot
            >
              {complianceLabels[vendor.complianceStatus]}
            </Badge>
          </div>
        )}

        {showContact && (vendor.email || vendor.phone) && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {vendor.email && (
              <p className="truncate text-sm text-gray-600">
                {vendor.email}
              </p>
            )}

            {vendor.phone && (
              <p className="mt-1 text-sm text-gray-600">
                {vendor.phone}
              </p>
            )}
          </div>
        )}

        {showActions && (
          <div className="mt-auto flex flex-wrap gap-2 border-t border-gray-100 pt-5">
            {(href || onView) && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  if (onView) {
                    onView(vendor);
                    return;
                  }

                  if (href) {
                    window.location.assign(href);
                  }
                }}
              >
                View Vendor
              </Button>
            )}

            {onContact && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onContact(vendor);
                }}
              >
                Contact
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  if (!href || onView) {
    return content;
  }

  return (
    <a
      href={href}
      className="block h-full rounded-xl focus:outline-none focus:ring-2 focus:ring-tenderhub-gold focus:ring-offset-2"
    >
      {content}
    </a>
  );
}