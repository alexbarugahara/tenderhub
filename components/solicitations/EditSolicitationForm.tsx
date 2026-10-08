"use client";

import { useRouter } from "next/navigation";

import SolicitationForm, {
  type SolicitationFormProps,
  type SolicitationFormValues,
} from "@/components/solicitations/SolicitationForm";

interface EditSolicitationFormProps {
  solicitationId: string;
  initialValues: Partial<SolicitationFormValues>;
  procurement: SolicitationFormProps["procurement"];
}

export default function EditSolicitationForm({
  solicitationId,
  initialValues,
  procurement,
}: EditSolicitationFormProps) {
  const router = useRouter();

  function handleCancel() {
    router.push(
      `/dashboard/organization/solicitations/${solicitationId}`,
    );
  }

  return (
    <SolicitationForm
      initialValues={initialValues}
      procurement={procurement}
      apiEndpoint={`/api/solicitations/${solicitationId}`}
      apiMethod="PATCH"
      submitLabel="Save Changes"
      onCancel={handleCancel}
    />
  );
}