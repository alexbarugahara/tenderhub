"use server";

import { RegisterSchema } from "@/lib/validators/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function register(data: unknown) {
  const validated = RegisterSchema.safeParse(data);

  if (!validated.success) {
    return {
      error: "Invalid registration details",
    };
  }

  try {
    const {
      name,
      email,
      password,
    } = validated.data;

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return {
        error: "A user with this email already exists.",
      };
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        status: "ACTIVE",
      },
    });

    return {
      success: "Registration successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Registration failed",
    };
  }
}