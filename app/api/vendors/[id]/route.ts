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

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: {
        id,
      },
      include: {
        country: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        classifications: {
          include: {
            classification: true,
          },
        },
        _count: {
          select: {
            bids: true,
            contracts: true,
            awards: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error) {
    console.error("Get vendor error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve vendor",
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

    const vendor = await prisma.vendor.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found",
        },
        {
          status: 404,
        },
      );
    }

    const isAdmin = currentUser.role === "ADMIN";
    const isOwner = vendor.userId === currentUser.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to update this vendor",
        },
        {
          status: 403,
        },
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
      verifiedAt,
    } = body;

    if (
      companyName !== undefined &&
      (typeof companyName !== "string" || companyName.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Company name cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (
      email !== undefined &&
      email !== null &&
      (typeof email !== "string" || email.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Email must be a valid value",
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

    if (email !== undefined && email !== null) {
      const existingVendor = await prisma.vendor.findFirst({
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

      if (existingVendor) {
        return NextResponse.json(
          {
            success: false,
            error: "A vendor with this email already exists",
          },
          {
            status: 409,
          },
        );
      }
    }

    if (registrationNumber !== undefined && registrationNumber !== null) {
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          registrationNumber: registrationNumber.trim(),
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingVendor) {
        return NextResponse.json(
          {
            success: false,
            error: "A vendor with this registration number already exists",
          },
          {
            status: 409,
          },
        );
      }
    }

    if (taxNumber !== undefined && taxNumber !== null) {
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          taxNumber: taxNumber.trim(),
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingVendor) {
        return NextResponse.json(
          {
            success: false,
            error: "A vendor with this tax number already exists",
          },
          {
            status: 409,
          },
        );
      }
    }

    const updatedVendor = await prisma.vendor.update({
      where: {
        id,
      },
      data: {
        ...(companyName !== undefined
          ? { companyName: companyName.trim() }
          : {}),
        ...(legalName !== undefined
          ? {
              legalName:
                legalName === null ? null : String(legalName).trim(),
            }
          : {}),
        ...(description !== undefined
          ? {
              description:
                description === null ? null : String(description).trim(),
            }
          : {}),
        ...(email !== undefined
          ? {
              email: email === null ? null : String(email).trim(),
            }
          : {}),
        ...(phone !== undefined
          ? {
              phone: phone === null ? null : String(phone).trim(),
            }
          : {}),
        ...(website !== undefined
          ? {
              website: website === null ? null : String(website).trim(),
            }
          : {}),
        ...(address !== undefined
          ? {
              address: address === null ? null : String(address).trim(),
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
                taxNumber === null ? null : String(taxNumber).trim(),
            }
          : {}),
        ...(countryId !== undefined ? { countryId } : {}),
        ...(businessType !== undefined
          ? {
              businessType:
                businessType === null ? null : String(businessType).trim(),
            }
          : {}),
        ...(numberOfEmployees !== undefined
          ? { numberOfEmployees }
          : {}),
        ...(yearsOperating !== undefined ? { yearsOperating } : {}),
        ...(operatingLocations !== undefined
          ? {
              operatingLocations:
                operatingLocations === null
                  ? null
                  : String(operatingLocations).trim(),
            }
          : {}),
        ...(portfolioDescription !== undefined
          ? {
              portfolioDescription:
                portfolioDescription === null
                  ? null
                  : String(portfolioDescription).trim(),
            }
          : {}),
        ...(isAdmin && verifiedAt !== undefined
          ? {
              verifiedAt,
            }
          : {}),
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

    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully",
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error("Update vendor error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update vendor",
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

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators can delete vendors",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.vendor.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error("Delete vendor error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete vendor",
      },
      {
        status: 500,
      },
    );
  }
}