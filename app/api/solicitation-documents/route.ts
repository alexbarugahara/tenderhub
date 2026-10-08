import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { DocumentCategory, UserRole } from "@prisma/client";

async function getSessionUser() {
const session = await auth();

if (!session?.user?.id) {
return null;
}

return {
id: session.user.id,
role: session.user.role,
};
}

async function canManageSolicitation(
userId: string,
role: UserRole,
organizationId: string,
) {
if (role === UserRole.ADMIN) {
return true;
}

if (role !== UserRole.ORGANIZATION) {
return false;
}

const membership = await prisma.organizationMember.findUnique({
where: {
organizationId_userId: {
organizationId,
userId,
},
},
});

return Boolean(membership);
}

function isValidDocumentCategory(
value: string,
): value is DocumentCategory {
return Object.values(DocumentCategory).includes(
value as DocumentCategory,
);
}

export async function GET(request: NextRequest) {
try {
const user = await getSessionUser();


const { searchParams } = new URL(request.url);
const solicitationId = searchParams.get("solicitationId");

if (!solicitationId) {
  return NextResponse.json(
    {
      success: false,
      message: "solicitationId is required.",
    },
    { status: 400 },
  );
}

const solicitation = await prisma.solicitation.findUnique({
  where: {
    id: solicitationId,
  },
  select: {
    id: true,
    organizationId: true,
    status: true,
  },
});

if (!solicitation) {
  return NextResponse.json(
    {
      success: false,
      message: "Solicitation not found.",
    },
    { status: 404 },
  );
}

/*
 * Draft solicitation documents are organization-controlled.
 * Public users can only view documents once the solicitation
 * is no longer in draft/cancelled state.
 */
const isPublicView =
  solicitation.status !== "DRAFT" &&
  solicitation.status !== "CANCELLED";

if (!user) {
  if (!isPublicView) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication is required.",
      },
      { status: 401 },
    );
  }
} else if (
  !(await canManageSolicitation(
    user.id,
    user.role,
    solicitation.organizationId,
  ))
) {
  if (!isPublicView || user.role !== UserRole.VENDOR) {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authorized to view these documents.",
      },
      { status: 403 },
    );
  }
}

const documents = await prisma.solicitationDocument.findMany({
  where: {
    solicitationId,
  },
  orderBy: [
    {
      createdAt: "desc",
    },
    {
      name: "asc",
    },
  ],
  select: {
    id: true,
    solicitationId: true,
    name: true,
    category: true,
    fileUrl: true,
    mimeType: true,
    fileSize: true,
    version: true,
    createdAt: true,
    updatedAt: true,
  },
});

return NextResponse.json({
  success: true,
  data: documents,
});


} catch (error) {
console.error(
"GET /api/solicitation-documents error:",
error,
);


return NextResponse.json(
  {
    success: false,
    message: "Failed to retrieve solicitation documents.",
  },
  { status: 500 },
);


}
}

export async function POST(request: NextRequest) {
try {
const user = await getSessionUser();


if (!user) {
  return NextResponse.json(
    {
      success: false,
      message: "Authentication is required.",
    },
    { status: 401 },
  );
}

if (
  user.role !== UserRole.ADMIN &&
  user.role !== UserRole.ORGANIZATION
) {
  return NextResponse.json(
    {
      success: false,
      message: "You are not authorized to upload solicitation documents.",
    },
    { status: 403 },
  );
}

const body = await request.json();

const solicitationId =
  typeof body.solicitationId === "string"
    ? body.solicitationId.trim()
    : "";

const name =
  typeof body.name === "string" ? body.name.trim() : "";

const category =
  typeof body.category === "string"
    ? body.category.trim()
    : "";

const fileUrl =
  typeof body.fileUrl === "string"
    ? body.fileUrl.trim()
    : "";

const mimeType =
  typeof body.mimeType === "string"
    ? body.mimeType.trim()
    : null;

const fileSize =
  typeof body.fileSize === "number"
    ? body.fileSize
    : null;

if (!solicitationId) {
  return NextResponse.json(
    {
      success: false,
      message: "solicitationId is required.",
    },
    { status: 400 },
  );
}

if (!name) {
  return NextResponse.json(
    {
      success: false,
      message: "Document name is required.",
    },
    { status: 400 },
  );
}

if (!isValidDocumentCategory(category)) {
  return NextResponse.json(
    {
      success: false,
      message: "A valid document category is required.",
    },
    { status: 400 },
  );
}

if (!fileUrl) {
  return NextResponse.json(
    {
      success: false,
      message: "fileUrl is required.",
    },
    { status: 400 },
  );
}

if (
  fileSize !== null &&
  (!Number.isInteger(fileSize) || fileSize < 0)
) {
  return NextResponse.json(
    {
      success: false,
      message: "fileSize must be a valid non-negative integer.",
    },
    { status: 400 },
  );
}

const solicitation = await prisma.solicitation.findUnique({
  where: {
    id: solicitationId,
  },
  select: {
    id: true,
    organizationId: true,
    status: true,
  },
});

if (!solicitation) {
  return NextResponse.json(
    {
      success: false,
      message: "Solicitation not found.",
    },
    { status: 404 },
  );
}

const authorized = await canManageSolicitation(
  user.id,
  user.role,
  solicitation.organizationId,
);

if (!authorized) {
  return NextResponse.json(
    {
      success: false,
      message:
        "You are not authorized to manage documents for this solicitation.",
    },
    { status: 403 },
  );
}

if (
  solicitation.status !== "DRAFT"
) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Solicitation documents can only be added while the solicitation is in draft status.",
    },
    { status: 400 },
  );
}

const document = await prisma.solicitationDocument.create({
  data: {
    solicitationId,
    name,
    category,
    fileUrl,
    mimeType,
    fileSize,
  },
  select: {
    id: true,
    solicitationId: true,
    name: true,
    category: true,
    fileUrl: true,
    mimeType: true,
    fileSize: true,
    version: true,
    createdAt: true,
    updatedAt: true,
  },
});

return NextResponse.json(
  {
    success: true,
    message: "Solicitation document created successfully.",
    data: document,
  },
  { status: 201 },
);


} catch (error) {
console.error(
"POST /api/solicitation-documents error:",
error,
);


return NextResponse.json(
  {
    success: false,
    message: "Failed to create solicitation document.",
  },
  { status: 500 },
);


}
}
