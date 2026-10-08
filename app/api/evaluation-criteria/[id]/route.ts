import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isAdminOrOrganization(role: string | undefined) {
  return role === "ADMIN" || role === "ORGANIZATION";
}

async function canManageSolicitation(
  userId: string,
  role: string | undefined,
  solicitationId: string
) {
  if (role === "ADMIN") {
    return true;
  }

  if (role !== "ORGANIZATION") {
    return false;
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organization: {
        solicitations: {
          some: {
            id: solicitationId,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(membership);
}

function serializeCriterion(criterion: {
  id: string;
  solicitationId: string | null;
  lotId: string | null;
  name: string;
  description: string | null;
  weight: unknown;
  maxScore: unknown;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: criterion.id,
    solicitationId: criterion.solicitationId,
    lotId: criterion.lotId,
    name: criterion.name,
    description: criterion.description,
    weight: Number(criterion.weight),
    maxScore: Number(criterion.maxScore),
    sortOrder: criterion.sortOrder,
    createdAt: criterion.createdAt,
    updatedAt: criterion.updatedAt,
  };
}

async function getCriterionScope(criterionId: string) {
  return prisma.evaluationCriterion.findUnique({
    where: {
      id: criterionId,
    },
    include: {
      solicitation: {
        select: {
          id: true,
          status: true,
        },
      },
      lot: {
        select: {
          id: true,
          solicitationId: true,
          solicitation: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
      scores: {
        take: 1,
        select: {
          id: true,
        },
      },
    },
  });
}

function getParentSolicitation(
  criterion: Awaited<ReturnType<typeof getCriterionScope>>
) {
  if (!criterion) {
    return null;
  }

  if (criterion.solicitation) {
    return criterion.solicitation;
  }

  if (criterion.lot?.solicitation) {
    return criterion.lot.solicitation;
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const role = session.user.role;

    if (!isAdminOrOrganization(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const criterion = await prisma.evaluationCriterion.findUnique({
      where: {
        id,
      },
      include: {
        solicitation: {
          select: {
            id: true,
            status: true,
          },
        },
        lot: {
          select: {
            id: true,
            solicitationId: true,
            solicitation: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!criterion) {
      return NextResponse.json(
        {
          success: false,
          message: "Evaluation criterion not found.",
        },
        { status: 404 }
      );
    }

    const parentSolicitation =
      criterion.solicitation ?? criterion.lot?.solicitation ?? null;

    if (!parentSolicitation) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent solicitation could not be resolved.",
        },
        { status: 400 }
      );
    }

    const allowed = await canManageSolicitation(
      session.user.id,
      role,
      parentSolicitation.id
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to manage this criterion.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeCriterion(criterion),
    });
  } catch (error) {
    console.error("GET /api/evaluation-criteria/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load evaluation criterion.",
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
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const role = session.user.role;

    if (!isAdminOrOrganization(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const existing = await getCriterionScope(id);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Evaluation criterion not found.",
        },
        { status: 404 }
      );
    }

    const parentSolicitation = getParentSolicitation(existing);

    if (!parentSolicitation) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent solicitation could not be resolved.",
        },
        { status: 400 }
      );
    }

    const allowed = await canManageSolicitation(
      session.user.id,
      role,
      parentSolicitation.id
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to manage this criterion.",
        },
        { status: 403 }
      );
    }

    if (parentSolicitation.status !== "DRAFT") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Evaluation criteria can only be edited while the solicitation is in DRAFT status.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      name,
      description,
      weight,
      maxScore,
      sortOrder,
    } = body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Criterion name cannot be empty.",
        },
        { status: 400 }
      );
    }

    let numericWeight: number | undefined;

    if (weight !== undefined) {
      numericWeight = Number(weight);

      if (
        !Number.isFinite(numericWeight) ||
        numericWeight <= 0 ||
        numericWeight > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Weight must be greater than 0 and not more than 100.",
          },
          { status: 400 }
        );
      }
    }

    let numericMaxScore: number | undefined;

    if (maxScore !== undefined) {
      numericMaxScore = Number(maxScore);

      if (!Number.isFinite(numericMaxScore) || numericMaxScore <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Maximum score must be greater than 0.",
          },
          { status: 400 }
        );
      }
    }

    let numericSortOrder: number | undefined;

    if (sortOrder !== undefined) {
      numericSortOrder = Number(sortOrder);

      if (
        !Number.isInteger(numericSortOrder) ||
        numericSortOrder < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Sort order must be a non-negative integer.",
          },
          { status: 400 }
        );
      }
    }

    if (numericWeight !== undefined) {
      const otherCriteria = await prisma.evaluationCriterion.findMany({
        where: {
          id: {
            not: id,
          },
          ...(existing.lotId
            ? {
                lotId: existing.lotId,
                solicitationId: null,
              }
            : {
                solicitationId: existing.solicitationId!,
                lotId: null,
              }),
        },
        select: {
          weight: true,
        },
      });

      const otherTotal = otherCriteria.reduce(
        (sum, criterion) => sum + Number(criterion.weight),
        0
      );

      if (otherTotal + numericWeight > 100.0001) {
        return NextResponse.json(
          {
            success: false,
            message: `Total evaluation criteria weight cannot exceed 100%. Other criteria total ${otherTotal.toFixed(
              2
            )}%.`,
          },
          { status: 400 }
        );
      }
    }

    const criterion = await prisma.evaluationCriterion.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined
          ? {
              name: name.trim(),
            }
          : {}),
        ...(description !== undefined
          ? {
              description:
                typeof description === "string" &&
                description.trim()
                  ? description.trim()
                  : null,
            }
          : {}),
        ...(numericWeight !== undefined
          ? {
              weight: numericWeight,
            }
          : {}),
        ...(numericMaxScore !== undefined
          ? {
              maxScore: numericMaxScore,
            }
          : {}),
        ...(numericSortOrder !== undefined
          ? {
              sortOrder: numericSortOrder,
            }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: serializeCriterion(criterion),
    });
  } catch (error) {
    console.error("PATCH /api/evaluation-criteria/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update evaluation criterion.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const role = session.user.role;

    if (!isAdminOrOrganization(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const existing = await getCriterionScope(id);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Evaluation criterion not found.",
        },
        { status: 404 }
      );
    }

    const parentSolicitation = getParentSolicitation(existing);

    if (!parentSolicitation) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent solicitation could not be resolved.",
        },
        { status: 400 }
      );
    }

    const allowed = await canManageSolicitation(
      session.user.id,
      role,
      parentSolicitation.id
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to manage this criterion.",
        },
        { status: 403 }
      );
    }

    if (parentSolicitation.status !== "DRAFT") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Evaluation criteria can only be deleted while the solicitation is in DRAFT status.",
        },
        { status: 400 }
      );
    }

    if (existing.scores.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This evaluation criterion cannot be deleted because evaluation scores already exist.",
        },
        { status: 400 }
      );
    }

    await prisma.evaluationCriterion.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Evaluation criterion deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/evaluation-criteria/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete evaluation criterion.",
      },
      { status: 500 }
    );
  }
}