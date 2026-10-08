import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

async function getOrganizationMembership(
  organizationId: string,
  userId: string,
) {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      id: true,
      role: true,
      userId: true,
      organizationId: true,
    },
  });
}

function canManageOrganization(
  role: string | undefined,
  membershipRole?: string,
) {
  if (role === "ADMIN") {
    return true;
  }

  return (
    membershipRole === "OWNER" ||
    membershipRole === "ADMIN"
  );
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: {
        id,
      },
      include: {
        country: true,
        currency: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        departments: {
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            members: true,
            departments: true,
            procurements: true,
            solicitations: true,
            integrations: true,
            subscriptions: true,
            notices: true,
            contracts: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Get organization error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve organization",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        {
          status: 404,
        },
      );
    }

    const membership =
      currentUser.role === "ADMIN"
        ? null
        : await getOrganizationMembership(id, currentUser.id);

    if (
      !canManageOrganization(
        currentUser.role,
        membership?.role,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to update this organization",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    const {
      name,
      legalName,
      email,
      phone,
      website,
      address,
      logo,
      description,
      registrationNumber,
      taxNumber,
      organizationType,
      countryId,
      currencyId,
      verifiedAt,
    } = body;

    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization name cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (
      email !== undefined &&
      (typeof email !== "string" || email.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization email cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (countryId !== undefined && countryId !== null) {
      const country = await prisma.country.findUnique({
        where: {
          id: countryId,
        },
        select: {
          id: true,
        },
      });

      if (!country) {
        return NextResponse.json(
          {
            success: false,
            error: "Country not found",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (currencyId !== undefined && currencyId !== null) {
      const currency = await prisma.currency.findUnique({
        where: {
          id: currencyId,
        },
        select: {
          id: true,
        },
      });

      if (!currency) {
        return NextResponse.json(
          {
            success: false,
            error: "Currency not found",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (email !== undefined) {
      const existingEmail = await prisma.organization.findFirst({
        where: {
          email: email.trim(),
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: "An organization with this email already exists",
          },
          {
            status: 409,
          },
        );
      }
    }

    if (registrationNumber !== undefined && registrationNumber !== null) {
      const existingRegistration =
        await prisma.organization.findFirst({
          where: {
            registrationNumber: String(registrationNumber).trim(),
            NOT: {
              id,
            },
          },
          select: {
            id: true,
          },
        });

      if (existingRegistration) {
        return NextResponse.json(
          {
            success: false,
            error:
              "An organization with this registration number already exists",
          },
          {
            status: 409,
          },
        );
      }
    }

    if (taxNumber !== undefined && taxNumber !== null) {
      const existingTaxNumber =
        await prisma.organization.findFirst({
          where: {
            taxNumber: String(taxNumber).trim(),
            NOT: {
              id,
            },
          },
          select: {
            id: true,
          },
        });

      if (existingTaxNumber) {
        return NextResponse.json(
          {
            success: false,
            error:
              "An organization with this tax number already exists",
          },
          {
            status: 409,
          },
        );
      }
    }

    const updatedOrganization =
      await prisma.organization.update({
        where: {
          id,
        },
        data: {
          ...(name !== undefined
            ? {
                name: name.trim(),
              }
            : {}),
          ...(legalName !== undefined
            ? {
                legalName:
                  legalName === null
                    ? null
                    : String(legalName).trim(),
              }
            : {}),
          ...(email !== undefined
            ? {
                email: email.trim(),
              }
            : {}),
          ...(phone !== undefined
            ? {
                phone:
                  phone === null
                    ? null
                    : String(phone).trim(),
              }
            : {}),
          ...(website !== undefined
            ? {
                website:
                  website === null
                    ? null
                    : String(website).trim(),
              }
            : {}),
          ...(address !== undefined
            ? {
                address:
                  address === null
                    ? null
                    : String(address).trim(),
              }
            : {}),
          ...(logo !== undefined
            ? {
                logo:
                  logo === null
                    ? null
                    : String(logo).trim(),
              }
            : {}),
          ...(description !== undefined
            ? {
                description:
                  description === null
                    ? null
                    : String(description).trim(),
              }
            : {}),
          ...(registrationNumber !== undefined
            ? {
                registrationNumber:
                  registrationNumber === null
                    ? null
                    : String(registrationNumber).trim(),
              }
            : {}),
          ...(taxNumber !== undefined
            ? {
                taxNumber:
                  taxNumber === null
                    ? null
                    : String(taxNumber).trim(),
              }
            : {}),
          ...(organizationType !== undefined
            ? {
                organizationType: organizationType as never,
              }
            : {}),
          ...(countryId !== undefined
            ? {
                countryId,
              }
            : {}),
          ...(currencyId !== undefined
            ? {
                currencyId,
              }
            : {}),
          ...(currentUser.role === "ADMIN" &&
          verifiedAt !== undefined
            ? {
                verifiedAt,
              }
            : {}),
        },
        include: {
          country: true,
          currency: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  image: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully",
      organization: updatedOrganization,
    });
  } catch (error) {
    console.error("Update organization error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update organization",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        {
          status: 404,
        },
      );
    }

    const membership =
      currentUser.role === "ADMIN"
        ? null
        : await getOrganizationMembership(id, currentUser.id);

    if (
      !canManageOrganization(
        currentUser.role,
        membership?.role,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to delete this organization",
        },
        {
          status: 403,
        },
      );
    }

    await prisma.organization.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    console.error("Delete organization error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete organization",
      },
      {
        status: 500,
      },
    );
  }
}