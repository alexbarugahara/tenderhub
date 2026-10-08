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
    const solicitationId = searchParams.get("solicitationId");
    const evaluatorId = searchParams.get("evaluatorId");
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
            "Only organization users and administrators can access evaluation reports",
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
              totalEvaluations: 0,
              draft: 0,
              inProgress: 0,
              completed: 0,
              approved: 0,
              averageScore: 0,
              highestScore: 0,
              lowestScore: 0,
            },
            byStatus: [],
            bySolicitation: [],
            byEvaluator: [],
            evaluations: [],
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
      bid?: {
        solicitation?: {
          organizationId?: string | { in: string[] };
          id?: string;
        };
      };
      evaluatorId?: string;
      status?:
        | "DRAFT"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "APPROVED";
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      bid: {
        solicitation: {},
      },
    };

    if (organizationId) {
      where.bid = {
        solicitation: {
          organizationId,
        },
      };
    } else if (allowedOrganizationIds) {
      where.bid = {
        solicitation: {
          organizationId: {
            in: allowedOrganizationIds,
          },
        },
      };
    }

    if (solicitationId) {
      where.bid = {
        ...where.bid,
        solicitation: {
          ...where.bid?.solicitation,
          id: solicitationId,
        },
      };
    }

    if (evaluatorId) {
      where.evaluatorId = evaluatorId;
    }

    if (status) {
      const validStatuses = [
        "DRAFT",
        "IN_PROGRESS",
        "COMPLETED",
        "APPROVED",
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid evaluation status",
          },
          { status: 400 }
        );
      }

      where.status = status as
        | "DRAFT"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "APPROVED";
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

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bid: {
          select: {
            id: true,
            bidNumber: true,
            title: true,
            status: true,
            totalAmount: true,
            vendor: {
              select: {
                id: true,
                companyName: true,
              },
            },
            solicitation: {
              select: {
                id: true,
                solicitationNumber: true,
                title: true,
                organizationId: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        scores: {
          include: {
            criterion: {
              select: {
                id: true,
                name: true,
                weight: true,
                maxScore: true,
                sortOrder: true,
              },
            },
          },
          orderBy: {
            criterion: {
              sortOrder: "asc",
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const scores = evaluations.map((evaluation) =>
      Number(evaluation.totalScore)
    );

    const totalScore = scores.reduce(
      (total, score) => total + score,
      0
    );

    const averageScore =
      scores.length > 0 ? totalScore / scores.length : 0;

    const highestScore =
      scores.length > 0 ? Math.max(...scores) : 0;

    const lowestScore =
      scores.length > 0 ? Math.min(...scores) : 0;

    const statusCounts = {
      DRAFT: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      APPROVED: 0,
    };

    evaluations.forEach((evaluation) => {
      statusCounts[evaluation.status] += 1;
    });

    const statusLabels: Record<string, string> = {
      DRAFT: "Draft",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      APPROVED: "Approved",
    };

    const byStatus = Object.entries(statusCounts)
      .map(([evaluationStatus, count]) => ({
        status: evaluationStatus,
        label: statusLabels[evaluationStatus] ?? evaluationStatus,
        count,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const solicitationMap = new Map<
      string,
      {
        solicitationId: string;
        solicitationNumber: string;
        title: string;
        evaluationCount: number;
        averageScore: number;
        completedCount: number;
        approvedCount: number;
      }
    >();

    evaluations.forEach((evaluation) => {
      const solicitation = evaluation.bid.solicitation;
      const existing = solicitationMap.get(solicitation.id);
      const score = Number(evaluation.totalScore);

      if (existing) {
        const previousTotal =
          existing.averageScore * existing.evaluationCount;

        existing.evaluationCount += 1;
        existing.averageScore =
          (previousTotal + score) / existing.evaluationCount;

        if (
          evaluation.status === "COMPLETED" ||
          evaluation.status === "APPROVED"
        ) {
          existing.completedCount += 1;
        }

        if (evaluation.status === "APPROVED") {
          existing.approvedCount += 1;
        }
      } else {
        solicitationMap.set(solicitation.id, {
          solicitationId: solicitation.id,
          solicitationNumber: solicitation.solicitationNumber,
          title: solicitation.title,
          evaluationCount: 1,
          averageScore: score,
          completedCount:
            evaluation.status === "COMPLETED" ||
            evaluation.status === "APPROVED"
              ? 1
              : 0,
          approvedCount:
            evaluation.status === "APPROVED" ? 1 : 0,
        });
      }
    });

    const evaluatorMap = new Map<
      string,
      {
        evaluatorId: string;
        evaluatorName: string;
        evaluatorEmail: string;
        evaluationCount: number;
        averageScore: number;
        completedCount: number;
        approvedCount: number;
      }
    >();

    evaluations.forEach((evaluation) => {
      const evaluator = evaluation.evaluator;
      const existing = evaluatorMap.get(evaluator.id);
      const score = Number(evaluation.totalScore);

      if (existing) {
        const previousTotal =
          existing.averageScore * existing.evaluationCount;

        existing.evaluationCount += 1;
        existing.averageScore =
          (previousTotal + score) / existing.evaluationCount;

        if (
          evaluation.status === "COMPLETED" ||
          evaluation.status === "APPROVED"
        ) {
          existing.completedCount += 1;
        }

        if (evaluation.status === "APPROVED") {
          existing.approvedCount += 1;
        }
      } else {
        evaluatorMap.set(evaluator.id, {
          evaluatorId: evaluator.id,
          evaluatorName: evaluator.name,
          evaluatorEmail: evaluator.email,
          evaluationCount: 1,
          averageScore: score,
          completedCount:
            evaluation.status === "COMPLETED" ||
            evaluation.status === "APPROVED"
              ? 1
              : 0,
          approvedCount:
            evaluation.status === "APPROVED" ? 1 : 0,
        });
      }
    });

    const reportEvaluations = evaluations.map((evaluation) => ({
      id: evaluation.id,
      status: evaluation.status,
      totalScore: evaluation.totalScore,
      comments: evaluation.comments,
      startedAt: evaluation.startedAt,
      completedAt: evaluation.completedAt,
      createdAt: evaluation.createdAt,
      updatedAt: evaluation.updatedAt,
      evaluator: evaluation.evaluator,
      bid: evaluation.bid,
      scores: evaluation.scores,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEvaluations: evaluations.length,
          draft: statusCounts.DRAFT,
          inProgress: statusCounts.IN_PROGRESS,
          completed: statusCounts.COMPLETED,
          approved: statusCounts.APPROVED,
          averageScore,
          highestScore,
          lowestScore,
        },
        byStatus,
        bySolicitation: Array.from(solicitationMap.values()).sort(
          (a, b) => b.evaluationCount - a.evaluationCount
        ),
        byEvaluator: Array.from(evaluatorMap.values()).sort(
          (a, b) => b.evaluationCount - a.evaluationCount
        ),
        evaluations: reportEvaluations,
      },
    });
  } catch (error) {
    console.error("Evaluation report error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate evaluation report",
      },
      { status: 500 }
    );
  }
}