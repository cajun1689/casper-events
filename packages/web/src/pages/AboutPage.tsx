import { Link } from "react-router-dom";
import { CalendarHeart, Users, Code2, Heart, Building2, Globe, Share2, Printer, MapPin, Award, LayoutGrid } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 animate-fade-in">
      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-xl shadow-primary-500/25">
          <CalendarHeart className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          About Casper Events
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 leading-relaxed">
          A free, open-source community event calendar connecting people with the things happening around them.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-12 rounded-2xl border border-gray-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-extrabold text-gray-900">Our Mission</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Casper Events exists to make it easy for community members to discover what's happening locally — from youth programs and outdoor activities to veteran services, pride events, and everything in between. We believe that when people know what's going on in their community, they show up, connect, and thrive.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Too often, events are scattered across dozens of Facebook pages, flyers, and word of mouth. We built this platform to bring it all together in one place that anyone can browse, filter, and print out to share.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Our goal is to provide greater access to nonprofit events across Natrona County. We believe that access to events for youth creates positive childhood experiences.
        </p>
        <div className="mt-4 rounded-xl border border-gray-200/80 bg-gray-50/60 px-4 py-3">
          <p className="text-sm font-semibold text-gray-700 mb-1">What you won't find here</p>
          <p className="text-sm leading-relaxed text-gray-600">
            Bars and club events will never show on this calendar. Event organizers are currently limited to nonprofit organizations, and preference will be given to youth-serving nonprofits during our beta phase.
          </p>
        </div>
      </section>

      {/* Who built this */}
      <section className="mb-12 rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50/40 to-white p-8 shadow-sm backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/20">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="mb-2 text-xl font-extrabold text-gray-900">Built by Casper Youth Hub</h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Casper Events is built and maintained by <strong>Casper Youth Hub</strong>, a 501(c)(3) nonprofit organization based in Casper, Wyoming. Our broader mission centers on youth mental health, focusing on ages 14–20 — building strengths in online positivity, healthy self-image, and coping mechanisms for depression.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              This calendar platform is one piece of that mission: making it simple for young people and families to find positive, affirming events and activities in their community. We believe that connection is one of the strongest tools for mental wellness.
            </p>
          </div>
        </div>
      </section>

      {/* For Community Members */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-extrabold text-gray-900">For Community Members</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: CalendarHeart,
              title: "Browse & Filter Events",
              desc: "Find events by type — youth, outdoor, veteran, pride, and more. See everything on one calendar or filter to what matters to you.",
              gradient: "from-violet-500 to-violet-600",
            },
            {
              icon: Printer,
              title: "Print & Share",
              desc: "Print a monthly calendar to hang in your office, school, or community center so everyone can see what's coming up.",
              gradient: "from-amber-500 to-amber-600",
            },
            {
              icon: Globe,
              title: "Always Up to Date",
              desc: "Events are added by real organizations in your community. No stale listings — only upcoming events from verified groups.",
              gradient: "from-emerald-500 to-emerald-600",
            },
            {
              icon: Heart,
              title: "Completely Free",
              desc: "No ads, no subscriptions, no tracking. Casper Events is a community resource, funded by our nonprofit mission.",
              gradient: "from-rose-500 to-rose-600",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For Organizations */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-extrabold text-gray-900">For Organizations</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Building2,
              title: "Free Event Listing",
              desc: "Create an account for your organization, post events, and reach the whole community — all at no cost.",
              gradient: "from-blue-500 to-blue-600",
            },
            {
              icon: Code2,
              title: "Embeddable Calendar",
              desc: "Embed a calendar on your website with month, list, or poster board view. Match your brand colors, set the default view, filter event types, and install on Squarespace, WordPress, Wix, or any site.",
              gradient: "from-cyan-500 to-cyan-600",
            },
            {
              icon: MapPin,
              title: "Map View",
              desc: "Events with a location appear on an interactive map so visitors can see where things are happening. Available on the main calendar and in your embed.",
              gradient: "from-emerald-500 to-emerald-600",
            },
            {
              icon: LayoutGrid,
              title: "Poster Board View",
              desc: "Show events in a poster-style layout perfect for venues and programs. Choose it as the default view for your embed and feature events with images and sponsor logos.",
              gradient: "from-amber-500 to-amber-600",
            },
            {
              icon: Award,
              title: "Event Sponsors",
              desc: "Add sponsor logos and links to any event with tiered levels (presenting, gold, silver, bronze, community). Sponsors appear on event pages and in poster board view.",
              gradient: "from-rose-500 to-rose-600",
            },
            {
              icon: Share2,
              title: "Facebook Integration",
              desc: "Connect your Facebook Page and share events directly from the platform — no need to duplicate your work across multiple sites.",
              gradient: "from-indigo-500 to-indigo-600",
            },
            {
              icon: Users,
              title: "Partner Connections",
              desc: "Connect with other organizations to show each other's events on your embedded calendar. Great for coalitions, chambers, and partner networks.",
              gradient: "from-teal-500 to-teal-600",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-primary-200/60 bg-primary-50/40 p-6 text-center">
          <p className="mb-3 text-sm font-semibold text-gray-700">Ready to list your organization's events?</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px"
          >
            Sign Up for Free
          </Link>
        </div>
      </section>

      {/* Open Source */}
      <section className="mb-12 rounded-2xl border border-gray-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg">
            <Code2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="mb-2 text-xl font-extrabold text-gray-900">Open Source</h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Casper Events is fully open source. If your community wants to run something similar, you can find the complete source code, documentation, and deployment instructions on GitHub. We built this to be replicated — not locked down.
            </p>
            <a
              href="https://github.com/casperyouthhub/cyh-calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
              View on GitHub &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm text-center">
        <h2 className="mb-3 text-xl font-extrabold text-gray-900">Get in Touch</h2>
        <p className="mb-4 text-sm text-gray-500">
          Have questions, feedback, or want to get involved? We'd love to hear from you.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a href="mailto:hello@casperevents.org" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            hello@casperevents.org
          </a>
          <span className="text-gray-300">·</span>
          <span className="text-gray-500">Casper, Wyoming</span>
          <span className="text-gray-300">·</span>
          <Link to="/privacy" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-gray-300">·</span>
          <Link to="/terms" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Terms of Service
          </Link>
        </div>
      </section>
    </div>
  );
}
