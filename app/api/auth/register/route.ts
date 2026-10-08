import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),

  email: z.string().email("Invalid email address."),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long."),

  companyName: z
    .string()
    .min(2, "Company or organization name is required."),

  role: z.enum(["VENDOR", "ORGANIZATION"]),

  organizationType: z
    .enum([
      "GOVERNMENT",
      "LOCAL_GOVERNMENT",
      "NGO",
      "INTERNATIONAL_NGO",
      "PRIVATE_COMPANY",
      "SCHOOL_UNIVERSITY",
      "HOSPITAL",
      "BANK_FINANCIAL_INSTITUTION",
      "DEVELOPMENT_AGENCY",
      "OTHER",
    ])
    .optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      console.error(
        "REGISTRATION VALIDATION ERROR:",
        validated.error.flatten(),
      );

      return NextResponse.json(
        {
          message: "Invalid registration details.",
          errors: validated.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const {
      name,
      email,
      password,
      companyName,
      role,
      organizationType,
    } = validated.data;

    if (role === "ORGANIZATION" && !organizationType) {
      return NextResponse.json(
        {
          message: "Organization type is required.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "Email already registered.",
        },
        {
          status: 409,
        },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const subscriptionPlan =
      role === "ORGANIZATION"
        ? "ORGANIZATION_STARTER"
        : "VENDOR_FREE";

    const result = await prisma.$transaction(async (tx) => {
      /*
       * Create the user first.
       */
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role,
          status: "PENDING",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

      let organization = null;

      /*
       * Vendor registration
       */
      if (role === "VENDOR") {
        await tx.vendor.create({
          data: {
            userId: newUser.id,
            companyName: companyName.trim(),
            email: normalizedEmail,
          },
        });
      }

      /*
       * Organization registration
       *
       * The organization is created first.
       * The newly created organization's ID is then explicitly
       * assigned to OrganizationMember.
       */
      if (role === "ORGANIZATION") {
        organization = await tx.organization.create({
          data: {
            name: companyName.trim(),
            email: normalizedEmail,
            organizationType: organizationType!,
          },
        });

        await tx.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId: newUser.id,
          },
        });
      }

      /*
       * Create the user's subscription.
       */
      const subscription = await tx.subscription.create({
        data: {
          userId: newUser.id,
          plan: subscriptionPlan,
          ...(organization
            ? {
                organizationId: organization.id,
              }
            : {}),
        },
      });

      return {
        user: newUser,
        organization,
        subscription,
      };
    });

    return NextResponse.json(
      {
        message: "Registration successful.",
        user: result.user,
        organization: result.organization
          ? {
              id: result.organization.id,
              name: result.organization.name,
              email: result.organization.email,
              organizationType:
                result.organization.organizationType,
            }
          : null,
        subscription: {
          plan: subscriptionPlan,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        message: "Something went wrong during registration.",
      },
      {
        status: 500,
      },
    );
  }
}
