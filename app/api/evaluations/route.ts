import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { EvaluationStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const bidId = searchParams.get("bidId");
    const evaluatorId = searchParams.get("evaluatorId");
    const status = searchParams.get("status");
    const solicitationId = searchParams.get("solicitationId");

    const where: Record<string, unknown> = {};

    if (bidId) {
      where.bidId = bidId;
    }

    if (evaluatorId) {
      where.evaluatorId = evaluatorId;
    }

    if (status) {
      if (
        !Object.values(EvaluationStatus).includes(
          status as EvaluationStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid evaluation status",
          },
          { status: 400 }
        );
      }

      where.status = status;
    }

    if (solicitationId) {
      where.bid = {
        solicitationId,
      };
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (session.user.role === "VENDOR") {
      where.bid = {
        ...(typeof where.bid === "object" &&
        where.bid !== null
          ? where.bid
          : {}),
        vendor: {
          userId: session.user.id,
        },
      };
    }

    if (session.user.role === "ORGANIZATION") {
      const memberships =
        await prisma.organizationMember.findMany({
          where: {
            userId: session.user.id,
          },
          select: {
            organizationId: true,
          },
        });

      const organizationIds =
        memberships.map(
          (membership) =>
            membership.organizationId
        );

      if (organizationIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      where.bid = {
        ...(typeof where.bid === "object" &&
        where.bid !== null
          ? where.bid
          : {}),
        solicitation: {
          organizationId: {
            in: organizationIds,
          },
        },
      };
    }

    const evaluations =
      await prisma.evaluation.findMany({
        where,
        include: {
          bid: {
            include: {
              solicitation: {
                select: {
                  id: true,
                  solicitationNumber: true,
                  title: true,
                  status: true,
                  organizationId: true,
                },
              },
              lot: {
                select: {
                  id: true,
                  number: true,
                  title: true,
                  status: true,
                },
              },
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  legalName: true,
                },
              },
              currency: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  symbol: true,
                  decimals: true,
                },
              },
            },
          },
          evaluator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          scores: {
            include: {
              criterion: true,
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

    return NextResponse.json({
      success: true,
      data: evaluations,
    });
  } catch (error) {
    console.error(
      "GET /api/evaluations error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch evaluations",
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
          error:
            "Only administrators and organization users can create evaluations",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      bidId,
      evaluatorId,
      status,
      totalScore,
      comments,
      startedAt,
      completedAt,
    } = body;

    if (
      !bidId ||
      typeof bidId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "bidId is required",
        },
        { status: 400 }
      );
    }

    const bid = await prisma.bid.findUnique({
      where: {
        id: bidId,
      },
      include: {
        solicitation: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            status: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!bid) {
      return NextResponse.json(
        {
          success: false,
          error: "Bid not found",
        },
        { status: 404 }
      );
    }

    if (
      session.user.role === "ORGANIZATION"
    ) {
      const membership =
        await prisma.organizationMember.findFirst({
          where: {
            organizationId:
              bid.solicitation.organizationId,
            userId: session.user.id,
          },
          select: {
            id: true,
            role: true,
          },
        });

      if (!membership) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You do not have access to this organization's bid",
          },
          { status: 403 }
        );
      }
    }

    if (
      bid.status !== "SUBMITTED" &&
      bid.status !== "UNDER_REVIEW" &&
      bid.status !== "COMPLIANT" &&
      bid.status !== "SHORTLISTED" &&
      bid.status !== "EVALUATED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This bid is not currently available for evaluation",
        },
        { status: 409 }
      );
    }

    const selectedEvaluatorId =
      evaluatorId || session.user.id;

    const evaluator =
      await prisma.user.findUnique({
        where: {
          id: selectedEvaluatorId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

    if (!evaluator) {
      return NextResponse.json(
        {
          success: false,
          error: "Evaluator not found",
        },
        { status: 404 }
      );
    }

    if (evaluator.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected evaluator is not active",
        },
        { status: 400 }
      );
    }

    if (
      evaluator.role !== "ADMIN" &&
      evaluator.role !== "ORGANIZATION"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected user cannot evaluate bids",
        },
        { status: 400 }
      );
    }

    if (
      evaluator.role === "ORGANIZATION"
    ) {
      const evaluatorMembership =
        await prisma.organizationMember.findFirst({
          where: {
            organizationId:
              bid.solicitation.organizationId,
            userId: evaluator.id,
          },
          select: {
            id: true,
          },
        });

      if (!evaluatorMembership) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The evaluator must belong to the solicitation organization",
          },
          { status: 400 }
        );
      }
    }

    if (
      status !== undefined &&
      !Object.values(EvaluationStatus).includes(
        status as EvaluationStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid evaluation status",
        },
        { status: 400 }
      );
    }

    let numericTotalScore:
      | number
      | undefined;

    if (totalScore !== undefined) {
      numericTotalScore = Number(totalScore);

      if (
        !Number.isFinite(numericTotalScore) ||
        numericTotalScore < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "totalScore must be a valid non-negative number",
          },
          { status: 400 }
        );
      }
    }

    let parsedStartedAt:
      | Date
      | null
      | undefined;

    if (startedAt !== undefined) {
      if (
        startedAt === null ||
        startedAt === ""
      ) {
        parsedStartedAt = null;
      } else {
        parsedStartedAt = new Date(startedAt);

        if (
          Number.isNaN(
            parsedStartedAt.getTime()
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid startedAt",
            },
            { status: 400 }
          );
        }
      }
    }

    let parsedCompletedAt:
      | Date
      | null
      | undefined;

    if (completedAt !== undefined) {
      if (
        completedAt === null ||
        completedAt === ""
      ) {
        parsedCompletedAt = null;
      } else {
        parsedCompletedAt =
          new Date(completedAt);

        if (
          Number.isNaN(
            parsedCompletedAt.getTime()
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid completedAt",
            },
            { status: 400 }
          );
        }
      }
    }

    const existingEvaluation =
      await prisma.evaluation.findUnique({
        where: {
          bidId_evaluatorId: {
            bidId,
            evaluatorId: selectedEvaluatorId,
          },
        },
        select: {
          id: true,
        },
      });

    if (existingEvaluation) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This evaluator has already been assigned to this bid",
        },
        { status: 409 }
      );
    }

    const evaluation =
      await prisma.evaluation.create({
        data: {
          bidId,
          evaluatorId: selectedEvaluatorId,
          status:
            status !== undefined
              ? (status as EvaluationStatus)
              : EvaluationStatus.DRAFT,
          totalScore:
            numericTotalScore !== undefined
              ? numericTotalScore
              : 0,
          comments:
            comments !== undefined
              ? comments
              : null,
          startedAt:
            parsedStartedAt !== undefined
              ? parsedStartedAt
              : null,
          completedAt:
            parsedCompletedAt !== undefined
              ? parsedCompletedAt
              : null,
        },
        include: {
          bid: {
            select: {
              id: true,
              bidNumber: true,
              title: true,
              totalAmount: true,
              status: true,
              solicitation: {
                select: {
                  id: true,
                  solicitationNumber: true,
                  title: true,
                  organizationId: true,
                },
              },
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  legalName: true,
                },
              },
            },
          },
          evaluator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          scores: {
            include: {
              criterion: true,
            },
          },
        },
      });

    await prisma.applicationActivity.create({
      data: {
        bidId,
        performedById: session.user.id,
        action: "EVALUATION_CREATED",
        description: `Evaluation was assigned to ${evaluator.name}.`,
      },
    });

    if (bid.status === "SUBMITTED") {
      await prisma.bid.update({
        where: {
          id: bid.id,
        },
        data: {
          status: "UNDER_REVIEW",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: evaluation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/evaluations error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create evaluation",
      },
      { status: 500 }
    );
  }
}