export type VerificationStatus =
  | "NOT_SUBMITTED"
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_INFORMATION"
  | "APPROVED"
  | "REJECTED";

export type CheckStatus =
  | "PENDING"
  | "PASSED"
  | "FAILED"
  | "NEEDS_INFORMATION"
  | "NOT_APPLICABLE";

export type DocumentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export interface VerificationRequirement {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  required: boolean;
  validityDays?: number | null;
  active?: boolean;
}

export interface VerificationDocument {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  status: DocumentStatus;
  issuedAt?: string | null;
  expiryDate?: string | null;
  rejectionReason?: string | null;
  uploadedAt: string;
  updatedAt?: string | null;
}

export interface VerificationCheck {
  id: string;
  requirementId?: string | null;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  required: boolean;
  status: CheckStatus;
  documentId?: string | null;
  checkedAt?: string | null;
  checkedById?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;

  requirement?: VerificationRequirement | null;
  document?: VerificationDocument | null;

  checkedBy?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export interface VerificationSummary {
  totalChecks: number;
  requiredChecks: number;
  passedChecks: number;
  failedChecks: number;
  pendingChecks: number;
  completionPercentage: number;
  readyForApproval: boolean;
}

export interface VerificationReviewer {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface VerificationRecord {
  id: string;
  organizationId?: string;
  status: VerificationStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;

  reviewedBy?: VerificationReviewer | null;
  checks: VerificationCheck[];
}

export interface VerificationOrganization {
  id: string;
  name: string;
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  organizationType?: string | null;

  country?: {
    id: string;
    name: string;
    code?: string | null;
  } | null;

  verification?: VerificationRecord | null;

  documents: VerificationDocument[];
}

export interface VerificationApiResponse {
  organization: VerificationOrganization;
  verification: VerificationRecord;
  documents: VerificationDocument[];
  verificationSummary: VerificationSummary;
}

export type VerificationTab =
  | "overview"
  | "documents"
  | "compliance"
  | "verification";