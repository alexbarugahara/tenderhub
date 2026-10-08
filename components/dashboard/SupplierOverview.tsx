"use client";

interface SupplierOverviewProps {
  applications: number;
  approved: number;
  rejected: number;
  pending: number;
  awarded: number;
}

export default function SupplierOverview({
  applications,
  approved,
  rejected,
  pending,
  awarded,
}: SupplierOverviewProps) {
  const stats = [
    {
      label: "Applications",
      value: applications,
    },
    {
      label: "Approved",
      value: approved,
    },
    {
      label: "Pending",
      value: pending,
    },
    {
      label: "Rejected",
      value: rejected,
    },
    {
      label: "Awarded",
      value: awarded,
    },
  ];

  return (
    <div
      className="
        rounded-2xl
        border
        bg-white
        shadow-sm
        p-6
      "
    >
      <h2
        className="
          text-xl
          font-bold
          text-slate-900
          mb-6
        "
      >
        Supplier Overview
      </h2>

      <div
        className="
          grid
          grid-cols-2
          md:grid-cols-5
          gap-4
        "
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="
              rounded-xl
              border
              bg-slate-50
              p-4
            "
          >
            <p
              className="
                text-sm
                text-slate-500
              "
            >
              {stat.label}
            </p>

            <p
              className="
                mt-2
                text-2xl
                font-bold
                text-slate-900
              "
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}