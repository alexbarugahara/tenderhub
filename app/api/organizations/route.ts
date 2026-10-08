import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const countryId = searchParams.get("countryId") || "";
    const organizationType = searchParams.get("organizationType") || "";
    const verified = searchParams.get("verified");

    const where = {
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                legalName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                registrationNumber: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
      ...(countryId ? { countryId } : {}),
      ...(organizationType ? { organizationType: organizationType as never } : {}),
      ...(verified === "true"
        ? {
            verifiedAt: {
              not: null,
            },
          }
        : {}),
      ...(verified === "false"
        ? {
            verifiedAt: null,
          }
        : {}),
      ...(currentUser?.role === "ORGANIZATION"
        ? {
            members: {
              some: {
                userId: currentUser.id,
              },
            },
          }
        : {}),
    };

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        country: true,
        currency: true,
        _count: {
          select: {
            members: true,
            departments: true,
            procurements: true,
            solicitations: true,
            contracts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      organizations,
      count: organizations.length,
    });
  } catch (error) {
    console.error("Get organizations error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve organizations",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "ORGANIZATION"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to create an organization",
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
    } = body;

    if (
      typeof name !== "string" ||
      name.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof email !== "string" ||
      email.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization email is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !organizationType ||
      typeof organizationType !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization type is required",
        },
        {
          status: 400,
        },
      );
    }

    if (countryId) {
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

    if (currencyId) {
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

    const existingEmail = await prisma.organization.findUnique({
      where: {
        email: email.trim(),
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

    if (registrationNumber) {
      const existingRegistration = await prisma.organization.findFirst({
        where: {
          registrationNumber: String(registrationNumber).trim(),
        },
        select: {
          id: true,
        },
      });

      if (existingRegistration) {
        return NextResponse.json(
          {
            success: false,
            error: "An organization with this registration number already exists",
          },
          {
            status: 409,
          },
        );
      }
    }

    if (taxNumber) {
      const existingTaxNumber = await prisma.organization.findFirst({
        where: {
          taxNumber: String(taxNumber).trim(),
        },
        select: {
          id: true,
        },
      });

      if (existingTaxNumber) {
        return NextResponse.json(
          {
            success: false,
            error: "An organization with this tax number already exists",
          },
          {
            status: 409,
          },
        );
      }
    }

    const organization = await prisma.$transaction(async (tx) => {
      const createdOrganization = await tx.organization.create({
        data: {
          name: name.trim(),
          legalName:
            legalName === undefined || legalName === null
              ? null
              : String(legalName).trim(),
          email: email.trim(),
          phone:
            phone === undefined || phone === null
              ? null
              : String(phone).trim(),
          website:
            website === undefined || website === null
              ? null
              : String(website).trim(),
          address:
            address === undefined || address === null
              ? null
              : String(address).trim(),
          logo:
            logo === undefined || logo === null
              ? null
              : String(logo).trim(),
          description:
            description === undefined || description === null
              ? null
              : String(description).trim(),
          registrationNumber:
            registrationNumber === undefined ||
            registrationNumber === null
              ? null
              : String(registrationNumber).trim(),
          taxNumber:
            taxNumber === undefined || taxNumber === null
              ? null
              : String(taxNumber).trim(),
          organizationType: organizationType as never,
          ...(countryId ? { countryId } : {}),
          ...(currencyId ? { currencyId } : {}),
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: createdOrganization.id,
          userId: currentUser.id,
          role: "OWNER",
        },
      });

      return createdOrganization;
    });

    const organizationWithRelations =
      await prisma.organization.findUnique({
        where: {
          id: organization.id,
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
                  image: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Organization created successfully",
        organization: organizationWithRelations,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create organization error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create organization",
      },
      {
        status: 500,
      },
    );
  }
}