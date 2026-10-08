import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { EvaluationStatus } from "@prisma/client";

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
                include: {
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      legalName: true,
                      email: true,
                    },
                  },
                  procurement: {
                    select: {
                      id: true,
                      title: true,
                      referenceNumber: true,
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
              lot: {
                select: {
                  id: true,
                  number: true,
                  title: true,
                  description: true,
                  estimatedValue: true,
                  status: true,
                },
              },
              vendor: {
                include: {
                  country: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },
                },
              },
              submittedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
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
              status: true,
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
          },
        });

      isOrganizationUser = Boolean(membership);
    }

    if (
      session.user.role === "VENDOR"
    ) {
      if (
        evaluation.bid.vendor.userId !==
        session.user.id
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You do not have access to this evaluation",
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: evaluation.id,
          bidId: evaluation.bidId,
          status: evaluation.status,
          totalScore: evaluation.totalScore,
          completedAt: evaluation.completedAt,
          bid: {
            id: evaluation.bid.id,
            bidNumber: evaluation.bid.bidNumber,
            title: evaluation.bid.title,
            totalAmount: evaluation.bid.totalAmount,
            status: evaluation.bid.status,
            solicitation:
              evaluation.bid.solicitation,
            lot: evaluation.bid.lot,
            vendor: evaluation.bid.vendor,
          },
        },
      });
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
            "You do not have access to this evaluation",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error(
      "GET /api/evaluations/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch evaluation",
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

    const existingEvaluation =
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
            },
          },
        },
      });

    if (!existingEvaluation) {
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
      existingEvaluation.evaluatorId ===
      session.user.id;

    let isOrganizationUser = false;

    if (
      session.user.role === "ORGANIZATION"
    ) {
      const membership =
        await prisma.organizationMember.findFirst({
          where: {
            organizationId:
              existingEvaluation.bid
                .solicitation.organizationId,
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
            "You do not have permission to update this evaluation",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      evaluatorId,
      status,
      totalScore,
      comments,
      startedAt,
      completedAt,
    } = body;

    if (
      evaluatorId !== undefined &&
      evaluatorId !== existingEvaluation.evaluatorId
    ) {
      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only administrators can reassign an evaluation",
          },
          { status: 403 }
        );
      }

      const newEvaluator =
        await prisma.user.findUnique({
          where: {
            id: evaluatorId,
          },
          select: {
            id: true,
            name: true,
            role: true,
            status: true,
          },
        });

      if (!newEvaluator) {
        return NextResponse.json(
          {
            success: false,
            error: "Evaluator not found",
          },
          { status: 404 }
        );
      }

      if (
        newEvaluator.status !== "ACTIVE" ||
        (
          newEvaluator.role !== "ADMIN" &&
          newEvaluator.role !== "ORGANIZATION"
        )
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
        newEvaluator.role === "ORGANIZATION"
      ) {
        const membership =
          await prisma.organizationMember.findFirst({
            where: {
              organizationId:
                existingEvaluation.bid
                  .solicitation.organizationId,
              userId: evaluatorId,
            },
            select: {
              id: true,
            },
          });

        if (!membership) {
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

      const duplicate =
        await prisma.evaluation.findUnique({
          where: {
            bidId_evaluatorId: {
              bidId:
                existingEvaluation.bidId,
              evaluatorId,
            },
          },
          select: {
            id: true,
          },
        });

      if (
        duplicate &&
        duplicate.id !== id
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This evaluator is already assigned to this bid",
          },
          { status: 409 }
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

    if (
      comments !== undefined &&
      comments !== null &&
      typeof comments !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "comments must be a string",
        },
        { status: 400 }
      );
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

    if (
      status === EvaluationStatus.IN_PROGRESS &&
      !existingEvaluation.startedAt &&
      parsedStartedAt === undefined
    ) {
      parsedStartedAt = new Date();
    }

    if (
      status === EvaluationStatus.COMPLETED &&
      !existingEvaluation.completedAt &&
      parsedCompletedAt === undefined
    ) {
      parsedCompletedAt = new Date();
    }

    if (
      status === EvaluationStatus.APPROVED &&
      !isAdmin &&
      !isOrganizationUser
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators or organization users can approve an evaluation",
        },
        { status: 403 }
      );
    }

    const updatedEvaluation =
      await prisma.evaluation.update({
        where: {
          id,
        },
        data: {
          ...(evaluatorId !== undefined &&
            isAdmin && {
              evaluatorId,
            }),
          ...(status !== undefined && {
            status:
              status as EvaluationStatus,
          }),
          ...(numericTotalScore !== undefined && {
            totalScore: numericTotalScore,
          }),
          ...(comments !== undefined && {
            comments:
              comments === null
                ? null
                : comments.trim(),
          }),
          ...(parsedStartedAt !== undefined && {
            startedAt: parsedStartedAt,
          }),
          ...(parsedCompletedAt !== undefined && {
            completedAt: parsedCompletedAt,
          }),
        },
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
        bidId: existingEvaluation.bidId,
        performedById: session.user.id,
        action: "EVALUATION_UPDATED",
        description: `Evaluation ${existingEvaluation.id} was updated.`,
      },
    });

    if (
      status === EvaluationStatus.COMPLETED ||
      status === EvaluationStatus.APPROVED
    ) {
      await prisma.notification.create({
        data: {
          userId:
            existingEvaluation.evaluatorId,
          title: "Evaluation updated",
          message: `The evaluation for bid "${existingEvaluation.bid.bidNumber}" has been updated.`,
          type: "EVALUATION_COMPLETED",
          link: `/dashboard/organization/evaluations/${existingEvaluation.id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedEvaluation,
    });
  } catch (error) {
    console.error(
      "PATCH /api/evaluations/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update evaluation",
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
                  organizationId: true,
                  title: true,
                },
              },
            },
          },
          scores: {
            select: {
              id: true,
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
            "You do not have permission to delete this evaluation",
        },
        { status: 403 }
      );
    }

    if (
      evaluation.status ===
        EvaluationStatus.COMPLETED ||
      evaluation.status ===
        EvaluationStatus.APPROVED
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Completed or approved evaluations cannot be deleted",
        },
        { status: 409 }
      );
    }

    await prisma.evaluation.delete({
      where: {
        id,
      },
    });

    await prisma.applicationActivity.create({
      data: {
        bidId: evaluation.bidId,
        performedById: session.user.id,
        action: "EVALUATION_DELETED",
        description: `Evaluation ${id} was deleted.`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: "Evaluation deleted successfully",
      },
    });
  } catch (error) {
    console.error(
      "DELETE /api/evaluations/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete evaluation",
      },
      { status: 500 }
    );
  }
}