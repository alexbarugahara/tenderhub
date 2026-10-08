import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getSelectedOrganizationId } from "@/components/layout/organization-switcher-actions";

type VerificationAction = "SAVE_DRAFT" | "SUBMIT";

const VERIFICATION_CHECKS = [
  {
    code: "LEGAL_NAME",
    name: "Legal business name",
    category: "LEGAL_IDENTITY" as const,
    description:
      "Confirm that the organization's legal name matches its registration documentation.",
    required: true,
  },
  {
    code: "ORGANIZATION_TYPE",
    name: "Organization type",
    category: "LEGAL_IDENTITY" as const,
    description:
      "Confirm the legal or organizational classification of the entity.",
    required: true,
  },
  {
    code: "REGISTRATION_NUMBER",
    name: "Registration number",
    category: "REGISTRATION" as const,
    description:
      "Confirm the organization's registration number against supporting records.",
    required: true,
  },
  {
    code: "REGISTRATION_DOCUMENT",
    name: "Registration document",
    category: "REGISTRATION" as const,
    description:
      "Review the organization's registration, incorporation, or formation document.",
    required: true,
  },
  {
    code: "TAX_IDENTIFICATION",
    name: "Tax identification",
    category: "TAX" as const,
    description:
      "Confirm tax identification information where applicable.",
    required: false,
  },
  {
    code: "BUSINESS_ADDRESS",
    name: "Business address",
    category: "ADDRESS" as const,
    description:
      "Confirm the organization's registered or operating business address.",
    required: true,
  },
  {
    code: "AUTHORIZED_REPRESENTATIVE",
    name: "Authorized representative",
    category: "REPRESENTATIVE" as const,
    description:
      "Confirm that the person submitting the application is authorized to represent the organization.",
    required: true,
  },
  {
    code: "OWNERSHIP_INFORMATION",
    name: "Ownership information",
    category: "OWNERSHIP" as const,
    description:
      "Review ownership or control information where applicable.",
    required: false,
  },
  {
    code: "LICENSING",
    name: "Business or professional licensing",
    category: "LICENSING" as const,
    description:
      "Review applicable business or professional licensing requirements.",
    required: false,
  },
  {
    code: "SANCTIONS_SCREENING",
    name: "Sanctions and exclusion screening",
    category: "SANCTIONS_SCREENING" as const,
    description:
      "Perform applicable sanctions, exclusion, or restricted-party screening.",
    required: false,
  },
];

const VALID_ORGANIZATION_TYPES = [
  "GOVERNMENT",
  "LOCAL_GOVERNMENT",
  "NGO",
  "INTERNATIONAL_NGO",
  "PRIVATE_COMPANY",
  "SCHOOL_UNIVERSITY",
  "HOSPITAL",
  "BANK_FINANCIAL_INSTITUTION",
  "DEVELOPMENT_AGENCY",
  "OTHER",
] as const;

/**
 * Ensure that the verification record and its standard checks exist.
 *
 * Important:
 * We do NOT upsert all 10 checks every time the page loads.
 * That was causing unnecessary database work and contributed
 * to the Prisma P2028 transaction error.
 */
async function ensureVerification(organizationId: string) {
  let verification =
    await prisma.organizationVerification.findUnique({
      where: {
        organizationId,
      },
      select: {
        id: true,
      },
    });

  if (!verification) {
    verification =
      await prisma.organizationVerification.create({
        data: {
          organizationId,
          status: "DRAFT",
        },
        select: {
          id: true,
        },
      });
  }

  const existingChecks =
    await prisma.organizationVerificationCheck.findMany({
      where: {
        verificationId: verification.id,
      },
      select: {
        code: true,
      },
    });

  const existingCodes = new Set(
    existingChecks.map((check) => check.code),
  );

  const missingChecks = VERIFICATION_CHECKS.filter(
    (check) => !existingCodes.has(check.code),
  );

  if (missingChecks.length > 0) {
    await prisma.organizationVerificationCheck.createMany({
      data: missingChecks.map((check) => ({
        verificationId: verification.id,
        code: check.code,
        name: check.name,
        category: check.category,
        description: check.description,
        required: check.required,
        status: "PENDING" as const,
      })),
      skipDuplicates: true,
    });
  }

  return verification;
}

/**
 * Load the complete verification response.
 */
async function getResponse(organizationId: string) {
  const organization =
    await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        name: true,
        legalName: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        organizationType: true,
        registrationNumber: true,
        taxNumber: true,
        verifiedAt: true,
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        currency: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const verification =
    await prisma.organizationVerification.findUnique({
      where: {
        organizationId,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
        adminNotes: true,
        checks: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            description: true,
            required: true,
            status: true,
            documentId: true,
            notes: true,
          },
        },
      },
    });

  const documents =
    await prisma.organizationDocument.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        category: true,
        fileUrl: true,
        mimeType: true,
        fileSize: true,
        status: true,
        issuedAt: true,
        expiryDate: true,
        rejectionReason: true,
        uploadedAt: true,
      },
    });

  return {
    organization,
    verification,
    documents,
  };
}

/**
 * GET
 *
 * Loads the selected organization's verification application.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const organizationId =
      await getSelectedOrganizationId(
        session.user.id,
      );

    if (!organizationId) {
      return NextResponse.json(
        {
          error: "No organization is selected.",
        },
        {
          status: 400,
        },
      );
    }

    await ensureVerification(organizationId);

    return NextResponse.json(
      await getResponse(organizationId),
    );
  } catch (error) {
    console.error(
      "GET /api/organization/verification error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load organization verification.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * PUT
 *
 * Saves organization information or submits the
 * verification application.
 */
export async function PUT(
  request: NextRequest,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const organizationId =
      await getSelectedOrganizationId(
        session.user.id,
      );

    if (!organizationId) {
      return NextResponse.json(
        {
          error: "No organization is selected.",
        },
        {
          status: 400,
        },
      );
    }

    const body = await request.json();

    const action =
      body.action as VerificationAction;

    if (
      action !== "SAVE_DRAFT" &&
      action !== "SUBMIT"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid verification action.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * The supporting-documents page sends:
     *
     * {
     *   action: "SAVE_DRAFT",
     *   organization: {
     *     name,
     *     legalName,
     *     type,
     *     email,
     *     registrationNumber,
     *     address
     *   }
     * }
     *
     * We therefore read body.organization first.
     *
     * The flat body format is also supported for
     * compatibility with other callers.
     */
    const organizationInput =
      body.organization &&
      typeof body.organization === "object"
        ? body.organization
        : body;

    const existingOrganization =
      await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
        select: {
          id: true,
          verifiedAt: true,
        },
      });

    if (!existingOrganization) {
      return NextResponse.json(
        {
          error: "Organization not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (existingOrganization.verifiedAt) {
      return NextResponse.json(
        {
          error:
            "This organization has already been approved.",
        },
        {
          status: 409,
        },
      );
    }

    const existingVerification =
      await prisma.organizationVerification.findUnique({
        where: {
          organizationId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (
      existingVerification?.status ===
        "SUBMITTED" ||
      existingVerification?.status ===
        "UNDER_REVIEW"
    ) {
      return NextResponse.json(
        {
          error:
            "This verification application cannot currently be edited because it is under review.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Read organization fields.
     */
    const name = String(
      organizationInput.name ?? "",
    ).trim();

    const legalName = String(
      organizationInput.legalName ?? "",
    ).trim();

    const email = String(
      organizationInput.email ?? "",
    ).trim();

    const phone = String(
      organizationInput.phone ?? "",
    ).trim();

    const website = String(
      organizationInput.website ?? "",
    ).trim();

    const address = String(
      organizationInput.address ?? "",
    ).trim();

    const registrationNumber =
      String(
        organizationInput.registrationNumber ??
          "",
      ).trim();

    const taxNumber = String(
      organizationInput.taxNumber ?? "",
    ).trim();

    /*
     * The UI uses "type".
     *
     * The database uses "organizationType".
     *
     * Accept both.
     */
    const organizationType =
      organizationInput.organizationType ??
      organizationInput.type;

    /*
     * Required organization information.
     */
    if (!name) {
      return NextResponse.json(
        {
          error:
            "Organization name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!legalName) {
      return NextResponse.json(
        {
          error:
            "Legal name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Organization email is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!address) {
      return NextResponse.json(
        {
          error:
            "Organization address is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!registrationNumber) {
      return NextResponse.json(
        {
          error:
            "Registration number is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !VALID_ORGANIZATION_TYPES.includes(
        organizationType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid organization type.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * A registration document is mandatory when
     * submitting the verification application.
     */
    if (action === "SUBMIT") {
      const registrationDocument =
        await prisma.organizationDocument.findFirst({
          where: {
            organizationId,
            category: {
              in: [
                "CERTIFICATE_OF_INCORPORATION",
                "ARTICLES_OF_INCORPORATION",
                "CERTIFICATE_OF_FORMATION",
                "BUSINESS_REGISTRATION",
                "GOVERNMENT_REGISTRATION",
              ],
            },
            status: {
              not: "REJECTED",
            },
          },
          select: {
            id: true,
          },
        });

      if (!registrationDocument) {
        return NextResponse.json(
          {
            error:
              "A valid registration, incorporation, formation, or government registration document must be uploaded before submission.",
          },
          {
            status: 400,
          },
        );
      }
    }

    /*
     * Make sure the verification record exists.
     *
     * This is deliberately outside the transaction below.
     * It prevents the transaction from doing unnecessary
     * verification-check creation work.
     */
    const verification =
      await ensureVerification(
        organizationId,
      );

    /*
     * Only the organization and verification status
     * are changed inside this transaction.
     *
     * We no longer perform 10 sequential check upserts
     * here.
     */
    await prisma.$transaction(
      async (transaction) => {
        await transaction.organization.update({
          where: {
            id: organizationId,
          },
          data: {
            name,
            legalName,
            email,
            phone: phone || null,
            website: website || null,
            address,
            organizationType,
            registrationNumber,
            taxNumber: taxNumber || null,
          },
        });

        const nextStatus =
          action === "SUBMIT"
            ? "SUBMITTED"
            : "DRAFT";

        await transaction.organizationVerification.update(
          {
            where: {
              id: verification.id,
            },
            data: {
              status: nextStatus,
              submittedAt:
                action === "SUBMIT"
                  ? new Date()
                  : undefined,
              reviewedAt: null,
            },
          },
        );

        /*
         * When an organization corrects information after
         * NEEDS_INFORMATION or REJECTED, previous check
         * results must not remain falsely valid.
         */
        if (
          action === "SUBMIT" &&
          existingVerification &&
          (existingVerification.status ===
            "NEEDS_INFORMATION" ||
            existingVerification.status ===
              "REJECTED")
        ) {
          await transaction.organizationVerificationCheck.updateMany(
            {
              where: {
                verificationId:
                  verification.id,
              },
              data: {
                status: "PENDING",
                checkedAt: null,
                checkedById: null,
                documentId: null,
                notes: null,
              },
            },
          );
        }
      },
    );

    return NextResponse.json(
      await getResponse(organizationId),
      {
        status: existingVerification
          ? 200
          : 201,
      },
    );
  } catch (error) {
    console.error(
      "PUT /api/organization/verification error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to save organization verification.",
      },
      {
        status: 500,
      },
    );
  }
}