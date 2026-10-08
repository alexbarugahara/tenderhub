import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  SolicitationStatus,
  SolicitationType,
  UserRole,
} from "@prisma/client";

function isValidEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
): value is T[keyof T] {
  return (
    typeof value === "string" &&
    Object.values(enumObject).includes(value as T[keyof T])
  );
}

function parseOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const procurementId = searchParams.get("procurementId");
    const organizationId = searchParams.get("organizationId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status && isValidEnumValue(SolicitationStatus, status)) {
      where.status = status;
    }

    if (type && isValidEnumValue(SolicitationType, type)) {
      where.type = type;
    }

    if (procurementId) {
      where.procurementId = procurementId;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (search) {
      where.OR = [
        {
          solicitationNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    /*
     * Public users may only see open solicitations.
     */
    if (!session?.user) {
      where.status = SolicitationStatus.OPEN;
    }

    const solicitations = await prisma.solicitation.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            organizationType: true,
          },
        },

        procurement: {
          select: {
            id: true,
            referenceNumber: true,
            title: true,
            status: true,
            procurementMethod: true,
            estimatedValue: true,

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

        currency: {
          select: {
            id: true,
            code: true,
            name: true,
            symbol: true,
          },
        },

        lots: {
          orderBy: {
            number: "asc",
          },
        },

        requirements: {
          orderBy: {
            createdAt: "asc",
          },
        },

        documents: {
          orderBy: {
            createdAt: "desc",
          },
        },

        classifications: {
          include: {
            classification: true,
          },
        },

        evaluationCriteria: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        notices: {
          orderBy: {
            publishedAt: "desc",
          },
        },

        _count: {
          select: {
            bids: true,
            lots: true,
            requirements: true,
            documents: true,
            evaluationCriteria: true,
          },
        },
      },
    });

    return NextResponse.json(solicitations);
  } catch (error) {
    console.error(
      "GET /api/solicitations error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load solicitations.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/solicitations reached");

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.ORGANIZATION
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to create a solicitation.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    /*
     * IMPORTANT:
     *
     * These values are NOT accepted from the client:
     *
     * - organizationId
     * - currencyId
     * - procurementMethod
     *
     * They are inherited from the parent Procurement.
     *
     * estimatedValue IS accepted from the client because it
     * represents the allocation assigned to this Solicitation
     * from the Procurement budget.
     */
    const {
      procurementId,
      solicitationNumber,
      title,
      description,
      status,
      type,
      openingDate,
      closingDate,
      estimatedValue,
      bidSecurityRequired,
      bidSecurityAmount,
      applicationFeeRequired,
      applicationFeeAmount,
    } = body;

    if (!procurementId) {
      return NextResponse.json(
        {
          error: "Procurement is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof solicitationNumber !== "string" ||
      !solicitationNumber.trim()
    ) {
      return NextResponse.json(
        {
          error: "Solicitation number is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          error: "Solicitation title is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      status !== undefined &&
      status !== null &&
      status !== "" &&
      !isValidEnumValue(SolicitationStatus, status)
    ) {
      return NextResponse.json(
        {
          error: "Invalid solicitation status.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      type !== undefined &&
      type !== null &&
      type !== "" &&
      !isValidEnumValue(SolicitationType, type)
    ) {
      return NextResponse.json(
        {
          error: "Invalid solicitation type.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Load the parent Procurement.
     *
     * Procurement is the source of truth for:
     *
     * - organization
     * - currency
     * - procurement method
     * - total financial ceiling
     */
    const procurement = await prisma.procurement.findUnique({
      where: {
        id: procurementId,
      },
      select: {
        id: true,
        organizationId: true,
        currencyId: true,
        procurementMethod: true,
        estimatedValue: true,
      },
    });

    if (!procurement) {
      return NextResponse.json(
        {
          error:
            "The selected procurement could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Organization users must belong to the organization
     * that owns the selected Procurement.
     */
    if (userRole === UserRole.ORGANIZATION) {
      const membership =
        await prisma.organizationMember.findFirst({
          where: {
            userId,
            organizationId: procurement.organizationId,
          },
          select: {
            id: true,
          },
        });

      if (!membership) {
        return NextResponse.json(
          {
            error:
              "You are not authorized to create a solicitation for this procurement.",
          },
          {
            status: 403,
          },
        );
      }
    }

    /*
     * Currency is inherited from Procurement.
     */
    if (!procurement.currencyId) {
      return NextResponse.json(
        {
          error:
            "The selected procurement does not have a currency configured.",
        },
        {
          status: 400,
        },
      );
    }

    const currency = await prisma.currency.findUnique({
      where: {
        id: procurement.currencyId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        active: true,
      },
    });

    if (!currency) {
      return NextResponse.json(
        {
          error:
            "The currency configured on the selected procurement could not be found.",
        },
        {
          status: 400,
        },
      );
    }

    if (!currency.active) {
      return NextResponse.json(
        {
          error:
            "The currency configured on the selected procurement is inactive.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Solicitation number must be unique.
     */
    const normalizedSolicitationNumber =
      solicitationNumber.trim();

    const existingSolicitation =
      await prisma.solicitation.findUnique({
        where: {
          solicitationNumber:
            normalizedSolicitationNumber,
        },
        select: {
          id: true,
        },
      });

    if (existingSolicitation) {
      return NextResponse.json(
        {
          error:
            "A solicitation with this number already exists.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Parse solicitation-specific dates.
     */
    const parsedOpeningDate =
      parseOptionalDate(openingDate);

    const parsedClosingDate =
      parseOptionalDate(closingDate);

    if (
      openingDate !== undefined &&
      openingDate !== null &&
      openingDate !== "" &&
      !parsedOpeningDate
    ) {
      return NextResponse.json(
        {
          error: "Invalid opening date.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      closingDate !== undefined &&
      closingDate !== null &&
      closingDate !== "" &&
      !parsedClosingDate
    ) {
      return NextResponse.json(
        {
          error: "Invalid closing date.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      parsedOpeningDate &&
      parsedClosingDate &&
      parsedClosingDate <= parsedOpeningDate
    ) {
      return NextResponse.json(
        {
          error:
            "Closing date must be after the opening date.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ============================================================
     * SOLICITATION ALLOCATION VALIDATION
     * ============================================================
     *
     * Procurement.estimatedValue is the total Procurement budget.
     *
     * Solicitation.estimatedValue is the amount allocated to this
     * particular Solicitation.
     *
     * Therefore:
     *
     * requested allocation
     * <=
     * procurement budget - existing solicitation allocations
     */

    const parsedEstimatedValue =
      parseOptionalNumber(estimatedValue);

    if (
      estimatedValue === undefined ||
      estimatedValue === null ||
      estimatedValue === ""
    ) {
      return NextResponse.json(
        {
          error:
            "Solicitation allocation amount is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      parsedEstimatedValue === null ||
      parsedEstimatedValue < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Solicitation allocation amount must be a valid non-negative number.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Sum all existing Solicitation allocations belonging
     * to this Procurement.
     *
     * Null estimatedValue is treated as zero.
     */
    const existingAllocation =
      await prisma.solicitation.aggregate({
        where: {
          procurementId: procurement.id,
        },
        _sum: {
          estimatedValue: true,
        },
      });

    const alreadyAllocated =
      Number(
        existingAllocation._sum.estimatedValue ?? 0,
      );

    const procurementBudget =
      Number(
        procurement.estimatedValue ?? 0,
      );

    const availableAllocation =
      procurementBudget - alreadyAllocated;

    /*
     * Do not allow a new Solicitation to exceed the
     * remaining Procurement budget.
     */
    if (
      parsedEstimatedValue >
      availableAllocation
    ) {
      return NextResponse.json(
        {
          error:
            "Solicitation allocation exceeds the remaining Procurement budget.",
          procurementBudget,
          alreadyAllocated,
          availableAllocation,
          requestedAllocation:
            parsedEstimatedValue,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Parse solicitation-specific financial settings.
     *
     * These remain independent of Procurement:
     *
     * - bid security
     * - application fee
     */
    const parsedBidSecurityAmount =
      parseOptionalNumber(bidSecurityAmount);

    const parsedApplicationFeeAmount =
      parseOptionalNumber(
        applicationFeeAmount,
      );

    if (
      bidSecurityRequired === true &&
      parsedBidSecurityAmount === null
    ) {
      return NextResponse.json(
        {
          error:
            "Bid security amount is required when bid security is enabled.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      parsedBidSecurityAmount !== null &&
      parsedBidSecurityAmount < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Bid security amount cannot be negative.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      applicationFeeRequired === true &&
      parsedApplicationFeeAmount === null
    ) {
      return NextResponse.json(
        {
          error:
            "Application fee amount is required when application fee is enabled.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      parsedApplicationFeeAmount !== null &&
      parsedApplicationFeeAmount < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Application fee amount cannot be negative.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedDescription =
      typeof description === "string"
        ? description.trim()
        : "";

    /*
     * Create Solicitation.
     *
     * Financial hierarchy:
     *
     * Procurement
     *      |
     *      +-- total estimatedValue = budget ceiling
     *      |
     *      +-- Solicitation estimatedValue = allocation
     *
     * The following values are inherited:
     *
     * organizationId
     * currencyId
     * procurementMethod
     *
     * estimatedValue is NOT inherited.
     * It is the requested Solicitation allocation.
     */
    const solicitation =
      await prisma.solicitation.create({
        data: {
          procurementId:
            procurement.id,

          organizationId:
            procurement.organizationId,

          currencyId:
            procurement.currencyId,

          solicitationNumber:
            normalizedSolicitationNumber,

          title:
            title.trim(),

          description:
            normalizedDescription,

          status:
            status &&
            isValidEnumValue(
              SolicitationStatus,
              status,
            )
              ? status
              : SolicitationStatus.DRAFT,

          type:
            type &&
            isValidEnumValue(
              SolicitationType,
              type,
            )
              ? type
              : SolicitationType.RFP,

          /*
           * Inherited from Procurement.
           */
          procurementMethod:
            procurement.procurementMethod,

          /*
           * Publication is controlled by the publication
           * workflow, not by Solicitation creation.
           */
          publishedAt: null,

          openingDate:
            parsedOpeningDate,

          closingDate:
            parsedClosingDate,

          /*
           * This is the Solicitation's allocation from
           * the Procurement budget.
           */
          estimatedValue:
            parsedEstimatedValue,

          /*
           * Solicitation-specific financial settings.
           */
          bidSecurityRequired:
            Boolean(
              bidSecurityRequired,
            ),

          bidSecurityAmount:
            bidSecurityRequired === true
              ? parsedBidSecurityAmount
              : null,

          applicationFeeRequired:
            Boolean(
              applicationFeeRequired,
            ),

          applicationFeeAmount:
            applicationFeeRequired === true
              ? parsedApplicationFeeAmount
              : null,
        },

        include: {
          organization: {
            select: {
              id: true,
              name: true,
              organizationType: true,
            },
          },

          procurement: {
            select: {
              id: true,
              referenceNumber: true,
              title: true,
              status: true,
              procurementMethod: true,
              estimatedValue: true,

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

    /*
     * Record creation activity.
     */
    await prisma.solicitationActivity.create({
      data: {
        solicitationId:
          solicitation.id,

        action:
          "CREATED",

        performedById:
          userId,
      },
    });

    return NextResponse.json(
      {
        message:
          "Solicitation created successfully.",

        solicitation,

        /*
         * Return financial information so the client
         * can immediately display the allocation state.
         */
        financial: {
          procurementBudget,
          alreadyAllocated:
            alreadyAllocated +
            parsedEstimatedValue,
          availableAllocation:
            availableAllocation -
            parsedEstimatedValue,
          solicitationAllocation:
            parsedEstimatedValue,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/solicitations error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create solicitation.",
      },
      {
        status: 500,
      },
    );
  }
}