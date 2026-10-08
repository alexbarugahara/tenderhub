"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function createUser(formData: FormData) {
  const session = await auth();

  // Authentication
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Authorization
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const name = String(formData.get("name") || "").trim();

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const phone = String(formData.get("phone") || "").trim();

  const role = String(formData.get("role") || "").trim();

  const password = String(formData.get("password") || "");

  // Validation
  if (!name || !email || !role || !password) {
    throw new Error(
      "Name, email, role, and password are required."
    );
  }

  if (password.length < 6) {
    throw new Error(
      "Password must be at least 6 characters."
    );
  }

  if (
    role !== "ADMIN" &&
    role !== "ORGANIZATION" &&
    role !== "VENDOR"
  ) {
    throw new Error("Invalid user role.");
  }

  // Check for existing user
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error(
      "A user with this email already exists."
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role,
        status: "ACTIVE",
      },
    });

    // Vendors have a direct one-to-one User → Vendor relationship.
    if (role === "VENDOR") {
      await tx.vendor.create({
        data: {
          userId: user.id,
          companyName: name,
          email,
          phone: phone || null,
        },
      });
    }
  });

  redirect("/dashboard/admin/users");
}
