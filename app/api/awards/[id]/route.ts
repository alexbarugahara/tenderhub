import { NextRequest, NextResponse } from "next/server";
import { AwardStatus, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  return user;
}

async function getAward(id: string) {
  return prisma.award.findUnique({
    where: {
      id,
    },
    include: {
      solicitation: {
        include: {
          organization: true,
        },
      },
      lot: true,
      bid: {
        include: {
          vendor: {
            include: {
              user: true,
            },
          },
          evaluations: {
            include: {
              evaluator: true,
            },
          },
        },
      },
      vendor: {
        include: {
          user: true,
        },
      },
      contract: true,
    },
  });
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

async function canAccessAward(
  userId: string,
  role: UserRole,
  award: Awaited<ReturnType<typeof getAward>>,
) {
  if (!award) {
    return false;
  }

  if (role === UserRole.ADMIN) {
    return true;
  }

  if (role === UserRole.VENDOR) {
    return award.vendor.userId === userId;
  }

  if (role === UserRole.ORGANIZATION) {
    return canAccessOrganization(
      userId,
      award.solicitation.organizationId,
    );
  }

  return false;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const award = await getAward(id);

    if (!award) {
      return NextResponse.json(
        {
          success: false,
          error: "Award not found",
        },
        { status: 404 },
      );
    }

    const hasAccess = await canAccessAward(
      user.id,
      user.role,
      award,
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to view this award",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: award,
    });
  } catch (error) {
    console.error("GET /api/awards/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch award",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const existingAward = await getAward(id);

    if (!existingAward) {
      return NextResponse.json(
        {
          success: false,
          error: "Award not found",
        },
        { status: 404 },
      );
    }

    const role = user.role;

    if (role !== UserRole.ADMIN && role !== UserRole.ORGANIZATION) {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators and organization users can update awards",
        },
        { status: 403 },
      );
    }

    const hasAccess = await canAccessAward(
      user.id,
      role,
      existingAward,
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to update this award",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const allowedStatuses = Object.values(AwardStatus);

    if (
      body.status !== undefined &&
      !allowedStatuses.includes(body.status as AwardStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid award status",
        },
        { status: 400 },
      );
    }

    if (
      body.awardAmount !== undefined &&
      (body.awardAmount === null ||
        body.awardAmount === "" ||
        Number.isNaN(Number(body.awardAmount)) ||
        Number(body.awardAmount) < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Award amount must be a valid non-negative number",
        },
        { status: 400 },
      );
    }

    if (
      body.awardNumber !== undefined &&
      (!body.awardNumber ||
        typeof body.awardNumber !== "string" ||
        !body.awardNumber.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Award number cannot be empty",
        },
        { status: 400 },
      );
    }

    if (
      body.awardNumber !== undefined &&
      body.awardNumber.trim() !== existingAward.awardNumber
    ) {
      const duplicateAward = await prisma.award.findUnique({
        where: {
          awardNumber: body.awardNumber.trim(),
        },
      });

      if (duplicateAward && duplicateAward.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: "An award with this award number already exists",
          },
          { status: 409 },
        );
      }
    }

    const data: {
      awardNumber?: string;
      status?: AwardStatus;
      awardAmount?: number;
      awardDate?: Date;
      notes?: string | null;
    } = {};

    if (body.awardNumber !== undefined) {
      data.awardNumber = body.awardNumber.trim();
    }

    if (body.status !== undefined) {
      data.status = body.status as AwardStatus;
    }

    if (body.awardAmount !== undefined) {
      data.awardAmount = Number(body.awardAmount);
    }

    if (body.awardDate !== undefined) {
      const awardDate = new Date(body.awardDate);

      if (Number.isNaN(awardDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid award date",
          },
          { status: 400 },
        );
      }

      data.awardDate = awardDate;
    }

    if (body.notes !== undefined) {
      data.notes =
        body.notes === null ? null : String(body.notes);
    }

    const award = await prisma.$transaction(async (tx) => {
      const updatedAward = await tx.award.update({
        where: {
          id,
        },
        data,
        include: {
          solicitation: true,
          lot: true,
          bid: {
            include: {
              vendor: true,
            },
          },
          vendor: true,
          contract: true,
        },
      });

      await tx.applicationActivity.create({
        data: {
          bidId: updatedAward.bidId,
          performedById: user.id,
          action: "AWARD_UPDATED",
          description: `Award ${updatedAward.awardNumber} was updated`,
        },
      });

      if (
        body.status !== undefined &&
        body.status !== existingAward.status
      ) {
        await tx.notification.create({
          data: {
            userId: updatedAward.vendor.userId,
            title: "Award status updated",
            message: `The status of award ${updatedAward.awardNumber} has been updated to ${updatedAward.status}.`,
            type: "AWARD_NOTIFICATION",
            link: `/dashboard/vendor/awards/${updatedAward.id}`,
          },
        });
      }

      return updatedAward;
    });

    return NextResponse.json({
      success: true,
      message: "Award updated successfully",
      data: award,
    });
  } catch (error) {
    console.error("PATCH /api/awards/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update award",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const existingAward = await getAward(id);

    if (!existingAward) {
      return NextResponse.json(
        {
          success: false,
          error: "Award not found",
        },
        { status: 404 },
      );
    }

    const role = user.role;

    if (role !== UserRole.ADMIN && role !== UserRole.ORGANIZATION) {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators and organization users can delete awards",
        },
        { status: 403 },
      );
    }

    const hasAccess = await canAccessAward(
      user.id,
      role,
      existingAward,
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to delete this award",
        },
        { status: 403 },
      );
    }

    if (existingAward.contract) {
      return NextResponse.json(
        {
          success: false,
          error: "An award linked to a contract cannot be deleted",
        },
        { status: 409 },
      );
    }

    if (
      existingAward.status === AwardStatus.APPROVED ||
      existingAward.status === AwardStatus.ACCEPTED
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Approved or accepted awards cannot be deleted",
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.applicationActivity.create({
        data: {
          bidId: existingAward.bidId,
          performedById: user.id,
          action: "AWARD_DELETED",
          description: `Award ${existingAward.awardNumber} was deleted`,
        },
      });

      await tx.award.delete({
        where: {
          id,
        },
      });

      await tx.notification.create({
        data: {
          userId: existingAward.vendor.userId,
          title: "Award cancelled",
          message: `Award ${existingAward.awardNumber} has been removed.`,
          type: "WARNING",
          link: `/dashboard/vendor/awards`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Award deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/awards/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete award",
      },
      { status: 500 },
    );
  }
}
