import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== "ADMIN" && userRole !== "ORGANIZATION") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only organization users and administrators can access contract reports",
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
              totalContracts: 0,
              draft: 0,
              pendingSignature: 0,
              active: 0,
              onHold: 0,
              completed: 0,
              terminated: 0,
              expired: 0,
              totalContractValue: 0,
              averageContractValue: 0,
            },
            byStatus: [],
            byVendor: [],
            contracts: [],
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

    const where: {
      organizationId?: string | { in: string[] };
      vendorId?: string;
      status?:
        | "DRAFT"
        | "PENDING_SIGNATURE"
        | "ACTIVE"
        | "ON_HOLD"
        | "COMPLETED"
        | "TERMINATED"
        | "EXPIRED";
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (organizationId) {
      where.organizationId = organizationId;
    } else if (allowedOrganizationIds) {
      where.organizationId = {
        in: allowedOrganizationIds,
      };
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (status) {
      const validStatuses = [
        "DRAFT",
        "PENDING_SIGNATURE",
        "ACTIVE",
        "ON_HOLD",
        "COMPLETED",
        "TERMINATED",
        "EXPIRED",
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid contract status",
          },
          { status: 400 }
        );
      }

      where.status = status as
        | "DRAFT"
        | "PENDING_SIGNATURE"
        | "ACTIVE"
        | "ON_HOLD"
        | "COMPLETED"
        | "TERMINATED"
        | "EXPIRED";
    }

    if (from || to) {
      where.createdAt = {};

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

        where.createdAt.gte = fromDate;
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
        where.createdAt.lte = toDate;
      }
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        award: {
          select: {
            id: true,
            awardNumber: true,
            status: true,
            awardAmount: true,
            awardDate: true,
            solicitation: {
              select: {
                id: true,
                solicitationNumber: true,
                title: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            legalName: true,
            country: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        documents: {
          select: {
            id: true,
            name: true,
            category: true,
            fileUrl: true,
            createdAt: true,
          },
        },
        milestones: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            amount: true,
            status: true,
            completedAt: true,
          },
          orderBy: {
            dueDate: "asc",
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currencyId: true,
            paymentDate: true,
            status: true,
            reference: true,
            notes: true,
            createdAt: true,
          },
          orderBy: {
            paymentDate: "desc",
          },
        },
        _count: {
          select: {
            documents: true,
            milestones: true,
            payments: true,
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalContractValue = contracts.reduce(
      (total, contract) => total + Number(contract.contractValue),
      0
    );

    const averageContractValue =
      contracts.length > 0
        ? totalContractValue / contracts.length
        : 0;

    const statusCounts = {
      DRAFT: 0,
      PENDING_SIGNATURE: 0,
      ACTIVE: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
      TERMINATED: 0,
      EXPIRED: 0,
    };

    contracts.forEach((contract) => {
      statusCounts[contract.status] += 1;
    });

    const statusLabels: Record<string, string> = {
      DRAFT: "Draft",
      PENDING_SIGNATURE: "Pending Signature",
      ACTIVE: "Active",
      ON_HOLD: "On Hold",
      COMPLETED: "Completed",
      TERMINATED: "Terminated",
      EXPIRED: "Expired",
    };

    const byStatus = Object.entries(statusCounts)
      .map(([contractStatus, count]) => ({
        status: contractStatus,
        label: statusLabels[contractStatus] ?? contractStatus,
        count,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const vendorMap = new Map<
      string,
      {
        vendorId: string;
        companyName: string;
        country: {
          id: string;
          code: string;
          name: string;
        } | null;
        contractCount: number;
        totalContractValue: number;
        activeCount: number;
        completedCount: number;
        terminatedCount: number;
      }
    >();

    contracts.forEach((contract) => {
      const existing = vendorMap.get(contract.vendorId);

      if (existing) {
        existing.contractCount += 1;
        existing.totalContractValue += Number(contract.contractValue);

        if (contract.status === "ACTIVE") {
          existing.activeCount += 1;
        }

        if (contract.status === "COMPLETED") {
          existing.completedCount += 1;
        }

        if (contract.status === "TERMINATED") {
          existing.terminatedCount += 1;
        }
      } else {
        vendorMap.set(contract.vendorId, {
          vendorId: contract.vendorId,
          companyName: contract.vendor.companyName,
          country: contract.vendor.country,
          contractCount: 1,
          totalContractValue: Number(contract.contractValue),
          activeCount: contract.status === "ACTIVE" ? 1 : 0,
          completedCount: contract.status === "COMPLETED" ? 1 : 0,
          terminatedCount: contract.status === "TERMINATED" ? 1 : 0,
        });
      }
    });

    const reportContracts = contracts.map((contract) => {
      const completedMilestones = contract.milestones.filter(
        (milestone) => milestone.status === "COMPLETED"
      ).length;

      const totalMilestones = contract.milestones.length;

      const paidPayments = contract.payments.filter(
        (payment) => payment.status === "PAID"
      );

      const totalPaid = paidPayments.reduce(
        (total, payment) => total + Number(payment.amount),
        0
      );

      return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        title: contract.title,
        description: contract.description,
        status: contract.status,
        contractValue: contract.contractValue,
        startDate: contract.startDate,
        endDate: contract.endDate,
        signedAt: contract.signedAt,
        completedAt: contract.completedAt,
        terminatedAt: contract.terminatedAt,
        terminationReason: contract.terminationReason,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        award: contract.award,
        vendor: contract.vendor,
        organization: contract.organization,
        documents: contract.documents,
        milestones: contract.milestones,
        payments: contract.payments,
        documentCount: contract._count.documents,
        milestoneCount: contract._count.milestones,
        paymentCount: contract._count.payments,
        activityCount: contract._count.activities,
        completedMilestones,
        totalMilestones,
        milestoneCompletionRate:
          totalMilestones > 0
            ? (completedMilestones / totalMilestones) * 100
            : 0,
        totalPaid,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalContracts: contracts.length,
          draft: statusCounts.DRAFT,
          pendingSignature: statusCounts.PENDING_SIGNATURE,
          active: statusCounts.ACTIVE,
          onHold: statusCounts.ON_HOLD,
          completed: statusCounts.COMPLETED,
          terminated: statusCounts.TERMINATED,
          expired: statusCounts.EXPIRED,
          totalContractValue,
          averageContractValue,
        },
        byStatus,
        byVendor: Array.from(vendorMap.values()).sort(
          (a, b) => b.contractCount - a.contractCount
        ),
        contracts: reportContracts,
      },
    });
  } catch (error) {
    console.error("Contract report error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate contract report",
      },
      { status: 500 }
    );
  }
}