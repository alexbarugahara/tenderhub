import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { DocumentCategory, Prisma } from "@prisma/client";
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronRight,
    Info,
    Layers3,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import {
    generateRequirementSetCode,
    generateRequirementSetDescription,
    generateRequirementSetName,
} from "@/lib/vendor-onboarding/classification";

type SearchParams = {
    companyTypeId?: string;
    industryId?: string;
};

type RequirementRuleWithRequirement =
    Prisma.VendorRequirementRuleGetPayload<{
        include: {
            requirement: {
                select: {
                    id: true;
                    code: true;
                    name: true;
                    description: true;
                    purpose: true;
                    category: true;
                    required: true;
                    allowedDocumentCategories: true;
                    active: true;
                };
            };
        };
    }>;

async function createRequirementSet(formData: FormData) {
    "use server";

    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const companyTypeId = String(
        formData.get("companyTypeId") ?? "",
    ).trim();

    const industryId = String(
        formData.get("industryId") ?? "",
    ).trim();

    const active = formData.get("active") === "on";

    if (!companyTypeId) {
        throw new Error("Company type is required.");
    }

    if (!industryId) {
        throw new Error("Industry is required.");
    }

    const [companyType, industry] = await Promise.all([
        prisma.vendorCompanyType.findUnique({
            where: {
                id: companyTypeId,
            },
            select: {
                id: true,
                code: true,
                name: true,
                active: true,
            },
        }),

        prisma.vendorIndustry.findUnique({
            where: {
                id: industryId,
            },
            select: {
                id: true,
                code: true,
                name: true,
                active: true,
            },
        }),
    ]);

    if (!companyType) {
        throw new Error("Selected company type was not found.");
    }

    if (!industry) {
        throw new Error("Selected industry was not found.");
    }

    if (!companyType.active) {
        throw new Error("Selected company type is inactive.");
    }

    if (!industry.active) {
        throw new Error("Selected industry is inactive.");
    }

    const name = generateRequirementSetName(
        companyType.name,
        industry.name,
    );

    const code = generateRequirementSetCode(
        companyType.code,
        industry.code,
    );

    const description = generateRequirementSetDescription(
        companyType.name,
        industry.name,
    );

    const existing = await prisma.vendorRequirementSet.findFirst({
        where: {
            OR: [
                {
                    code,
                },
                {
                    companyTypeId,
                    industryId,
                },
            ],
        },
        select: {
            id: true,
            code: true,
            companyTypeId: true,
            industryId: true,
        },
    });

    if (existing) {
        if (existing.code === code) {
            throw new Error(
                `A requirement set with code ${code} already exists.`,
            );
        }

        throw new Error(
            "A requirement set already exists for this company type and industry.",
        );
    }

    const rules: RequirementRuleWithRequirement[] =
        await prisma.vendorRequirementRule.findMany({
            where: {
                companyTypeId,
                industryId,
                active: true,
                requirement: {
                    active: true,
                },
            },
            include: {
                requirement: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        description: true,
                        purpose: true,
                        category: true,
                        required: true,
                        allowedDocumentCategories: true,
                        active: true,
                    },
                },
            },
            orderBy: [
                {
                    priority: "asc",
                },
                {
                    requirement: {
                        name: "asc",
                    },
                },
            ],
        });

    const requirementIds = formData.getAll("requirementId");

    const selectedRequirementIds = new Set(
        requirementIds
            .map((value) => String(value).trim())
            .filter(Boolean),
    );

    if (rules.length > 0 && selectedRequirementIds.size === 0) {
        throw new Error(
            "Select at least one recommended requirement before creating the requirement set.",
        );
    }

    const validRuleRequirementIds = new Set(
        rules.map((rule) => rule.requirementId),
    );

    for (const requirementId of selectedRequirementIds) {
        if (!validRuleRequirementIds.has(requirementId)) {
            throw new Error(
                "One or more selected requirements are invalid for this classification.",
            );
        }
    }

    const selectedRules = rules.filter((rule) =>
        selectedRequirementIds.has(rule.requirementId),
    );

    const requirementSet = await prisma.$transaction(async (tx) => {
        const createdSet = await tx.vendorRequirementSet.create({
            data: {
                name,
                code,
                description,
                active,
                companyTypeId,
                industryId,
            },
        });

        if (selectedRules.length > 0) {
            await tx.vendorRequirementSetRequirement.createMany({
                data: selectedRules.map((rule) => {
                    const required =
                        formData.get(
                            `required_${rule.requirementId}`,
                        ) === "on";

                    const requirementActive =
                        formData.get(
                            `active_${rule.requirementId}`,
                        ) === "on";

                    const purposeValue = String(
                        formData.get(
                            `purpose_${rule.requirementId}`,
                        ) ?? "",
                    ).trim();

                    const evidenceValues = formData
                        .getAll(`evidence_${rule.requirementId}`)
                        .map((value) => String(value))
                        .filter(
                            (value): value is DocumentCategory =>
                                Object.values(
                                    DocumentCategory,
                                ).includes(
                                    value as DocumentCategory,
                                ),
                        );

                    const defaultEvidence =
                        rule.allowedDocumentCategories.length > 0
                            ? rule.allowedDocumentCategories
                            : rule.requirement
                                  .allowedDocumentCategories;

                    return {
                        id: crypto.randomUUID(),
                        requirementSetId: createdSet.id,
                        requirementId: rule.requirementId,
                        required,
                        active: requirementActive,
                        purpose: purposeValue || null,
                        allowedDocumentCategories:
                            evidenceValues.length > 0
                                ? evidenceValues
                                : defaultEvidence,
                    };
                }),
            });
        }

        return createdSet;
    });

    revalidatePath(
        "/dashboard/admin/vendor-onboarding/requirements",
    );

    redirect(
        `/dashboard/admin/vendor-onboarding/requirements/${requirementSet.id}`,
    );
}

export default async function NewVendorRequirementSetPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h1 className="text-lg font-semibold text-red-900">
                    Access denied
                </h1>

                <p className="mt-2 text-sm text-red-700">
                    Administrator access is required to create vendor
                    requirement sets.
                </p>
            </div>
        );
    }

    const params = await searchParams;

    const selectedCompanyTypeId = params.companyTypeId ?? "";
    const selectedIndustryId = params.industryId ?? "";

    const [companyTypes, industries] = await Promise.all([
        prisma.vendorCompanyType.findMany({
            where: {
                active: true,
            },
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
            },
        }),

        prisma.vendorIndustry.findMany({
            where: {
                active: true,
            },
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
            },
        }),
    ]);

    const selectedCompanyType = companyTypes.find(
        (item) => item.id === selectedCompanyTypeId,
    );

    const selectedIndustry = industries.find(
        (item) => item.id === selectedIndustryId,
    );

    const hasClassification =
        Boolean(selectedCompanyType) &&
        Boolean(selectedIndustry);

    const generatedName = hasClassification
        ? generateRequirementSetName(
              selectedCompanyType!.name,
              selectedIndustry!.name,
          )
        : "Select a company type and industry";

    const generatedCode = hasClassification
        ? generateRequirementSetCode(
              selectedCompanyType!.code,
              selectedIndustry!.code,
          )
        : "—";

    const generatedDescription = hasClassification
        ? generateRequirementSetDescription(
              selectedCompanyType!.name,
              selectedIndustry!.name,
          )
        : "The requirement set description will be generated from the selected classification.";

    let rules: RequirementRuleWithRequirement[] = [];

    if (hasClassification) {
        rules = await prisma.vendorRequirementRule.findMany({
            where: {
                companyTypeId: selectedCompanyTypeId,
                industryId: selectedIndustryId,
                active: true,
                requirement: {
                    active: true,
                },
            },
            include: {
                requirement: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        description: true,
                        purpose: true,
                        category: true,
                        required: true,
                        allowedDocumentCategories: true,
                        active: true,
                    },
                },
            },
            orderBy: [
                {
                    priority: "asc",
                },
                {
                    requirement: {
                        name: "asc",
                    },
                },
            ],
        });
    }

    const requiredCount = rules.filter(
        (rule) => rule.required,
    ).length;

    const optionalCount = Math.max(
        rules.length - requiredCount,
        0,
    );

    return (
        <div className="mx-auto max-w-7xl space-y-7 pb-10">
            {/* Back navigation */}
            <div>
                <Link
                    href="/dashboard/admin/vendor-onboarding/requirements"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to requirement sets
                </Link>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-tenderhub-gold/30 bg-tenderhub-gold/10 px-3 py-1.5 text-xs font-semibold text-tenderhub-navy">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Vendor onboarding configuration
                    </div>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                        Create compliance package
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Build the requirements TenderHub will use to verify
                        vendors belonging to a specific company type and
                        industry.
                    </p>
                </div>

                {hasClassification && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Classification
                        </p>

                        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <span>{selectedCompanyType?.name}</span>
                            <span className="text-slate-300">/</span>
                            <span>{selectedIndustry?.name}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3">
                    <StepIndicator
                        number="01"
                        title="Classification"
                        description="Define vendor category"
                        active
                        complete={hasClassification}
                    />

                    <StepIndicator
                        number="02"
                        title="Requirements"
                        description="Configure compliance evidence"
                        active={hasClassification}
                        complete={false}
                    />

                    <StepIndicator
                        number="03"
                        title="Create package"
                        description="Publish onboarding configuration"
                        active={false}
                        complete={false}
                    />
                </div>
            </div>

            {/* Classification */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white shadow-sm">
                            <Layers3 className="h-5 w-5" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold tracking-wider text-tenderhub-gold">
                                    STEP 01
                                </span>

                                {hasClassification && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                        <Check className="h-3 w-3" />
                                        Complete
                                    </span>
                                )}
                            </div>

                            <h2 className="mt-1 text-lg font-semibold text-slate-950">
                                Define vendor classification
                            </h2>

                            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                                Tell TenderHub which class of vendors this
                                compliance package applies to. The
                                classification drives the recommended
                                requirements.
                            </p>
                        </div>
                    </div>
                </div>

                <form method="GET">
                    <div className="grid gap-5 p-6 md:grid-cols-2">
                        <ClassificationSelect
                            id="companyTypeId"
                            name="companyTypeId"
                            label="Company type"
                            description="The vendor's legal or organizational structure."
                            value={selectedCompanyTypeId}
                            options={companyTypes}
                        />

                        <ClassificationSelect
                            id="industryId"
                            name="industryId"
                            label="Industry"
                            description="The primary sector in which the vendor operates."
                            value={selectedIndustryId}
                            options={industries}
                        />
                    </div>

                    <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Sparkles className="h-4 w-4 text-tenderhub-gold" />
                            Recommendations are generated from active
                            classification rules.
                        </div>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <Sparkles className="h-4 w-4" />
                            Apply recommendations
                        </button>
                    </div>
                </form>
            </section>

            {/* Generated package */}
            <section className="overflow-hidden rounded-2xl border border-tenderhub-navy/10 bg-tenderhub-navy shadow-sm">
                <div className="grid lg:grid-cols-[1fr_auto]">
                    <div className="p-6 lg:p-7">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tenderhub-gold">
                            <Sparkles className="h-3.5 w-3.5" />
                            System-generated package
                        </div>

                        <h2 className="mt-3 text-xl font-bold text-white">
                            {generatedName}
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                            {generatedDescription}
                        </p>
                    </div>

                    <div className="border-t border-white/10 p-6 lg:min-w-[250px] lg:border-l lg:border-t-0 lg:p-7">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            System code
                        </p>

                        <p className="mt-2 font-mono text-lg font-bold text-white">
                            {generatedCode}
                        </p>

                        {hasClassification && (
                            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-300">
                                <CheckCircle2 className="h-4 w-4" />
                                Classification identified
                            </div>
                        )}
                    </div>
                </div>

                {hasClassification && rules.length > 0 && (
                    <div className="grid border-t border-white/10 sm:grid-cols-3">
                        <SummaryStat
                            value={rules.length}
                            label="Recommended"
                        />

                        <SummaryStat
                            value={requiredCount}
                            label="Required"
                        />

                        <SummaryStat
                            value={optionalCount}
                            label="Optional"
                        />
                    </div>
                )}
            </section>

            {/* Requirements */}
            {hasClassification && (
                <form action={createRequirementSet}>
                    <input
                        type="hidden"
                        name="companyTypeId"
                        value={selectedCompanyTypeId}
                    />

                    <input
                        type="hidden"
                        name="industryId"
                        value={selectedIndustryId}
                    />

                    {rules.map((rule) => (
                        <input
                            key={rule.id}
                            type="hidden"
                            name="requirementId"
                            value={rule.requirementId}
                        />
                    ))}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white shadow-sm">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <div className="text-xs font-bold tracking-wider text-tenderhub-gold">
                                            STEP 02
                                        </div>

                                        <h2 className="mt-1 text-lg font-semibold text-slate-950">
                                            Configure compliance requirements
                                        </h2>

                                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                                            Review the recommended controls and
                                            decide what this vendor class must
                                            provide during onboarding.
                                        </p>
                                    </div>
                                </div>

                                {rules.length > 0 && (
                                    <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3 text-right">
                                        <p className="text-xs font-medium text-slate-500">
                                            Recommended controls
                                        </p>

                                        <p className="mt-0.5 text-lg font-bold text-tenderhub-navy">
                                            {rules.length}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {rules.length === 0 ? (
                            <div className="p-6">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                                    <div className="flex gap-3">
                                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                                        <div>
                                            <h3 className="text-sm font-semibold text-amber-900">
                                                No classification rules
                                                configured
                                            </h3>

                                            <p className="mt-1 text-sm leading-6 text-amber-800">
                                                TenderHub does not currently have
                                                any active requirement rules
                                                for{" "}
                                                <strong>
                                                    {selectedCompanyType?.name}
                                                </strong>{" "}
                                                vendors in the{" "}
                                                <strong>
                                                    {selectedIndustry?.name}
                                                </strong>{" "}
                                                industry.
                                            </p>

                                            <p className="mt-2 text-xs leading-5 text-amber-700">
                                                Configure the classification
                                                rules first, then return here
                                                to create this compliance
                                                package.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {rules.map((rule, index) => {
                                    const defaultEvidence =
                                        rule.allowedDocumentCategories
                                            .length > 0
                                            ? rule.allowedDocumentCategories
                                            : rule.requirement
                                                  .allowedDocumentCategories;

                                    const defaultPurpose =
                                        rule.purpose ??
                                        rule.requirement.purpose ??
                                        "";

                                    return (
                                        <RequirementCard
                                            key={rule.id}
                                            rule={rule}
                                            index={index}
                                            defaultEvidence={
                                                defaultEvidence
                                            }
                                            defaultPurpose={
                                                defaultPurpose
                                            }
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {rules.length > 0 && (
                            <>
                                <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5">
                                    <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            defaultChecked
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-tenderhub-navy focus:ring-tenderhub-navy"
                                        />

                                        <span>
                                            <span className="block text-sm font-semibold text-slate-900">
                                                Make package available for
                                                vendor onboarding
                                            </span>

                                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                Keep this enabled if this
                                                classification should be
                                                available immediately after
                                                creation.
                                            </span>
                                        </span>
                                    </label>
                                </div>

                                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                                    <Link
                                        href="/dashboard/admin/vendor-onboarding/requirements"
                                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Cancel
                                    </Link>

                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Create compliance package
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </form>
            )}

            {/* Empty classification */}
            {!hasClassification && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                        <ShieldCheck className="h-6 w-6" />
                    </div>

                    <h2 className="mt-4 text-base font-semibold text-slate-900">
                        Start with a vendor classification
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Select a company type and industry above. TenderHub
                        will then recommend the compliance controls configured
                        for that classification.
                    </p>
                </div>
            )}

            {/* Configuration principle */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tenderhub-gold/10 text-tenderhub-gold">
                        <Info className="h-4 w-4" />
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                            How TenderHub determines vendor requirements
                        </h2>

                        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
                            Company type and industry determine the vendor
                            classification. Classification rules recommend the
                            appropriate controls. This compliance package then
                            defines exactly what TenderHub will ask vendors in
                            that class to provide during onboarding.
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="rounded-lg bg-slate-100 px-3 py-2">
                                Company type
                            </span>

                            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

                            <span className="rounded-lg bg-slate-100 px-3 py-2">
                                Industry
                            </span>

                            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

                            <span className="rounded-lg bg-tenderhub-navy/5 px-3 py-2 text-tenderhub-navy">
                                Classification rules
                            </span>

                            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

                            <span className="rounded-lg bg-tenderhub-gold/10 px-3 py-2 text-tenderhub-navy">
                                Compliance package
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function StepIndicator({
    number,
    title,
    description,
    active,
    complete,
}: {
    number: string;
    title: string;
    description: string;
    active: boolean;
    complete: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                active
                    ? "border-tenderhub-navy/10 bg-tenderhub-navy/[0.03]"
                    : "border-transparent bg-slate-50"
            }`}
        >
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    complete
                        ? "bg-emerald-100 text-emerald-700"
                        : active
                          ? "bg-tenderhub-navy text-white"
                          : "bg-slate-200 text-slate-500"
                }`}
            >
                {complete ? (
                    <Check className="h-4 w-4" />
                ) : (
                    number
                )}
            </div>

            <div className="min-w-0">
                <p
                    className={`text-sm font-semibold ${
                        active
                            ? "text-slate-900"
                            : "text-slate-500"
                    }`}
                >
                    {title}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

function ClassificationSelect({
    id,
    name,
    label,
    description,
    value,
    options,
}: {
    id: string;
    name: string;
    label: string;
    description: string;
    value: string;
    options: Array<{
        id: string;
        name: string;
    }>;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="block text-sm font-semibold text-slate-900"
            >
                {label}
            </label>

            <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
            </p>

            <select
                id={id}
                name={name}
                required
                defaultValue={value}
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-tenderhub-navy focus:ring-4 focus:ring-tenderhub-navy/10"
            >
                <option value="" disabled>
                    Select {label.toLowerCase()}
                </option>

                {options.map((option) => (
                    <option
                        key={option.id}
                        value={option.id}
                    >
                        {option.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

function SummaryStat({
    value,
    label,
}: {
    value: number;
    label: string;
}) {
    return (
        <div className="border-white/10 px-6 py-4 first:border-0 sm:border-l">
            <p className="text-xl font-bold text-white">
                {value}
            </p>

            <p className="mt-0.5 text-xs font-medium text-slate-400">
                {label}
            </p>
        </div>
    );
}

function RequirementCard({
    rule,
    index,
    defaultEvidence,
    defaultPurpose,
}: {
    rule: RequirementRuleWithRequirement;
    index: number;
    defaultEvidence: DocumentCategory[];
    defaultPurpose: string;
}) {
    return (
        <div className="p-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
                {/* Requirement header */}
                <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-tenderhub-navy">
                                {String(index + 1).padStart(2, "0")}
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-bold text-slate-950">
                                        {rule.requirement.name}
                                    </h3>

                                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold tracking-wide text-slate-500">
                                        {rule.requirement.code}
                                    </span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-tenderhub-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-tenderhub-navy">
                                        {String(
                                            rule.requirement.category,
                                        ).replace(/_/g, " ")}
                                    </span>

                                    {rule.required ? (
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                            Required by classification
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                            Optional
                                        </span>
                                    )}
                                </div>

                                {rule.requirement.description && (
                                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                                        {rule.requirement.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                                <input
                                    type="checkbox"
                                    name={`required_${rule.requirementId}`}
                                    defaultChecked={rule.required}
                                    className="h-4 w-4 rounded border-slate-300 text-tenderhub-navy focus:ring-tenderhub-navy"
                                />
                                Required
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                                <input
                                    type="checkbox"
                                    name={`active_${rule.requirementId}`}
                                    defaultChecked
                                    className="h-4 w-4 rounded border-slate-300 text-tenderhub-navy focus:ring-tenderhub-navy"
                                />
                                Active
                            </label>
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="grid gap-5 p-5 lg:grid-cols-2">
                    {/* Purpose */}
                    <div>
                        <label
                            htmlFor={`purpose_${rule.requirementId}`}
                            className="block text-sm font-semibold text-slate-900"
                        >
                            Compliance purpose
                        </label>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Explain why this evidence is required from the
                            vendor.
                        </p>

                        <textarea
                            id={`purpose_${rule.requirementId}`}
                            name={`purpose_${rule.requirementId}`}
                            defaultValue={defaultPurpose}
                            rows={4}
                            placeholder="Explain the compliance purpose..."
                            className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenderhub-navy focus:bg-white focus:ring-4 focus:ring-tenderhub-navy/10"
                        />
                    </div>

                    {/* Evidence */}
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Accepted evidence
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Select the documents vendors may submit to
                                    satisfy this requirement.
                                </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-tenderhub-navy/5 px-2.5 py-1 text-[11px] font-semibold text-tenderhub-navy">
                                {defaultEvidence.length} selected
                            </span>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
                            <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
                                {Object.values(DocumentCategory).map(
                                    (category) => {
                                        const selected =
                                            defaultEvidence.includes(
                                                category,
                                            );

                                        return (
                                            <label
                                                key={category}
                                                className={`group flex cursor-pointer items-center gap-3 bg-white px-4 py-3 transition ${
                                                    selected
                                                        ? "bg-tenderhub-navy/[0.04]"
                                                        : "hover:bg-slate-50"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    name={`evidence_${rule.requirementId}`}
                                                    value={category}
                                                    defaultChecked={
                                                        selected
                                                    }
                                                    className="peer sr-only"
                                                />

                                                <span
                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                                        selected
                                                            ? "border-tenderhub-navy bg-tenderhub-navy text-white"
                                                            : "border-slate-300 bg-white text-transparent group-hover:border-slate-400"
                                                    }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </span>

                                                <span
                                                    className={`text-xs font-medium ${
                                                        selected
                                                            ? "text-slate-900"
                                                            : "text-slate-600"
                                                    }`}
                                                >
                                                    {formatDocumentCategory(
                                                        category,
                                                    )}
                                                </span>
                                            </label>
                                        );
                                    },
                                )}
                            </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-[11px] text-slate-400">
                                Select all evidence types that can satisfy this
                                requirement.
                            </p>

                            <span className="text-[11px] font-semibold text-slate-500">
                                {defaultEvidence.length} recommended
                            </span>
                        </div>

                        {defaultEvidence.length === 0 && (
                            <p className="mt-2 text-xs text-amber-700">
                                No evidence types are currently configured for
                                this requirement.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatDocumentCategory(
    category: DocumentCategory,
) {
    return category
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(
            /\b\w/g,
            (letter) => letter.toUpperCase(),
        );
}