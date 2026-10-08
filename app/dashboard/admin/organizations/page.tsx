import OrganizationManagementClient from "@/components/admin/Organizations/OrganizationManagementClient";
import type { ManagedOrganization } from "@/components/admin/Organizations/OrganizationManagement";
import { prisma } from "@/lib/db/prisma";

export default async function AdminOrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      legalName: true,
      email: true,
      phone: true,
      website: true,
      address: true,
      organizationType: true,
      registrationNumber: true,
      taxNumber: true,
      countryId: true,
      currencyId: true,
      verifiedAt: true,
      createdAt: true,
      updatedAt: true,

      verification: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
          adminNotes: true,
        },
      },
    },
  });

  const managedOrganizations: ManagedOrganization[] =
    organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      legalName: organization.legalName,
      email: organization.email,
      phone: organization.phone,
      website: organization.website,
      address: organization.address,
      organizationType: organization.organizationType,
      registrationNumber: organization.registrationNumber,
      taxNumber: organization.taxNumber,
      countryId: organization.countryId,
      currencyId: organization.currencyId,
      verifiedAt: organization.verifiedAt,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,

      verification: organization.verification
        ? {
            id: organization.verification.id,
            status:
              organization.verification.status,
            submittedAt:
              organization.verification.submittedAt,
            reviewedAt:
              organization.verification.reviewedAt,
            rejectionReason:
              organization.verification.rejectionReason,
            adminNotes:
              organization.verification.adminNotes,
          }
        : null,
    }));

  return (
    <OrganizationManagementClient
      organizations={managedOrganizations}
    />
  );
}