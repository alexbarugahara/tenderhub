export default function DashboardFooter() {
  return (
    <footer
      className="
        border-t
        bg-white
        px-8
        py-6
        text-sm
        text-slate-500
      "
    >

      <div
        className="
          flex
          flex-col
          justify-between
          gap-3
          md:flex-row
          md:items-center
        "
      >

        <p>
          © {new Date().getFullYear()} TenderHub Uganda. All rights reserved.
        </p>


        <div className="flex gap-5">

          <a
            href="/help"
            className="hover:text-slate-900 transition"
          >
            Support
          </a>


          <a
            href="/terms"
            className="hover:text-slate-900 transition"
          >
            Terms
          </a>


          <a
            href="/privacy"
            className="hover:text-slate-900 transition"
          >
            Privacy
          </a>

        </div>

      </div>

    </footer>
  );
}