import { notFound } from "next/navigation";

interface AdminUserDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminUserDetailsPage({
  params,
}: AdminUserDetailsPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-tenderhub-navy">
          User Details
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          User ID: {id}
        </p>
      </div>
    </main>
  );
}
