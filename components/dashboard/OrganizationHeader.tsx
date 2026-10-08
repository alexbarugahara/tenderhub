"use client";

import Link from "next/link";

import {
  Building2,
  Plus,
  Clock,
  ShieldCheck,
} from "lucide-react";

import ExportReportButton from "./ExportReportButton";
import OrganizationProfileCard from "./OrganizationProfileCard";

interface OrganizationHeaderProps {
  name?: string;
  plan?: string;
}

export default function OrganizationHeader({
  name = "Organization",
  plan = "Professional",
}: OrganizationHeaderProps) {
  return (
    <section
      className="
      relative
      overflow-hidden
      rounded-3xl
      border
      border-[#D4AF37]/30
      bg-gradient-to-br
      from-[#071A33]
      via-[#0D315A]
      to-[#071A33]
      p-8
      shadow-2xl
      lg:p-10
      "
    >

      {/* GOLD GLOW BACKGROUND */}
      <div
        className="
        pointer-events-none
        absolute
        -right-20
        -top-20
        h-80
        w-80
        rounded-full
        bg-[#D4AF37]/20
        blur-3xl
        "
      />


      <div
        className="
        pointer-events-none
        absolute
        bottom-0
        left-0
        h-40
        w-40
        rounded-full
        bg-blue-400/10
        blur-3xl
        "
      />


      {/* ICON DECORATION */}
      <Building2
        className="
        pointer-events-none
        absolute
        right-10
        top-10
        h-64
        w-64
        text-[#D4AF37]
        opacity-10
        "
      />


      <div className="relative z-10">

        <div
          className="
          grid
          gap-10
          lg:grid-cols-[65%_35%]
          "
        >

          {/* LEFT SIDE */}
          <div>

            <p
              className="
              flex
              items-center
              gap-2
              text-sm
              font-bold
              text-[#D4AF37]
              "
            >

              <ShieldCheck className="h-4 w-4" />

              Organization Dashboard

            </p>



            <h1
              className="
              mt-4
              text-5xl
              font-black
              tracking-tight
              text-white
              "
            >
              {name}
            </h1>



            <p
              className="
              mt-4
              max-w-xl
              text-lg
              leading-relaxed
              text-slate-200
              "
            >
              Manage tenders, review supplier applications,
              track procurement performance and grow your
              organization's opportunities from one powerful platform.
            </p>




            {/* STATUS BADGES */}
            <div
              className="
              mt-7
              flex
              flex-wrap
              gap-3
              "
            >

              <div
                className="
                flex
                items-center
                gap-2
                rounded-full
                bg-[#D4AF37]
                px-5
                py-2.5
                text-sm
                font-black
                text-[#071A33]
                "
              >

                <ShieldCheck className="h-4 w-4" />

                Verified Organization

              </div>



              <div
                className="
                rounded-full
                border
                border-[#D4AF37]/40
                bg-[#071A33]/40
                px-5
                py-2.5
                text-sm
                font-bold
                text-white
                "
              >

                ⭐ {plan} Plan

              </div>



              <div
                className="
                flex
                items-center
                gap-2
                rounded-full
                border
                border-white/20
                bg-white/10
                px-5
                py-2.5
                text-sm
                font-bold
                text-white
                "
              >

                <Clock className="h-4 w-4 text-[#D4AF37]" />

                Active today

              </div>


            </div>






            {/* ACTION BUTTONS */}
            <div
              className="
              relative
              z-50
              mt-9
              flex
              flex-wrap
              gap-4
              "
            >



              {/* CREATE TENDER */}
              <Link
                href="/dashboard/organization/tenders/new"
                className="
                relative
                z-50
                flex
                h-12
                items-center
                gap-2
                rounded-xl
                bg-[#D4AF37]
                px-7
                font-black
                text-[#071A33]
                shadow-lg
                transition
                hover:bg-yellow-300
                "
              >

                <Plus className="h-5 w-5" />

                Create Tender

              </Link>






              {/* EXPORT REPORT */}
              <div
                className="
                relative
                z-50
                flex
                h-12
                items-center
                rounded-xl
                bg-white
                px-5
                shadow-lg
                "
              >

                <ExportReportButton />

              </div>


            </div>


          </div>







          {/* PROFILE CARD */}
          <div
            className="
            rounded-3xl
            bg-white/5
            p-2
            backdrop-blur-sm
            "
          >

            <OrganizationProfileCard
              organizationName={name}
              plan={plan}
            />

          </div>


        </div>


      </div>


    </section>
  );
}