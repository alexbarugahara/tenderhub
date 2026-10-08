import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must be signed in to publish a solicitation.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const solicitation =
      await prisma.solicitation.findUnique({
        where: {
          id,
        },
        include: {
          lots: {
            include: {
              requirements: true,
              evaluationCriteria: true,
            },
            orderBy: {
              number: "asc",
            },
          },
          requirements: {
            where: {
              lotId: null,
            },
          },
          documents: true,
          evaluationCriteria: true,
        },
      });

    if (!solicitation) {
      return NextResponse.json(
        {
          success: false,
          error: "Solicitation not found.",
        },
        { status: 404 }
      );
    }

    const membership =
      await prisma.organizationMember.findFirst({
        where: {
          userId: session.user.id,
          organizationId: solicitation.organizationId,
        },
      });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not authorized to publish this solicitation.",
        },
        { status: 403 }
      );
    }

    if (solicitation.status !== "DRAFT") {
      return NextResponse.json(
        {
          success: false,
          error:
            `This solicitation cannot be published because its current status is ${solicitation.status}.`,
        },
        { status: 400 }
      );
    }

    const errors: string[] = [];

    /*
     * ---------------------------------------------------------
     * DATE VALIDATION
     * ---------------------------------------------------------
     */

    if (!solicitation.openingDate) {
      errors.push("An opening date is required.");
    }

    if (!solicitation.closingDate) {
      errors.push("A closing date is required.");
    }

    if (
      solicitation.openingDate &&
      solicitation.closingDate &&
      solicitation.closingDate <= solicitation.openingDate
    ) {
      errors.push(
        "The closing date must be later than the opening date."
      );
    }

    /*
     * ---------------------------------------------------------
     * SOLICITATION-WIDE REQUIREMENTS
     * ---------------------------------------------------------
     */

    if (solicitation.requirements.length === 0) {
      errors.push(
        "At least one solicitation-wide requirement must be configured."
      );
    }

    /*
     * ---------------------------------------------------------
     * DOCUMENTS
     * ---------------------------------------------------------
     */

    if (solicitation.documents.length === 0) {
      errors.push(
        "At least one solicitation document must be uploaded."
      );
    }

    /*
     * ---------------------------------------------------------
     * SOLICITATION-WIDE EVALUATION CRITERIA
     * ---------------------------------------------------------
     */

    if (solicitation.evaluationCriteria.length === 0) {
      errors.push(
        "Solicitation-wide evaluation criteria must be configured."
      );
    } else {
      const total =
        solicitation.evaluationCriteria.reduce(
          (sum, criterion) =>
            sum + decimalToNumber(criterion.weight),
          0
        );

      if (Math.abs(total - 100) > 0.0001) {
        errors.push(
          `Solicitation-wide evaluation criteria must total 100%. Current total: ${total}%.`
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * LOTS
     * ---------------------------------------------------------
     */

    if (solicitation.lots.length === 0) {
      errors.push(
        "At least one lot must be configured before publication."
      );
    }

    /*
     * ---------------------------------------------------------
     * VALIDATE EVERY LOT
     * ---------------------------------------------------------
     */

    for (const lot of solicitation.lots) {
      /*
       * Lot requirements
       */
      if (lot.requirements.length === 0) {
        errors.push(
          `Lot ${lot.number} (${lot.title}) must have at least one requirement.`
        );
      }

      /*
       * Lot evaluation criteria
       */
      if (lot.evaluationCriteria.length === 0) {
        errors.push(
          `Lot ${lot.number} (${lot.title}) must have evaluation criteria configured.`
        );

        continue;
      }

      const lotTotal =
        lot.evaluationCriteria.reduce(
          (sum, criterion) =>
            sum + decimalToNumber(criterion.weight),
          0
        );

      if (Math.abs(lotTotal - 100) > 0.0001) {
        errors.push(
          `Lot ${lot.number} (${lot.title}) evaluation criteria must total 100%. Current total: ${lotTotal}%.`
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * STOP IF VALIDATION FAILED
     * ---------------------------------------------------------
     */

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The solicitation is not ready for publication.",
          errors,
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * PUBLISH
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * PUBLISHED is intentionally different from OPEN.
     * We only change DRAFT -> PUBLISHED here.
     */

    const publishedSolicitation =
      await prisma.solicitation.update({
        where: {
          id: solicitation.id,
        },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          publishedAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Solicitation published successfully.",
        data: publishedSolicitation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Publish solicitation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected error occurred while publishing the solicitation.",
      },
      { status: 500 }
    );
  }
}