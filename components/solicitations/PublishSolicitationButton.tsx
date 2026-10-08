"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PublishSolicitationButtonProps = {
  solicitationId: string;
};

export default function PublishSolicitationButton({
  solicitationId,
}: PublishSolicitationButtonProps) {
  const router = useRouter();

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    const confirmed = window.confirm(
      "Are you sure you want to publish this solicitation?\n\nOnce published, it will no longer be in Draft status."
    );

    if (!confirmed) {
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/solicitations/${solicitationId}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message =
          Array.isArray(result?.errors) &&
          result.errors.length > 0
            ? result.errors.join("\n")
            : result?.error ||
              "Failed to publish the solicitation.";

        setError(message);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Publish solicitation error:",
        error
      );

      setError(
        "An unexpected error occurred while publishing the solicitation."
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handlePublish}
        disabled={publishing}
        className="inline-flex items-center justify-center rounded-lg bg-tenderhub-gold px-4 py-2.5 text-sm font-semibold text-tenderhub-navy shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {publishing
          ? "Publishing..."
          : "Publish Solicitation"}
      </button>

      {error ? (
        <div className="max-w-md whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}