import SolicitationManagement, {
  type ManagedSolicitation,
} from "@/components/admin/SolicitationManagement";
import { prisma } from "@/lib/db/prisma";

export default async function AdminSolicitationsPage() {
  const solicitations =
    await prisma.solicitation.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        solicitationNumber: true,
        title: true,
        description: true,
        status: true,
        type: true,
        procurementMethod: true,
        organizationId: true,
        procurementId: true,
        publishedAt: true,
        openingDate: true,
        closingDate: true,
        estimatedValue: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            name: true,
          },
        },
        currency: {
          select: {
            code: true,
          },
        },
      },
    });

  const managedSolicitations: ManagedSolicitation[] =
    solicitations.map((solicitation) => ({
      id: solicitation.id,
      solicitationNumber:
        solicitation.solicitationNumber,
      title: solicitation.title,
      description: solicitation.description,
      status: solicitation.status,
      type: solicitation.type,
      procurementMethod:
        solicitation.procurementMethod,
      organizationId:
        solicitation.organizationId,
      organizationName:
        solicitation.organization?.name ?? null,
      procurementId:
        solicitation.procurementId,
      publishedAt:
        solicitation.publishedAt,
      openingDate:
        solicitation.openingDate,
      closingDate:
        solicitation.closingDate,
      estimatedValue:
        solicitation.estimatedValue
          ? Number(solicitation.estimatedValue)
          : null,
      currency:
        solicitation.currency?.code ?? null,
      createdAt:
        solicitation.createdAt,
      updatedAt:
        solicitation.updatedAt,
    }));

  return (
    <SolicitationManagement
      solicitations={managedSolicitations}
    />
  );
}