import type { Prisma } from "@prisma/client";

/**
 * TenderHub vendor verification / onboarding types.
 *
 * The old VendorComplianceRequirement and VendorCompliance models
 * have been retired.
 *
 * Current architecture:
 *
 * VendorRequirement
 *   ↓
 * VendorRequirementSet
 *   ↓
 * VendorApplicationRequirement
 *   ↓
 * VendorApplicationEvidence
 */

/* -------------------------------------------------------------------------- */
/* Vendor requirements                                                        */
/* -------------------------------------------------------------------------- */

export type ComplianceRequirement =
  Prisma.VendorRequirementGetPayload<{}>;

export type ComplianceRequirementWithRelations =
  Prisma.VendorRequirementGetPayload<{
    include: {
      requirementSets: true;
      applicationRequirements: true;
    };
  }>;

export type ComplianceRequirementCreateInput =
  Prisma.VendorRequirementCreateInput;

export type ComplianceRequirementUpdateInput =
  Prisma.VendorRequirementUpdateInput;

export type ComplianceRequirementWhereInput =
  Prisma.VendorRequirementWhereInput;

export type ComplianceRequirementOrderByInput =
  Prisma.VendorRequirementOrderByWithRelationInput;

/* -------------------------------------------------------------------------- */
/* Vendor requirement sets                                                    */
/* -------------------------------------------------------------------------- */

export type VendorRequirementSet =
  Prisma.VendorRequirementSetGetPayload<{}>;

export type VendorRequirementSetWithRelations =
  Prisma.VendorRequirementSetGetPayload<{
    include: {
      requirements: {
        include: {
          requirement: true;
        };
      };
    };
  }>;

export type VendorRequirementSetCreateInput =
  Prisma.VendorRequirementSetCreateInput;

export type VendorRequirementSetUpdateInput =
  Prisma.VendorRequirementSetUpdateInput;

export type VendorRequirementSetWhereInput =
  Prisma.VendorRequirementSetWhereInput;

export type VendorRequirementSetOrderByInput =
  Prisma.VendorRequirementSetOrderByWithRelationInput;

/* -------------------------------------------------------------------------- */
/* Requirement-set assignments                                                */
/* -------------------------------------------------------------------------- */

export type VendorRequirementSetRequirement =
  Prisma.VendorRequirementSetRequirementGetPayload<{}>;

export type VendorRequirementSetRequirementWithRelations =
  Prisma.VendorRequirementSetRequirementGetPayload<{
    include: {
      requirement: true;
      requirementSet: true;
    };
  }>;

/* -------------------------------------------------------------------------- */
/* Vendor applications                                                        */
/* -------------------------------------------------------------------------- */

export type VendorApplication =
  Prisma.VendorApplicationGetPayload<{}>;

export type VendorApplicationWithRelations =
  Prisma.VendorApplicationGetPayload<{
    include: {
      user: true;
      country: true;
      requirementSet: true;
      requirements: true;
      evidence: true;
      actions: true;
    };
  }>;

export type VendorApplicationCreateInput =
  Prisma.VendorApplicationCreateInput;

export type VendorApplicationUpdateInput =
  Prisma.VendorApplicationUpdateInput;

export type VendorApplicationWhereInput =
  Prisma.VendorApplicationWhereInput;

export type VendorApplicationOrderByInput =
  Prisma.VendorApplicationOrderByWithRelationInput;

/* -------------------------------------------------------------------------- */
/* Application requirements                                                   */
/* -------------------------------------------------------------------------- */

export type VendorApplicationRequirement =
  Prisma.VendorApplicationRequirementGetPayload<{}>;

export type VendorApplicationRequirementWithRelations =
  Prisma.VendorApplicationRequirementGetPayload<{
    include: {
      requirement: true;
      evidence: true;
      application: true;
      reviewedBy: true;
    };
  }>;

export type VendorApplicationRequirementCreateInput =
  Prisma.VendorApplicationRequirementCreateInput;

export type VendorApplicationRequirementUpdateInput =
  Prisma.VendorApplicationRequirementUpdateInput;

export type VendorApplicationRequirementWhereInput =
  Prisma.VendorApplicationRequirementWhereInput;

export type VendorApplicationRequirementOrderByInput =
  Prisma.VendorApplicationRequirementOrderByWithRelationInput;

/* -------------------------------------------------------------------------- */
/* Application evidence                                                       */
/* -------------------------------------------------------------------------- */

export type VendorApplicationEvidence =
  Prisma.VendorApplicationEvidenceGetPayload<{}>;

export type VendorApplicationEvidenceWithRelations =
  Prisma.VendorApplicationEvidenceGetPayload<{
    include: {
      application: true;
      requirement: true;
      reviewedBy: true;
    };
  }>;

export type VendorApplicationEvidenceCreateInput =
  Prisma.VendorApplicationEvidenceCreateInput;

export type VendorApplicationEvidenceUpdateInput =
  Prisma.VendorApplicationEvidenceUpdateInput;

export type VendorApplicationEvidenceWhereInput =
  Prisma.VendorApplicationEvidenceWhereInput;

export type VendorApplicationEvidenceOrderByInput =
  Prisma.VendorApplicationEvidenceOrderByWithRelationInput;

/* -------------------------------------------------------------------------- */
/* Verification actions                                                       */
/* -------------------------------------------------------------------------- */

export type VendorVerificationAction =
  Prisma.VendorVerificationActionGetPayload<{}>;

export type VendorVerificationActionWithRelations =
  Prisma.VendorVerificationActionGetPayload<{
    include: {
      application: true;
      performedBy: true;
    };
  }>;

/* -------------------------------------------------------------------------- */
/* Useful list items                                                           */
/* -------------------------------------------------------------------------- */

export type ComplianceRequirementListItem =
  Prisma.VendorRequirementGetPayload<{
    select: {
      id: true;
      code: true;
      name: true;
      description: true;
      category: true;
      required: true;
      validityDays: true;
      active: true;
      allowedDocumentCategories: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;

export type VendorRequirementSetListItem =
  Prisma.VendorRequirementSetGetPayload<{
    select: {
      id: true;
      code: true;
      name: true;
      description: true;
      active: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;

export type VendorApplicationListItem =
  Prisma.VendorApplicationGetPayload<{
    select: {
      id: true;
      userId: true;
      requirementSetId: true;
      status: true;
      companyName: true;
      legalName: true;
      email: true;
      phone: true;
      registrationNumber: true;
      taxNumber: true;
      submittedAt: true;
      reviewedAt: true;
      approvedAt: true;
      rejectedAt: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;

export type VendorApplicationRequirementListItem =
  Prisma.VendorApplicationRequirementGetPayload<{
    select: {
      id: true;
      applicationId: true;
      requirementId: true;
      code: true;
      name: true;
      description: true;
      category: true;
      required: true;
      status: true;
      notes: true;
      reviewedAt: true;
      reviewedById: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;

export type VendorApplicationEvidenceListItem =
  Prisma.VendorApplicationEvidenceGetPayload<{
    select: {
      id: true;
      applicationId: true;
      requirementId: true;
      name: true;
      category: true;
      fileUrl: true;
      mimeType: true;
      fileSize: true;
      status: true;
      issuedAt: true;
      expiryDate: true;
      rejectionReason: true;
      uploadedAt: true;
      reviewedAt: true;
      reviewedById: true;
    };
  }>;