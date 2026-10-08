"use client";

interface Activity {
  id: string;
  type: "tender" | "application";
  title: string;
  description: string;
  time: string;
}

interface RecentActivityProps {
  activities?: Activity[];
}

export default function RecentActivity({
  activities = [
    {
      id: "1",
      type: "tender",
      title: "Tender opened",
      description: "School Furniture Supply",
      time: "2 hours ago",
    },

    {
      id: "2",
      type: "application",
      title: "Supplier applied",
      description: "ABC Contractors",
      time: "Yesterday",
    },
  ],
}: RecentActivityProps) {
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

      <h2
        className="
          text-xl
          font-bold
          text-[#071A33]
        "
      >
        Recent Activity
      </h2>

      {/* ACTIVITY LIST */}

      <div
        className="
          mt-5
          space-y-4
        "
      >
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="
                flex
                items-start
                gap-4
                border-b
                border-gray-100
                pb-4
                last:border-0
              "
            >
              {/* ICON */}

              <div
                className="
                  mt-1
                  text-lg
                "
              >
                {activity.type === "tender"
                  ? "🟢"
                  : "👤"}
              </div>

              {/* CONTENT */}

              <div className="min-w-0">
                <p
                  className="
                    font-semibold
                    text-gray-900
                  "
                >
                  {activity.title}
                </p>

                <p
                  className="
                    text-sm
                    text-gray-600
                  "
                >
                  {activity.description}
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-gray-400
                  "
                >
                  {activity.time}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div
            className="
              py-6
              text-center
              text-sm
              text-gray-500
            "
          >
            No recent activity yet.
          </div>
        )}
      </div>
    </div>
  );
}
