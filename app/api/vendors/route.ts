import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const countryId = searchParams.get("countryId");
    const verified = searchParams.get("verified");

    const where: {
      countryId?: string;
      verifiedAt?: {
        not: null;
      } | null;
      OR?: Array<{
        companyName?: {
          contains: string;
          mode: "insensitive";
        };
        legalName?: {
          contains: string;
          mode: "insensitive";
        };
        email?: {
          contains: string;
          mode: "insensitive";
        };
        registrationNumber?: {
          contains: string;
          mode: "insensitive";
        };
      }>;
    } = {};

    if (countryId) {
      where.countryId = countryId;
    }

    if (verified === "true") {
      where.verifiedAt = {
        not: null,
      };
    }

    if (verified === "false") {
      where.verifiedAt = null;
    }

    if (search) {
      where.OR = [
        {
          companyName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          legalName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          registrationNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        country: true,
        classifications: {
          include: {
            classification: true,
          },
        },
      },
      orderBy: {
        companyName: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: vendors,
      count: vendors.length,
    });
  } catch (error) {
    console.error("GET /api/vendors error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch vendors",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const role = user.role as UserRole;

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.VENDOR
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators and vendor users can create vendor profiles",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      companyName,
      legalName,
      description,
      email,
      phone,
      website,
      address,
      registrationNumber,
      taxNumber,
      countryId,
      businessType,
      numberOfEmployees,
      yearsOperating,
      operatingLocations,
      portfolioDescription,
    } = body;

    if (!companyName || !String(companyName).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Company name is required",
        },
        { status: 400 },
      );
    }

    if (countryId) {
      const country = await prisma.country.findUnique({
        where: {
          id: countryId,
        },
      });

      if (!country) {
        return NextResponse.json(
          {
            success: false,
            error: "Country not found",
          },
          { status: 404 },
        );
      }
    }

    const existingVendorForUser =
      await prisma.vendor.findUnique({
        where: {
          userId: user.id,
        },
      });

    if (existingVendorForUser) {
      return NextResponse.json(
        {
          success: false,
          error: "A vendor profile already exists for this user",
        },
        { status: 409 },
      );
    }

    if (email) {
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          email: String(email).trim(),
        },
      });

      if (existingVendor) {
        return NextResponse.json(
          {
            success: false,
            error: "A vendor with this email already exists",
          },
          { status: 409 },
        );
      }
    }

    if (registrationNumber) {
      const existingRegistration =
        await prisma.vendor.findFirst({
          where: {
            registrationNumber: String(
              registrationNumber,
            ).trim(),
          },
        });

      if (existingRegistration) {
        return NextResponse.json(
          {
            success: false,
            error: "A vendor with this registration number already exists",
          },
          { status: 409 },
        );
      }
    }

    if (taxNumber) {
      const existingTaxNumber =
        await prisma.vendor.findFirst({
          where: {
            taxNumber: String(taxNumber).trim(),
          },
        });

      if (existingTaxNumber) {
        return NextResponse.json(
          {
            success: false,
            error: "A vendor with this tax number already exists",
          },
          { status: 409 },
        );
      }
    }

    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        companyName: String(companyName).trim(),
        legalName:
          legalName === undefined || legalName === null
            ? null
            : String(legalName).trim(),
        description:
          description === undefined || description === null
            ? null
            : String(description),
        email:
          email === undefined || email === null
            ? null
            : String(email).trim(),
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
            : String(address),
        registrationNumber:
          registrationNumber === undefined ||
          registrationNumber === null
            ? null
            : String(registrationNumber).trim(),
        taxNumber:
          taxNumber === undefined || taxNumber === null
            ? null
            : String(taxNumber).trim(),
        countryId: countryId || null,
        businessType:
          businessType === undefined ||
          businessType === null
            ? null
            : String(businessType),
        numberOfEmployees:
          numberOfEmployees === undefined ||
          numberOfEmployees === null ||
          numberOfEmployees === ""
            ? null
            : Number(numberOfEmployees),
        yearsOperating:
          yearsOperating === undefined ||
          yearsOperating === null ||
          yearsOperating === ""
            ? null
            : Number(yearsOperating),
        operatingLocations:
          operatingLocations === undefined ||
          operatingLocations === null
            ? null
            : String(operatingLocations),
        portfolioDescription:
          portfolioDescription === undefined ||
          portfolioDescription === null
            ? null
            : String(portfolioDescription),
      },
      include: {
        country: true,
        classifications: {
          include: {
            classification: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vendor profile created successfully",
        data: vendor,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/vendors error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create vendor",
      },
      { status: 500 },
    );
  }
}