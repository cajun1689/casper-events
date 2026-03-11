import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Mail, CalendarPlus } from "lucide-react";

const updates = [
  {
    date: "March 2026",
    title: "Digest Newsletter Overhaul",
    icon: Mail,
    gradient: "from-teal-500 to-teal-600",
    items: [
      {
        title: "New email layout",
        desc: "Weekly digest now uses a modern card layout: event thumbnails, metadata, and descriptions in a clean, scannable format.",
      },
      {
        title: "Latest News section",
        desc: "Optional Latest News block that appears in the digest when you add items. Perfect for highlighting community news alongside events.",
      },
      {
        title: "Admin digest dashboard",
        desc: "Manage subscribers, export to CSV, add or remove subscribers manually, and customize the email with header image, sponsors, and extra links.",
      },
    ],
  },
  {
    date: "March 2026",
    title: "Google Calendar Sync",
    icon: CalendarPlus,
    gradient: "from-green-500 to-green-600",
    items: [
      {
        title: "Two-way sync",
        desc: "Connect your Google Calendar to sync events. Create events in Casper Events and they'll appear in Google Calendar.",
      },
      {
        title: "Approval workflow",
        desc: "Optional approval step for Google Calendar events — control what gets published before it goes live.",
      },
    ],
  },
  {
    date: "Earlier",
    title: "Core Platform",
    icon: Sparkles,
    gradient: "from-amber-500 to-amber-600",
    items: [
      { title: "Embeddable calendar", desc: "Month, list, list with poster board, and map views. Customize colors and filters for your site." },
      { title: "Event sponsors", desc: "Tiered sponsor levels with logos and links on event pages and poster board view." },
      { title: "Facebook integration", desc: "Share events directly to Facebook from the platform." },
      { title: "Partner connections", desc: "Connect with other organizations to show each other's events on embedded calendars." },
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 animate-fade-in">
      {/* Hero */}
      <div className="mb-12">
        <Link
          to="/about"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to About
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-xl shadow-violet-500/25">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Updates
            </h1>
            <p className="mt-1 text-lg text-gray-500">
              What's new in Casper Events
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />

        <div className="space-y-10">
          {updates.map((release, idx) => (
            <div key={release.title + idx} className="relative flex gap-6 pl-1">
              {/* Icon */}
              <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${release.gradient} shadow-xl shadow-gray-200/50 ring-1 ring-white/50`}>
                <release.icon className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="rounded-2xl border border-gray-200/60 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
                  <div className="mb-4 flex flex-wrap items-baseline gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{release.title}</h2>
                    <span className="text-sm font-medium text-gray-400">{release.date}</span>
                  </div>
                  <ul className="space-y-4">
                    {release.items.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                          <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50/60 to-white p-8 text-center">
        <p className="mb-4 text-sm font-semibold text-gray-700">
          Have feedback or a feature request?
        </p>
        <a
          href="mailto:hello@casperevents.org"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px"
        >
          Get in touch
        </a>
      </div>
    </div>
  );
}
