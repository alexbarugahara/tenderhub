"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { ResetPasswordSchema } from "@/lib/validators/auth";

export async function resetPassword(
  token: string,
  data: {
    password: string;
    confirmPassword: string;
  }
) {
  const validated = ResetPasswordSchema.safeParse(data);

  if (!validated.success) {
    return {
      error: "Invalid password details",
    };
  }

  const resetToken = await prisma.verificationToken.findUnique({
    where: {
      token,
    },
  });

  if (!resetToken) {
    return {
      error: "Invalid reset token",
    };
  }

  if (resetToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        token,
      },
    });

    return {
      error: "Reset token has expired",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: resetToken.identifier,
    },
  });


  if (!user) {
    return {
      error: "User not found",
    };
  }


  const hashedPassword = await hashPassword(
    validated.data.password
  );


  await prisma.user.update({
    where: {
      id: user.id,
    },

    data: {
      password: hashedPassword,
    },
  });


  await prisma.verificationToken.delete({
    where: {
      token,
    },
  });


  return {
    success: "Password reset successfully",
  };
}