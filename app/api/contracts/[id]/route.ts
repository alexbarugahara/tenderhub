import { NextRequest, NextResponse } from "next/server";
import { ContractStatus, UserRole } from "@prisma/client";
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

  return session.user;
}

async function getContract(id: string) {
  return prisma.contract.findUnique({
    where: {
      id,
    },
    include: {
      award: {
        include: {
          solicitation: {
            include: {
              organization: true,
            },
          },
          bid: true,
        },
      },
      vendor: {
        include: {
          user: true,
        },
      },
      organization: true,
      documents: true,
      milestones: true,
      payments: true,
      activities: {
        include: {
          performedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
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

async function canAccessContract(
  userId: string,
  role: UserRole,
  contract: Awaited<ReturnType<typeof getContract>>,
) {
  if (!contract) {
    return false;
  }

  if (role === UserRole.ADMIN) {
    return true;
  }

  if (role === UserRole.VENDOR) {
    return contract.vendor.userId === userId;
  }

  if (role === UserRole.ORGANIZATION) {
    if (!contract.organizationId) {
      return false;
    }

    return canAccessOrganization(
      userId,
      contract.organizationId,
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

    const contract = await getContract(id);

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract not found",
        },
        { status: 404 },
      );
    }

    const hasAccess = await canAccessContract(
      user.id,
      user.role as UserRole,
      contract,
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to view this contract",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    console.error("GET /api/contracts/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch contract",
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

    const existingContract = await getContract(id);

    if (!existingContract) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract not found",
        },
        { status: 404 },
      );
    }

    const role = user.role as UserRole;

    const hasAccess = await canAccessContract(
      user.id,
      role,
      existingContract,
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to update this contract",
        },
        { status: 403 },
      );
    }

    if (role === UserRole.VENDOR) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendors cannot update contract records",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      contractNumber,
      title,
      description,
      status,
      contractValue,
      startDate,
      endDate,
      signedAt,
      completedAt,
      terminatedAt,
      terminationReason,
    } = body;

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

    if (
      contractNumber !== undefined &&
      (!contractNumber ||
        typeof contractNumber !== "string" ||
        !contractNumber.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract number cannot be empty",
        },
        { status: 400 },
      );
    }

    if (
      title !== undefined &&
      (!title ||
        typeof title !== "string" ||
        !title.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract title cannot be empty",
        },
        { status: 400 },
      );
    }

    if (
      contractValue !== undefined &&
      (contractValue === null ||
        contractValue === "" ||
        Number.isNaN(Number(contractValue)) ||
        Number(contractValue) < 0)
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
      contractNumber !== undefined &&
      contractNumber.trim() !== existingContract.contractNumber
    ) {
      const duplicateContract = await prisma.contract.findUnique({
        where: {
          contractNumber: contractNumber.trim(),
        },
      });

      if (duplicateContract && duplicateContract.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: "A contract with this contract number already exists",
          },
          { status: 409 },
        );
      }
    }

    const data: {
      contractNumber?: string;
      title?: string;
      description?: string | null;
      status?: ContractStatus;
      contractValue?: number;
      startDate?: Date | null;
      endDate?: Date | null;
      signedAt?: Date | null;
      completedAt?: Date | null;
      terminatedAt?: Date | null;
      terminationReason?: string | null;
    } = {};

    if (contractNumber !== undefined) {
      data.contractNumber = contractNumber.trim();
    }

    if (title !== undefined) {
      data.title = title.trim();
    }

    if (description !== undefined) {
      data.description =
        description === null ? null : String(description);
    }

    if (status !== undefined) {
      data.status = status as ContractStatus;
    }

    if (contractValue !== undefined) {
      data.contractValue = Number(contractValue);
    }

    if (startDate !== undefined) {
      if (startDate === null || startDate === "") {
        data.startDate = null;
      } else {
        const parsedStartDate = new Date(startDate);

        if (Number.isNaN(parsedStartDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid start date",
            },
            { status: 400 },
          );
        }

        data.startDate = parsedStartDate;
      }
    }

    if (endDate !== undefined) {
      if (endDate === null || endDate === "") {
        data.endDate = null;
      } else {
        const parsedEndDate = new Date(endDate);

        if (Number.isNaN(parsedEndDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid end date",
            },
            { status: 400 },
          );
        }

        data.endDate = parsedEndDate;
      }
    }

    if (signedAt !== undefined) {
      if (signedAt === null || signedAt === "") {
        data.signedAt = null;
      } else {
        const parsedSignedAt = new Date(signedAt);

        if (Number.isNaN(parsedSignedAt.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid signed date",
            },
            { status: 400 },
          );
        }

        data.signedAt = parsedSignedAt;
      }
    }

    if (completedAt !== undefined) {
      if (completedAt === null || completedAt === "") {
        data.completedAt = null;
      } else {
        const parsedCompletedAt = new Date(completedAt);

        if (Number.isNaN(parsedCompletedAt.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid completed date",
            },
            { status: 400 },
          );
        }

        data.completedAt = parsedCompletedAt;
      }
    }

    if (terminatedAt !== undefined) {
      if (terminatedAt === null || terminatedAt === "") {
        data.terminatedAt = null;
      } else {
        const parsedTerminatedAt = new Date(terminatedAt);

        if (Number.isNaN(parsedTerminatedAt.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid termination date",
            },
            { status: 400 },
          );
        }

        data.terminatedAt = parsedTerminatedAt;
      }
    }

    if (terminationReason !== undefined) {
      data.terminationReason =
        terminationReason === null
          ? null
          : String(terminationReason);
    }

    const effectiveStartDate =
      data.startDate !== undefined
        ? data.startDate
        : existingContract.startDate;

    const effectiveEndDate =
      data.endDate !== undefined
        ? data.endDate
        : existingContract.endDate;

    if (
      effectiveStartDate &&
      effectiveEndDate &&
      effectiveEndDate < effectiveStartDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "End date cannot be earlier than start date",
        },
        { status: 400 },
      );
    }

    if (
      data.status === ContractStatus.TERMINATED &&
      data.terminationReason === undefined &&
      !existingContract.terminationReason
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Termination reason is required when terminating a contract",
        },
        { status: 400 },
      );
    }

    const contract = await prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: {
          id,
        },
        data,
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

      const changes: string[] = [];

      if (
        data.status !== undefined &&
        data.status !== existingContract.status
      ) {
        changes.push(
          `status changed from ${existingContract.status} to ${data.status}`,
        );
      }

      if (
        data.contractNumber !== undefined &&
        data.contractNumber !== existingContract.contractNumber
      ) {
        changes.push("contract number updated");
      }

      if (
        data.title !== undefined &&
        data.title !== existingContract.title
      ) {
        changes.push("title updated");
      }

      if (
        data.contractValue !== undefined &&
        Number(data.contractValue) !==
          Number(existingContract.contractValue)
      ) {
        changes.push("contract value updated");
      }

      if (changes.length === 0) {
        changes.push("contract details updated");
      }

      await tx.contractActivity.create({
        data: {
          contractId: updatedContract.id,
          performedById: user.id,
          action: "CONTRACT_UPDATED",
          description: changes.join("; "),
        },
      });

      if (
        data.status !== undefined &&
        data.status !== existingContract.status
      ) {
        await tx.notification.create({
          data: {
            userId: updatedContract.vendor.userId,
            title: "Contract status updated",
            message: `Contract ${updatedContract.contractNumber} status has been updated to ${updatedContract.status}.`,
            type: "CONTRACT_NOTIFICATION",
            link: `/dashboard/vendor/contracts/${updatedContract.id}`,
          },
        });
      }

      return updatedContract;
    });

    return NextResponse.json({
      success: true,
      message: "Contract updated successfully",
      data: contract,
    });
  } catch (error) {
    console.error("PATCH /api/contracts/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update contract",
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

    const existingContract = await getContract(id);

    if (!existingContract) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract not found",
        },
        { status: 404 },
      );
    }

    const role = user.role as UserRole;

    const hasAccess = await canAccessContract(
      user.id,
      role,
      existingContract,
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to delete this contract",
        },
        { status: 403 },
      );
    }

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.ORGANIZATION
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators and organization users can delete contracts",
        },
        { status: 403 },
      );
    }

    if (
      existingContract.status === ContractStatus.ACTIVE ||
      existingContract.status === ContractStatus.COMPLETED ||
      existingContract.status === ContractStatus.TERMINATED
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Active, completed, or terminated contracts cannot be deleted",
        },
        { status: 409 },
      );
    }

    if (
      existingContract.documents.length > 0 ||
      existingContract.milestones.length > 0 ||
      existingContract.payments.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A contract with documents, milestones, or payments cannot be deleted",
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.contractActivity.create({
        data: {
          contractId: existingContract.id,
          performedById: user.id,
          action: "CONTRACT_DELETED",
          description: `Contract ${existingContract.contractNumber} was deleted`,
        },
      });

      await tx.contract.delete({
        where: {
          id,
        },
      });

      await tx.notification.create({
        data: {
          userId: existingContract.vendor.userId,
          title: "Contract removed",
          message: `Contract ${existingContract.contractNumber} has been removed.`,
          type: "WARNING",
          link: `/dashboard/vendor/contracts`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Contract deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/contracts/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete contract",
      },
      { status: 500 },
    );
  }
}