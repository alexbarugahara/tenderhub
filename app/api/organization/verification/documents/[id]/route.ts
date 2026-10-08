import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

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

async function getOrganizationId(userId: string) {
  const cookieOrganizationId =
    (await import("next/headers")).cookies().then((cookieStore) =>
      cookieStore.get("tenderhub_organization_id")?.value
    );

  const organizationId = await cookieOrganizationId;

  if (organizationId) {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
      },
      select: {
        organizationId: true,
      },
    });

    if (membership) {
      return membership.organizationId;
    }
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      organizationId: true,
    },
  });

  return membership?.organizationId ?? null;
}

async function ensureVerification(
  organizationId: string,
  createChecks: boolean
) {
  let verification = await prisma.organizationVerification.findUnique({
    where: {
      organizationId,
    },
  });

  if (!verification) {
    verification = await prisma.organizationVerification.create({
      data: {
        organizationId,
        status: "DRAFT",
      },
    });
  }

  if (createChecks) {
    for (const check of VERIFICATION_CHECKS) {
      await prisma.organizationVerificationCheck.upsert({
        where: {
          verificationId_code: {
            verificationId: verification.id,
            code: check.code,
          },
        },
        update: {
          name: check.name,
          category: check.category,
          description: check.description,
          required: check.required,
        },
        create: {
          verificationId: verification.id,
          code: check.code,
          name: check.name,
          category: check.category,
          description: check.description,
          required: check.required,
          status: "PENDING",
        },
      });
    }
  }

  return verification;
}

async function getResponse(organizationId: string) {
  const organization = await prisma.organization.findUnique({
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

  const verification = await prisma.organizationVerification.findUnique({
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

  const documents = await prisma.organizationDocument.findMany({
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

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationId(session.user.id);

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization is selected." },
        { status: 400 }
      );
    }

    return NextResponse.json(await getResponse(organizationId));
  } catch (error) {
    console.error("GET /api/organization/verification error:", error);

    return NextResponse.json(
      {
        error: "Failed to load organization verification.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationId(session.user.id);

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization is selected." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const action = body.action as VerificationAction;

    if (action !== "SAVE_DRAFT" && action !== "SUBMIT") {
      return NextResponse.json(
        { error: "Invalid verification action." },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found." },
        { status: 404 }
      );
    }

    const existing = await prisma.organizationVerification.findUnique({
      where: {
        organizationId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (
      existing?.status === "UNDER_REVIEW" ||
      existing?.status === "SUBMITTED" ||
      existing?.status === "APPROVED"
    ) {
      return NextResponse.json(
        {
          error:
            "This verification application cannot currently be edited.",
        },
        { status: 409 }
      );
    }

    const name = String(body.name ?? "").trim();
    const legalName = String(body.legalName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const website = String(body.website ?? "").trim();
    const address = String(body.address ?? "").trim();
    const registrationNumber = String(
      body.registrationNumber ?? ""
    ).trim();
    const taxNumber = String(body.taxNumber ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required." },
        { status: 400 }
      );
    }

    if (!legalName) {
      return NextResponse.json(
        { error: "Legal name is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Organization email is required." },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Organization address is required." },
        { status: 400 }
      );
    }

    if (!registrationNumber) {
      return NextResponse.json(
        { error: "Registration number is required." },
        { status: 400 }
      );
    }

    const organizationType = body.organizationType;

    const validOrganizationTypes = [
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
    ];

    if (!validOrganizationTypes.includes(organizationType)) {
      return NextResponse.json(
        { error: "Invalid organization type." },
        { status: 400 }
      );
    }

    const verification = await prisma.$transaction(
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

        const updatedVerification =
          await transaction.organizationVerification.upsert({
            where: {
              organizationId,
            },
            update: {
              status: action === "SUBMIT" ? "SUBMITTED" : "DRAFT",
              submittedAt:
                action === "SUBMIT" ? new Date() : undefined,
              reviewedAt: null,
              rejectionReason: null,
              adminNotes: null,
            },
            create: {
              organizationId,
              status: action === "SUBMIT" ? "SUBMITTED" : "DRAFT",
              submittedAt:
                action === "SUBMIT" ? new Date() : null,
            },
          });

        for (const check of VERIFICATION_CHECKS) {
          await transaction.organizationVerificationCheck.upsert({
            where: {
              verificationId_code: {
                verificationId: updatedVerification.id,
                code: check.code,
              },
            },
            update: {
              name: check.name,
              category: check.category,
              description: check.description,
              required: check.required,
            },
            create: {
              verificationId: updatedVerification.id,
              code: check.code,
              name: check.name,
              category: check.category,
              description: check.description,
              required: check.required,
              status: "PENDING",
            },
          });
        }

        return updatedVerification;
      }
    );

    return NextResponse.json(
      await getResponse(organizationId),
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    console.error("PUT /api/organization/verification error:", error);

    return NextResponse.json(
      {
        error: "Failed to save organization verification.",
      },
      { status: 500 }
    );
  }
}