import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getSelectedOrganizationId } from "@/components/layout/organization-switcher-actions";

function cleanString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function nullableString(value: unknown) {
  const cleaned = cleanString(value);

  return cleaned || null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function serializeOrganization(organization: {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  description: string | null;
  registrationNumber: string | null;
  taxNumber: string | null;
  organizationType: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  country: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  currency: {
    id: string;
    code: string;
    name: string;
    symbol: string | null;
  } | null;
}) {
  return {
    ...organization,
    verifiedAt: organization.verifiedAt?.toISOString() ?? null,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const organizationId = await getSelectedOrganizationId(
      session.user.id
    );

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization selected." },
        { status: 404 }
      );
    }

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
          description: true,
          registrationNumber: true,
          taxNumber: true,
          organizationType: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,

          country: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          currency: {
            select: {
              id: true,
              code: true,
              name: true,
              symbol: true,
            },
          },
        },
      });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization: serializeOrganization(organization),
    });
  } catch (error) {
    console.error(
      "GET /api/organization/settings/general failed:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load organization settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const organizationId = await getSelectedOrganizationId(
      session.user.id
    );

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization selected." },
        { status: 404 }
      );
    }

    const membership =
      await prisma.organizationMember.findFirst({
        where: {
          userId: session.user.id,
          organizationId,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You do not have access to this organization.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = cleanString(body?.name);
    const email = cleanString(body?.email);

    const phone = nullableString(body?.phone);
    const website = nullableString(body?.website);
    const address = nullableString(body?.address);
    const description = nullableString(body?.description);

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required." },
        { status: 400 }
      );
    }

    if (name.length > 200) {
      return NextResponse.json(
        { error: "Organization name is too long." },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid organization email.",
        },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { error: "Organization email is too long." },
        { status: 400 }
      );
    }

    if (phone && phone.length > 50) {
      return NextResponse.json(
        { error: "Phone number is too long." },
        { status: 400 }
      );
    }

    if (website && website.length > 500) {
      return NextResponse.json(
        { error: "Website address is too long." },
        { status: 400 }
      );
    }

    if (address && address.length > 1000) {
      return NextResponse.json(
        { error: "Business address is too long." },
        { status: 400 }
      );
    }

    if (description && description.length > 5000) {
      return NextResponse.json(
        { error: "Description is too long." },
        { status: 400 }
      );
    }

    const organization =
      await prisma.organization.update({
        where: {
          id: organizationId,
        },

        data: {
          name,

          // Use undefined instead of null for fields
          // that Prisma defines as non-nullable.
          email: email || undefined,
          phone: phone ?? undefined,
          website: website ?? undefined,
          address: address ?? undefined,
          description: description ?? undefined,
        },

        select: {
          id: true,
          name: true,
          legalName: true,
          email: true,
          phone: true,
          website: true,
          address: true,
          description: true,
          registrationNumber: true,
          taxNumber: true,
          organizationType: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,

          country: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          currency: {
            select: {
              id: true,
              code: true,
              name: true,
              symbol: true,
            },
          },
        },
      });

    return NextResponse.json({
      message:
        "Organization information updated successfully.",

      organization: serializeOrganization(organization),
    });
  } catch (error) {
    console.error(
      "PUT /api/organization/settings/general failed:",
      error
    );

    return NextResponse.json(
      { error: "Failed to save organization settings." },
      { status: 500 }
    );
  }
}
