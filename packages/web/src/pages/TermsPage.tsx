import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm prose prose-sm prose-gray max-w-none">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Terms of Service</h1>
        <p className="text-xs text-gray-400 mb-6">Last updated: March 2026</p>

        <h2>Acceptance</h2>
        <p>By using Casper Events (casperevents.org), you agree to these Terms of Service.</p>

        <h2>The Service</h2>
        <p>
          Casper Events is a free, community-driven event calendar platform that allows organizations
          to post events, embed calendars on their websites, and optionally share events to Facebook.
        </p>

        <h2>User Accounts</h2>
        <ul>
          <li>You must provide accurate information when creating an account</li>
          <li>You are responsible for maintaining the security of your account</li>
          <li>One organization account per organization</li>
        </ul>

        <h2>Event Content</h2>
        <ul>
          <li>Events must be real, community-relevant activities</li>
          <li>You are responsible for the accuracy of event details you submit</li>
          <li>Events may be reviewed and approved by administrators before appearing on the main calendar</li>
          <li>We reserve the right to remove events that violate these terms</li>
        </ul>

        <h2>Facebook Integration</h2>
        <p>
          Connecting your Facebook Page is optional. When connected, Casper Events will create Facebook
          Events and/or Page posts on your behalf only when you explicitly request it. You can disconnect
          at any time. We comply with Meta's Platform Terms and Developer Policies.
        </p>

        <h2>Prohibited Content</h2>
        <p>Events must not contain:</p>
        <ul>
          <li>Illegal activities or promotion thereof</li>
          <li>Hate speech, harassment, or discrimination</li>
          <li>Spam, misleading, or fraudulent content</li>
          <li>Content that infringes on intellectual property rights</li>
        </ul>

        <h2>Limitation of Liability</h2>
        <p>
          Casper Events is provided "as is" without warranties. We are not liable for event accuracy,
          cancellations, or any damages arising from use of the platform.
        </p>

        <h2>Changes</h2>
        <p>We may update these terms at any time. Continued use constitutes acceptance of changes.</p>

        <h2>Contact</h2>
        <p>
          Questions? Contact us at{" "}
          <a href="mailto:info@casperevents.org">info@casperevents.org</a>.
        </p>
      </div>
    </div>
  );
}
