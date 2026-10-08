import Link from "next/link";

import { prisma } from "@/lib/db/prisma";

interface BillingSettingsPageProps {
    searchParams: Promise<{
        organizationId?: string;
    }>;
}

const ORGANIZATION_PLANS = [
    {
        key: "ORGANIZATION_STARTER",
        name: "Starter",
        description: "For organizations getting started with digital procurement.",
        price: 0,
        activeLimit: "1 active procurement",
    },
    {
        key: "ORGANIZATION_PROFESSIONAL",
        name: "Professional",
        description:
            "For organizations managing a larger and more active procurement pipeline.",
        price: 150000,
        activeLimit: "Expanded procurement capacity",
    },
    {
        key: "ORGANIZATION_ENTERPRISE",
        name: "Enterprise",
        description:
            "For organizations requiring enterprise-level procurement capabilities.",
        price: 0,
        activeLimit: "Custom capacity",
    },
] as const;

function formatCurrency(amount: number, currency = "UGX") {
    return new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatPlan(plan: string) {
    return plan
        .replace("ORGANIZATION_", "")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatus(status: string) {
    return status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(status: string) {
    switch (status) {
        case "ACTIVE":
            return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";

        case "PENDING":
            return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";

        case "CANCELLED":
            return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";

        case "EXPIRED":
            return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";

        default:
            return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
    }
}

export default async function BillingSettingsPage({
    searchParams,
}: BillingSettingsPageProps) {
    const params = await searchParams;
    const organizationId = params.organizationId;

    if (!organizationId) {
        return (
            <div className="space-y-8">
                <div>
                    <Link
                        href="/dashboard/organization/settings"
                        className="text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                        ← Organization Settings
                    </Link>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        Billing
                    </h1>

                    <p className="mt-1 text-sm text-slate-600">
                        Manage your organization subscription and billing activity.
                    </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                    <h2 className="text-base font-semibold text-amber-900">
                        Organization not selected
                    </h2>

                    <p className="mt-2 text-sm text-amber-800">
                        Select an organization from the organization switcher before
                        viewing its billing information.
                    </p>
                </div>
            </div>
        );
    }

    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            name: true,
        },
    });

    if (!organization) {
        return (
            <div className="space-y-8">
                <div>
                    <Link
                        href="/dashboard/organization/settings"
                        className="text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                        ← Organization Settings
                    </Link>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        Billing
                    </h1>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <h2 className="text-base font-semibold text-red-900">
                        Organization not found
                    </h2>

                    <p className="mt-2 text-sm text-red-800">
                        The selected organization could not be found.
                    </p>
                </div>
            </div>
        );
    }

    const members = await prisma.organizationMember.findMany({
        where: {
            organizationId: organization.id,
        },
        select: {
            userId: true,
        },
        distinct: ["userId"],
    });

    const userIds = members.map((member) => member.userId);

    const [subscriptions, payments] = await Promise.all([
        userIds.length > 0
            ? prisma.subscription.findMany({
                where: {
                    userId: {
                        in: userIds,
                    },
                    plan: {
                        in: [
                            "ORGANIZATION_STARTER",
                            "ORGANIZATION_PROFESSIONAL",
                            "ORGANIZATION_ENTERPRISE",
                        ],
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                take: 20,
            })
            : [],
        userIds.length > 0
            ? prisma.payment.findMany({
                where: {
                    userId: {
                        in: userIds,
                    },
                    type: "SUBSCRIPTION",
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 20,
            })
            : [],
    ]);

    const currentSubscription = subscriptions[0] ?? null;

    const currentPlan =
        currentSubscription?.plan ?? "ORGANIZATION_STARTER";

    const currentStatus = currentSubscription?.status ?? "ACTIVE";

    const currentPrice = currentSubscription
        ? Number(currentSubscription.price)
        : 0;

    const paidPayments = payments.filter(
        (payment) => payment.status === "PAID",
    );

    const totalPaid = paidPayments.reduce(
        (total, payment) => total + Number(payment.amount),
        0,
    );

    return (
        <div className="space-y-8">
            <div>
                <Link
                    href="/dashboard/organization/settings"
                    className="text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                    ← Organization Settings
                </Link>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Billing
                        </h1>

                        <p className="mt-1 text-sm text-slate-600">
                            Manage the subscription and billing activity for{" "}
                            {organization.name}.
                        </p>
                    </div>

                    <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        View Plans
                    </Link>
                </div>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
                <BillingMetric
                    label="Current Plan"
                    value={formatPlan(currentPlan)}
                    description="Organization subscription"
                />

                <BillingMetric
                    label="Subscription Status"
                    value={formatStatus(currentStatus)}
                    description={
                        currentSubscription?.autoRenew
                            ? "Automatic renewal enabled"
                            : "Automatic renewal disabled"
                    }
                />

                <BillingMetric
                    label="Plan Price"
                    value={
                        currentPlan === "ORGANIZATION_ENTERPRISE"
                            ? "Custom"
                            : formatCurrency(currentPrice)
                    }
                    description={
                        currentPlan === "ORGANIZATION_ENTERPRISE"
                            ? "Contact TenderHub for pricing"
                            : "Current subscription price"
                    }
                />
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Current Subscription
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Details of the organization subscription currently associated with
                        this workspace.
                    </p>
                </div>

                {currentSubscription ? (
                    <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">
                        <DetailItem
                            label="Plan"
                            value={formatPlan(currentSubscription.plan)}
                        />

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Status
                            </p>

                            <div className="mt-2">
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                                        currentSubscription.status,
                                    )}`}
                                >
                                    {formatStatus(currentSubscription.status)}
                                </span>
                            </div>
                        </div>

                        <DetailItem
                            label="Price"
                            value={
                                currentSubscription.plan === "ORGANIZATION_ENTERPRISE"
                                    ? "Custom"
                                    : formatCurrency(Number(currentSubscription.price))
                            }
                        />

                        <DetailItem
                            label="Auto Renewal"
                            value={currentSubscription.autoRenew ? "Enabled" : "Disabled"}
                        />

                        <DetailItem
                            label="Start Date"
                            value={currentSubscription.startDate.toLocaleDateString(
                                "en-UG",
                            )}
                        />

                        <DetailItem
                            label="End Date"
                            value={
                                currentSubscription.endDate
                                    ? currentSubscription.endDate.toLocaleDateString("en-UG")
                                    : "No end date"
                            }
                        />

                        <DetailItem
                            label="Created"
                            value={currentSubscription.createdAt.toLocaleDateString(
                                "en-UG",
                            )}
                        />

                        <DetailItem
                            label="Last Updated"
                            value={currentSubscription.updatedAt.toLocaleDateString(
                                "en-UG",
                            )}
                        />
                    </div>
                ) : (
                    <div className="p-6">
                        <p className="text-sm text-slate-600">
                            No organization subscription record was found. The workspace is
                            currently treated as being on the Starter plan.
                        </p>
                    </div>
                )}
            </section>

            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Organization Plans
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Available subscription plans for organizations using TenderHub.
                    </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    {ORGANIZATION_PLANS.map((plan) => {
                        const isCurrent = plan.key === currentPlan;

                        return (
                            <div
                                key={plan.key}
                                className={`rounded-xl border bg-white p-6 shadow-sm ${isCurrent
                                        ? "border-tenderhub-gold ring-1 ring-tenderhub-gold"
                                        : "border-slate-200"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {plan.name}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {plan.description}
                                        </p>
                                    </div>

                                    {isCurrent && (
                                        <span className="shrink-0 rounded-full bg-tenderhub-gold/15 px-2.5 py-1 text-xs font-semibold text-slate-800">
                                            Current
                                        </span>
                                    )}
                                </div>

                                <div className="mt-6">
                                    {plan.key === "ORGANIZATION_ENTERPRISE" ? (
                                        <p className="text-2xl font-bold text-slate-900">
                                            Custom
                                        </p>
                                    ) : (
                                        <p className="text-2xl font-bold text-slate-900">
                                            {formatCurrency(plan.price)}
                                            <span className="ml-1 text-sm font-normal text-slate-500">
                                                / month
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
                                    <p className="text-sm font-medium text-slate-700">
                                        {plan.activeLimit}
                                    </p>
                                </div>

                                {!isCurrent && (
                                    <Link
                                        href="/pricing"
                                        className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        View Plan
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Payment Summary
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Subscription payments associated with organization members.
                        </p>
                    </div>

                    <div className="text-sm">
                        <span className="text-slate-500">Total paid: </span>

                        <span className="font-semibold text-slate-900">
                            {formatCurrency(totalPaid)}
                        </span>
                    </div>
                </div>

                {payments.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-sm font-medium text-slate-700">
                            No subscription payments found.
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Payment activity will appear here when subscription payments are
                            recorded.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <TableHeader>Reference</TableHeader>
                                    <TableHeader>Amount</TableHeader>
                                    <TableHeader>Currency</TableHeader>
                                    <TableHeader>Status</TableHeader>
                                    <TableHeader>Provider</TableHeader>
                                    <TableHeader>Date</TableHeader>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200 bg-white">
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <TableCell>
                                            <span className="font-medium text-slate-900">
                                                {payment.reference}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            {Number(payment.amount).toLocaleString("en-UG")}
                                        </TableCell>

                                        <TableCell>{payment.currencyId || "—"}</TableCell>

                                        <TableCell>
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                                                    payment.status,
                                                )}`}
                                            >
                                                {formatStatus(payment.status)}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            {payment.provider || "Not specified"}
                                        </TableCell>

                                        <TableCell>
                                            {payment.createdAt.toLocaleDateString("en-UG")}
                                        </TableCell>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                    Billing Information
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    TenderHub records subscription payments against the users associated
                    with an organization. Subscription and payment records are retained
                    separately so billing activity can be reviewed independently from
                    procurement activity.
                </p>

                <div className="mt-5">
                    <Link
                        href="/dashboard/organization/settings"
                        className="text-sm font-semibold text-tenderhub-navy hover:underline"
                    >
                        Return to organization settings →
                    </Link>
                </div>
            </section>
        </div>
    );
}

function BillingMetric({
    label,
    value,
    description,
}: {
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>

            <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
    );
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>

            <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
        </div>
    );
}

function TableHeader({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {children}
        </th>
    );
}

function TableCell({ children }: { children: React.ReactNode }) {
    return (
        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
            {children}
        </td>
    );
}