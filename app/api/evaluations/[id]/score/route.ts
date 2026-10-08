import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const evaluation =
      await prisma.evaluation.findUnique({
        where: {
          id,
        },
        include: {
          bid: {
            include: {
              solicitation: {
                select: {
                  id: true,
                  title: true,
                  organizationId: true,
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
        },
      });

    if (!evaluation) {
      return NextResponse.json(
        {
          success: false,
          error: "Evaluation not found",
        },
        { status: 404 }
      );
    }

    const isAdmin =
      session.user.role === "ADMIN";

    const isEvaluator =
      evaluation.evaluatorId === session.user.id;

    let isOrganizationUser = false;

    if (
      session.user.role === "ORGANIZATION"
    ) {
      const membership =
        await prisma.organizationMember.findFirst({
          where: {
            organizationId:
              evaluation.bid.solicitation.organizationId,
            userId: session.user.id,
          },
          select: {
            id: true,
            role: true,
          },
        });

      isOrganizationUser = Boolean(membership);
    }

    if (
      !isAdmin &&
      !isEvaluator &&
      !isOrganizationUser
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to score this evaluation",
        },
        { status: 403 }
      );
    }

    if (
      evaluation.status === "COMPLETED" ||
      evaluation.status === "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Scores cannot be changed after the evaluation is completed or approved",
        },
        { status: 409 }
      );
    }

    const body = await request.json();

    const {
      criterionId,
      score,
      weightedScore,
      comment,
    } = body;

    if (
      !criterionId ||
      typeof criterionId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "criterionId is required",
        },
        { status: 400 }
      );
    }

    if (score === undefined || score === null) {
      return NextResponse.json(
        {
          success: false,
          error: "score is required",
        },
        { status: 400 }
      );
    }

    const numericScore = Number(score);

    if (
      !Number.isFinite(numericScore) ||
      numericScore < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "score must be a valid non-negative number",
        },
        { status: 400 }
      );
    }

    const criterion =
      await prisma.evaluationCriterion.findUnique({
        where: {
          id: criterionId,
        },
        select: {
          id: true,
          solicitationId: true,
          name: true,
          description: true,
          weight: true,
          maxScore: true,
          sortOrder: true,
        },
      });

    if (!criterion) {
      return NextResponse.json(
        {
          success: false,
          error: "Evaluation criterion not found",
        },
        { status: 404 }
      );
    }

    if (
      criterion.solicitationId !==
      evaluation.bid.solicitation.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The evaluation criterion does not belong to this solicitation",
        },
        { status: 400 }
      );
    }

    if (
      numericScore >
      Number(criterion.maxScore)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `score cannot exceed the criterion maximum score of ${criterion.maxScore}`,
        },
        { status: 400 }
      );
    }

    let numericWeightedScore:
      | number
      | undefined;

    if (
      weightedScore !== undefined &&
      weightedScore !== null
    ) {
      numericWeightedScore =
        Number(weightedScore);

      if (
        !Number.isFinite(
          numericWeightedScore
        ) ||
        numericWeightedScore < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "weightedScore must be a valid non-negative number",
          },
          { status: 400 }
        );
      }
    } else {
      numericWeightedScore =
        (numericScore /
          Number(criterion.maxScore)) *
        Number(criterion.weight);
    }

    if (
      comment !== undefined &&
      comment !== null &&
      typeof comment !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "comment must be a string",
        },
        { status: 400 }
      );
    }

    const existingScore =
      await prisma.evaluationScore.findUnique({
        where: {
          evaluationId_criterionId: {
            evaluationId: evaluation.id,
            criterionId,
          },
        },
        select: {
          id: true,
        },
      });

    const scoreRecord =
      existingScore
        ? await prisma.evaluationScore.update({
            where: {
              id: existingScore.id,
            },
            data: {
              score: numericScore,
              weightedScore:
                numericWeightedScore,
              comment:
                comment === undefined
                  ? undefined
                  : comment === null
                    ? null
                    : comment.trim(),
            },
            include: {
              criterion: true,
            },
          })
        : await prisma.evaluationScore.create({
            data: {
              evaluationId: evaluation.id,
              criterionId,
              score: numericScore,
              weightedScore:
                numericWeightedScore,
              comment:
                comment === undefined
                  ? null
                  : comment === null
                    ? null
                    : comment.trim(),
            },
            include: {
              criterion: true,
            },
          });

    const allScores =
      await prisma.evaluationScore.findMany({
        where: {
          evaluationId: evaluation.id,
        },
        select: {
          weightedScore: true,
        },
      });

    const calculatedTotalScore =
      allScores.reduce(
        (total, item) =>
          total + Number(item.weightedScore),
        0
      );

    const updatedEvaluation =
      await prisma.evaluation.update({
        where: {
          id: evaluation.id,
        },
        data: {
          totalScore:
            calculatedTotalScore,
          status:
            evaluation.status === "DRAFT"
              ? "IN_PROGRESS"
              : evaluation.status,
          startedAt:
            evaluation.startedAt ??
            new Date(),
        },
        include: {
          bid: {
            select: {
              id: true,
              bidNumber: true,
              title: true,
              totalAmount: true,
              status: true,
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  legalName: true,
                },
              },
              solicitation: {
                select: {
                  id: true,
                  solicitationNumber: true,
                  title: true,
                  status: true,
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
      });

    await prisma.applicationActivity.create({
      data: {
        bidId: evaluation.bidId,
        performedById: session.user.id,
        action: "EVALUATION_SCORE_UPDATED",
        description: `Evaluation score for criterion "${criterion.name}" was ${existingScore ? "updated" : "added"}.`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        score: scoreRecord,
        evaluation: updatedEvaluation,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/evaluations/[id]/score error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save evaluation score",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  return POST(request, context);
}