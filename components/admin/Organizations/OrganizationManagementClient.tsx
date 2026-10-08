"use client";

import { useRouter } from "next/navigation";
import OrganizationManagement, {
  type ManagedOrganization,
} from "@/components/admin/Organizations/OrganizationManagement";

interface OrganizationManagementClientProps {
  organizations: ManagedOrganization[];
}

export default function OrganizationManagementClient({
  organizations,
}: OrganizationManagementClientProps) {
  const router = useRouter();

  const handleReview = (
    organization: ManagedOrganization,
  ) => {
    router.push(
      `/dashboard/admin/organizations/${organization.id}/verification`,
    );
  };

  return (
    <OrganizationManagement
      organizations={organizations}
      onReview={handleReview}
    />
  );
}