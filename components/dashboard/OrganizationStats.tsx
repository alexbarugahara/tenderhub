"use client";

import {
  FileText,
  Activity,
  Users,
  AlertTriangle,
} from "lucide-react";

import OrganizationStatCard from "./OrganizationStatCard";


interface OrganizationStatsProps {

  totalTenders: number;

  activeTenders: number;

  applications: number;

  closingSoon: number;

}



export default function OrganizationStats({

  totalTenders,

  activeTenders,

  applications,

  closingSoon,

}: OrganizationStatsProps) {



  const stats = [

    {
      icon: (
        <FileText className="h-6 w-6" />
      ),

      title: "Total Tenders",

      value: totalTenders ?? 0,

      subtitle:
        "All procurement notices",

    },


    {
      icon: (
        <Activity className="h-6 w-6" />
      ),

      title: "Active Tenders",

      value: activeTenders ?? 0,

      subtitle:
        "Currently running",

    },


    {
      icon: (
        <Users className="h-6 w-6" />
      ),

      title: "Applications",

      value: applications ?? 0,

      subtitle:
        "Supplier submissions",

    },


    {
      icon: (
        <AlertTriangle className="h-6 w-6" />
      ),

      title: "Closing Soon",

      value: closingSoon ?? 0,

      subtitle:
        closingSoon > 0
          ? "Needs attention"
          : "No deadlines nearby",

    },


  ];




  return (

    <div

      className="
        grid
        gap-5
        sm:grid-cols-2
        xl:grid-cols-4
      "

    >


      {stats.map((stat) => (

        <OrganizationStatCard

          key={stat.title}

          icon={stat.icon}

          title={stat.title}

          value={stat.value}

          subtitle={stat.subtitle}

        />

      ))}



    </div>

  );

}