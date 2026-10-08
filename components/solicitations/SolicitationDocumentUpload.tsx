"use client";

import React, { useState } from "react";
import FileUpload from "@/components/ui/FileUpload";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

const DOCUMENT_CATEGORIES = [
  {
    value: "SOLICITATION_DOCUMENT",
    label: "Solicitation Document",
  },
  {
    value: "TECHNICAL_PROPOSAL",
    label: "Technical Proposal",
  },
  {
    value: "FINANCIAL_PROPOSAL",
    label: "Financial Proposal",
  },
  {
    value: "WORK_PLAN",
    label: "Work Plan",
  },
  {
    value: "METHODOLOGY",
    label: "Methodology",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

interface SolicitationDocumentUploadProps {
  solicitationId: string;
  onUploaded?: () => void;
}

interface UploadedFile {
  name: string;
  originalName: string;
  url: string;
  mimeType: string;
  fileSize: number;
}

export default function SolicitationDocumentUpload({
  solicitationId,
  onUploaded,
}: SolicitationDocumentUploadProps) {
  const [category, setCategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleUpload() {
    setError("");
    setSuccess("");

    if (!category) {
      setError("Please select a document category.");
      return;
    }

    if (files.length === 0) {
      setError("Please select a document to upload.");
      return;
    }

    const file = files[0];

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData?.success) {
        throw new Error(
          uploadData?.message || "The file could not be uploaded.",
        );
      }

      const uploadedFile: UploadedFile = uploadData.data;

      const documentResponse = await fetch(
        "/api/solicitation-documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            solicitationId,
            name: uploadedFile.originalName || file.name,
            category,
            fileUrl: uploadedFile.url,
            mimeType: uploadedFile.mimeType || file.type,
            fileSize: uploadedFile.fileSize || file.size,
          }),
        },
      );

      const documentData = await documentResponse.json();

      if (!documentResponse.ok || !documentData?.success) {
        throw new Error(
          documentData?.message ||
            "The document record could not be created.",
        );
      }

      setFiles([]);
      setCategory("");
      setSuccess("Document uploaded successfully.");

      onUploaded?.();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "An unexpected error occurred while uploading the document.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Upload Solicitation Document
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Upload a document that belongs to this solicitation. The
          solicitation is already selected from the current page.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <Select
          label="Document Category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          disabled={isUploading}
          options={[
            {
              value: "",
              label: "Select document category",
            },
            ...DOCUMENT_CATEGORIES,
          ]}
        />

        <FileUpload
          label="Document File"
          hint="PDF, Word, Excel, PowerPoint, text, CSV, ZIP, JPEG, PNG or WebP. Maximum 20 MB."
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.jpeg,.jpg,.png,.webp"
          multiple={false}
          maxFiles={1}
          maxSizeMB={20}
          onFilesChange={setFiles}
          disabled={isUploading}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !category || files.length === 0}
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </div>
    </div>
  );
}
