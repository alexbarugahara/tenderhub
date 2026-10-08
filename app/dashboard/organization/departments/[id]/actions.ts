"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

async function getAuthorizedDepartment(departmentId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Authentication required.");
  }

  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
    select: {
      id: true,
      organizationId: true,
    },
  });

  if (!department) {
    throw new Error("Department not found.");
  }

  const organizationMember =
    await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId: department.organizationId,
      },
      select: {
        id: true,
        role: true,
      },
    });

  if (!organizationMember) {
    throw new Error(
      "You are not authorized to manage this department.",
    );
  }

  return department;
}

export async function assignMembersToDepartment(
  departmentId: string,
  memberIds: string[],
) {
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error("Select at least one member.");
  }

  const department =
    await getAuthorizedDepartment(departmentId);

  const uniqueMemberIds = [
    ...new Set(
      memberIds.filter(
        (memberId) =>
          typeof memberId === "string" &&
          memberId.trim().length > 0,
      ),
    ),
  ];

  if (uniqueMemberIds.length === 0) {
    throw new Error("Select at least one member.");
  }

  const organizationMembers =
    await prisma.organizationMember.findMany({
      where: {
        id: {
          in: uniqueMemberIds,
        },
        organizationId: department.organizationId,
      },
      select: {
        id: true,
      },
    });

  if (
    organizationMembers.length !==
    uniqueMemberIds.length
  ) {
    throw new Error(
      "One or more selected members do not belong to this organization.",
    );
  }

  await prisma.organizationMember.updateMany({
    where: {
      id: {
        in: uniqueMemberIds,
      },
      organizationId: department.organizationId,
    },
    data: {
      departmentId: department.id,
    },
  });

  revalidatePath(
    `/dashboard/organization/departments/${department.id}`,
  );

  revalidatePath(
    "/dashboard/organization/departments",
  );

  revalidatePath(
    "/dashboard/organization/members",
  );

  return {
    success: true,
  };
}

export async function removeMemberFromDepartment(
  departmentId: string,
  memberId: string,
) {
  const department =
    await getAuthorizedDepartment(departmentId);

  const member =
    await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: department.organizationId,
      },
      select: {
        id: true,
        departmentId: true,
      },
    });

  if (!member) {
    throw new Error("Organization member not found.");
  }

  if (member.departmentId !== department.id) {
    throw new Error(
      "This member is not assigned to this department.",
    );
  }

  await prisma.organizationMember.update({
    where: {
      id: member.id,
    },
    data: {
      departmentId: null,
    },
  });

  revalidatePath(
    `/dashboard/organization/departments/${department.id}`,
  );

  revalidatePath(
    "/dashboard/organization/departments",
  );

  revalidatePath(
    "/dashboard/organization/members",
  );

  return {
    success: true,
  };
}

export async function assignProcurementsToDepartment(
  departmentId: string,
  procurementIds: string[],
) {
  if (
    !Array.isArray(procurementIds) ||
    procurementIds.length === 0
  ) {
    throw new Error("Select at least one procurement.");
  }

  const department =
    await getAuthorizedDepartment(departmentId);

  const uniqueProcurementIds = [
    ...new Set(
      procurementIds.filter(
        (procurementId) =>
          typeof procurementId === "string" &&
          procurementId.trim().length > 0,
      ),
    ),
  ];

  if (uniqueProcurementIds.length === 0) {
    throw new Error("Select at least one procurement.");
  }

  const procurements =
    await prisma.procurement.findMany({
      where: {
        id: {
          in: uniqueProcurementIds,
        },
        organizationId: department.organizationId,
      },
      select: {
        id: true,
      },
    });

  if (
    procurements.length !==
    uniqueProcurementIds.length
  ) {
    throw new Error(
      "One or more selected procurements do not belong to this organization.",
    );
  }

  await prisma.procurement.updateMany({
    where: {
      id: {
        in: uniqueProcurementIds,
      },
      organizationId: department.organizationId,
    },
    data: {
      departmentId: department.id,
    },
  });

  revalidatePath(
    `/dashboard/organization/departments/${department.id}`,
  );

  revalidatePath(
    "/dashboard/organization/departments",
  );

  revalidatePath(
    "/dashboard/organization/procurements",
  );

  return {
    success: true,
  };
}

export async function removeProcurementFromDepartment(
  departmentId: string,
  procurementId: string,
) {
  const department =
    await getAuthorizedDepartment(departmentId);

  const procurement =
    await prisma.procurement.findFirst({
      where: {
        id: procurementId,
        organizationId: department.organizationId,
      },
      select: {
        id: true,
        departmentId: true,
      },
    });

  if (!procurement) {
    throw new Error("Procurement not found.");
  }

  if (procurement.departmentId !== department.id) {
    throw new Error(
      "This procurement is not assigned to this department.",
    );
  }

  await prisma.procurement.update({
    where: {
      id: procurement.id,
    },
    data: {
      departmentId: null,
    },
  });

  revalidatePath(
    `/dashboard/organization/departments/${department.id}`,
  );

  revalidatePath(
    "/dashboard/organization/departments",
  );

  revalidatePath(
    "/dashboard/organization/procurements",
  );

  return {
    success: true,
  };
}
