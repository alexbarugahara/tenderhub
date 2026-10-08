"use server";

import { signOut } from "@/auth";

export async function logout() {
  try {
    await signOut({
      redirect: false,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Logout error:", error);

    return {
      success: false,
      error: "Failed to logout",
    };
  }
}