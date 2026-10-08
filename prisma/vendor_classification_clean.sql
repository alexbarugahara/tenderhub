ALTER TABLE "Vendor" ADD COLUMN "companyTypeId" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "industryId" TEXT;

ALTER TABLE "VendorApplication" ADD COLUMN "companyTypeId" TEXT;
ALTER TABLE "VendorApplication" ADD COLUMN "industryId" TEXT;

CREATE INDEX "Vendor_companyTypeId_idx" ON "Vendor"("companyTypeId");
CREATE INDEX "Vendor_industryId_idx" ON "Vendor"("industryId");

CREATE INDEX "VendorApplication_companyTypeId_idx" ON "VendorApplication"("companyTypeId");
CREATE INDEX "VendorApplication_industryId_idx" ON "VendorApplication"("industryId");

ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_companyTypeId_fkey"
  FOREIGN KEY ("companyTypeId") REFERENCES "VendorCompanyType"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_industryId_fkey"
  FOREIGN KEY ("industryId") REFERENCES "VendorIndustry"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VendorApplication" ADD CONSTRAINT "VendorApplication_companyTypeId_fkey"
  FOREIGN KEY ("companyTypeId") REFERENCES "VendorCompanyType"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VendorApplication" ADD CONSTRAINT "VendorApplication_industryId_fkey"
  FOREIGN KEY ("industryId") REFERENCES "VendorIndustry"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
