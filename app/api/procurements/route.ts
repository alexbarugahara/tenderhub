import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { ProcurementMethod, ProcurementStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const organizationId = searchParams.get("organizationId");
    const departmentId = searchParams.get("departmentId");
    const countryId = searchParams.get("countryId");
    const search = searchParams.get("search");

    const where: {
      status?: ProcurementStatus;
      organizationId?: string;
      departmentId?: string;
      countryId?: string;
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        referenceNumber?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (status) {
      if (!Object.values(ProcurementStatus).includes(status as ProcurementStatus)) {
        return NextResponse.json(
          { success: false, error: "Invalid procurement status" },
          { status: 400 }
        );
      }

      where.status = status as ProcurementStatus;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (countryId) {
      where.countryId = countryId;
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          referenceNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const procurements = await prisma.procurement.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            legalName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        country: {
          select: {
            id: true,
            code: true,
            name: true,
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
        solicitations: {
          select: {
            id: true,
            solicitationNumber: true,
            title: true,
            status: true,
            type: true,
            publishedAt: true,
            openingDate: true,
            closingDate: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: procurements,
    });
  } catch (error) {
    console.error("GET /api/procurements error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch procurements",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "ORGANIZATION"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators and organization users can create procurements",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      organizationId,
      departmentId,
      countryId,
      currencyId,
      title,
      description,
      referenceNumber,
      status,
      procurementMethod,
      estimatedValue,
      plannedStartDate,
      plannedEndDate,
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organizationId is required",
        },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "title is required",
        },
        { status: 400 }
      );
    }

    if (
      !referenceNumber ||
      typeof referenceNumber !== "string" ||
      !referenceNumber.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "referenceNumber is required",
        },
        { status: 400 }
      );
    }

    if (
      !procurementMethod ||
      !Object.values(ProcurementMethod).includes(
        procurementMethod as ProcurementMethod
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid procurementMethod is required",
        },
        { status: 400 }
      );
    }

    if (
      status &&
      !Object.values(ProcurementStatus).includes(status as ProcurementStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid procurement status",
        },
        { status: 400 }
      );
    }

    if (estimatedValue !== undefined && estimatedValue !== null) {
      const numericEstimatedValue = Number(estimatedValue);

      if (
        !Number.isFinite(numericEstimatedValue) ||
        numericEstimatedValue < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "estimatedValue must be a valid non-negative number",
          },
          { status: 400 }
        );
      }
    }

    if (plannedStartDate) {
      const startDate = new Date(plannedStartDate);

      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid plannedStartDate",
          },
          { status: 400 }
        );
      }
    }

    if (plannedEndDate) {
      const endDate = new Date(plannedEndDate);

      if (Number.isNaN(endDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid plannedEndDate",
          },
          { status: 400 }
        );
      }
    }

    if (plannedStartDate && plannedEndDate) {
      const startDate = new Date(plannedStartDate);
      const endDate = new Date(plannedEndDate);

      if (endDate < startDate) {
        return NextResponse.json(
          {
            success: false,
            error: "plannedEndDate cannot be earlier than plannedStartDate",
          },
          { status: 400 }
        );
      }
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
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!department) {
        return NextResponse.json(
          {
            success: false,
            error: "Department not found for the specified organization",
          },
          { status: 400 }
        );
      }
    }

    if (countryId) {
      const country = await prisma.country.findUnique({
        where: {
          id: countryId,
        },
        select: {
          id: true,
          active: true,
        },
      });

      if (!country) {
        return NextResponse.json(
          {
            success: false,
            error: "Country not found",
          },
          { status: 400 }
        );
      }

      if (!country.active) {
        return NextResponse.json(
          {
            success: false,
            error: "Selected country is inactive",
          },
          { status: 400 }
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
          active: true,
        },
      });

      if (!currency) {
        return NextResponse.json(
          {
            success: false,
            error: "Currency not found",
          },
          { status: 400 }
        );
      }

      if (!currency.active) {
        return NextResponse.json(
          {
            success: false,
            error: "Selected currency is inactive",
          },
          { status: 400 }
        );
      }
    }

    const existingProcurement = await prisma.procurement.findUnique({
      where: {
        referenceNumber: referenceNumber.trim(),
      },
      select: {
        id: true,
      },
    });

    if (existingProcurement) {
      return NextResponse.json(
        {
          success: false,
          error: "A procurement with this reference number already exists",
        },
        { status: 409 }
      );
    }

    const procurement = await prisma.procurement.create({
      data: {
        organizationId,
        departmentId: departmentId || null,
        countryId: countryId || null,
        currencyId: currencyId || null,
        title: title.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        referenceNumber: referenceNumber.trim(),
        status: status
          ? (status as ProcurementStatus)
          : ProcurementStatus.DRAFT,
        procurementMethod: procurementMethod as ProcurementMethod,
        estimatedValue:
          estimatedValue !== undefined && estimatedValue !== null
            ? estimatedValue
            : null,
        plannedStartDate: plannedStartDate
          ? new Date(plannedStartDate)
          : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            legalName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        country: {
          select: {
            id: true,
            code: true,
            name: true,
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

    await prisma.procurementActivity.create({
      data: {
        procurementId: procurement.id,
        performedById: session.user.id,
        action: "CREATE",
        description: `Procurement "${procurement.title}" was created.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: procurement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/procurements error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create procurement",
      },
      { status: 500 }
    );
  }
}