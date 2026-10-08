"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function createDepartment(formData: FormData) {
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

  const organizationMember =
    await prisma.organizationMember.findFirst({
      where: {
        userId,
      },
      select: {
        organizationId: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  if (!organizationMember) {
    throw new Error(
      "You are not associated with an organization.",
    );
  }

  const organizationId =
    organizationMember.organizationId;

  const existingDepartment =
    await prisma.department.findFirst({
      where: {
        organizationId,
        name,
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

  await prisma.department.create({
    data: {
      organizationId,
      name,
      code: code || null,
      description: description || null,
    },
  });

  redirect(
    "/dashboard/organization/departments",
  );
}