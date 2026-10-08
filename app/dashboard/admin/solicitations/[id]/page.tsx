import { notFound } from "next/navigation";

interface AdminSolicitationDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminSolicitationDetailsPage({
  params,
}: AdminSolicitationDetailsPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-tenderhub-navy">
          Solicitation Details
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Solicitation ID: {id}
        </p>
      </div>
    </main>
  );
}
