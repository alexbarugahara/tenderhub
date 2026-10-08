"use server";

import { prisma } from "@/lib/prisma";

export async function verifyEmail(token: string) {
  try {
    const verificationToken =
      await prisma.verificationToken.findUnique({
        where: {
          token,
        },
      });

    if (!verificationToken) {
      return {
        error: "Invalid verification token",
      };
    }


    if (verificationToken.expires < new Date()) {

      await prisma.verificationToken.delete({
        where: {
          token,
        },
      });

      return {
        error: "Verification token has expired",
      };
    }


    const user =
      await prisma.user.findUnique({
        where: {
          email: verificationToken.identifier,
        },
      });


    if (!user) {
      return {
        error: "User not found",
      };
    }


    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        emailVerified: new Date(),
        status: "ACTIVE",
      },
    });


    await prisma.verificationToken.delete({
      where: {
        token,
      },
    });


    return {
      success: "Email verified successfully",
    };


  } catch (error) {

    console.error(
      "VERIFY EMAIL ERROR:",
      error
    );

    return {
      error: "Something went wrong while verifying email",
    };
  }
}