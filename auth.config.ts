import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/db/prisma";
import { comparePassword } from "@/lib/password";

export const authConfig = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");

        console.log(
          "[AUTH DEBUG] DATABASE_URL:",
          process.env.DATABASE_URL
            ? process.env.DATABASE_URL.replace(/:\/\/.*@/, "://***:***@")
            : "MISSING",
        );

        console.log("[AUTH DEBUG] email:", email);
        console.log(
          "[AUTH DEBUG] password received:",
          Boolean(password),
        );
        console.log(
          "[AUTH DEBUG] password length:",
          password.length,
        );

        if (!email || !password) {
          console.log(
            "[AUTH DEBUG] REJECTED: missing email or password",
          );
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        console.log(
          "[AUTH DEBUG] user found:",
          Boolean(user),
        );

        if (!user || !user.password) {
          console.log(
            "[AUTH DEBUG] REJECTED: user missing or no password",
          );
          return null;
        }

        console.log(
          "[AUTH DEBUG] user role:",
          user.role,
        );

        console.log(
          "[AUTH DEBUG] user status:",
          user.status,
        );

        const passwordMatch = await comparePassword(
          password,
          user.password,
        );

        console.log(
          "[AUTH DEBUG] password match:",
          passwordMatch,
        );

        if (!passwordMatch) {
          console.log(
            "[AUTH DEBUG] REJECTED: password mismatch",
          );
          return null;
        }

        console.log(
          "[AUTH DEBUG] SUCCESS: authorize returning user",
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.status = user.status;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }

        if (typeof token.role === "string") {
          session.user.role =
            token.role as typeof session.user.role;
        }

        if (typeof token.status === "string") {
          session.user.status = token.status;
        }
      }

      return session;
    },
  },
} satisfies NextAuthConfig;