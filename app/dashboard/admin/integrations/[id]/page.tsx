import { notFound } from "next/navigation";

interface AdminIntegrationDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminIntegrationDetailsPage({
  params,
}: AdminIntegrationDetailsPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Integration Details
        </h1>

        <p className="text-sm text-gray-500">
          Integration ID: {id}
        </p>
      </div>
    </main>
  );
}
