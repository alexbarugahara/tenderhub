import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  ProcurementMethod,
  ProcurementStatus,
} from "@prisma/client";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get("organizationId");
    const departmentId = searchParams.get("departmentId");
    const countryId = searchParams.get("countryId");
    const status = searchParams.get("status");
    const procurementMethod = searchParams.get("procurementMethod");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== "ADMIN" && userRole !== "ORGANIZATION") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only organization users and administrators can access procurement reports",
        },
        { status: 403 }
      );
    }

    let allowedOrganizationIds: string[] | undefined;

    if (userRole === "ORGANIZATION") {
      const memberships = await prisma.organizationMember.findMany({
        where: {
          userId,
        },
        select: {
          organizationId: true,
        },
      });

      allowedOrganizationIds = memberships.map(
        (membership) => membership.organizationId
      );

      if (allowedOrganizationIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            summary: {
              totalProcurements: 0,
              totalEstimatedValue: 0,
              averageEstimatedValue: 0,
              statusCounts: {},
            },
            byMethod: [],
            byCountry: [],
            byDepartment: [],
            procurements: [],
          },
        });
      }
    }

    if (
      organizationId &&
      allowedOrganizationIds &&
      !allowedOrganizationIds.includes(organizationId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to this organization",
        },
        { status: 403 }
      );
    }

    const where: Prisma.ProcurementWhereInput = {};

    if (organizationId) {
      where.organizationId = organizationId;
    } else if (allowedOrganizationIds) {
      where.organizationId = {
        in: allowedOrganizationIds,
      };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (countryId) {
      where.countryId = countryId;
    }

    if (status) {
      const validStatuses = Object.values(ProcurementStatus);

      if (!validStatuses.includes(status as ProcurementStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid procurement status",
            validStatuses,
          },
          { status: 400 }
        );
      }

      where.status = status as ProcurementStatus;
    }

    if (procurementMethod) {
      const validMethods = Object.values(ProcurementMethod);

      if (!validMethods.includes(procurementMethod as ProcurementMethod)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid procurement method",
            validMethods,
          },
          { status: 400 }
        );
      }

      where.procurementMethod = procurementMethod as ProcurementMethod;
    }

    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {};

      if (from) {
        const fromDate = new Date(from);

        if (Number.isNaN(fromDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid from date",
            },
            { status: 400 }
          );
        }

        createdAt.gte = fromDate;
      }

      if (to) {
        const toDate = new Date(to);

        if (Number.isNaN(toDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid to date",
            },
            { status: 400 }
          );
        }

        toDate.setHours(23, 59, 59, 999);
        createdAt.lte = toDate;
      }

      where.createdAt = createdAt;
    }

    const procurements = await prisma.procurement.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
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
            symbol: true,
            decimals: true,
          },
        },
        solicitations: {
          select: {
            id: true,
            status: true,
            estimatedValue: true,
          },
        },
        _count: {
          select: {
            solicitations: true,
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalEstimatedValue = procurements.reduce(
      (total, procurement) =>
        total + Number(procurement.estimatedValue ?? 0),
      0
    );

    const averageEstimatedValue =
      procurements.length > 0
        ? totalEstimatedValue / procurements.length
        : 0;

    const statusCounts: Record<string, number> = {};

    for (const procurementStatus of Object.values(ProcurementStatus)) {
      statusCounts[procurementStatus] = 0;
    }

    for (const procurement of procurements) {
      statusCounts[procurement.status] =
        (statusCounts[procurement.status] ?? 0) + 1;
    }

    const methodMap = new Map<
      string,
      {
        method: ProcurementMethod;
        count: number;
        estimatedValue: number;
      }
    >();

    for (const procurement of procurements) {
      const existing = methodMap.get(procurement.procurementMethod);

      if (existing) {
        existing.count += 1;
        existing.estimatedValue += Number(procurement.estimatedValue ?? 0);
      } else {
        methodMap.set(procurement.procurementMethod, {
          method: procurement.procurementMethod,
          count: 1,
          estimatedValue: Number(procurement.estimatedValue ?? 0),
        });
      }
    }

    const countryMap = new Map<
      string,
      {
        countryId: string | null;
        countryCode: string | null;
        countryName: string;
        count: number;
        estimatedValue: number;
      }
    >();

    for (const procurement of procurements) {
      const key = procurement.countryId ?? "UNSPECIFIED";
      const existing = countryMap.get(key);

      if (existing) {
        existing.count += 1;
        existing.estimatedValue += Number(procurement.estimatedValue ?? 0);
      } else {
        countryMap.set(key, {
          countryId: procurement.country?.id ?? null,
          countryCode: procurement.country?.code ?? null,
          countryName: procurement.country?.name ?? "Unspecified",
          count: 1,
          estimatedValue: Number(procurement.estimatedValue ?? 0),
        });
      }
    }

    const departmentMap = new Map<
      string,
      {
        departmentId: string | null;
        departmentName: string;
        count: number;
        estimatedValue: number;
      }
    >();

    for (const procurement of procurements) {
      const key = procurement.departmentId ?? "UNSPECIFIED";
      const existing = departmentMap.get(key);

      if (existing) {
        existing.count += 1;
        existing.estimatedValue += Number(procurement.estimatedValue ?? 0);
      } else {
        departmentMap.set(key, {
          departmentId: procurement.department?.id ?? null,
          departmentName: procurement.department?.name ?? "Unspecified",
          count: 1,
          estimatedValue: Number(procurement.estimatedValue ?? 0),
        });
      }
    }

    const reportProcurements = procurements.map((procurement) => ({
      id: procurement.id,
      referenceNumber: procurement.referenceNumber,
      title: procurement.title,
      description: procurement.description,
      status: procurement.status,
      procurementMethod: procurement.procurementMethod,
      estimatedValue: procurement.estimatedValue,
      plannedStartDate: procurement.plannedStartDate,
      plannedEndDate: procurement.plannedEndDate,
      createdAt: procurement.createdAt,
      updatedAt: procurement.updatedAt,
      organization: procurement.organization,
      department: procurement.department,
      country: procurement.country,
      currency: procurement.currency,
      solicitationCount: procurement._count.solicitations,
      activityCount: procurement._count.activities,
      solicitations: procurement.solicitations.map((solicitation) => ({
        id: solicitation.id,
        status: solicitation.status,
        estimatedValue: solicitation.estimatedValue,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProcurements: procurements.length,
          totalEstimatedValue,
          averageEstimatedValue,
          statusCounts,
        },
        byMethod: Array.from(methodMap.values()).sort(
          (a, b) => b.count - a.count
        ),
        byCountry: Array.from(countryMap.values()).sort(
          (a, b) => b.count - a.count
        ),
        byDepartment: Array.from(departmentMap.values()).sort(
          (a, b) => b.count - a.count
        ),
        procurements: reportProcurements,
      },
    });
  } catch (error) {
    console.error("Procurement report error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate procurement report",
      },
      { status: 500 }
    );
  }
}
