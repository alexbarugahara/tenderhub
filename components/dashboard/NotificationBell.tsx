"use client";

import { Bell } from "lucide-react";
import { useState } from "react";


type NotificationType =
  | "TENDER_REOPENED"
  | "TENDER_SUSPENDED"
  | "TENDER_CLOSED"
  | "TENDER_AWARDED"
  | "TENDER_CANCELLED"
  | "INFO";


interface Notification {
  id: string | number;
  title: string;
  message: string;
  type: NotificationType;
  createdAt?: Date | string;
  read?: boolean;
}


/*
========================================
TEMPORARY DATA

Later replace this with data from Prisma:
prisma.notification.findMany()

========================================
*/

const notifications: Notification[] = [

  {
    id: 1,
    title: "Tender Reopened",
    message:
      "Road Construction Tender is open again for supplier applications.",
    type: "TENDER_REOPENED",
    createdAt: "2026-08-02",
  },


  {
    id: 2,
    title: "Tender Suspended",
    message:
      "Road Maintenance Tender has been temporarily suspended.",
    type: "TENDER_SUSPENDED",
    createdAt: "2026-08-01",
  },


  {
    id: 3,
    title: "Tender Awarded",
    message:
      "Medical Supplies Tender has been awarded.",
    type: "TENDER_AWARDED",
    createdAt: "2026-07-30",
  },

];



export default function NotificationBell() {

  const [open, setOpen] = useState(false);


  const unreadCount = notifications.length;



  const getNotificationStyle = (
    type: NotificationType
  ) => {

    switch(type){

      case "TENDER_REOPENED":
        return "bg-emerald-50 text-emerald-700";


      case "TENDER_SUSPENDED":
        return "bg-yellow-50 text-yellow-700";


      case "TENDER_CLOSED":
        return "bg-slate-100 text-slate-700";


      case "TENDER_AWARDED":
        return "bg-blue-50 text-blue-700";


      case "TENDER_CANCELLED":
        return "bg-red-50 text-red-700";


      default:
        return "bg-slate-50 text-slate-700";

    }

  };



  return (

    <div className="relative">


      {/* Bell Button */}

      <button
        onClick={() => setOpen(!open)}
        className="
          relative
          rounded-full
          p-2
          transition
          hover:bg-slate-100
        "
        aria-label="Notifications"
      >

        <Bell
          className="
            h-6
            w-6
            text-slate-700
          "
        />


        {unreadCount > 0 && (

          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              h-5
              w-5
              items-center
              justify-center
              rounded-full
              bg-red-500
              text-xs
              font-bold
              text-white
            "
          >

            {unreadCount}

          </span>

        )}


      </button>




      {/* Dropdown */}

      {open && (

        <div
          className="
            absolute
            right-0
            z-50
            mt-3
            w-96
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-xl
          "
        >


          <div
            className="
              mb-4
              flex
              items-center
              justify-between
            "
          >

            <h3
              className="
                text-lg
                font-semibold
                text-[#071A33]
              "
            >
              Notifications
            </h3>


            <span
              className="
                text-sm
                text-slate-500
              "
            >

              {unreadCount} new

            </span>


          </div>




          <div className="space-y-3">


            {notifications.length === 0 ? (

              <p className="text-sm text-slate-500">
                No notifications.
              </p>


            ) : (


              notifications.map((notification)=>(


                <div
                  key={notification.id}
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-3
                  "
                >


                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    "
                  >


                    <p
                      className="
                        text-sm
                        font-semibold
                        text-[#071A33]
                      "
                    >

                      {notification.title}

                    </p>



                    <span
                      className={`
                        rounded-full
                        px-2
                        py-1
                        text-[10px]
                        font-bold
                        ${getNotificationStyle(
                          notification.type
                        )}
                      `}
                    >

                      {notification.type
                        .replaceAll("_"," ")
                      }

                    </span>


                  </div>



                  <p
                    className="
                      mt-2
                      text-xs
                      text-slate-600
                    "
                  >

                    {notification.message}

                  </p>



                  {notification.createdAt && (

                    <p
                      className="
                        mt-2
                        text-xs
                        text-slate-400
                      "
                    >

                      {new Intl.DateTimeFormat(
                        "en-UG",
                        {
                          dateStyle:"medium"
                        }
                      ).format(
                        new Date(
                          notification.createdAt
                        )
                      )}

                    </p>

                  )}



                </div>


              ))

            )}


          </div>




          <button
            className="
              mt-4
              w-full
              rounded-lg
              border
              py-2
              text-sm
              font-medium
              text-slate-700
              hover:bg-slate-50
            "
          >

            View all notifications

          </button>



        </div>

      )}


    </div>

  );

}