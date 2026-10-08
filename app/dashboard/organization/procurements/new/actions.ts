"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import type {
  ProcurementFormValues,
} from "@/components/procurement/ProcurementForm";

export async function createProcurement(
  values: ProcurementFormValues,
): Promise<void> {
  const session = await auth();

  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Authentication required.");
  }

  const title = values.title.trim();
  const description = values.description.trim();
  const referenceNumber = values.referenceNumber.trim();
  const estimatedValue = values.estimatedValue.trim();

  if (!values.organizationId) {
    throw new Error("Organization is required.");
  }

  if (!title) {
    throw new Error("Procurement title is required.");
  }

  if (!referenceNumber) {
    throw new Error("Reference number is required.");
  }

  if (!estimatedValue) {
    throw new Error("Estimated value is required.");
  }

  const numericEstimatedValue = Number(estimatedValue);

  if (
    !Number.isFinite(numericEstimatedValue) ||
    numericEstimatedValue < 0
  ) {
    throw new Error(
      "Estimated value must be a valid non-negative number.",
    );
  }

  if (
    values.plannedStartDate &&
    values.plannedEndDate
  ) {
    const startDate = new Date(values.plannedStartDate);
    const endDate = new Date(values.plannedEndDate);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      throw new Error("Invalid planned procurement dates.");
    }

    if (endDate < startDate) {
      throw new Error(
        "Planned end date cannot be before the planned start date.",
      );
    }
  }

  /*
   * Resolve the organization through OrganizationMember.
   *
   * This is deliberately performed again on the server instead of
   * trusting the organizationId coming from the browser.
   */
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: values.organizationId,
    },
    select: {
      organizationId: true,
    },
  });

  if (!membership) {
    throw new Error(
      "You are not a member of the selected organization.",
    );
  }

  /*
   * Verify optional foreign keys belong to the selected organization
   * where applicable.
   */
  if (values.departmentId) {
    const department = await prisma.department.findFirst({
      where: {
        id: values.departmentId,
        organizationId: values.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!department) {
      throw new Error(
        "The selected department does not belong to this organization.",
      );
    }
  }

  if (values.countryId) {
    const country = await prisma.country.findUnique({
      where: {
        id: values.countryId,
      },
      select: {
        id: true,
      },
    });

    if (!country) {
      throw new Error("The selected country could not be found.");
    }
  }

  if (values.currencyId) {
    const currency = await prisma.currency.findUnique({
      where: {
        id: values.currencyId,
      },
      select: {
        id: true,
      },
    });

    if (!currency) {
      throw new Error("The selected currency could not be found.");
    }
  }

  try {
    const procurement = await prisma.$transaction(async (tx) => {
      const createdProcurement = await tx.procurement.create({
        data: {
          organizationId: values.organizationId,
          departmentId: values.departmentId || null,
          countryId: values.countryId || null,
          currencyId: values.currencyId || null,
          title,
          description: description || null,
          referenceNumber,
          status: values.status,
          procurementMethod: values.procurementMethod,
          estimatedValue: numericEstimatedValue,
          plannedStartDate: values.plannedStartDate
            ? new Date(values.plannedStartDate)
            : null,
          plannedEndDate: values.plannedEndDate
            ? new Date(values.plannedEndDate)
            : null,
        },
        select: {
          id: true,
          organizationId: true,
          title: true,
        },
      });

      await tx.procurementActivity.create({
        data: {
          procurementId: createdProcurement.id,
          performedById: userId,
          action: "CREATED",
          description: `Procurement "${createdProcurement.title}" was created.`,
        },
      });

      return createdProcurement;
    });

    redirect(
      `/dashboard/organization/procurements/${procurement.id}`,
    );
  } catch (error) {
    /*
     * Next.js redirect() intentionally throws a special internal error.
     * Re-throw it so redirect continues to work.
     */
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(
        "A procurement with this reference number already exists.",
      );
    }

    console.error("Failed to create procurement:", error);

    throw new Error(
      "Unable to create the procurement. Please try again.",
    );
  }
}