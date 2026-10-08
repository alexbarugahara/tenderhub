import {
  PrismaClient,
  ProcurementMethod,
  ProcurementStatus,
  SolicitationStatus,
  SolicitationType,
  LotStatus,
  RequirementType,
  OrganizationType,
  UserRole,
  UserStatus,
  ComplianceCategory,
  DocumentCategory,
  VendorApplicationStatus,
  VendorApplicationRequirementStatus,
} from "@prisma/client";

import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting TenderHub seed...");

  // ==========================================================
  // CURRENCY
  // ==========================================================

  const currency = await prisma.currency.upsert({
    where: {
      code: "USD",
    },
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

  // ==========================================================
  // COUNTRY
  // ==========================================================

  const country = await prisma.country.upsert({
    where: {
      code: "US",
    },
    update: {
      name: "United States",
      currencyCode: currency.code,
      active: true,
    },
    create: {
      code: "US",
      name: "United States",
      currencyCode: currency.code,
      active: true,
    },
  });

  // ==========================================================
  // ADMIN USER
  // ==========================================================

  const adminPassword = await bcrypt.hash("Admin@12345", 10);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@tenderhub.com",
    },
    update: {
      name: "TenderHub Administrator",
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: "TenderHub Administrator",
      email: "admin@tenderhub.com",
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // ==========================================================
  // ORGANIZATION USER
  // ==========================================================

  const organizationPassword = await bcrypt.hash(
    "Organization@12345",
    10,
  );

  const organizationUser = await prisma.user.upsert({
    where: {
      email: "procurement@demoorganization.com",
    },
    update: {
      name: "Demo Procurement Manager",
      password: organizationPassword,
      role: UserRole.ORGANIZATION,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: "Demo Procurement Manager",
      email: "procurement@demoorganization.com",
      password: organizationPassword,
      role: UserRole.ORGANIZATION,
      status: UserStatus.ACTIVE,
    },
  });

  // ==========================================================
  // VENDOR USER
  // ==========================================================

  const vendorPassword = await bcrypt.hash("Vendor@12345", 10);

  const vendorUser = await prisma.user.upsert({
    where: {
      email: "vendor@demovendor.com",
    },
    update: {
      name: "Demo Vendor",
      password: vendorPassword,
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: "Demo Vendor",
      email: "vendor@demovendor.com",
      password: vendorPassword,
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
    },
  });

  // ==========================================================
  // ORGANIZATION
  // ==========================================================

  const organization = await prisma.organization.upsert({
    where: {
      email: "procurement@demoorganization.com",
    },
    update: {
      name: "Demo Procurement Organization",
      legalName: "Demo Procurement Organization Inc.",
      phone: "+1 202-555-0100",
      website: "https://demoorganization.com",
      address: "Washington, DC, United States",
      description:
        "Demo organization used for testing the TenderHub procurement workflow.",
      registrationNumber: "DEMO-US-001",
      taxNumber: "US-DEMO-001",
      organizationType: OrganizationType.PRIVATE_COMPANY,
      countryId: country.id,
      currencyId: currency.id,
    },
    create: {
      name: "Demo Procurement Organization",
      legalName: "Demo Procurement Organization Inc.",
      email: "procurement@demoorganization.com",
      phone: "+1 202-555-0100",
      website: "https://demoorganization.com",
      address: "Washington, DC, United States",
      description:
        "Demo organization used for testing the TenderHub procurement workflow.",
      registrationNumber: "DEMO-US-001",
      taxNumber: "US-DEMO-001",
      organizationType: OrganizationType.PRIVATE_COMPANY,
      countryId: country.id,
      currencyId: currency.id,
    },
  });

  // ==========================================================
  // ORGANIZATION MEMBERSHIP
  // ==========================================================

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

  // ==========================================================
  // VENDOR REQUIREMENTS
  // ==========================================================

  console.log("Creating vendor master requirements...");

  const vendorRequirementDefinitions = [
    {
      code: "BUSINESS_REGISTRATION",
      name: "Business Registration",
      description:
        "Evidence that the vendor is legally registered to operate as a business.",
      purpose:
        "Confirm that the vendor is legally established and authorized to operate.",
      category: ComplianceCategory.REGISTRATION,
      required: true,
      validityDays: null,
      allowedDocumentCategories: [
        DocumentCategory.COMPANY_REGISTRATION_CERTIFICATE,
        DocumentCategory.CERTIFICATE_OF_INCORPORATION,
      ],
    },
    {
      code: "TAX_CLEARANCE",
      name: "Tax Clearance",
      description:
        "Current evidence of tax compliance issued by the relevant tax authority.",
      purpose:
        "Confirm that the vendor is compliant with applicable tax obligations.",
      category: ComplianceCategory.TAX,
      required: true,
      validityDays: 365,
      allowedDocumentCategories: [
        DocumentCategory.TAX_CLEARANCE_CERTIFICATE,
        DocumentCategory.TAX_IDENTIFICATION_CERTIFICATE,
      ],
    },
    {
      code: "TRADING_LICENSE",
      name: "Trading License",
      description:
        "Current license or permit authorizing the vendor to conduct its stated business activities.",
      purpose:
        "Confirm that the vendor is licensed to conduct its stated commercial activities.",
      category: ComplianceCategory.LICENSING,
      required: true,
      validityDays: 365,
      allowedDocumentCategories: [
        DocumentCategory.TRADING_LICENSE,
      ],
    },
    {
      code: "PROFESSIONAL_CERTIFICATION",
      name: "Professional Certification",
      description:
        "Relevant professional, technical, industry, or regulatory certification where applicable.",
      purpose:
        "Confirm that the vendor possesses required professional or technical credentials.",
      category: ComplianceCategory.PROFESSIONAL,
      required: true,
      validityDays: 365,
      allowedDocumentCategories: [
        DocumentCategory.PROFESSIONAL_CERTIFICATIONS,
        DocumentCategory.OTHER,
      ],
    },
    {
      code: "CONTRACTOR_LICENSE",
      name: "Contractor License",
      description:
        "Relevant contractor, construction, engineering, or industry license where applicable.",
      purpose:
        "Confirm that the vendor is appropriately licensed to undertake regulated works or contracting activities.",
      category: ComplianceCategory.LICENSING,
      required: true,
      validityDays: 365,
      allowedDocumentCategories: [
        DocumentCategory.TRADING_LICENSE,
        DocumentCategory.PROFESSIONAL_CERTIFICATIONS,
        DocumentCategory.OTHER,
      ],
    },
    {
      code: "RELEVANT_EXPERIENCE",
      name: "Relevant Experience",
      description:
        "Evidence demonstrating relevant experience delivering comparable goods, works, or services.",
      purpose:
        "Confirm that the vendor has successfully delivered comparable contracts or assignments.",
      category: ComplianceCategory.EXPERIENCE,
      required: true,
      validityDays: null,
      allowedDocumentCategories: [
        DocumentCategory.EXPERIENCE_CERTIFICATES,
        DocumentCategory.PREVIOUS_CONTRACTS,
        DocumentCategory.REFERENCES,
        DocumentCategory.OTHER,
      ],
    },
    {
      code: "FINANCIAL_CAPACITY",
      name: "Financial Capacity",
      description:
        "Evidence demonstrating the vendor's financial capacity to perform contractual obligations.",
      purpose:
        "Assess whether the vendor has sufficient financial capacity to perform contractual obligations.",
      category: ComplianceCategory.FINANCIAL,
      required: true,
      validityDays: null,
      allowedDocumentCategories: [
        DocumentCategory.FINANCIAL_STATEMENTS,
        DocumentCategory.BANK_ACCOUNT_CONFIRMATION,
        DocumentCategory.OTHER,
      ],
    },
    {
      code: "INSURANCE_CERTIFICATE",
      name: "Insurance Certificate",
      description:
        "Current evidence of relevant business, professional, liability, or other required insurance coverage.",
      purpose:
        "Confirm that the vendor maintains insurance appropriate to the nature and risk of its activities.",
      category: ComplianceCategory.INSURANCE,
      required: true,
      validityDays: 365,
      allowedDocumentCategories: [
        DocumentCategory.INSURANCE_CERTIFICATE,
        DocumentCategory.OTHER,
      ],
    },
    {
      code: "KEY_PERSONNEL_QUALIFICATIONS",
      name: "Key Personnel Qualifications",
      description:
        "Evidence of qualifications and experience of key personnel relevant to the vendor's services.",
      purpose:
        "Confirm that personnel responsible for delivery have appropriate qualifications and experience.",
      category: ComplianceCategory.PROFESSIONAL,
      required: true,
      validityDays: null,
      allowedDocumentCategories: [
        DocumentCategory.KEY_PERSONNEL_CV,
        DocumentCategory.PROFESSIONAL_CERTIFICATIONS,
        DocumentCategory.OTHER,
      ],
    },
    {
      code: "BANK_ACCOUNT_CONFIRMATION",
      name: "Bank Account Confirmation",
      description:
        "Evidence confirming the vendor's business bank account details.",
      purpose:
        "Confirm the existence and ownership of the business bank account used for payments.",
      category: ComplianceCategory.FINANCIAL,
      required: true,
      validityDays: null,
      allowedDocumentCategories: [
        DocumentCategory.BANK_ACCOUNT_CONFIRMATION,
        DocumentCategory.OTHER,
      ],
    },
    {
      code: "OWNERSHIP_INFORMATION",
      name: "Ownership Information",
      description:
        "Information identifying the vendor's ownership structure and beneficial ownership where applicable.",
      purpose:
        "Establish the vendor's ownership and beneficial ownership structure for compliance and due diligence.",
      category: ComplianceCategory.OWNERSHIP,
      required: true,
      validityDays: null,
      allowedDocumentCategories: [
        DocumentCategory.COMPANY_REGISTRATION_CERTIFICATE,
        DocumentCategory.OTHER,
      ],
    },
    {
      code: "MANUFACTURER_AUTHORIZATION",
      name: "Manufacturer Authorization",
      description:
        "Evidence of authorization from the manufacturer where the vendor is acting as an authorized distributor or reseller.",
      purpose:
        "Confirm that a distributor or reseller is authorized to supply the manufacturer's products.",
      category: ComplianceCategory.PROFESSIONAL,
      required: true,
      validityDays: 365,
      allowedDocumentCategories: [
        DocumentCategory.MANUFACTURER_AUTHORIZATION,
        DocumentCategory.OTHER,
      ],
    },
    {
      code: "QUALITY_CERTIFICATE",
      name: "Quality Certificate",
      description:
        "Relevant quality management, product quality, or industry quality certification where applicable.",
      purpose:
        "Confirm that the vendor or its products meet applicable quality standards.",
      category: ComplianceCategory.PROFESSIONAL,
      required: true,
      validityDays: 365,
      allowedDocumentCategories: [
        DocumentCategory.QUALITY_CERTIFICATE,
        DocumentCategory.PROFESSIONAL_CERTIFICATIONS,
        DocumentCategory.OTHER,
      ],
    },
  ];

  const vendorRequirements: Record<
    string,
    Awaited<ReturnType<typeof prisma.vendorRequirement.create>>
  > = {};

  for (const definition of vendorRequirementDefinitions) {
    const requirement = await prisma.vendorRequirement.upsert({
      where: {
        code: definition.code,
      },
      update: {
        name: definition.name,
        description: definition.description,
        purpose: definition.purpose,
        category: definition.category,
        required: definition.required,
        validityDays: definition.validityDays,
        allowedDocumentCategories: definition.allowedDocumentCategories,
        active: true,
      },
      create: {
        code: definition.code,
        name: definition.name,
        description: definition.description,
        purpose: definition.purpose,
        category: definition.category,
        required: definition.required,
        validityDays: definition.validityDays,
        allowedDocumentCategories: definition.allowedDocumentCategories,
        active: true,
      },
    });

    vendorRequirements[definition.code] = requirement;
  }

  // ==========================================================
  // VENDOR COMPANY TYPES
  // ==========================================================

  console.log("Creating vendor company types...");

  const vendorCompanyTypeDefinitions = [
    {
      code: "PRIVATE_COMPANY",
      name: "Private Company",
      description: "Privately owned commercial business.",
    },
    {
      code: "PUBLIC_COMPANY",
      name: "Public Company",
      description: "Publicly listed or publicly traded company.",
    },
    {
      code: "GOVERNMENT_ENTITY",
      name: "Government Entity",
      description: "Government-owned or government-controlled entity.",
    },
    {
      code: "NGO",
      name: "Non-Governmental Organization",
      description: "Non-governmental or charitable organization.",
    },
    {
      code: "INTERNATIONAL_NGO",
      name: "International NGO",
      description: "International non-governmental organization.",
    },
    {
      code: "PARTNERSHIP",
      name: "Partnership",
      description: "Business operated through a partnership structure.",
    },
    {
      code: "SOLE_PROPRIETOR",
      name: "Sole Proprietorship",
      description: "Business operated by an individual proprietor.",
    },
    {
      code: "COOPERATIVE",
      name: "Cooperative",
      description: "Member-owned cooperative organization.",
    },
  ];

  const vendorCompanyTypes: Record<
    string,
    Awaited<ReturnType<typeof prisma.vendorCompanyType.create>>
  > = {};

  for (const definition of vendorCompanyTypeDefinitions) {
    const companyType = await prisma.vendorCompanyType.upsert({
      where: {
        code: definition.code,
      },
      update: {
        name: definition.name,
        description: definition.description,
        active: true,
      },
      create: {
        code: definition.code,
        name: definition.name,
        description: definition.description,
        active: true,
      },
    });

    vendorCompanyTypes[definition.code] = companyType;
  }

  // ==========================================================
  // VENDOR INDUSTRIES
  // ==========================================================

  console.log("Creating vendor industries...");

  const vendorIndustryDefinitions = [
    {
      code: "ICT",
      name: "Information & Communication Technology",
      description:
        "Software, hardware, telecommunications, cloud, IT infrastructure and technology services.",
    },
    {
      code: "CONSTRUCTION",
      name: "Construction & Engineering",
      description:
        "Construction, civil works, engineering and related contracting services.",
    },
    {
      code: "PROFESSIONAL_SERVICES",
      name: "Professional Services",
      description:
        "Consulting, accounting, legal, audit, advisory and other professional services.",
    },
    {
      code: "FINANCIAL_SERVICES",
      name: "Financial Services",
      description:
        "Banking, insurance, payments, lending and other financial services.",
    },
    {
      code: "HEALTHCARE",
      name: "Healthcare",
      description:
        "Medical services, pharmaceuticals, medical equipment and healthcare supplies.",
    },
    {
      code: "GENERAL_SUPPLIES",
      name: "General Supplies",
      description:
        "General goods, office supplies, equipment and commercial products.",
    },
    {
      code: "MANUFACTURING",
      name: "Manufacturing",
      description:
        "Manufacturing, production and industrial processing.",
    },
    {
      code: "TRANSPORT_LOGISTICS",
      name: "Transport & Logistics",
      description:
        "Transport, freight, warehousing and logistics services.",
    },
    {
      code: "AGRICULTURE",
      name: "Agriculture",
      description:
        "Agriculture, agribusiness, agricultural inputs and related services.",
    },
    {
      code: "ENERGY",
      name: "Energy & Utilities",
      description:
        "Energy, electricity, utilities and related technical services.",
    },
  ];

  const vendorIndustries: Record<
    string,
    Awaited<ReturnType<typeof prisma.vendorIndustry.create>>
  > = {};

  for (const definition of vendorIndustryDefinitions) {
    const industry = await prisma.vendorIndustry.upsert({
      where: {
        code: definition.code,
      },
      update: {
        name: definition.name,
        description: definition.description,
        active: true,
      },
      create: {
        code: definition.code,
        name: definition.name,
        description: definition.description,
        active: true,
      },
    });

    vendorIndustries[definition.code] = industry;
  }

  // ==========================================================
  // VENDOR REQUIREMENT SET
  // ==========================================================

  console.log("Creating vendor requirement set...");

  const vendorRequirementSet =
    await prisma.vendorRequirementSet.upsert({
      where: {
        code: "STANDARD_VENDOR",
      },
      update: {
        name: "Standard Vendor Verification",
        description:
          "Standard TenderHub requirements used to verify vendors before they can participate in procurements.",
        active: true,
      },
      create: {
        code: "STANDARD_VENDOR",
        name: "Standard Vendor Verification",
        description:
          "Standard TenderHub requirements used to verify vendors before they can participate in procurements.",
        active: true,
      },
    });

  // ==========================================================
  // MAP REQUIREMENTS TO STANDARD SET
  // ==========================================================

  for (const definition of vendorRequirementDefinitions) {
    const requirement = vendorRequirements[definition.code];

    await prisma.vendorRequirementSetRequirement.upsert({
      where: {
        requirementSetId_requirementId: {
          requirementSetId: vendorRequirementSet.id,
          requirementId: requirement.id,
        },
      },
      update: {
        required: definition.required,
        active: true,
        purpose: definition.purpose,
        allowedDocumentCategories:
          definition.allowedDocumentCategories,
      },
      create: {
        id: crypto.randomUUID(),
        requirementSetId: vendorRequirementSet.id,
        requirementId: requirement.id,
        required: definition.required,
        active: true,
        purpose: definition.purpose,
        allowedDocumentCategories:
          definition.allowedDocumentCategories,
      },
    });
  }

  // ==========================================================
  // VENDOR REQUIREMENT RULES
  // ==========================================================

  console.log("Creating vendor requirement rules...");

  const vendorRequirementRuleDefinitions = [
    {
      companyType: "PRIVATE_COMPANY",
      industry: "ICT",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "PROFESSIONAL_CERTIFICATION",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "KEY_PERSONNEL_QUALIFICATIONS",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
      ],
    },
    {
      companyType: "PRIVATE_COMPANY",
      industry: "CONSTRUCTION",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "CONTRACTOR_LICENSE",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "INSURANCE_CERTIFICATE",
        "KEY_PERSONNEL_QUALIFICATIONS",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
      ],
    },
    {
      companyType: "PRIVATE_COMPANY",
      industry: "PROFESSIONAL_SERVICES",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "PROFESSIONAL_CERTIFICATION",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "KEY_PERSONNEL_QUALIFICATIONS",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
      ],
    },
    {
      companyType: "PRIVATE_COMPANY",
      industry: "FINANCIAL_SERVICES",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "PROFESSIONAL_CERTIFICATION",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "INSURANCE_CERTIFICATE",
        "KEY_PERSONNEL_QUALIFICATIONS",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
      ],
    },
    {
      companyType: "PRIVATE_COMPANY",
      industry: "HEALTHCARE",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "PROFESSIONAL_CERTIFICATION",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "INSURANCE_CERTIFICATE",
        "KEY_PERSONNEL_QUALIFICATIONS",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
        "QUALITY_CERTIFICATE",
      ],
    },
    {
      companyType: "PRIVATE_COMPANY",
      industry: "GENERAL_SUPPLIES",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
      ],
    },
    {
      companyType: "PRIVATE_COMPANY",
      industry: "MANUFACTURING",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "INSURANCE_CERTIFICATE",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
        "QUALITY_CERTIFICATE",
      ],
    },
    {
      companyType: "PRIVATE_COMPANY",
      industry: "TRANSPORT_LOGISTICS",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "INSURANCE_CERTIFICATE",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
      ],
    },
    {
      companyType: "PRIVATE_COMPANY",
      industry: "AGRICULTURE",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
        "QUALITY_CERTIFICATE",
      ],
    },
    {
      companyType: "PRIVATE_COMPANY",
      industry: "ENERGY",
      requirements: [
        "BUSINESS_REGISTRATION",
        "TAX_CLEARANCE",
        "TRADING_LICENSE",
        "PROFESSIONAL_CERTIFICATION",
        "RELEVANT_EXPERIENCE",
        "FINANCIAL_CAPACITY",
        "INSURANCE_CERTIFICATE",
        "KEY_PERSONNEL_QUALIFICATIONS",
        "BANK_ACCOUNT_CONFIRMATION",
        "OWNERSHIP_INFORMATION",
        "QUALITY_CERTIFICATE",
      ],
    },
  ];

  for (const ruleDefinition of vendorRequirementRuleDefinitions) {
    const companyType =
      vendorCompanyTypes[ruleDefinition.companyType];

    const industry =
      vendorIndustries[ruleDefinition.industry];

    for (
      let index = 0;
      index < ruleDefinition.requirements.length;
      index++
    ) {
      const requirementCode =
        ruleDefinition.requirements[index];

      const requirement =
        vendorRequirements[requirementCode];

      if (!companyType || !industry || !requirement) {
        throw new Error(
          `Invalid vendor requirement rule: ${ruleDefinition.companyType} + ${ruleDefinition.industry} + ${requirementCode}`,
        );
      }

      await prisma.vendorRequirementRule.upsert({
        where: {
          companyTypeId_industryId_requirementId: {
            companyTypeId: companyType.id,
            industryId: industry.id,
            requirementId: requirement.id,
          },
        },
        update: {
          required: true,
          purpose: requirement.purpose,
          allowedDocumentCategories:
            requirement.allowedDocumentCategories,
          priority: index + 1,
          active: true,
        },
        create: {
          companyTypeId: companyType.id,
          industryId: industry.id,
          requirementId: requirement.id,
          required: true,
          purpose: requirement.purpose,
          allowedDocumentCategories:
            requirement.allowedDocumentCategories,
          priority: index + 1,
          active: true,
        },
      });
    }
  }

  // ==========================================================
  // DEMO VENDOR CLASSIFICATION
  // ==========================================================

  const demoCompanyType =
    vendorCompanyTypes.PRIVATE_COMPANY;

  const demoIndustry =
    vendorIndustries.ICT;

  // ==========================================================
  // VENDOR APPLICATION
  // ==========================================================

  console.log("Creating demo vendor application...");

  const vendorApplication = await prisma.vendorApplication.upsert({
    where: {
      userId: vendorUser.id,
    },
    update: {
      requirementSetId: vendorRequirementSet.id,
      companyTypeId: demoCompanyType.id,
      industryId: demoIndustry.id,
      status: VendorApplicationStatus.APPROVED,

      companyName: "Demo Technology Solutions",
      legalName: "Demo Technology Solutions LLC",
      description:
        "Demo technology vendor used for testing TenderHub vendor and bidding workflows.",
      email: "vendor@demovendor.com",
      phone: "+1 202-555-0200",
      website: "https://demovendor.com",
      address: "Virginia, United States",
      registrationNumber: "VENDOR-US-001",
      taxNumber: "US-VENDOR-001",
      countryId: country.id,
      businessType: "Technology Services",
      numberOfEmployees: 45,
      yearsOperating: 8,
      operatingLocations: "United States",
      portfolioDescription:
        "Digital infrastructure, cloud services, software implementation, and technical support.",

      submittedAt: new Date("2026-09-20"),
      reviewedAt: new Date("2026-09-22"),
      approvedAt: new Date("2026-09-22"),
      rejectedAt: null,
      adminNotes: "Demo vendor approved for testing.",
      rejectionReason: null,
    },
    create: {
      userId: vendorUser.id,
      requirementSetId: vendorRequirementSet.id,
      companyTypeId: demoCompanyType.id,
      industryId: demoIndustry.id,
      status: VendorApplicationStatus.APPROVED,

      companyName: "Demo Technology Solutions",
      legalName: "Demo Technology Solutions LLC",
      description:
        "Demo technology vendor used for testing TenderHub vendor and bidding workflows.",
      email: "vendor@demovendor.com",
      phone: "+1 202-555-0200",
      website: "https://demovendor.com",
      address: "Virginia, United States",
      registrationNumber: "VENDOR-US-001",
      taxNumber: "US-VENDOR-001",
      countryId: country.id,
      businessType: "Technology Services",
      numberOfEmployees: 45,
      yearsOperating: 8,
      operatingLocations: "United States",
      portfolioDescription:
        "Digital infrastructure, cloud services, software implementation, and technical support.",

      submittedAt: new Date("2026-09-20"),
      reviewedAt: new Date("2026-09-22"),
      approvedAt: new Date("2026-09-22"),
      adminNotes: "Demo vendor approved for testing.",
    },
  });

  // ==========================================================
  // APPLICATION REQUIREMENTS
  // ==========================================================
  //
  // The application stores a snapshot of the requirements that
  // applied when the vendor submitted the application.
  //
  // Demo application is APPROVED, therefore its requirements
  // are marked SATISFIED.
  // ==========================================================

  const applicationRequirementCodes = [
    "BUSINESS_REGISTRATION",
    "TAX_CLEARANCE",
    "PROFESSIONAL_CERTIFICATION",
    "RELEVANT_EXPERIENCE",
    "FINANCIAL_CAPACITY",
  ];

  for (const requirementCode of applicationRequirementCodes) {
    const requirement =
      vendorRequirements[requirementCode];

    await prisma.vendorApplicationRequirement.upsert({
      where: {
        applicationId_requirementId: {
          applicationId: vendorApplication.id,
          requirementId: requirement.id,
        },
      },
      update: {
        code: requirement.code,
        name: requirement.name,
        description: requirement.description,
        purpose: requirement.purpose,
        category: requirement.category,
        required: true,
        allowedDocumentCategories:
          requirement.allowedDocumentCategories,
        status: VendorApplicationRequirementStatus.SATISFIED,
        notes: "Demo evidence accepted for testing.",
        reviewedAt: new Date("2026-09-22"),
        reviewedById: admin.id,
      },
      create: {
        id: crypto.randomUUID(),
        applicationId: vendorApplication.id,
        requirementId: requirement.id,
        code: requirement.code,
        name: requirement.name,
        description: requirement.description,
        purpose: requirement.purpose,
        category: requirement.category,
        required: true,
        allowedDocumentCategories:
          requirement.allowedDocumentCategories,
        status: VendorApplicationRequirementStatus.SATISFIED,
        notes: "Demo evidence accepted for testing.",
        reviewedAt: new Date("2026-09-22"),
        reviewedById: admin.id,
      },
    });
  }

  // ==========================================================
  // VENDOR
  // ==========================================================
  //
  // The Vendor master record represents the approved vendor.
  // Account creation itself does NOT create the Vendor record
  // in the intended production workflow. This demo seed creates
  // it because we want an approved vendor available for testing.
  // ==========================================================

  const vendor = await prisma.vendor.upsert({
    where: {
      userId: vendorUser.id,
    },
    update: {
      companyName: "Demo Technology Solutions",
      legalName: "Demo Technology Solutions LLC",
      description:
        "Demo technology vendor used for testing TenderHub vendor and bidding workflows.",
      email: "vendor@demovendor.com",
      phone: "+1 202-555-0200",
      website: "https://demovendor.com",
      address: "Virginia, United States",
      registrationNumber: "VENDOR-US-001",
      taxNumber: "US-VENDOR-001",
      countryId: country.id,
      businessType: "Technology Services",
      numberOfEmployees: 45,
      yearsOperating: 8,
      operatingLocations: "United States",
      portfolioDescription:
        "Digital infrastructure, cloud services, software implementation, and technical support.",
      companyTypeId: demoCompanyType.id,
      industryId: demoIndustry.id,
      verifiedAt: new Date("2026-09-22"),
      requirementSetId: vendorRequirementSet.id,
    },
    create: {
      userId: vendorUser.id,
      companyName: "Demo Technology Solutions",
      legalName: "Demo Technology Solutions LLC",
      description:
        "Demo technology vendor used for testing TenderHub vendor and bidding workflows.",
      email: "vendor@demovendor.com",
      phone: "+1 202-555-0200",
      website: "https://demovendor.com",
      address: "Virginia, United States",
      registrationNumber: "VENDOR-US-001",
      taxNumber: "US-VENDOR-001",
      countryId: country.id,
      businessType: "Technology Services",
      numberOfEmployees: 45,
      yearsOperating: 8,
      operatingLocations: "United States",
      portfolioDescription:
        "Digital infrastructure, cloud services, software implementation, and technical support.",
      companyTypeId: demoCompanyType.id,
      industryId: demoIndustry.id,
      verifiedAt: new Date("2026-09-22"),
      requirementSetId: vendorRequirementSet.id,
    },
  });

  // ==========================================================
  // PROCUREMENT
  // ==========================================================

  const procurement = await prisma.procurement.upsert({
    where: {
      referenceNumber: "PROC-US-2026-001",
    },
    update: {
      organizationId: organization.id,
      countryId: country.id,
      currencyId: currency.id,
      title: "Digital Infrastructure and Technology Procurement",
      description:
        "Procurement initiative for digital infrastructure, technology equipment, implementation services, and related support.",
      status: ProcurementStatus.ACTIVE,
      procurementMethod: ProcurementMethod.OPEN,
      estimatedValue: 500000,
      plannedStartDate: new Date("2026-10-01"),
      plannedEndDate: new Date("2027-09-30"),
    },
    create: {
      organizationId: organization.id,
      countryId: country.id,
      currencyId: currency.id,
      title: "Digital Infrastructure and Technology Procurement",
      description:
        "Procurement initiative for digital infrastructure, technology equipment, implementation services, and related support.",
      referenceNumber: "PROC-US-2026-001",
      status: ProcurementStatus.ACTIVE,
      procurementMethod: ProcurementMethod.OPEN,
      estimatedValue: 500000,
      plannedStartDate: new Date("2026-10-01"),
      plannedEndDate: new Date("2027-09-30"),
    },
  });

  // ==========================================================
  // SOLICITATION
  // ==========================================================

  const solicitation = await prisma.solicitation.upsert({
    where: {
      solicitationNumber: "SOL-US-2026-001",
    },
    update: {
      procurementId: procurement.id,
      organizationId: organization.id,
      currencyId: currency.id,
      title:
        "Request for Proposals — Digital Infrastructure Services",
      description:
        "The organization is seeking qualified vendors to provide digital infrastructure, implementation, integration, and ongoing technical support services.",
      status: SolicitationStatus.OPEN,
      type: SolicitationType.RFP,
      procurementMethod: ProcurementMethod.OPEN,
      publishedAt: new Date("2026-09-01"),
      openingDate: new Date("2026-09-01"),
      closingDate: new Date("2026-10-15T23:59:59"),
      estimatedValue: 500000,
      bidSecurityRequired: false,
      bidSecurityAmount: null,
      applicationFeeRequired: false,
      applicationFeeAmount: null,
    },
    create: {
      procurementId: procurement.id,
      organizationId: organization.id,
      currencyId: currency.id,
      solicitationNumber: "SOL-US-2026-001",
      title:
        "Request for Proposals — Digital Infrastructure Services",
      description:
        "The organization is seeking qualified vendors to provide digital infrastructure, implementation, integration, and ongoing technical support services.",
      status: SolicitationStatus.OPEN,
      type: SolicitationType.RFP,
      procurementMethod: ProcurementMethod.OPEN,
      publishedAt: new Date("2026-09-01"),
      openingDate: new Date("2026-09-01"),
      closingDate: new Date("2026-10-15T23:59:59"),
      estimatedValue: 500000,
      bidSecurityRequired: false,
      applicationFeeRequired: false,
    },
  });

  // ==========================================================
  // LOT
  // ==========================================================

  const lot = await prisma.lot.upsert({
    where: {
      solicitationId_number: {
        solicitationId: solicitation.id,
        number: 1,
      },
    },
    update: {
      title: "Digital Infrastructure and Implementation",
      description:
        "Supply, implementation, configuration, integration, and support of the required digital infrastructure.",
      estimatedValue: 500000,
      status: LotStatus.OPEN,
    },
    create: {
      solicitationId: solicitation.id,
      number: 1,
      title: "Digital Infrastructure and Implementation",
      description:
        "Supply, implementation, configuration, integration, and support of the required digital infrastructure.",
      estimatedValue: 500000,
      status: LotStatus.OPEN,
    },
  });

  // ==========================================================
  // PROCUREMENT REQUIREMENTS
  // ==========================================================

  const requirements = [
    {
      title: "Company Registration",
      description:
        "Vendor must provide valid evidence of legal business registration.",
      type: RequirementType.ELIGIBILITY,
      isMandatory: true,
      sortOrder: 1,
    },
    {
      title: "Relevant Experience",
      description:
        "Vendor must demonstrate relevant experience delivering comparable technology projects.",
      type: RequirementType.EXPERIENCE,
      isMandatory: true,
      sortOrder: 2,
    },
    {
      title: "Technical Proposal",
      description:
        "Vendor must provide a detailed technical proposal explaining the proposed solution and implementation approach.",
      type: RequirementType.TECHNICAL,
      isMandatory: true,
      sortOrder: 3,
    },
    {
      title: "Financial Capacity",
      description:
        "Vendor must demonstrate sufficient financial capacity to execute the contract.",
      type: RequirementType.FINANCIAL,
      isMandatory: true,
      sortOrder: 4,
    },
    {
      title: "Compliance Documentation",
      description:
        "Vendor must provide all applicable compliance and regulatory documentation.",
      type: RequirementType.COMPLIANCE,
      isMandatory: true,
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

    if (existing) {
      await prisma.requirement.update({
        where: {
          id: existing.id,
        },
        data: {
          lotId: lot.id,
          description: requirement.description,
          type: requirement.type,
          isMandatory: requirement.isMandatory,
          sortOrder: requirement.sortOrder,
        },
      });
    } else {
      await prisma.requirement.create({
        data: {
          solicitationId: solicitation.id,
          lotId: lot.id,
          title: requirement.title,
          description: requirement.description,
          type: requirement.type,
          isMandatory: requirement.isMandatory,
          sortOrder: requirement.sortOrder,
        },
      });
    }
  }

  // ==========================================================
  // EVALUATION CRITERIA
  // ==========================================================

  const criteria = [
    {
      name: "Technical Approach",
      description:
        "Quality, completeness, feasibility, and technical soundness of the proposed solution.",
      weight: 35,
      maxScore: 100,
      sortOrder: 1,
    },
    {
      name: "Relevant Experience",
      description:
        "Demonstrated experience delivering similar projects successfully.",
      weight: 20,
      maxScore: 100,
      sortOrder: 2,
    },
    {
      name: "Implementation Methodology",
      description:
        "Quality of the implementation plan, project management approach, and delivery timeline.",
      weight: 20,
      maxScore: 100,
      sortOrder: 3,
    },
    {
      name: "Financial Proposal",
      description:
        "Competitiveness, transparency, and overall value of the financial proposal.",
      weight: 25,
      maxScore: 100,
      sortOrder: 4,
    },
  ];

  for (const criterion of criteria) {
    const existing =
      await prisma.evaluationCriterion.findFirst({
        where: {
          solicitationId: solicitation.id,
          name: criterion.name,
        },
      });

    if (existing) {
      await prisma.evaluationCriterion.update({
        where: {
          id: existing.id,
        },
        data: {
          description: criterion.description,
          weight: criterion.weight,
          maxScore: criterion.maxScore,
          sortOrder: criterion.sortOrder,
        },
      });
    } else {
      await prisma.evaluationCriterion.create({
        data: {
          solicitationId: solicitation.id,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight,
          maxScore: criterion.maxScore,
          sortOrder: criterion.sortOrder,
        },
      });
    }
  }

  // ==========================================================
  // NEWS
  // ==========================================================

  await prisma.news.upsert({
    where: {
      slug: "welcome-to-tenderhub",
    },
    update: {
      title: "Welcome to TenderHub",
      summary:
        "TenderHub provides a modern digital procurement environment for organizations and vendors.",
      content:
        "TenderHub connects organizations and vendors through a structured procurement workflow covering solicitations, bids, evaluations, awards, and contracts.",
      published: true,
    },
    create: {
      title: "Welcome to TenderHub",
      slug: "welcome-to-tenderhub",
      summary:
        "TenderHub provides a modern digital procurement environment for organizations and vendors.",
      content:
        "TenderHub connects organizations and vendors through a structured procurement workflow covering solicitations, bids, evaluations, awards, and contracts.",
      published: true,
    },
  });

  // ==========================================================
  // SEED SUMMARY
  // ==========================================================

  console.log("");
  console.log("========================================");
  console.log("✅ TenderHub seed completed successfully.");
  console.log("========================================");
  console.log("");

  console.log("Demo accounts:");
  console.log("----------------------------------------");

  console.log("Admin:");
  console.log("  Email: admin@tenderhub.com");
  console.log("  Password: Admin@12345");
  console.log("");

  console.log("Organization:");
  console.log("  Email: procurement@demoorganization.com");
  console.log("  Password: Organization@12345");
  console.log("");

  console.log("Vendor:");
  console.log("  Email: vendor@demovendor.com");
  console.log("  Password: Vendor@12345");
  console.log("----------------------------------------");
  console.log("");

  console.log(`Country: ${country.name}`);
  console.log(`Currency: ${currency.name}`);
  console.log(`Organization: ${organization.name}`);
  console.log(`Vendor: ${vendor.companyName}`);
  console.log(`Vendor ID: ${vendor.id}`);
  console.log(`Vendor verified: ${vendor.verifiedAt ? "YES" : "NO"}`);
  console.log(
    `Vendor company type: ${demoCompanyType.name}`,
  );
  console.log(`Vendor industry: ${demoIndustry.name}`);
  console.log(
    `Vendor requirement set: ${vendorRequirementSet.name}`,
  );
  console.log(
    `Vendor master requirements: ${vendorRequirementDefinitions.length}`,
  );
  console.log(
    `Application requirements: ${applicationRequirementCodes.length}`,
  );
  console.log(
    `Vendor application status: ${vendorApplication.status}`,
  );
  console.log(`Procurement: ${procurement.referenceNumber}`);
  console.log(`Solicitation: ${solicitation.solicitationNumber}`);
  console.log(`Lot: ${lot.title}`);
  console.log(
    `Procurement requirements: ${requirements.length}`,
  );
  console.log(`Evaluation criteria: ${criteria.length}`);
  console.log(`Admin user ID: ${admin.id}`);
  console.log("");
}

main()
  .catch((error) => {
    console.error("❌ TenderHub seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });