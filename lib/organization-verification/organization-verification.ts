import { prisma } from "@/lib/db/prisma";

export async function ensureOrganizationVerification(
  organizationId: string
) {
  /*
   * Step 1:
   * Make sure the organization has a verification record.
   */
  const verification =
    await prisma.organizationVerification.upsert({
      where: {
        organizationId,
      },
      create: {
        organizationId,
        status: "NOT_SUBMITTED",
      },
      update: {},
      select: {
        id: true,
        organizationId: true,
        status: true,
      },
    });

  /*
   * Step 2:
   * Load all active organization verification requirements.
   */
  const requirements =
    await prisma.organizationComplianceRequirement.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        description: true,
        required: true,
      },
    });

  /*
   * Step 3:
   * Load existing verification checks.
   */
  const existingChecks =
    await prisma.organizationVerificationCheck.findMany({
      where: {
        verificationId: verification.id,
      },
      select: {
        id: true,
        code: true,
        requirementId: true,
      },
    });

  const existingByCode = new Map(
    existingChecks.map((check) => [
      check.code,
      check,
    ])
  );

  /*
   * Step 4:
   * Create missing verification checks.
   */
  for (const requirement of requirements) {
    const existing = existingByCode.get(
      requirement.code
    );

    if (!existing) {
      await prisma.organizationVerificationCheck.create({
        data: {
          verificationId: verification.id,
          requirementId: requirement.id,
          code: requirement.code,
          name: requirement.name,
          category: requirement.category,
          description: requirement.description,
          required: requirement.required,
          status: "PENDING",
        },
      });

      continue;
    }

    /*
     * Link older checks to the master requirement
     * when requirementId has not yet been populated.
     */
    if (!existing.requirementId) {
      await prisma.organizationVerificationCheck.update({
        where: {
          id: existing.id,
        },
        data: {
          requirementId: requirement.id,
        },
      });
    }
  }

  /*
   * Step 5:
   * Return the complete verification record.
   */
  return prisma.organizationVerification.findUnique({
    where: {
      id: verification.id,
    },
    include: {
      checks: {
        include: {
          requirement: true,

          document: true,

          checkedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },

        orderBy: [
          {
            required: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });
}