import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { ProcurementMethod, ProcurementStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Procurement ID is required",
        },
        { status: 400 }
      );
    }

    const procurement = await prisma.procurement.findUnique({
      where: {
        id,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            legalName: true,
            email: true,
            phone: true,
            website: true,
            address: true,
            logo: true,
            organizationType: true,
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
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        country: {
          select: {
            id: true,
            code: true,
            name: true,
            currencyCode: true,
            active: true,
          },
        },
        currency: {
          select: {
            id: true,
            code: true,
            name: true,
            symbol: true,
            decimals: true,
            active: true,
          },
        },
        solicitations: {
          include: {
            currency: {
              select: {
                id: true,
                code: true,
                name: true,
                symbol: true,
              },
            },
            lots: {
              select: {
                id: true,
                number: true,
                title: true,
                description: true,
                estimatedValue: true,
                status: true,
              },
              orderBy: {
                number: "asc",
              },
            },
            requirements: {
              select: {
                id: true,
                type: true,
                title: true,
                description: true,
                isMandatory: true,
                sortOrder: true,
              },
              orderBy: {
                sortOrder: "asc",
              },
            },
            documents: {
              select: {
                id: true,
                name: true,
                category: true,
                fileUrl: true,
                mimeType: true,
                fileSize: true,
                version: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            classifications: {
              include: {
                classification: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    description: true,
                    type: true,
                  },
                },
              },
            },
            evaluationCriteria: {
              select: {
                id: true,
                name: true,
                description: true,
                weight: true,
                maxScore: true,
                sortOrder: true,
              },
              orderBy: {
                sortOrder: "asc",
              },
            },
            notices: {
              where: {
                published: true,
              },
              select: {
                id: true,
                title: true,
                content: true,
                type: true,
                published: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                publishedAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        activities: {
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!procurement) {
      return NextResponse.json(
        {
          success: false,
          error: "Procurement not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: procurement,
    });
  } catch (error) {
    console.error("GET /api/procurements/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch procurement",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
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
          error: "Only administrators and organization users can update procurements",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Procurement ID is required",
        },
        { status: 400 }
      );
    }

    const existingProcurement = await prisma.procurement.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        organizationId: true,
        title: true,
        description: true,
        referenceNumber: true,
        status: true,
        procurementMethod: true,
        estimatedValue: true,
        plannedStartDate: true,
        plannedEndDate: true,
        departmentId: true,
        countryId: true,
        currencyId: true,
      },
    });

    if (!existingProcurement) {
      return NextResponse.json(
        {
          success: false,
          error: "Procurement not found",
        },
        { status: 404 }
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

    const nextOrganizationId =
      organizationId !== undefined
        ? organizationId
        : existingProcurement.organizationId;

    if (
      title !== undefined &&
      (typeof title !== "string" || !title.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "title must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (
      referenceNumber !== undefined &&
      (typeof referenceNumber !== "string" || !referenceNumber.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "referenceNumber must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (
      status !== undefined &&
      !Object.values(ProcurementStatus).includes(
        status as ProcurementStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid procurement status",
        },
        { status: 400 }
      );
    }

    if (
      procurementMethod !== undefined &&
      !Object.values(ProcurementMethod).includes(
        procurementMethod as ProcurementMethod
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid procurement method",
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

    let nextStartDate: Date | null | undefined;

    if (plannedStartDate !== undefined) {
      if (plannedStartDate === null || plannedStartDate === "") {
        nextStartDate = null;
      } else {
        const date = new Date(plannedStartDate);

        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid plannedStartDate",
            },
            { status: 400 }
          );
        }

        nextStartDate = date;
      }
    }

    let nextEndDate: Date | null | undefined;

    if (plannedEndDate !== undefined) {
      if (plannedEndDate === null || plannedEndDate === "") {
        nextEndDate = null;
      } else {
        const date = new Date(plannedEndDate);

        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid plannedEndDate",
            },
            { status: 400 }
          );
        }

        nextEndDate = date;
      }
    }

    const effectiveStartDate =
      nextStartDate !== undefined
        ? nextStartDate
        : existingProcurement.plannedStartDate;

    const effectiveEndDate =
      nextEndDate !== undefined
        ? nextEndDate
        : existingProcurement.plannedEndDate;

    if (
      effectiveStartDate &&
      effectiveEndDate &&
      effectiveEndDate < effectiveStartDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "plannedEndDate cannot be earlier than plannedStartDate",
        },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: nextOrganizationId,
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

    if (departmentId !== undefined && departmentId !== null) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId: nextOrganizationId,
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

    if (countryId !== undefined && countryId !== null) {
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

    if (currencyId !== undefined && currencyId !== null) {
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

    const nextReferenceNumber =
      referenceNumber !== undefined
        ? referenceNumber.trim()
        : existingProcurement.referenceNumber;

    if (nextReferenceNumber !== existingProcurement.referenceNumber) {
      const duplicateReference = await prisma.procurement.findFirst({
        where: {
          referenceNumber: nextReferenceNumber,
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicateReference) {
        return NextResponse.json(
          {
            success: false,
            error: "A procurement with this reference number already exists",
          },
          { status: 409 }
        );
      }
    }

    const procurement = await prisma.procurement.update({
      where: {
        id,
      },
      data: {
        organizationId: nextOrganizationId,
        ...(departmentId !== undefined
          ? { departmentId: departmentId || null }
          : {}),
        ...(countryId !== undefined
          ? { countryId: countryId || null }
          : {}),
        ...(currencyId !== undefined
          ? { currencyId: currencyId || null }
          : {}),
        ...(title !== undefined
          ? { title: title.trim() }
          : {}),
        ...(description !== undefined
          ? {
              description:
                typeof description === "string" && description.trim()
                  ? description.trim()
                  : null,
            }
          : {}),
        ...(referenceNumber !== undefined
          ? { referenceNumber: referenceNumber.trim() }
          : {}),
        ...(status !== undefined
          ? { status: status as ProcurementStatus }
          : {}),
        ...(procurementMethod !== undefined
          ? {
              procurementMethod:
                procurementMethod as ProcurementMethod,
            }
          : {}),
        ...(estimatedValue !== undefined
          ? { estimatedValue }
          : {}),
        ...(plannedStartDate !== undefined
          ? { plannedStartDate: nextStartDate }
          : {}),
        ...(plannedEndDate !== undefined
          ? { plannedEndDate: nextEndDate }
          : {}),
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
        action: "UPDATE",
        description: `Procurement "${procurement.title}" was updated.`,
      },
    });

    return NextResponse.json({
      success: true,
      data: procurement,
    });
  } catch (error) {
    console.error("PATCH /api/procurements/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update procurement",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
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
          error: "Only administrators and organization users can delete procurements",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Procurement ID is required",
        },
        { status: 400 }
      );
    }

    const procurement = await prisma.procurement.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!procurement) {
      return NextResponse.json(
        {
          success: false,
          error: "Procurement not found",
        },
        { status: 404 }
      );
    }

    await prisma.procurement.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Procurement "${procurement.title}" was deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE /api/procurements/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete procurement",
      },
      { status: 500 }
    );
  }
}