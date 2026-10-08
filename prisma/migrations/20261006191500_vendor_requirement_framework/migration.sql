-- AlterTable
ALTER TABLE "VendorApplicationEvidence" ADD COLUMN     "fileHash" TEXT;

-- AlterTable
ALTER TABLE "VendorApplicationRequirement" ADD COLUMN     "allowedDocumentCategories" "DocumentCategory"[] DEFAULT ARRAY[]::"DocumentCategory"[],
ADD COLUMN     "purpose" TEXT;

-- AlterTable
ALTER TABLE "VendorRequirement" ADD COLUMN     "purpose" TEXT;

-- AlterTable
ALTER TABLE "VendorRequirementSet" ADD COLUMN     "companyTypeId" TEXT,
ADD COLUMN     "industryId" TEXT;

-- AlterTable
ALTER TABLE "VendorRequirementSetRequirement" ADD COLUMN     "allowedDocumentCategories" "DocumentCategory"[] DEFAULT ARRAY[]::"DocumentCategory"[],
ADD COLUMN     "purpose" TEXT;

-- CreateTable
CREATE TABLE "VendorCompanyType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCompanyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorIndustry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorIndustry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRequirementRule" (
    "id" TEXT NOT NULL,
    "companyTypeId" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "purpose" TEXT,
    "allowedDocumentCategories" "DocumentCategory"[] DEFAULT ARRAY[]::"DocumentCategory"[],
    "priority" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRequirementRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorCompanyType_code_key" ON "VendorCompanyType"("code");

-- CreateIndex
CREATE INDEX "VendorCompanyType_active_idx" ON "VendorCompanyType"("active");

-- CreateIndex
CREATE UNIQUE INDEX "VendorIndustry_code_key" ON "VendorIndustry"("code");

-- CreateIndex
CREATE INDEX "VendorIndustry_active_idx" ON "VendorIndustry"("active");

-- CreateIndex
CREATE INDEX "VendorRequirementRule_companyTypeId_idx" ON "VendorRequirementRule"("companyTypeId");

-- CreateIndex
CREATE INDEX "VendorRequirementRule_industryId_idx" ON "VendorRequirementRule"("industryId");

-- CreateIndex
CREATE INDEX "VendorRequirementRule_requirementId_idx" ON "VendorRequirementRule"("requirementId");

-- CreateIndex
CREATE INDEX "VendorRequirementRule_active_idx" ON "VendorRequirementRule"("active");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRequirementRule_companyTypeId_industryId_requirementI_key" ON "VendorRequirementRule"("companyTypeId", "industryId", "requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorApplicationEvidence_applicationId_fileHash_key" ON "VendorApplicationEvidence"("applicationId", "fileHash");

-- CreateIndex
CREATE INDEX "VendorRequirementSet_companyTypeId_idx" ON "VendorRequirementSet"("companyTypeId");

-- CreateIndex
CREATE INDEX "VendorRequirementSet_industryId_idx" ON "VendorRequirementSet"("industryId");

-- AddForeignKey
ALTER TABLE "VendorRequirementRule" ADD CONSTRAINT "VendorRequirementRule_companyTypeId_fkey" FOREIGN KEY ("companyTypeId") REFERENCES "VendorCompanyType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRequirementRule" ADD CONSTRAINT "VendorRequirementRule_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "VendorIndustry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRequirementRule" ADD CONSTRAINT "VendorRequirementRule_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "VendorRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRequirementSet" ADD CONSTRAINT "VendorRequirementSet_companyTypeId_fkey" FOREIGN KEY ("companyTypeId") REFERENCES "VendorCompanyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRequirementSet" ADD CONSTRAINT "VendorRequirementSet_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "VendorIndustry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
