"use client";

interface ApplicationStatsProps {
  totalApplications: number;
}

export default function ApplicationStats({
  totalApplications,
}: ApplicationStatsProps) {
  const applications = totalApplications ?? 0;

  return (
    <div
      className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-6
        shadow-sm
      "
    >
      {/* HEADER */}
      <div
        className="
          flex
          items-center
          justify-between
        "
      >
        <div>
          <p
            className="
              text-sm
              font-medium
              text-gray-500
            "
          >
            Total Applications
          </p>

          {applications === 0 ? (
            <div className="mt-3">
              <h2
                className="
                  text-3xl
                  font-bold
                  text-[#071A33]
                "
              >
                0
              </h2>

              <div className="mt-4 text-sm text-slate-500">
                <p className="font-medium text-slate-700">
                  No supplier applications yet.
                </p>

                <p className="mt-1">
                  Share your tender or promote it.
                </p>
              </div>
            </div>
          ) : (
            <h2
              className="
                mt-2
                text-3xl
                font-bold
                text-[#071A33]
              "
            >
              {applications}
            </h2>
          )}
        </div>

        {/* ICON */}
        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-[#D4AF37]/20
            text-2xl
          "
        >
          👥
        </div>
      </div>

      {/* FOOTER */}
      <div
        className={`
          mt-5
          border-t
          border-gray-100
          pt-4
          text-sm
          text-gray-500
        `}
      >
        {applications === 0
          ? "Supplier applications will appear here once received."
          : "Supplier submissions across all tenders"}
      </div>
    </div>
  );
}