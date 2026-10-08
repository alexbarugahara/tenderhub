import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

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

type ScopeResult =
  | {
      solicitationId: string;
      lotId: string | null;
      status: string;
    }
  | {
      error: string;
      statusCode: number;
    };

async function getScope(
  solicitationId?: string | null,
  lotId?: string | null
): Promise<ScopeResult> {
  const hasSolicitation = Boolean(solicitationId);
  const hasLot = Boolean(lotId);

  if (hasSolicitation && hasLot) {
    return {
      error: "Provide either solicitationId or lotId, not both.",
      statusCode: 400,
    };
  }

  if (!hasSolicitation && !hasLot) {
    return {
      error: "Either solicitationId or lotId is required.",
      statusCode: 400,
    };
  }

  if (solicitationId) {
    const solicitation = await prisma.solicitation.findUnique({
      where: {
        id: solicitationId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!solicitation) {
      return {
        error: "Solicitation not found.",
        statusCode: 404,
      };
    }

    return {
      solicitationId: solicitation.id,
      lotId: null,
      status: solicitation.status,
    };
  }

  const lot = await prisma.lot.findUnique({
    where: {
      id: lotId!,
    },
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
  });

  if (!lot) {
    return {
      error: "Lot not found.",
      statusCode: 404,
    };
  }

  return {
    solicitationId: lot.solicitation.id,
    lotId: lot.id,
    status: lot.solicitation.status,
  };
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

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const solicitationId = searchParams.get("solicitationId");
    const lotId = searchParams.get("lotId");

    const scope = await getScope(solicitationId, lotId);

    if ("error" in scope) {
      return NextResponse.json(
        {
          success: false,
          message: scope.error,
        },
        { status: scope.statusCode }
      );
    }

    const allowed = await canManageSolicitation(
      session.user.id,
      role,
      scope.solicitationId
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to manage this solicitation.",
        },
        { status: 403 }
      );
    }

    const criteria = await prisma.evaluationCriterion.findMany({
      where: scope.lotId
        ? {
            lotId: scope.lotId,
            solicitationId: null,
          }
        : {
            solicitationId: scope.solicitationId,
            lotId: null,
          },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: criteria.map(serializeCriterion),
    });
  } catch (error) {
    console.error("GET /api/evaluation-criteria error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load evaluation criteria.",
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

    const body = await request.json();

    const {
      solicitationId,
      lotId,
      name,
      description,
      weight,
      maxScore,
      sortOrder,
    } = body;

    const scope = await getScope(
      typeof solicitationId === "string" ? solicitationId : null,
      typeof lotId === "string" ? lotId : null
    );

    if ("error" in scope) {
      return NextResponse.json(
        {
          success: false,
          message: scope.error,
        },
        { status: scope.statusCode }
      );
    }

    const allowed = await canManageSolicitation(
      session.user.id,
      role,
      scope.solicitationId
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to manage this solicitation.",
        },
        { status: 403 }
      );
    }

    if (scope.status !== "DRAFT") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Evaluation criteria can only be configured while the solicitation is in DRAFT status.",
        },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Criterion name is required.",
        },
        { status: 400 }
      );
    }

    const numericWeight = Number(weight);
    const numericMaxScore = Number(maxScore ?? 100);
    const numericSortOrder = Number(sortOrder ?? 0);

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

    if (!Number.isFinite(numericMaxScore) || numericMaxScore <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum score must be greater than 0.",
        },
        { status: 400 }
      );
    }

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

    const existingCriteria = await prisma.evaluationCriterion.findMany({
      where: scope.lotId
        ? {
            lotId: scope.lotId,
            solicitationId: null,
          }
        : {
            solicitationId: scope.solicitationId,
            lotId: null,
          },
      select: {
        weight: true,
      },
    });

    const currentTotal = existingCriteria.reduce(
      (sum, criterion) => sum + Number(criterion.weight),
      0
    );

    if (currentTotal + numericWeight > 100.0001) {
      return NextResponse.json(
        {
          success: false,
          message: `Total evaluation criteria weight cannot exceed 100%. Current total is ${currentTotal.toFixed(
            2
          )}%.`,
        },
        { status: 400 }
      );
    }

    const criterion = await prisma.evaluationCriterion.create({
      data: {
        solicitationId: scope.lotId ? null : scope.solicitationId,
        lotId: scope.lotId,
        name: name.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        weight: numericWeight,
        maxScore: numericMaxScore,
        sortOrder: numericSortOrder,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: serializeCriterion(criterion),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/evaluation-criteria error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create evaluation criterion.",
      },
      { status: 500 }
    );
  }
}