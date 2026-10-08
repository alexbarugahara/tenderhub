"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function updateDepartment(
  departmentId: string,
  formData: FormData,
) {
  const session = await auth();

  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Authentication required.");
  }

  const nameValue = formData.get("name");
  const codeValue = formData.get("code");
  const descriptionValue = formData.get("description");

  const name =
    typeof nameValue === "string"
      ? nameValue.trim()
      : "";

  const code =
    typeof codeValue === "string"
      ? codeValue.trim().toUpperCase()
      : "";

  const description =
    typeof descriptionValue === "string"
      ? descriptionValue.trim()
      : "";

  if (!name) {
    throw new Error("Department name is required.");
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
      },
    });

  if (!organizationMember) {
    throw new Error(
      "You are not authorized to modify this department.",
    );
  }

  const existingDepartment =
    await prisma.department.findFirst({
      where: {
        organizationId: department.organizationId,
        name,
        NOT: {
          id: departmentId,
        },
      },
      select: {
        id: true,
      },
    });

  if (existingDepartment) {
    throw new Error(
      "A department with this name already exists in your organization.",
    );
  }

  await prisma.department.update({
    where: {
      id: departmentId,
    },
    data: {
      name,
      code: code || null,
      description: description || null,
    },
  });

  redirect(
    `/dashboard/organization/departments/${departmentId}`,
  );
}