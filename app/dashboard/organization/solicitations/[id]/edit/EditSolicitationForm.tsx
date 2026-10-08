"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
    SOLICITATION_TYPES,
    getSolicitationTypeConfig,
} from "@/lib/solicitations/types";

type InitialValues = {
    solicitationNumber: string;
    title: string;
    description: string;
    type: string;
    openingDate: string;
    closingDate: string;
    bidSecurityRequired: boolean;
    bidSecurityAmount: string;
    applicationFeeRequired: boolean;
    applicationFeeAmount: string;
};

type EditSolicitationFormProps = {
    solicitationId: string;
    initialValues: InitialValues;
};

export default function EditSolicitationForm({
    solicitationId,
    initialValues,
}: EditSolicitationFormProps) {
    const router = useRouter();

    const [form, setForm] = useState<InitialValues>(initialValues);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function updateField(
        field: keyof InitialValues,
        value: string | boolean,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setError("");
        setSuccess("");
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            if (!form.solicitationNumber.trim()) {
                throw new Error(
                    "Solicitation number is required.",
                );
            }

            if (!form.title.trim()) {
                throw new Error(
                    "Solicitation title is required.",
                );
            }

            if (
                form.openingDate &&
                form.closingDate &&
                new Date(form.closingDate) <=
                    new Date(form.openingDate)
            ) {
                throw new Error(
                    "Closing date must be after opening date.",
                );
            }

            if (
                form.bidSecurityRequired &&
                !form.bidSecurityAmount
            ) {
                throw new Error(
                    "Bid security amount is required when bid security is enabled.",
                );
            }

            if (
                form.applicationFeeRequired &&
                !form.applicationFeeAmount
            ) {
                throw new Error(
                    "Application fee amount is required when application fee is enabled.",
                );
            }

            const response = await fetch(
                `/api/solicitations/${solicitationId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        solicitationNumber:
                            form.solicitationNumber.trim(),

                        title: form.title.trim(),

                        description:
                            form.description.trim() || null,

                        type: form.type,

                        openingDate:
                            form.openingDate || null,

                        closingDate:
                            form.closingDate || null,

                        bidSecurityRequired:
                            form.bidSecurityRequired,

                        bidSecurityAmount:
                            form.bidSecurityRequired
                                ? form.bidSecurityAmount || null
                                : null,

                        applicationFeeRequired:
                            form.applicationFeeRequired,

                        applicationFeeAmount:
                            form.applicationFeeRequired
                                ? form.applicationFeeAmount || null
                                : null,
                    }),
                },
            );

            let result: {
                success?: boolean;
                error?: string;
            } = {};

            try {
                result = await response.json();
            } catch {
                throw new Error(
                    "The server returned an invalid response.",
                );
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error ||
                        "Failed to update solicitation.",
                );
            }

            setSuccess(
                "Solicitation updated successfully.",
            );

            router.refresh();

            setTimeout(() => {
                router.push(
                    `/dashboard/organization/solicitations/${solicitationId}`,
                );
            }, 500);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to update solicitation.",
            );
        } finally {
            setSaving(false);
        }
    }

    const selectedType =
        getSolicitationTypeConfig(form.type);

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-8"
        >
            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">
                        {error}
                    </p>
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-800">
                        {success}
                    </p>
                </div>
            )}

            {/* Basic Information */}
            <section>
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Basic Information
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Update the basic details of this solicitation.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Solicitation Number */}
                    <div>
                        <label
                            htmlFor="solicitationNumber"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Solicitation Number
                        </label>

                        <input
                            id="solicitationNumber"
                            type="text"
                            value={form.solicitationNumber}
                            onChange={(event) =>
                                updateField(
                                    "solicitationNumber",
                                    event.target.value,
                                )
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                            disabled={saving}
                        />

                        <p className="mt-1 text-xs text-slate-500">
                            The unique reference for this solicitation.
                        </p>
                    </div>

                    {/* Solicitation Type */}
                    <div>
                        <label
                            htmlFor="type"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Solicitation Type
                        </label>

                        <select
                            id="type"
                            value={form.type}
                            onChange={(event) =>
                                updateField(
                                    "type",
                                    event.target.value,
                                )
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                            disabled={saving}
                        >
                            {SOLICITATION_TYPES.map((type) => (
                                <option
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.shortLabel} — {type.label}
                                </option>
                            ))}
                        </select>

                        {selectedType && (
                            <p className="mt-1 text-xs text-slate-500">
                                {selectedType.description}
                            </p>
                        )}
                    </div>

                    {/* Title */}
                    <div className="md:col-span-2">
                        <label
                            htmlFor="title"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Solicitation Title
                        </label>

                        <input
                            id="title"
                            type="text"
                            value={form.title}
                            onChange={(event) =>
                                updateField(
                                    "title",
                                    event.target.value,
                                )
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                            disabled={saving}
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label
                            htmlFor="description"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Description
                        </label>

                        <textarea
                            id="description"
                            rows={5}
                            value={form.description}
                            onChange={(event) =>
                                updateField(
                                    "description",
                                    event.target.value,
                                )
                            }
                            placeholder="Describe the procurement opportunity..."
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                            disabled={saving}
                        />
                    </div>
                </div>
            </section>

            {/* Solicitation Schedule */}
            <section className="border-t border-slate-200 pt-6">
                <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">
                        Solicitation Schedule
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Define when the solicitation opens and when
                        vendors must submit their bids.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Opening Date */}
                    <div>
                        <label
                            htmlFor="openingDate"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Opening Date
                        </label>

                        <input
                            id="openingDate"
                            type="datetime-local"
                            value={form.openingDate}
                            onChange={(event) =>
                                updateField(
                                    "openingDate",
                                    event.target.value,
                                )
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                            disabled={saving}
                        />
                    </div>

                    {/* Closing Date */}
                    <div>
                        <label
                            htmlFor="closingDate"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Closing Date
                        </label>

                        <input
                            id="closingDate"
                            type="datetime-local"
                            value={form.closingDate}
                            onChange={(event) =>
                                updateField(
                                    "closingDate",
                                    event.target.value,
                                )
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                            disabled={saving}
                        />
                    </div>
                </div>
            </section>

            {/* Bid Security */}
            <section className="border-t border-slate-200 pt-6">
                <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">
                        Bid Security
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Specify whether bidders must provide bid security.
                    </p>
                </div>

                <label className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={form.bidSecurityRequired}
                        onChange={(event) =>
                            updateField(
                                "bidSecurityRequired",
                                event.target.checked,
                            )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                        disabled={saving}
                    />

                    <span className="text-sm font-medium text-slate-700">
                        Bid security is required
                    </span>
                </label>

                {form.bidSecurityRequired && (
                    <div className="mt-4 max-w-md">
                        <label
                            htmlFor="bidSecurityAmount"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Bid Security Amount
                        </label>

                        <input
                            id="bidSecurityAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.bidSecurityAmount}
                            onChange={(event) =>
                                updateField(
                                    "bidSecurityAmount",
                                    event.target.value,
                                )
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                            disabled={saving}
                        />

                        <p className="mt-1 text-xs text-slate-500">
                            Enter the amount in the procurement currency.
                        </p>
                    </div>
                )}
            </section>

            {/* Application Fee */}
            <section className="border-t border-slate-200 pt-6">
                <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">
                        Application Fee
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Specify whether vendors must pay an application fee.
                    </p>
                </div>

                <label className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={form.applicationFeeRequired}
                        onChange={(event) =>
                            updateField(
                                "applicationFeeRequired",
                                event.target.checked,
                            )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                        disabled={saving}
                    />

                    <span className="text-sm font-medium text-slate-700">
                        Application fee is required
                    </span>
                </label>

                {form.applicationFeeRequired && (
                    <div className="mt-4 max-w-md">
                        <label
                            htmlFor="applicationFeeAmount"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Application Fee Amount
                        </label>

                        <input
                            id="applicationFeeAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.applicationFeeAmount}
                            onChange={(event) =>
                                updateField(
                                    "applicationFeeAmount",
                                    event.target.value,
                                )
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                            disabled={saving}
                        />

                        <p className="mt-1 text-xs text-slate-500">
                            Enter the amount in the procurement currency.
                        </p>
                    </div>
                )}
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            `/dashboard/organization/solicitations/${solicitationId}`,
                        )
                    }
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Solicitation"}
                </button>
            </div>
        </form>
    );
}