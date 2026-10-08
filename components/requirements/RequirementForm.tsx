"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RequirementFormProps {
  solicitationId: string;
  requirementCount: number;
  lotId?: string | null;
  onCreated?: () => void;
}

const REQUIREMENT_TYPES = [
  {
    value: "ELIGIBILITY",
    label: "Eligibility",
  },
  {
    value: "TECHNICAL",
    label: "Technical",
  },
  {
    value: "FINANCIAL",
    label: "Financial",
  },
  {
    value: "EXPERIENCE",
    label: "Experience",
  },
  {
    value: "COMPLIANCE",
    label: "Compliance",
  },
  {
    value: "DOCUMENT",
    label: "Document",
  },
  {
    value: "GENERAL",
    label: "General",
  },
];

export default function RequirementForm({
  solicitationId,
  requirementCount,
  lotId = null,
  onCreated,
}: RequirementFormProps) {
  const router = useRouter();

  const isLotRequirement = Boolean(lotId);

  const [type, setType] = useState("GENERAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(
    String(requirementCount + 1),
  );
  const [isMandatory, setIsMandatory] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setError("Requirement title is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/requirements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          solicitationId: isLotRequirement
            ? null
            : solicitationId,
          lotId: isLotRequirement ? lotId : null,
          type,
          title: trimmedTitle,
          description: trimmedDescription || null,
          isMandatory,
          sortOrder: Number(sortOrder) || 0,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Failed to create requirement.",
        );
      }

      setType("GENERAL");
      setTitle("");
      setDescription("");
      setIsMandatory(true);
      setSortOrder(String(requirementCount + 2));

      if (onCreated) {
        onCreated();
      }

      // Refresh the Server Component so the new
      // requirement appears immediately.
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create requirement.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 p-5"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="requirement-type"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          Requirement Type
        </label>

        <select
          id="requirement-type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          disabled={saving}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
        >
          {REQUIREMENT_TYPES.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="requirement-title"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          Requirement Title
        </label>

        <input
          id="requirement-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Certificate of Incorporation"
          disabled={saving}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label
          htmlFor="requirement-description"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          Description
        </label>

        <textarea
          id="requirement-description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          rows={4}
          placeholder="Describe what the vendor must provide or demonstrate."
          disabled={saving}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label
          htmlFor="requirement-order"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          Display Order
        </label>

        <input
          id="requirement-order"
          type="number"
          min="0"
          value={sortOrder}
          onChange={(event) =>
            setSortOrder(event.target.value)
          }
          disabled={saving}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input
          type="checkbox"
          checked={isMandatory}
          onChange={(event) =>
            setIsMandatory(event.target.checked)
          }
          disabled={saving}
          className="mt-1 h-4 w-4"
        />

        <span>
          <span className="block text-sm font-semibold text-slate-800">
            Mandatory requirement
          </span>

          <span className="mt-0.5 block text-xs leading-5 text-slate-500">
            Vendors must address this requirement when
            responding.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving
          ? "Adding..."
          : isLotRequirement
            ? "Add Lot Requirement"
            : "Add Requirement"}
      </button>
    </form>
  );
}