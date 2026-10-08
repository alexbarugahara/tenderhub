"use client";

import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";

import type { VerificationOrganization } from "./types";
import { formatCategory } from "./utils";

interface VerificationOverviewProps {
  organization: VerificationOrganization;
}

function InformationRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-gray-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-tenderhub-navy">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

export default function VerificationOverview({
  organization,
}: VerificationOverviewProps) {
  const countryName = organization.country?.name || null;

  return (
    <div className="space-y-5">
      <Section
        title="Business Information"
        description="Core registration and identity information for the organization."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InformationRow
            icon={<Building2 className="h-4 w-4" />}
            label="Organization Name"
            value={organization.name}
          />

          <InformationRow
            icon={<Building2 className="h-4 w-4" />}
            label="Legal Name"
            value={organization.legalName}
          />

          <InformationRow
            icon={<ReceiptText className="h-4 w-4" />}
            label="Organization Type"
            value={formatCategory(organization.organizationType)}
          />

          <InformationRow
            icon={<ReceiptText className="h-4 w-4" />}
            label="Registration Number"
            value={organization.registrationNumber}
          />

          <InformationRow
            icon={<ReceiptText className="h-4 w-4" />}
            label="Tax Number"
            value={organization.taxNumber}
          />

          <InformationRow
            icon={<MapPin className="h-4 w-4" />}
            label="Country"
            value={countryName}
          />

          <div className="md:col-span-2">
            <InformationRow
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={organization.address}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Contact Information"
        description="Primary contact details registered for the organization."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InformationRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={organization.email}
          />

          <InformationRow
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={organization.phone}
          />

          <InformationRow
            icon={<Globe className="h-4 w-4" />}
            label="Website"
            value={organization.website}
          />
        </div>
      </Section>

      <Section
        title="Verification Profile"
        description="Administrative information associated with the verification record."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InformationRow
            icon={<UserRound className="h-4 w-4" />}
            label="Reviewed By"
            value={
              organization.verification?.reviewedBy?.name ||
              organization.verification?.reviewedBy?.email ||
              null
            }
          />

          <InformationRow
            icon={<ReceiptText className="h-4 w-4" />}
            label="Verification Status"
            value={formatCategory(
              organization.verification?.status || null,
            )}
          />

          <InformationRow
            icon={<ReceiptText className="h-4 w-4" />}
            label="Submitted"
            value={
              organization.verification?.submittedAt
                ? new Date(
                    organization.verification.submittedAt,
                  ).toLocaleString()
                : null
            }
          />

          <InformationRow
            icon={<ReceiptText className="h-4 w-4" />}
            label="Reviewed"
            value={
              organization.verification?.reviewedAt
                ? new Date(
                    organization.verification.reviewedAt,
                  ).toLocaleString()
                : null
            }
          />
        </div>
      </Section>
    </div>
  );
}