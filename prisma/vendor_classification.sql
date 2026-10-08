-- AlterTable
ALTER TABLE "Currency" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "companyTypeId" TEXT,
ADD COLUMN     "industryId" TEXT;

-- AlterTable
ALTER TABLE "VendorApplication" ADD COLUMN     "companyTypeId" TEXT,
ADD COLUMN     "industryId" TEXT;

-- CreateIndex
CREATE INDEX "Vendor_companyTypeId_idx" ON "Vendor"("companyTypeId");

-- CreateIndex
CREATE INDEX "Vendor_industryId_idx" ON "Vendor"("industryId");

-- CreateIndex
CREATE INDEX "VendorApplication_companyTypeId_idx" ON "VendorApplication"("companyTypeId");

-- CreateIndex
CREATE INDEX "VendorApplication_industryId_idx" ON "VendorApplication"("industryId");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_companyTypeId_fkey" FOREIGN KEY ("companyTypeId") REFERENCES "VendorCompanyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "VendorIndustry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorApplication" ADD CONSTRAINT "VendorApplication_companyTypeId_fkey" FOREIGN KEY ("companyTypeId") REFERENCES "VendorCompanyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorApplication" ADD CONSTRAINT "VendorApplication_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "VendorIndustry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
