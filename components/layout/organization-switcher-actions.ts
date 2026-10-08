"use server";

import { cookies } from "next/headers";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ORGANIZATION_COOKIE = "tenderhub_organization_id";

export async function setSelectedOrganization(
  organizationId: string,
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Authentication required.");
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
    select: {
      organizationId: true,
    },
  });

  if (!membership) {
    throw new Error(
      "You do not have access to this organization.",
    );
  }

  const cookieStore = await cookies();

  cookieStore.set(
    ORGANIZATION_COOKIE,
    organizationId,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );
}

export async function getSelectedOrganizationId(
  userId: string,
) {
  const cookieStore = await cookies();

  const selectedOrganizationId =
    cookieStore.get(ORGANIZATION_COOKIE)?.value;

  if (selectedOrganizationId) {
    const membership =
      await prisma.organizationMember.findFirst({
        where: {
          userId,
          organizationId: selectedOrganizationId,
        },
        select: {
          organizationId: true,
        },
      });

    if (membership) {
      return membership.organizationId;
    }
  }

  const firstMembership =
    await prisma.organizationMember.findFirst({
      where: {
        userId,
      },
      orderBy: {
        joinedAt: "asc",
      },
      select: {
        organizationId: true,
      },
    });

  return firstMembership?.organizationId ?? null;
}