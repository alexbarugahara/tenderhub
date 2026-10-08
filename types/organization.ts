import type {
  Organization,
  OrganizationType as PrismaOrganizationType,
} from "@prisma/client";

export type OrganizationType = Organization;

export type OrganizationSummary = Pick<
  Organization,
  | "id"
  | "name"
  | "legalName"
  | "email"
  | "phone"
  | "website"
  | "countryId"
  | "organizationType"
  | "verifiedAt"
>;

export type OrganizationCreateInput = {
  name: string;
  legalName?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  logo?: string | null;
  description?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  organizationType?: PrismaOrganizationType | null;
  countryId?: string | null;
  currencyId?: string | null;
};

export type OrganizationUpdateInput = Partial<OrganizationCreateInput>;

export type OrganizationListItem = Pick<
  Organization,
  | "id"
  | "name"
  | "legalName"
  | "email"
  | "phone"
  | "website"
  | "countryId"
  | "organizationType"
  | "verifiedAt"
  | "createdAt"
>;

export type OrganizationFilters = {
  search?: string;
  countryId?: string;
  organizationType?: PrismaOrganizationType;
  verified?: boolean;
  page?: number;
  pageSize?: number;
};

export type OrganizationWithCount = Organization & {
  _count?: {
    procurements?: number;
    solicitations?: number;
    members?: number;
  };
};