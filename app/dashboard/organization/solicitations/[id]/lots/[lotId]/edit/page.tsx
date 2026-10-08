import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Card from "@/components/ui/Card";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import EditLotFormClient from "./EditLotFormClient";

export const dynamic = "force-dynamic";

interface EditLotPageProps {
  params: Promise<{
    id: string;
    lotId: string;
  }>;
}

export default async function EditLotPage({
  params,
}: EditLotPageProps) {
  const { id: solicitationId, lotId } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const membership =
    await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        organizationId: true,
      },
    });

  if (!membership) {
    redirect("/dashboard");
  }

  const lot = await prisma.lot.findFirst({
    where: {
      id: lotId,
      solicitationId,
      solicitation: {
        organizationId: membership.organizationId,
      },
    },
    include: {
      solicitation: {
        include: {
          procurement: {
            include: {
              currency: true,
            },
          },
        },
      },
    },
  });

  if (!lot) {
    notFound();
  }

  const solicitation = lot.solicitation;

  if (solicitation.status !== "DRAFT") {
    redirect(
      `/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}`,
    );
  }

  const initialValues = {
    number: String(lot.number),
    title: lot.title,
    description: lot.description ?? "",
    estimatedValue:
      lot.estimatedValue !== null &&
      lot.estimatedValue !== undefined
        ? String(lot.estimatedValue)
        : "",
    status: lot.status,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back to Lot
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-gray-900">
          Edit Lot
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Update the lot details for this solicitation.
        </p>
      </div>

      <Card>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {solicitation.title}
          </h2>

          <p className="text-sm text-gray-600">
            Solicitation:{" "}
            <span className="font-medium text-gray-900">
              {solicitation.procurement.referenceNumber}
            </span>
          </p>

          <p className="text-sm text-gray-600">
            Parent Procurement:{" "}
            <span className="font-medium text-gray-900">
              {solicitation.procurement.referenceNumber}
            </span>{" "}
            - {solicitation.procurement.title}
          </p>
        </div>
      </Card>

      <EditLotFormClient
        lotId={lot.id}
        solicitationId={solicitationId}
        currencyCode={
          solicitation.procurement.currency?.code ?? null
        }
        initialValues={initialValues}
      />
    </div>
  );
}