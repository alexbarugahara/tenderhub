"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import {
  Settings,
  HelpCircle,
  ChevronDown,
  ArrowLeft,
  LogOut,
} from "lucide-react";

import NotificationBell from "./NotificationBell";

interface DashboardHeaderProps {
  organizationName?: string;
}

export default function DashboardHeader({
  organizationName,
}: DashboardHeaderProps) {
  const { data: session } = useSession();

  const [openMenu, setOpenMenu] = useState(false);

  const pathname = usePathname();

  const displayName =
    organizationName ||
    session?.user?.name ||
    "Organization";

  return (
    <header
      className="
        flex
        items-center
        justify-between
        border-b
        bg-white
        px-8
        py-4
      "
    >
      {/* Left Section */}

      <div className="flex items-center gap-4">
        {pathname !== "/dashboard/organization" && (
          <Link
            href="/dashboard/organization"
            className="
              flex
              items-center
              gap-2
              rounded-lg
              px-3
              py-2
              text-sm
              font-semibold
              text-slate-700
              hover:bg-slate-100
              transition
            "
          >
            <ArrowLeft className="h-4 w-4" />

            Dashboard
          </Link>
        )}
      </div>

      {/* Right Actions */}

      <div
        className="
          flex
          items-center
          gap-4
        "
      >
        {/* Notifications */}

        <NotificationBell />

        {/* Settings Icon */}

        <Link
          href="/dashboard/organization/settings"
          className="
            rounded-lg
            p-2
            hover:bg-slate-100
            transition
          "
        >
          <Settings className="h-5 w-5 text-slate-600" />
        </Link>

        {/* Help Icon */}

        <Link
          href="/dashboard/organization/help"
          className="
            rounded-lg
            p-2
            hover:bg-slate-100
            transition
          "
        >
          <HelpCircle className="h-5 w-5 text-slate-600" />
        </Link>

        {/* Organization Dropdown */}

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((prev) => !prev)}
            className="
              flex
              items-center
              gap-3
              rounded-xl
              px-3
              py-2
              hover:bg-slate-100
              transition
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-[#071A33]
                font-black
                text-[#D4AF37]
              "
            >
              {displayName.charAt(0).toUpperCase()}
            </div>

            <span
              className="
                hidden
                font-bold
                text-slate-800
                md:block
              "
            >
              {displayName}
            </span>

            <ChevronDown
              className="
                h-4
                w-4
                text-slate-500
              "
            />
          </button>

          {openMenu && (
            <div
              className="
                absolute
                right-0
                z-50
                mt-3
                w-52
                rounded-xl
                border
                bg-white
                p-2
                shadow-lg
              "
            >
              <Link
                href="/dashboard/organization/profile"
                onClick={() => setOpenMenu(false)}
                className="
                  block
                  rounded-lg
                  px-3
                  py-2
                  text-sm
                  text-slate-700
                  hover:bg-slate-100
                "
              >
                Profile
              </Link>

              <Link
                href="/dashboard/organization/settings"
                onClick={() => setOpenMenu(false)}
                className="
                  block
                  rounded-lg
                  px-3
                  py-2
                  text-sm
                  text-slate-700
                  hover:bg-slate-100
                "
              >
                Settings
              </Link>

              <Link
                href="/dashboard/organization/help"
                onClick={() => setOpenMenu(false)}
                className="
                  block
                  rounded-lg
                  px-3
                  py-2
                  text-sm
                  text-slate-700
                  hover:bg-slate-100
                "
              >
                Help
              </Link>

              <Link
                href="/dashboard/organization/billing"
                onClick={() => setOpenMenu(false)}
                className="
                  block
                  rounded-lg
                  px-3
                  py-2
                  text-sm
                  text-slate-700
                  hover:bg-slate-100
                "
              >
                Billing
              </Link>

              <div className="my-2 border-t" />

              <button
                type="button"
                onClick={() => {
                  setOpenMenu(false);

                  signOut({
                    callbackUrl: "/auth/login",
                  });
                }}
                className="
                  flex
                  w-full
                  items-center
                  gap-2
                  rounded-lg
                  px-3
                  py-2
                  text-left
                  text-sm
                  font-medium
                  text-red-600
                  hover:bg-red-50
                "
              >
                <LogOut className="h-4 w-4" />

                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
