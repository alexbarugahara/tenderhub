import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
    params: Promise<{
        id: string;
        documentId: string;
    }>;
};

async function getAuthenticatedUser() {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    return prisma.user.findUnique({
        where: {
            id: session.user.id,
        },
        select: {
            id: true,
            role: true,
        },
    });
}

async function getVendorForDocument(documentId: string) {
    return prisma.vendorDocument.findUnique({
        where: {
            id: documentId,
        },
        include: {
            vendor: {
                select: {
                    id: true,
                    userId: true,
                    companyName: true,
                },
            },
        },
    });
}

async function getDocumentEvidence(
    vendorId: string,
    fileUrl: string
) {
    const application = await prisma.vendorApplication.findFirst({
        where: {
            user: {
                vendor: {
                    id: vendorId,
                },
            },
        },
        select: {
            id: true,
            status: true,
            evidence: {
                where: {
                    fileUrl,
                },
                include: {
                    requirement: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            description: true,
                            category: true,
                            required: true,
                            status: true,
                            notes: true,
                        },
                    },
                    reviewedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    uploadedAt: "desc",
                },
            },
        },
    });

    return application;
}

/**
 * GET /api/vendors/[id]/documents/[documentId]
 *
 * Returns one vendor document together with any vendor-onboarding
 * evidence records associated with the document.
 */
export async function GET(
    _request: NextRequest,
    context: RouteContext
) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: vendorId, documentId } = await context.params;

        const document = await getVendorForDocument(documentId);

        if (!document) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        if (document.vendor.id !== vendorId) {
            return NextResponse.json(
                { error: "Document does not belong to this vendor" },
                { status: 404 }
            );
        }

        const isAdmin = user.role === UserRole.ADMIN;
        const isOwner = document.vendor.userId === user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const application = await getDocumentEvidence(
            vendorId,
            document.fileUrl
        );

        return NextResponse.json({
            document: {
                id: document.id,
                vendorId: document.vendorId,
                vendorName: document.vendor.companyName,
                name: document.name,
                category: document.category,
                fileUrl: document.fileUrl,
                mimeType: document.mimeType,
                fileSize: document.fileSize,
                status: document.status,
                issuedAt: document.issuedAt,
                expiryDate: document.expiryDate,
                rejectionReason: document.rejectionReason,
                uploadedAt: document.uploadedAt,
                updatedAt: document.updatedAt,

                application: application
                    ? {
                          id: application.id,
                          status: application.status,
                      }
                    : null,

                evidence: application?.evidence ?? [],
            },
        });
    } catch (error) {
        console.error(
            "GET /api/vendors/[id]/documents/[documentId] error:",
            error
        );

        return NextResponse.json(
            { error: "Failed to retrieve document" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/vendors/[id]/documents/[documentId]
 *
 * Deletes a vendor document unless it has already been submitted
 * as evidence for a vendor onboarding application.
 */
export async function DELETE(
    _request: NextRequest,
    context: RouteContext
) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: vendorId, documentId } = await context.params;

        const document = await getVendorForDocument(documentId);

        if (!document) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        if (document.vendor.id !== vendorId) {
            return NextResponse.json(
                { error: "Document does not belong to this vendor" },
                { status: 404 }
            );
        }

        const isAdmin = user.role === UserRole.ADMIN;
        const isOwner = document.vendor.userId === user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        /*
         * VendorApplicationEvidence does not have a documentId field.
         * It references the uploaded document through its fileUrl.
         *
         * Therefore, check whether this document's fileUrl has already
         * been submitted as onboarding evidence.
         */
        const evidenceCount =
            await prisma.vendorApplicationEvidence.count({
                where: {
                    application: {
                        userId: document.vendor.userId,
                    },
                    fileUrl: document.fileUrl,
                },
            });

        if (evidenceCount > 0) {
            return NextResponse.json(
                {
                    error:
                        "This document cannot be deleted because it has already been submitted as vendor onboarding evidence.",
                },
                { status: 409 }
            );
        }

        await prisma.vendorDocument.delete({
            where: {
                id: documentId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Document deleted successfully",
        });
    } catch (error) {
        console.error(
            "DELETE /api/vendors/[id]/documents/[documentId] error:",
            error
        );

        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}