"use server";

import { signOut } from "@/auth";

export async function logout() {
  try {
    await signOut({
      redirect: false,
    });

    return {
      success: "Logged out successfully",
    };

  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

    return {
      error: "Logout failed",
    };
  }
}