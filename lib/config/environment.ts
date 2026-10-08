export type Environment = "development" | "test" | "production";

function getEnvironment(): Environment {
  const value = process.env.NODE_ENV;

  if (value === "production") {
    return "production";
  }

  if (value === "test") {
    return "test";
  }

  return "development";
}

export const environment = {
  current: getEnvironment(),

  isDevelopment: getEnvironment() === "development",
  isTest: getEnvironment() === "test",
  isProduction: getEnvironment() === "production",

  appUrl:
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000",

  databaseUrl: process.env.DATABASE_URL?.trim() || "",

  authSecret:
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "",

  email: {
    resendApiKey:
      process.env.RESEND_API_KEY?.trim() || "",

    from:
      process.env.EMAIL_FROM?.trim() || "",
  },
} as const;

export function requireEnvironmentVariable(
  name: string,
): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Required environment variable "${name}" is not configured.`,
    );
  }

  return value;
}

export function isEnvironmentVariableConfigured(
  name: string,
): boolean {
  return Boolean(process.env[name]?.trim());
}