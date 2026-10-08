import { prisma } from "@/lib/db/prisma";

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export async function activateVendor(
  vendorId: string,
) {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id: vendorId,
    },
    select: {
      id: true,
      userId: true,
      companyName: true,
      email: true,
      registrationNumber: true,
      taxNumber: true,
      verifiedAt: true,
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  if (vendor.verifiedAt) {
    return {
      vendor,
      alreadyActive: true,
      activated: true,
    };
  }

  if (!hasValue(vendor.companyName)) {
    throw new Error(
      "Vendor company name is required before activation",
    );
  }

  if (!hasValue(vendor.email)) {
    throw new Error(
      "Vendor email is required before activation",
    );
  }

  if (!hasValue(vendor.registrationNumber)) {
    throw new Error(
      "Vendor registration number is required before activation",
    );
  }

  if (!hasValue(vendor.taxNumber)) {
    throw new Error(
      "Vendor tax number is required before activation",
    );
  }

  const application =
    await prisma.vendorApplication.findUnique({
      where: {
        userId: vendor.userId,
      },
      include: {
        requirements: {
          where: {
            required: true,
          },
          select: {
            id: true,
            status: true,
            required: true,
            name: true,
          },
        },
      },
    });

  if (!application) {
    throw new Error(
      "Vendor cannot be activated because no vendor application exists",
    );
  }

  if (application.status !== "APPROVED") {
    throw new Error(
      "Vendor cannot be activated because the vendor application has not been approved",
    );
  }

  if (application.requirements.length === 0) {
    throw new Error(
      "Vendor cannot be activated because no required onboarding requirements exist",
    );
  }

  const incomplete = application.requirements.filter(
    (requirement) =>
      requirement.status !== "SATISFIED" &&
      requirement.status !== "NOT_APPLICABLE",
  );

  if (incomplete.length > 0) {
    throw new Error(
      "Vendor cannot be activated because required onboarding requirements are incomplete",
    );
  }

  const activatedVendor =
    await prisma.vendor.update({
      where: {
        id: vendorId,
      },
      data: {
        verifiedAt: new Date(),
      },
      select: {
        id: true,
        companyName: true,
        legalName: true,
        email: true,
        phone: true,
        registrationNumber: true,
        taxNumber: true,
        verifiedAt: true,
      },
    });

  return {
    vendor: activatedVendor,
    alreadyActive: false,
    activated: true,
  };
}

export async function deactivateVendor(
  vendorId: string,
) {
  const vendor =
    await prisma.vendor.update({
      where: {
        id: vendorId,
      },
      data: {
        verifiedAt: null,
      },
      select: {
        id: true,
        companyName: true,
        verifiedAt: true,
      },
    });

  return vendor;
}

export async function canActivateVendor(
  vendorId: string,
) {
  const vendor =
    await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
      select: {
        userId: true,
        companyName: true,
        email: true,
        registrationNumber: true,
        taxNumber: true,
        verifiedAt: true,
      },
    });

  if (!vendor) {
    return {
      canActivate: false,
      reasons: ["Vendor not found"],
    };
  }

  const reasons: string[] = [];

  if (!hasValue(vendor.companyName)) {
    reasons.push(
      "Vendor company name is missing",
    );
  }

  if (!hasValue(vendor.email)) {
    reasons.push(
      "Vendor email is missing",
    );
  }

  if (!hasValue(vendor.registrationNumber)) {
    reasons.push(
      "Vendor registration number is missing",
    );
  }

  if (!hasValue(vendor.taxNumber)) {
    reasons.push(
      "Vendor tax number is missing",
    );
  }

  const application =
    await prisma.vendorApplication.findUnique({
      where: {
        userId: vendor.userId,
      },
      include: {
        requirements: {
          where: {
            required: true,
          },
          select: {
            id: true,
            status: true,
            name: true,
          },
        },
      },
    });

  if (!application) {
    reasons.push(
      "No vendor onboarding application exists",
    );
  } else {
    if (application.status !== "APPROVED") {
      reasons.push(
        `Vendor application is ${application.status.toLowerCase().replaceAll("_", " ")}`,
      );
    }

    if (application.requirements.length === 0) {
      reasons.push(
        "No required vendor onboarding requirements have been configured",
      );
    }

    for (const requirement of application.requirements) {
      if (
        requirement.status !== "SATISFIED" &&
        requirement.status !== "NOT_APPLICABLE"
      ) {
        reasons.push(
          `Requirement not complete: ${requirement.name}`,
        );
      }
    }
  }

  return {
    canActivate: reasons.length === 0,
    reasons,
    alreadyActive: Boolean(vendor.verifiedAt),
  };
}