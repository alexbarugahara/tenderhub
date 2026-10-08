import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
    SolicitationStatus,
    SolicitationType,
} from "@prisma/client";

type RouteContext = {
    params: Promise<{ id: string }>;
};

function isValidEnumValue<T extends string>(
    value: unknown,
    enumObject: Record<string, T>,
): value is T {
    return (
        typeof value === "string" &&
        Object.values(enumObject).includes(value as T)
    );
}

function parseOptionalDate(
    value: unknown,
): Date | null | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return undefined;
    }

    return date;
}

function parseOptionalNumber(
    value: unknown,
): number | null | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === "") {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return undefined;
    }

    return number;
}

/*
 * GET
 *
 * Fetch one solicitation.
 */
export async function GET(
    request: NextRequest,
    context: RouteContext,
) {
    try {
        const session = await auth();
        const { id } = await context.params;

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unauthorized",
                },
                { status: 401 },
            );
        }

        const solicitation =
            await prisma.solicitation.findUnique({
                where: {
                    id,
                },

                include: {
                    procurement: {
                        include: {
                            organization: {
                                select: {
                                    id: true,
                                    name: true,
                                    legalName: true,
                                    email: true,
                                    phone: true,
                                    website: true,
                                },
                            },

                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    description: true,
                                },
                            },

                            country: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true,
                                },
                            },

                            currency: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true,
                                    symbol: true,
                                    decimals: true,
                                },
                            },
                        },
                    },

                    organization: {
                        select: {
                            id: true,
                            name: true,
                            legalName: true,
                            email: true,
                            phone: true,
                            website: true,
                            address: true,
                            logo: true,
                            description: true,
                            registrationNumber: true,
                            taxNumber: true,
                            organizationType: true,

                            country: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true,
                                },
                            },

                            currency: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true,
                                    symbol: true,
                                    decimals: true,
                                },
                            },
                        },
                    },

                    currency: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            symbol: true,
                            decimals: true,
                        },
                    },

                    lots: {
                        include: {
                            requirements: {
                                orderBy: {
                                    sortOrder: "asc",
                                },
                            },
                        },

                        orderBy: {
                            number: "asc",
                        },
                    },

                    requirements: {
                        where: {
                            lotId: null,
                        },

                        orderBy: {
                            sortOrder: "asc",
                        },
                    },

                    documents: {
                        orderBy: {
                            createdAt: "desc",
                        },
                    },

                    classifications: {
                        include: {
                            classification: true,
                        },
                    },

                    evaluationCriteria: {
                        include: {
                            scores: true,
                        },

                        orderBy: {
                            sortOrder: "asc",
                        },
                    },

                    notices: {
                        where: {
                            published: true,
                        },

                        orderBy: {
                            publishedAt: "desc",
                        },
                    },

                    bids: {
                        select: {
                            id: true,
                            bidNumber: true,
                            title: true,
                            totalAmount: true,
                            status: true,
                            submittedAt: true,
                            lockedAt: true,

                            vendor: {
                                select: {
                                    id: true,
                                    companyName: true,
                                    legalName: true,
                                    verifiedAt: true,
                                },
                            },

                            lot: {
                                select: {
                                    id: true,
                                    number: true,
                                    title: true,
                                },
                            },
                        },

                        orderBy: {
                            submittedAt: "desc",
                        },
                    },

                    awards: {
                        include: {
                            vendor: {
                                select: {
                                    id: true,
                                    companyName: true,
                                    legalName: true,
                                    verifiedAt: true,
                                },
                            },

                            bid: {
                                select: {
                                    id: true,
                                    bidNumber: true,
                                    totalAmount: true,
                                    status: true,
                                },
                            },

                            lot: {
                                select: {
                                    id: true,
                                    number: true,
                                    title: true,
                                },
                            },

                            contract: true,
                        },

                        orderBy: {
                            awardDate: "desc",
                        },
                    },

                    activities: {
                        include: {
                            performedBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    role: true,
                                },
                            },
                        },

                        orderBy: {
                            createdAt: "desc",
                        },
                    },

                    savedBy: {
                        select: {
                            id: true,
                            vendorId: true,
                            userId: true,
                            savedAt: true,
                        },
                    },

                    _count: {
                        select: {
                            lots: true,
                            requirements: true,
                            documents: true,
                            bids: true,
                            awards: true,
                            notices: true,
                            evaluationCriteria: true,
                            classifications: true,
                            activities: true,
                        },
                    },
                },
            });

        if (!solicitation) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Solicitation not found",
                },
                { status: 404 },
            );
        }

        /*
         * Draft solicitations are not visible to vendors.
         */
        if (
            solicitation.status ===
                SolicitationStatus.DRAFT &&
            session.user.role !== "ADMIN" &&
            session.user.role !== "ORGANIZATION"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Solicitation not found",
                },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            data: solicitation,
        });
    } catch (error) {
        console.error(
            "GET /api/solicitations/[id] error:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch solicitation",
            },
            { status: 500 },
        );
    }
}

/*
 * PATCH
 *
 * Update a DRAFT solicitation.
 *
 * IMPORTANT:
 *
 * This endpoint does NOT allow the client to change:
 *
 * - procurementId
 * - organizationId
 * - currencyId
 * - procurementMethod
 * - publishedAt
 * - estimatedValue
 * - status
 *
 * Those values are controlled elsewhere.
 */
export async function PATCH(
    request: NextRequest,
    context: RouteContext,
) {
    try {
        const session = await auth();
        const { id } = await context.params;

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unauthorized",
                },
                { status: 401 },
            );
        }

        /*
         * Only ADMIN and ORGANIZATION users can edit
         * organization solicitations.
         */
        if (
            session.user.role !== "ADMIN" &&
            session.user.role !== "ORGANIZATION"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only administrators and organization users can update solicitations",
                },
                { status: 403 },
            );
        }

        /*
         * Find the existing solicitation.
         */
        const existingSolicitation =
            await prisma.solicitation.findUnique({
                where: {
                    id,
                },

                select: {
                    id: true,
                    procurementId: true,
                    organizationId: true,
                    currencyId: true,

                    solicitationNumber: true,
                    title: true,
                    description: true,

                    status: true,
                    type: true,

                    procurementMethod: true,
                    publishedAt: true,

                    openingDate: true,
                    closingDate: true,

                    bidSecurityRequired: true,
                    bidSecurityAmount: true,

                    applicationFeeRequired: true,
                    applicationFeeAmount: true,

                    procurement: {
                        select: {
                            id: true,
                            organizationId: true,
                            currencyId: true,
                            procurementMethod: true,
                            estimatedValue: true,

                            currency: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true,
                                    symbol: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!existingSolicitation) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Solicitation not found",
                },
                { status: 404 },
            );
        }

        /*
         * Only DRAFT solicitations can be edited
         * through this endpoint.
         */
        if (
            existingSolicitation.status !==
            SolicitationStatus.DRAFT
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only draft solicitations can be edited",
                },
                { status: 400 },
            );
        }

        /*
         * ORGANIZATION AUTHORIZATION
         *
         * ADMIN can manage any organization.
         *
         * ORGANIZATION users must belong to the
         * solicitation's organization.
         */
        if (session.user.role === "ORGANIZATION") {
            const membership =
                await prisma.organizationMember.findFirst({
                    where: {
                        organizationId:
                            existingSolicitation.organizationId,

                        userId: session.user.id,
                    },

                    select: {
                        id: true,
                    },
                });

            if (!membership) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "You are not authorized to edit this solicitation",
                    },
                    { status: 403 },
                );
            }
        }

        /*
         * Read request body.
         */
        const body = await request.json();

        const {
            solicitationNumber,
            title,
            description,
            type,
            openingDate,
            closingDate,
            bidSecurityRequired,
            bidSecurityAmount,
            applicationFeeRequired,
            applicationFeeAmount,
        } = body;

        /*
         * SOLICITATION NUMBER
         */
        let nextSolicitationNumber =
            existingSolicitation.solicitationNumber;

        if (solicitationNumber !== undefined) {
            if (
                typeof solicitationNumber !== "string" ||
                !solicitationNumber.trim()
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Solicitation number cannot be empty",
                    },
                    { status: 400 },
                );
            }

            nextSolicitationNumber =
                solicitationNumber.trim();

            /*
             * Check duplicate solicitation number.
             */
            if (
                nextSolicitationNumber !==
                existingSolicitation.solicitationNumber
            ) {
                const duplicateSolicitation =
                    await prisma.solicitation.findFirst({
                        where: {
                            solicitationNumber:
                                nextSolicitationNumber,

                            NOT: {
                                id,
                            },
                        },

                        select: {
                            id: true,
                        },
                    });

                if (duplicateSolicitation) {
                    return NextResponse.json(
                        {
                            success: false,
                            error:
                                "A solicitation with this solicitation number already exists",
                        },
                        { status: 409 },
                    );
                }
            }
        }

        /*
         * TITLE
         */
        let nextTitle =
            existingSolicitation.title;

        if (title !== undefined) {
            if (
                typeof title !== "string" ||
                !title.trim()
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Solicitation title cannot be empty",
                    },
                    { status: 400 },
                );
            }

            nextTitle = title.trim();
        }

        /*
         * DESCRIPTION
         */
        let nextDescription =
            existingSolicitation.description;

        if (description !== undefined) {
            if (
                description !== null &&
                typeof description !== "string"
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Description must be a string",
                    },
                    { status: 400 },
                );
            }

            nextDescription =
                description === null
                    ? null
                    : description.trim();
        }

        /*
         * SOLICITATION TYPE
         */
        let nextType =
            existingSolicitation.type;

        if (type !== undefined) {
            if (
                !isValidEnumValue(
                    type,
                    SolicitationType,
                )
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Invalid solicitation type",
                    },
                    { status: 400 },
                );
            }

            nextType = type;
        }

        /*
         * OPENING DATE
         */
        const parsedOpeningDate =
            parseOptionalDate(openingDate);

        if (
            openingDate !== undefined &&
            parsedOpeningDate === undefined
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid opening date",
                },
                { status: 400 },
            );
        }

        const nextOpeningDate =
            parsedOpeningDate !== undefined
                ? parsedOpeningDate
                : existingSolicitation.openingDate;

        /*
         * CLOSING DATE
         */
        const parsedClosingDate =
            parseOptionalDate(closingDate);

        if (
            closingDate !== undefined &&
            parsedClosingDate === undefined
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid closing date",
                },
                { status: 400 },
            );
        }

        const nextClosingDate =
            parsedClosingDate !== undefined
                ? parsedClosingDate
                : existingSolicitation.closingDate;

        /*
         * Opening and closing dates.
         */
        if (
            nextOpeningDate &&
            nextClosingDate &&
            nextClosingDate <= nextOpeningDate
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Closing date must be after opening date",
                },
                { status: 400 },
            );
        }

        /*
         * Do not allow opening date before publishedAt
         * if the solicitation has already been published.
         */
        if (
            existingSolicitation.publishedAt &&
            nextOpeningDate &&
            nextOpeningDate <
                existingSolicitation.publishedAt
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Opening date cannot be before published date",
                },
                { status: 400 },
            );
        }

        /*
         * BID SECURITY REQUIRED
         */
        let nextBidSecurityRequired =
            existingSolicitation.bidSecurityRequired;

        if (bidSecurityRequired !== undefined) {
            if (
                typeof bidSecurityRequired !== "boolean"
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "bidSecurityRequired must be a boolean",
                    },
                    { status: 400 },
                );
            }

            nextBidSecurityRequired =
                bidSecurityRequired;
        }

        /*
         * BID SECURITY AMOUNT
         */
        const parsedBidSecurityAmount =
            parseOptionalNumber(
                bidSecurityAmount,
            );

        if (
            bidSecurityAmount !== undefined &&
            parsedBidSecurityAmount === undefined
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Bid security amount must be a valid number",
                },
                { status: 400 },
            );
        }

        let nextBidSecurityAmount =
            existingSolicitation.bidSecurityAmount
                ? Number(
                      existingSolicitation.bidSecurityAmount,
                  )
                : null;

        if (bidSecurityAmount !== undefined) {
            nextBidSecurityAmount =
                parsedBidSecurityAmount ?? null;
        }

        if (
            nextBidSecurityAmount !== null &&
            nextBidSecurityAmount < 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Bid security amount cannot be negative",
                },
                { status: 400 },
            );
        }

        /*
         * If bid security is disabled, clear the amount.
         */
        if (!nextBidSecurityRequired) {
            nextBidSecurityAmount = null;
        }

        /*
         * If bid security is enabled, amount is required.
         */
        if (
            nextBidSecurityRequired &&
            nextBidSecurityAmount === null
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Bid security amount is required when bid security is enabled",
                },
                { status: 400 },
            );
        }

        /*
         * APPLICATION FEE REQUIRED
         */
        let nextApplicationFeeRequired =
            existingSolicitation.applicationFeeRequired;

        if (applicationFeeRequired !== undefined) {
            if (
                typeof applicationFeeRequired !==
                "boolean"
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "applicationFeeRequired must be a boolean",
                    },
                    { status: 400 },
                );
            }

            nextApplicationFeeRequired =
                applicationFeeRequired;
        }

        /*
         * APPLICATION FEE AMOUNT
         */
        const parsedApplicationFeeAmount =
            parseOptionalNumber(
                applicationFeeAmount,
            );

        if (
            applicationFeeAmount !== undefined &&
            parsedApplicationFeeAmount === undefined
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Application fee amount must be a valid number",
                },
                { status: 400 },
            );
        }

        let nextApplicationFeeAmount =
            existingSolicitation.applicationFeeAmount
                ? Number(
                      existingSolicitation.applicationFeeAmount,
                  )
                : null;

        if (applicationFeeAmount !== undefined) {
            nextApplicationFeeAmount =
                parsedApplicationFeeAmount ?? null;
        }

        if (
            nextApplicationFeeAmount !== null &&
            nextApplicationFeeAmount < 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Application fee amount cannot be negative",
                },
                { status: 400 },
            );
        }

        /*
         * If application fee is disabled,
         * clear the amount.
         */
        if (!nextApplicationFeeRequired) {
            nextApplicationFeeAmount = null;
        }

        /*
         * If application fee is enabled,
         * amount is required.
         */
        if (
            nextApplicationFeeRequired &&
            nextApplicationFeeAmount === null
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Application fee amount is required when application fee is enabled",
                },
                { status: 400 },
            );
        }

        /*
         * UPDATE
         *
         * Notice that we intentionally do NOT update:
         *
         * procurementId
         * organizationId
         * currencyId
         * procurementMethod
         * estimatedValue
         * publishedAt
         * status
         *
         * Those remain controlled by the procurement/workflow.
         */
        const updatedSolicitation =
            await prisma.solicitation.update({
                where: {
                    id,
                },

                data: {
                    solicitationNumber:
                        nextSolicitationNumber,

                    title:
                        nextTitle,

                    description:
                        nextDescription,

                    type:
                        nextType,

                    openingDate:
                        nextOpeningDate,

                    closingDate:
                        nextClosingDate,

                    bidSecurityRequired:
                        nextBidSecurityRequired,

                    bidSecurityAmount:
                        nextBidSecurityAmount,

                    applicationFeeRequired:
                        nextApplicationFeeRequired,

                    applicationFeeAmount:
                        nextApplicationFeeAmount,
                },

                include: {
                    procurement: {
                        select: {
                            id: true,
                            title: true,
                            referenceNumber: true,
                            status: true,
                            procurementMethod: true,
                            estimatedValue: true,

                            currency: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true,
                                    symbol: true,
                                },
                            },
                        },
                    },

                    organization: {
                        select: {
                            id: true,
                            name: true,
                            legalName: true,
                        },
                    },

                    currency: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            symbol: true,
                        },
                    },
                },
            });

        /*
         * ACTIVITY LOG
         */
        await prisma.solicitationActivity.create({
            data: {
                solicitationId: id,
                performedById: session.user.id,
                action: "UPDATE",
                description: `Solicitation "${updatedSolicitation.title}" was updated.`,
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedSolicitation,
        });
    } catch (error) {
        console.error(
            "PATCH /api/solicitations/[id] error:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error: "Failed to update solicitation",
            },
            { status: 500 },
        );
    }
}

/*
 * DELETE
 */
export async function DELETE(
    request: NextRequest,
    context: RouteContext,
) {
    try {
        const session = await auth();
        const { id } = await context.params;

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unauthorized",
                },
                { status: 401 },
            );
        }

        if (
            session.user.role !== "ADMIN" &&
            session.user.role !== "ORGANIZATION"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only administrators and organization users can delete solicitations",
                },
                { status: 403 },
            );
        }

        const solicitation =
            await prisma.solicitation.findUnique({
                where: {
                    id,
                },

                select: {
                    id: true,
                    title: true,
                    status: true,
                    organizationId: true,
                },
            });

        if (!solicitation) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Solicitation not found",
                },
                { status: 404 },
            );
        }

        /*
         * Organization users can only delete solicitations
         * belonging to their organization.
         */
        if (session.user.role === "ORGANIZATION") {
            const membership =
                await prisma.organizationMember.findFirst({
                    where: {
                        organizationId:
                            solicitation.organizationId,

                        userId: session.user.id,
                    },

                    select: {
                        id: true,
                    },
                });

            if (!membership) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "You are not authorized to delete this solicitation",
                    },
                    { status: 403 },
                );
            }
        }

        /*
         * Do not allow deletion after the solicitation
         * has left the draft stage.
         */
        if (
            solicitation.status !==
            SolicitationStatus.DRAFT
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only draft solicitations can be deleted",
                },
                { status: 400 },
            );
        }

        await prisma.solicitation.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                id,
                message:
                    "Solicitation deleted successfully",
            },
        });
    } catch (error) {
        console.error(
            "DELETE /api/solicitations/[id] error:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete solicitation",
            },
            { status: 500 },
        );
    }
}