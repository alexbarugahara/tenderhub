import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding TenderHub demo data...");

  const passwordHash = await bcrypt.hash("Admin@12345", 12);
  const organizationPasswordHash = await bcrypt.hash(
    "Organization@12345",
    12,
  );
  const vendorPasswordHash = await bcrypt.hash("Vendor@12345", 12);

  const currency = await prisma.currency.upsert({
    where: { code: "USD" },
    update: {
      name: "US Dollar",
      symbol: "$",
      decimals: 2,
      active: true,
    },
    create: {
      code: "USD",
      name: "US Dollar",
      symbol: "$",
      decimals: 2,
      active: true,
    },
  });

  const country = await prisma.country.upsert({
    where: { code: "US" },
    update: {
      name: "United States",
      currencyCode: "USD",
      active: true,
    },
    create: {
      code: "US",
      name: "United States",
      currencyCode: "USD",
      active: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@tenderhub.com" },
    update: {
      name: "TenderHub Admin",
      password: passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      name: "TenderHub Admin",
      email: "admin@tenderhub.com",
      password: passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const organizationUser = await prisma.user.upsert({
    where: { email: "procurement@demoorganization.com" },
    update: {
      name: "Demo Procurement Manager",
      password: organizationPasswordHash,
      role: "ORGANIZATION",
      status: "ACTIVE",
    },
    create: {
      name: "Demo Procurement Manager",
      email: "procurement@demoorganization.com",
      password: organizationPasswordHash,
      role: "ORGANIZATION",
      status: "ACTIVE",
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: "vendor@demovendor.com" },
    update: {
      name: "Demo Vendor",
      password: vendorPasswordHash,
      role: "VENDOR",
      status: "ACTIVE",
    },
    create: {
      name: "Demo Vendor",
      email: "vendor@demovendor.com",
      password: vendorPasswordHash,
      role: "VENDOR",
      status: "ACTIVE",
    },
  });

  const organization = await prisma.organization.upsert({
    where: {
      email: "procurement@demoorganization.com",
    },
    update: {
      name: "Demo Procurement Organization",
      legalName: "Demo Procurement Organization",
      countryId: country.id,
      currencyId: currency.id,
      verifiedAt: new Date(),
    },
    create: {
      name: "Demo Procurement Organization",
      legalName: "Demo Procurement Organization",
      email: "procurement@demoorganization.com",
      countryId: country.id,
      currencyId: currency.id,
      organizationType: "PRIVATE_COMPANY",
      verifiedAt: new Date(),
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: organizationUser.id,
      },
    },
    update: {
      role: "OWNER",
    },
    create: {
      organizationId: organization.id,
      userId: organizationUser.id,
      role: "OWNER",
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: {
      userId: vendorUser.id,
    },
    update: {
      companyName: "Demo Technology Solutions",
      legalName: "Demo Technology Solutions LLC",
      countryId: country.id,
      verifiedAt: new Date(),
    },
    create: {
      userId: vendorUser.id,
      companyName: "Demo Technology Solutions",
      legalName: "Demo Technology Solutions LLC",
      email: "vendor@demovendor.com",
      countryId: country.id,
      businessType: "LIMITED_LIABILITY_COMPANY",
      numberOfEmployees: 25,
      yearsOperating: 8,
      verifiedAt: new Date(),
    },
  });

  const procurement = await prisma.procurement.upsert({
    where: {
      referenceNumber: "PROC-US-2026-001",
    },
    update: {
      title: "Digital Infrastructure Procurement",
      description:
        "Procurement of digital infrastructure and implementation services.",
      organizationId: organization.id,
      countryId: country.id,
      currencyId: currency.id,
      status: "ACTIVE",
      procurementMethod: "OPEN",
      estimatedValue: new Prisma.Decimal("250000.00"),
    },
    create: {
      organizationId: organization.id,
      countryId: country.id,
      currencyId: currency.id,
      title: "Digital Infrastructure Procurement",
      description:
        "Procurement of digital infrastructure and implementation services.",
      referenceNumber: "PROC-US-2026-001",
      status: "ACTIVE",
      procurementMethod: "OPEN",
      estimatedValue: new Prisma.Decimal("250000.00"),
    },
  });

  const solicitation = await prisma.solicitation.upsert({
    where: {
      solicitationNumber: "SOL-US-2026-001",
    },
    update: {
      procurementId: procurement.id,
      organizationId: organization.id,
      currencyId: currency.id,
      title: "Digital Infrastructure and Implementation",
      description:
        "Request for proposals for digital infrastructure, implementation, support, and related services.",
      status: "OPEN",
      type: "RFP",
      procurementMethod: "OPEN",
      estimatedValue: new Prisma.Decimal("250000.00"),
      bidSecurityRequired: false,
      applicationFeeRequired: false,
    },
    create: {
      procurementId: procurement.id,
      organizationId: organization.id,
      currencyId: currency.id,
      solicitationNumber: "SOL-US-2026-001",
      title: "Digital Infrastructure and Implementation",
      description:
        "Request for proposals for digital infrastructure, implementation, support, and related services.",
      status: "OPEN",
      type: "RFP",
      procurementMethod: "OPEN",
      estimatedValue: new Prisma.Decimal("250000.00"),
      bidSecurityRequired: false,
      applicationFeeRequired: false,
    },
  });

  let lot = await prisma.lot.findFirst({
    where: {
      solicitationId: solicitation.id,
      number: 1,
    },
  });

  if (!lot) {
    lot = await prisma.lot.create({
      data: {
        solicitationId: solicitation.id,
        number: 1,
        title: "Digital Infrastructure and Implementation",
        description:
          "Infrastructure supply, implementation, configuration, and support.",
        estimatedValue: new Prisma.Decimal("250000.00"),
        status: "OPEN",
      },
    });
  }

  const requirements = [
    {
      type: "ELIGIBILITY" as const,
      title: "Legal Business Registration",
      description:
        "Vendor must provide evidence of valid business registration.",
      sortOrder: 1,
    },
    {
      type: "TECHNICAL" as const,
      title: "Technical Capability",
      description:
        "Vendor must demonstrate the technical capability required to perform the work.",
      sortOrder: 2,
    },
    {
      type: "FINANCIAL" as const,
      title: "Financial Capacity",
      description:
        "Vendor must demonstrate sufficient financial capacity.",
      sortOrder: 3,
    },
    {
      type: "EXPERIENCE" as const,
      title: "Relevant Experience",
      description:
        "Vendor must demonstrate relevant experience on comparable projects.",
      sortOrder: 4,
    },
    {
      type: "DOCUMENT" as const,
      title: "Required Supporting Documents",
      description:
        "Vendor must provide all documents required by the solicitation.",
      sortOrder: 5,
    },
  ];

  for (const requirement of requirements) {
    const existing = await prisma.requirement.findFirst({
      where: {
        solicitationId: solicitation.id,
        title: requirement.title,
      },
    });

    if (!existing) {
      await prisma.requirement.create({
        data: {
          solicitationId: solicitation.id,
          ...requirement,
          isMandatory: true,
        },
      });
    }
  }

  const criteria = [
    {
      name: "Technical Approach",
      description:
        "Quality and suitability of the proposed technical solution.",
      weight: new Prisma.Decimal("40.0000"),
      sortOrder: 1,
    },
    {
      name: "Relevant Experience",
      description:
        "Relevant organizational experience and past performance.",
      weight: new Prisma.Decimal("25.0000"),
      sortOrder: 2,
    },
    {
      name: "Implementation Plan",
      description:
        "Quality and practicality of the implementation approach.",
      weight: new Prisma.Decimal("20.0000"),
      sortOrder: 3,
    },
    {
      name: "Financial Proposal",
      description:
        "Competitiveness and value of the financial proposal.",
      weight: new Prisma.Decimal("15.0000"),
      sortOrder: 4,
    },
  ];

  for (const criterion of criteria) {
    const existing = await prisma.evaluationCriterion.findFirst({
      where: {
        solicitationId: solicitation.id,
        name: criterion.name,
      },
    });

    if (!existing) {
      await prisma.evaluationCriterion.create({
        data: {
          solicitationId: solicitation.id,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight,
          maxScore: new Prisma.Decimal("100"),
          sortOrder: criterion.sortOrder,
        },
      });
    }
  }

  console.log("");
  console.log("TenderHub demo seed completed.");
  console.log("");
  console.log("Admin:");
  console.log("  admin@tenderhub.com / Admin@12345");
  console.log("");
  console.log("Organization:");
  console.log(
    "  procurement@demoorganization.com / Organization@12345",
  );
  console.log("");
  console.log("Vendor:");
  console.log("  vendor@demovendor.com / Vendor@12345");
  console.log("");
  console.log(`Organization: ${organization.name}`);
  console.log(`Vendor: ${vendor.companyName}`);
  console.log(`Procurement: ${procurement.referenceNumber}`);
  console.log(`Solicitation: ${solicitation.solicitationNumber}`);
  console.log(`Lot: ${lot.title}`);
  console.log(`Admin ID: ${admin.id}`);
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
