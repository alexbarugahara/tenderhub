import { z } from "zod";

/* ========================================
   LOGIN
======================================== */

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(
      6,
      "Password must be at least 6 characters"
    ),

  expectedRole: z.enum([
    "ADMIN",
    "VENDOR",
    "ORGANIZATION",
  ]),
});


/* ========================================
   REGISTER
======================================== */

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(
        2,
        "Name must be at least 2 characters"
      ),

    email: z
      .string()
      .email("Invalid email address"),

    password: z
      .string()
      .min(
        6,
        "Password must be at least 6 characters"
      ),

    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );


/* ========================================
   FORGOT PASSWORD
======================================== */

export const ForgotPasswordSchema =
  z.object({
    email: z
      .string()
      .email("Invalid email address"),
  });


/* ========================================
   RESET PASSWORD
======================================== */

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        6,
        "Password must be at least 6 characters"
      ),

    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );