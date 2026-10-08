"use client";

import React, { ChangeEvent, DragEvent, useRef, useState } from "react";

export interface FileUploadProps {
  label?: string;
  hint?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export default function FileUpload({
  label = "Upload files",
  hint,
  error,
  accept,
  multiple = false,
  maxFiles = 10,
  maxSizeMB = 10,
  onFilesChange,
  disabled = false,
  className = "",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState("");

  const validateFiles = (selectedFiles: File[]) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!multiple && selectedFiles.length > 1) {
      setValidationError("Please select only one file.");
      return [];
    }

    if (selectedFiles.length > maxFiles) {
      setValidationError(`You can upload a maximum of ${maxFiles} files.`);
      return [];
    }

    const oversizedFile = selectedFiles.find(
      (file) => file.size > maxSizeBytes
    );

    if (oversizedFile) {
      setValidationError(
        `${oversizedFile.name} exceeds the ${maxSizeMB} MB file size limit.`
      );
      return [];
    }

    setValidationError("");
    return selectedFiles;
  };

  const updateFiles = (selectedFiles: File[]) => {
    const validFiles = validateFiles(selectedFiles);

    if (validFiles.length === 0) {
      return;
    }

    setFiles(validFiles);
    onFilesChange?.(validFiles);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    updateFiles(selectedFiles);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const droppedFiles = Array.from(event.dataTransfer.files);
    updateFiles(droppedFiles);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, fileIndex) => fileIndex !== index);

    setFiles(updatedFiles);
    setValidationError("");
    onFilesChange?.(updatedFiles);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const displayedError = error || validationError;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50"
            : displayedError
              ? "border-red-300 bg-red-50/30"
              : "border-gray-300 bg-white hover:border-tenderhub-gold hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tenderhub-navy/5 text-tenderhub-navy">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0L8 8m4-4 4 4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
              />
            </svg>
          </div>

          <p className="text-sm font-medium text-gray-700">
            Drag and drop your file{multiple ? "s" : ""} here
          </p>

          <p className="mt-1 text-xs text-gray-500">or</p>

          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="mt-2 rounded-lg bg-tenderhub-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-tenderhub-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Browse files
          </button>

          <p className="mt-3 text-xs text-gray-500">
            Maximum file size: {maxSizeMB} MB
          </p>

          {hint && !displayedError && (
            <p className="mt-1 text-xs text-gray-500">{hint}</p>
          )}

          {displayedError && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {displayedError}
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}