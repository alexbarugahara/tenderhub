"use server";

import { signIn } from "@/auth";
import { LoginSchema } from "@/lib/validators/auth";

type LoginRole =
  | "SUPPLIER"
  | "ORGANIZATION"
  | "ADMIN";

interface LoginData {
  email: string;
  password: string;
  expectedRole: LoginRole;
}

export async function login(
  data: LoginData
) {
  const validated =
    LoginSchema.safeParse(data);

  if (!validated.success) {
    return {
      error: "Invalid login details",
    };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      expectedRole: data.expectedRole,
      redirect: false,
    });

    return {
      success: "Login successful",
    };
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return {
      error:
        "Invalid email, password, or account type",
    };
  }
}