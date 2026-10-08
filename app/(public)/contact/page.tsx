import {
  ArrowRight,
  Clock,
  Globe2,
  Mail,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Contact Us | TenderHub",
  description:
    "Contact TenderHub for procurement platform support, partnerships, enterprise solutions, and general inquiries.",
};

const contactOptions = [
  {
    icon: MessageSquare,
    title: "General Inquiries",
    description:
      "Questions about TenderHub, procurement workflows, accounts, or platform capabilities.",
  },
  {
    icon: ShieldCheck,
    title: "Platform Support",
    description:
      "Need help with your organization, vendor profile, solicitations, bids, or contracts?",
  },
  {
    icon: Globe2,
    title: "Partnerships",
    description:
      "Explore integrations, procurement partnerships, technology partnerships, or regional opportunities.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#071A33] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              Contact TenderHub
            </p>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Let&apos;s talk procurement.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Have a question about TenderHub, need platform support, or
              interested in an enterprise partnership? Our team would be
              happy to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {contactOptions.map((option) => {
            const Icon = option.icon;

            return (
              <div
                key={option.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#071A33] text-[#D4AF37]">
                  <Icon size={23} />
                </div>

                <h2 className="mt-6 text-xl font-bold text-[#071A33]">
                  {option.title}
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  {option.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Contact Information */}
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Get in touch
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#071A33] sm:text-4xl">
              We&apos;re here to help.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              Whether you represent an organization managing procurement,
              a vendor looking for opportunities, or a partner interested
              in working with TenderHub, you can reach out to our team.
            </p>

            <div className="mt-10 space-y-7">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071A33] text-[#D4AF37]">
                  <Mail size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-[#071A33]">
                    Email
                  </h3>

                  <p className="mt-1 text-slate-600">
                    General inquiries and support
                  </p>

                  <a
                    href="mailto:info@tenderhub.ug"
                    className="mt-1 inline-block font-semibold text-[#071A33] transition hover:text-[#9c7d18]"
                  >
                    info@tenderhub.ug
                  </a>
                </div>
              </div>

              {/* Support */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071A33] text-[#D4AF37]">
                  <MessageSquare size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-[#071A33]">
                    Platform Support
                  </h3>

                  <p className="mt-1 text-slate-600">
                    For account and platform assistance
                  </p>

                  <a
                    href="mailto:support@tenderhub.ug"
                    className="mt-1 inline-block font-semibold text-[#071A33] transition hover:text-[#9c7d18]"
                  >
                    support@tenderhub.ug
                  </a>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071A33] text-[#D4AF37]">
                  <Clock size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-[#071A33]">
                    Support Availability
                  </h3>

                  <p className="mt-1 leading-7 text-slate-600">
                    Monday – Friday
                    <br />
                    Business hours
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Response times may vary by inquiry type.
                  </p>
                </div>
              </div>
            </div>

            {/* International note */}
            <div className="mt-10 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-6">
              <div className="flex gap-4">
                <Globe2
                  className="mt-1 shrink-0 text-[#9c7d18]"
                  size={22}
                />

                <div>
                  <h3 className="font-bold text-[#071A33]">
                    Serving a global procurement market
                  </h3>

                  <p className="mt-2 leading-7 text-slate-700">
                    TenderHub is designed to support organizations and
                    vendors across different countries, currencies,
                    procurement models, classifications, and compliance
                    requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Send a message
              </p>

              <h2 className="mt-3 text-2xl font-extrabold text-[#071A33] sm:text-3xl">
                How can we help?
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Complete the form and provide as much detail as possible.
              </p>
            </div>

            <form className="mt-8 space-y-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              {/* Organization */}
              <div>
                <label
                  htmlFor="organization"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Organization
                </label>

                <input
                  id="organization"
                  name="organization"
                  type="text"
                  placeholder="Organization name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              {/* Inquiry Type */}
              <div>
                <label
                  htmlFor="inquiryType"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Inquiry Type
                </label>

                <select
                  id="inquiryType"
                  name="inquiryType"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  <option value="" disabled>
                    Select an option
                  </option>

                  <option value="general">
                    General Inquiry
                  </option>

                  <option value="support">
                    Platform Support
                  </option>

                  <option value="enterprise">
                    Enterprise Solution
                  </option>

                  <option value="partnership">
                    Partnership
                  </option>

                  <option value="vendor">
                    Vendor Account
                  </option>

                  <option value="organization">
                    Organization Account
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="What would you like to discuss?"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Tell us how we can help..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#071A33] px-6 py-4 font-bold text-white transition hover:bg-[#0d2a4d]"
              >
                Send Message

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                By submitting this form, you agree that TenderHub may use
                the information provided to respond to your inquiry.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="bg-[#071A33] py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Enterprise
          </p>

          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Building a procurement system for a larger organization?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-300">
            Talk to us about enterprise procurement workflows,
            departments, users, compliance, reporting, integrations,
            and other organizational requirements.
          </p>

          <a
            href="mailto:info@tenderhub.ug?subject=Enterprise%20TenderHub%20Inquiry"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-7 py-4 font-bold text-[#071A33] transition hover:bg-[#e5c45a]"
          >
            Contact Enterprise Team
            <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </main>
  );
}