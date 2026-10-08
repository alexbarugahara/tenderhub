import type { Vendor } from "@prisma/client";

/**
 * Full Prisma Vendor type.
 */
export type VendorTypeData = Vendor;

/**
 * Vendor onboarding lifecycle.
 *
 * verifiedAt remains the final activation marker,
 * while these statuses represent the actual onboarding process.
 */
export type VendorOnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "APPROVED";

/**
 * Vendor onboarding/compliance progress returned by
 * the vendor repository.
 */
export type VendorOnboardingSummary = {
  onboardingStatus: VendorOnboardingStatus;

  totalRequirements: number;
  requiredRequirements: number;

  compliantRequirements: number;
  pendingRequirements: number;
  nonCompliantRequirements: number;
  expiredRequirements: number;
  expiringRequirements: number;

  completionPercentage: number;

  profileComplete: boolean;
  readyForReview: boolean;
};

/**
 * Compact vendor representation.
 *
 * Keeps verifiedAt for backward compatibility but also
 * exposes the onboarding status used by the admin workflow.
 */
export type VendorSummary = Pick<
  Vendor,
  | "id"
  | "companyName"
  | "legalName"
  | "email"
  | "phone"
  | "website"
  | "registrationNumber"
  | "taxNumber"
  | "countryId"
  | "businessType"
  | "verifiedAt"
> &
  VendorOnboardingSummary;

/**
 * Data accepted when creating a vendor.
 *
 * These fields correspond to the current Prisma Vendor model.
 */
export type VendorCreateInput = {
  companyName: string;

  legalName?: string | null;
  description?: string | null;

  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;

  registrationNumber?: string | null;
  taxNumber?: string | null;

  countryId?: string | null;

  businessType?: string | null;

  numberOfEmployees?: number | null;
  yearsOperating?: number | null;

  operatingLocations?: string | null;
  portfolioDescription?: string | null;
};

/**
 * Vendor update input.
 */
export type VendorUpdateInput =
  Partial<VendorCreateInput>;

/**
 * Basic vendor list item.
 *
 * This remains useful for older pages that only need
 * the basic vendor profile.
 */
export type VendorListItem = Pick<
  Vendor,
  | "id"
  | "companyName"
  | "legalName"
  | "email"
  | "phone"
  | "website"
  | "registrationNumber"
  | "taxNumber"
  | "countryId"
  | "businessType"
  | "verifiedAt"
  | "createdAt"
>;

/**
 * Vendor list item enriched with onboarding progress.
 *
 * This is the type that the new admin VendorManagement
 * workflow should use.
 */
export type VendorOnboardingListItem =
  VendorListItem &
  VendorOnboardingSummary;

/**
 * Vendor filtering options.
 *
 * `verified` is retained for compatibility with existing
 * callers. New admin onboarding screens should preferably
 * use onboardingStatus.
 */
export type VendorFilters = {
  search?: string;
  countryId?: string;
  businessType?: string;

  /**
   * Legacy filter.
   */
  verified?: boolean;

  /**
   * New onboarding filter.
   */
  onboardingStatus?: VendorOnboardingStatus;

  page?: number;
  pageSize?: number;
};

/**
 * Vendor record with optional Prisma relation counts.
 */
export type VendorWithCount = Vendor & {
  _count?: {
    bids?: number;
    documents?: number;
    classifications?: number;
    complianceRecords?: number;
    certifications?: number;
    contracts?: number;
    awards?: number;
    teamMembers?: number;
    savedSolicitations?: number;
  };
};

/**
 * Vendor record with onboarding information.
 *
 * Useful for admin/vendor review screens where the full
 * Prisma Vendor record and compliance summary are needed.
 */
export type VendorWithOnboarding =
  Vendor &
  VendorOnboardingSummary;

/**
 * Compact compliance progress representation.
 */
export type VendorComplianceProgress = {
  totalRequirements: number;
  requiredRequirements: number;

  compliantRequirements: number;
  pendingRequirements: number;
  nonCompliantRequirements: number;
  expiredRequirements: number;
  expiringRequirements: number;

  completionPercentage: number;

  readyForReview: boolean;
};