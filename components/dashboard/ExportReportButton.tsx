"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  ChevronDown,
} from "lucide-react";

export default function ExportReportButton() {
  const [open, setOpen] = useState(false);

  const handleExport = (type: "pdf" | "excel" | "csv") => {
    setOpen(false);

    // TODO:
    // Replace these with real export actions/API calls.
    switch (type) {
      case "pdf":
        console.log("Export PDF procurement report");
        break;

      case "excel":
        console.log("Export Excel tender report");
        break;

      case "csv":
        console.log("Export CSV applications report");
        break;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-gray-200
          bg-white
          px-4
          py-2.5
          text-sm
          font-semibold
          text-gray-700
          shadow-sm
          transition
          hover:bg-gray-50
        "
      >
        <Download className="h-4 w-4" />
        Export Report
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="
            absolute
            right-0
            z-50
            mt-2
            w-64
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white
            shadow-xl
          "
        >
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="
              flex
              w-full
              items-center
              gap-3
              px-4
              py-3
              text-left
              text-sm
              transition
              hover:bg-gray-50
            "
          >
            <FileText className="h-5 w-5 text-red-600" />

            <div>
              <p className="font-semibold text-gray-900">
                PDF Procurement Report
              </p>

              <p className="text-xs text-gray-500">
                Export a printable dashboard report
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport("excel")}
            className="
              flex
              w-full
              items-center
              gap-3
              border-t
              border-gray-100
              px-4
              py-3
              text-left
              text-sm
              transition
              hover:bg-gray-50
            "
          >
            <FileSpreadsheet className="h-5 w-5 text-green-600" />

            <div>
              <p className="font-semibold text-gray-900">
                Excel Tender Report
              </p>

              <p className="text-xs text-gray-500">
                Export all tenders to Excel
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="
              flex
              w-full
              items-center
              gap-3
              border-t
              border-gray-100
              px-4
              py-3
              text-left
              text-sm
              transition
              hover:bg-gray-50
            "
          >
            <File className="h-5 w-5 text-blue-600" />

            <div>
              <p className="font-semibold text-gray-900">
                CSV Applications Report
              </p>

              <p className="text-xs text-gray-500">
                Export supplier application data
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}