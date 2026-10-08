import VerifyEmail from "@/components/auth/VerifyEmail";
import Link from "next/link";

export const metadata = {
  title: "Verify Email | TenderHub",
  description:
    "Verify your email address to activate your TenderHub account.",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{
    email?: string;
    verified?: string;
  }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;

  const email =
    typeof params.email === "string" ? params.email : "";

  const verified = params.verified === "true";

  return (
    <main className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-2xl font-bold tracking-tight text-tenderhub-navy transition hover:text-tenderhub-gold"
          >
            TenderHub
          </Link>

          <p className="mt-2 text-sm text-slate-500">
            Procurement made simpler.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <VerifyEmail
            email={email}
            verified={verified}
          />
        </div>
      </div>
    </main>
  );
}