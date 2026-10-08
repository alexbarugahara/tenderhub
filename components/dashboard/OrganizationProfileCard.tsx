"use client";

import {
  ShieldCheck,
} from "lucide-react";


interface OrganizationProfileCardProps {

  name?: string;

  organizationName?: string;

  verified?: boolean;

  plan?: string;

  activeSince?: string;

  primaryContact?: string;

  organizationEmail?: string;

  district?: string;

  procurementOfficer?: string;

  subscriptionRenewal?: string;

}



export default function OrganizationProfileCard({

  name,

  organizationName = "Organization",

  verified = true,

  plan = "Professional",

  activeSince = "July 2026",

  primaryContact = "John Congo",

  organizationEmail = "info@congoltd.com",

  district = "Kampala",

  procurementOfficer = "Jane Doe",

  subscriptionRenewal = "August 2027",

}: OrganizationProfileCardProps) {



  const displayName =
    name || organizationName;



  const initials =
    displayName
      .charAt(0)
      .toUpperCase();



  return (

    <div

      className="
        rounded-2xl
        border
        border-white/20
        bg-[#102B50]
        p-6
        shadow-xl
      "

    >



      {/* HEADER */}

      <div

        className="
          flex
          items-center
          gap-4
        "

      >



        {/* AVATAR */}

        <div

          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-xl
            bg-[#D4AF37]
            text-xl
            font-black
            text-[#071A33]
          "

        >

          {initials}

        </div>





        {/* DETAILS */}

        <div className="flex-1">


          <h2

            className="
              text-xl
              font-black
              text-white
            "

          >

            {displayName}

          </h2>





          {verified && (

            <div

              className="
                mt-2
                flex
                items-center
                gap-2
                text-sm
                font-bold
                text-[#D4AF37]
              "

            >

              <ShieldCheck className="h-4 w-4" />

              Verified Organization

            </div>

          )}



        </div>



      </div>







      {/* ORGANIZATION DETAILS */}



      <div

        className="
          mt-6
          space-y-4
        "

      >


        <InfoRow

          label="Primary Contact"

          value={primaryContact}

        />



        <InfoRow

          label="Organization Email"

          value={organizationEmail}

        />



        <InfoRow

          label="District"

          value={district}

        />



        <InfoRow

          label="Procurement Officer"

          value={procurementOfficer}

        />



        <InfoRow

          label="Subscription Plan"

          value={plan}

        />



        <InfoRow

          label="Member Since"

          value={activeSince}

        />



        <InfoRow

          label="Subscription Renewal"

          value={subscriptionRenewal}

        />



      </div>





    </div>

  );

}







function InfoRow({

  label,

  value,

}:{

  label:string;

  value:string;

}) {



  return (

    <div

      className="
        flex
        justify-between
        gap-4
        border-b
        border-white/20
        pb-3
      "

    >



      <span

        className="
          text-sm
          font-semibold
          text-slate-300
        "

      >

        {label}

      </span>





      <span

        className="
          text-right
          text-sm
          font-black
          text-white
        "

      >

        {value}

      </span>



    </div>

  );

}