import { NextRequest, NextResponse } from "next/server";
import { ContractStatus, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

async function canAccessOrganization(
  userId: string,
  organizationId: string,
) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  return Boolean(membership);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);

    const awardId = searchParams.get("awardId");
    const vendorId = searchParams.get("vendorId");
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const role = user.role as UserRole;

    const where: {
      awardId?: string;
      vendorId?: string;
      organizationId?: string;
      status?: ContractStatus;
      OR?: Array<{
        contractNumber?: {
          contains: string;
          mode: "insensitive";
        };
        title?: {
          contains: string;
          mode: "insensitive";
        };
      }>;
      vendor?: {
        userId?: string;
      };
      organization?: {
        members?: {
          some: {
            userId: string;
          };
        };
      };
    } = {};

    if (awardId) {
      where.awardId = awardId;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (status) {
      if (!Object.values(ContractStatus).includes(status as ContractStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid contract status",
          },
          { status: 400 },
        );
      }

      where.status = status as ContractStatus;
    }

    if (search) {
      where.OR = [
        {
          contractNumber: {
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

    if (role === UserRole.VENDOR) {
      where.vendor = {
        userId: user.id,
      };
    } else if (role === UserRole.ORGANIZATION) {
      if (organizationId) {
        const hasAccess = await canAccessOrganization(
          user.id,
          organizationId,
        );

        if (!hasAccess) {
          return NextResponse.json(
            {
              success: false,
              error: "You do not have access to this organization",
            },
            { status: 403 },
          );
        }

        where.organizationId = organizationId;
      } else {
        where.organization = {
          members: {
            some: {
              userId: user.id,
            },
          },
        };
      }
    } else if (role === UserRole.ADMIN) {
      if (organizationId) {
        where.organizationId = organizationId;
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to view contracts",
        },
        { status: 403 },
      );
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        award: {
          include: {
            solicitation: true,
            bid: true,
          },
        },
        vendor: true,
        organization: true,
        documents: true,
        milestones: true,
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: contracts,
      count: contracts.length,
    });
  } catch (error) {
    console.error("GET /api/contracts error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch contracts",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const role = user.role as UserRole;

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.ORGANIZATION
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators and organization users can create contracts",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      awardId,
      contractNumber,
      title,
      description,
      status,
      contractValue,
      startDate,
      endDate,
      organizationId,
    } = body;

    if (!awardId) {
      return NextResponse.json(
        {
          success: false,
          error: "Award ID is required",
        },
        { status: 400 },
      );
    }

    if (!contractNumber || !String(contractNumber).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract number is required",
        },
        { status: 400 },
      );
    }

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract title is required",
        },
        { status: 400 },
      );
    }

    if (
      contractValue === undefined ||
      contractValue === null ||
      contractValue === "" ||
      Number.isNaN(Number(contractValue)) ||
      Number(contractValue) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract value must be a valid non-negative number",
        },
        { status: 400 },
      );
    }

    if (
      status !== undefined &&
      !Object.values(ContractStatus).includes(
        status as ContractStatus,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid contract status",
        },
        { status: 400 },
      );
    }

    const award = await prisma.award.findUnique({
      where: {
        id: awardId,
      },
      include: {
        contract: true,
        vendor: true,
        solicitation: {
          include: {
            organization: true,
          },
        },
        bid: true,
      },
    });

    if (!award) {
      return NextResponse.json(
        {
          success: false,
          error: "Award not found",
        },
        { status: 404 },
      );
    }

    if (award.contract) {
      return NextResponse.json(
        {
          success: false,
          error: "A contract already exists for this award",
        },
        { status: 409 },
      );
    }

    if (role === UserRole.ORGANIZATION) {
      const hasAccess = await canAccessOrganization(
        user.id,
        award.solicitation.organizationId,
      );

      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            error: "You do not have permission to create a contract for this award",
          },
          { status: 403 },
        );
      }
    }

    if (
      organizationId &&
      organizationId !== award.solicitation.organizationId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization does not match the award organization",
        },
        { status: 400 },
      );
    }

    const existingContractNumber = await prisma.contract.findUnique({
      where: {
        contractNumber: String(contractNumber).trim(),
      },
    });

    if (existingContractNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "A contract with this contract number already exists",
        },
        { status: 409 },
      );
    }

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);

      if (Number.isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid start date",
          },
          { status: 400 },
        );
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);

      if (Number.isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid end date",
          },
          { status: 400 },
        );
      }
    }

    if (
      parsedStartDate &&
      parsedEndDate &&
      parsedEndDate < parsedStartDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "End date cannot be earlier than start date",
        },
        { status: 400 },
      );
    }

    const contract = await prisma.$transaction(async (tx) => {
      const createdContract = await tx.contract.create({
        data: {
          awardId: award.id,
          vendorId: award.vendorId,
          organizationId: award.solicitation.organizationId,
          contractNumber: String(contractNumber).trim(),
          title: String(title).trim(),
          description:
            description === undefined || description === null
              ? null
              : String(description),
          status:
            status === undefined
              ? ContractStatus.DRAFT
              : (status as ContractStatus),
          contractValue: Number(contractValue),
          startDate: parsedStartDate,
          endDate: parsedEndDate,
        },
        include: {
          award: {
            include: {
              solicitation: true,
              bid: true,
            },
          },
          vendor: true,
          organization: true,
          documents: true,
          milestones: true,
          payments: true,
        },
      });

      await tx.contractActivity.create({
        data: {
          contractId: createdContract.id,
          performedById: user.id,
          action: "CONTRACT_CREATED",
          description: `Contract ${createdContract.contractNumber} was created`,
        },
      });

      await tx.notification.create({
        data: {
          userId: award.vendor.userId,
          title: "Contract created",
          message: `Contract ${createdContract.contractNumber} has been created for your awarded bid.`,
          type: "CONTRACT_NOTIFICATION",
          link: `/dashboard/vendor/contracts/${createdContract.id}`,
        },
      });

      return createdContract;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Contract created successfully",
        data: contract,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/contracts error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create contract",
      },
      { status: 500 },
    );
  }
}