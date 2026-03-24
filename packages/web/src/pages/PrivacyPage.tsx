import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm prose prose-sm prose-gray max-w-none">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Privacy Policy</h1>
        <p className="text-xs text-gray-400 mb-6">Last updated: March 2026</p>

        <h2>Overview</h2>
        <p>
          Casper Events ("we", "us", "our") operates the casperevents.org website, the Wyoming Events Calendar mobile app (iOS and Android), and related services.
          This Privacy Policy explains how we collect, use, and protect information from users of our service.
          We are a community project designed to provide a centralized calendar for events across Wyoming.
        </p>

        <h2>Wyoming Events Calendar Mobile App (iOS & Android)</h2>
        <p>
          The Wyoming Events Calendar app is available on the Apple App Store and Google Play Store. This section describes data practices specific to the mobile app.
        </p>
        <h3>Data We Collect in the Mobile App</h3>
        <ul>
          <li><strong>Push notification token</strong>: When you enable push notifications, we receive an Expo push token from your device. We store this token and your selected organization subscriptions on our servers to send you event reminders (1.5 hours before events). Push delivery is handled by Expo's push service, which routes to Apple Push Notification service (APNs) on iOS and Firebase Cloud Messaging (FCM) on Android.</li>
          <li><strong>Organization subscriptions</strong>: Which organizations you subscribe to for push notifications, stored on our servers and linked to your device token.</li>
          <li><strong>City filter preference</strong>: Stored only on your device (AsyncStorage). We do not collect or transmit your city preference to our servers.</li>
          <li><strong>Event submission data</strong>: If you submit an event through the app, we collect the event details plus your name and email address.</li>
        </ul>
        <h3>Data We Do Not Collect</h3>
        <p>We do not collect your location, contacts, photos, or other device data unless you explicitly provide it (e.g., when submitting an event with a venue address). We do not use advertising identifiers or track you across other apps or websites.</p>

        <h2>Website & Platform Information We Collect</h2>
        <h3>Account Information</h3>
        <p>When you register, we collect your email address, name, and organization name. This is used to manage your account and associate events with your organization.</p>

        <h3>Event Information</h3>
        <p>Event details you submit (title, description, dates, venues, images) are stored to display on the public calendar and embedded widgets.</p>

        <h3>Facebook Data</h3>
        <p>If you connect a Facebook Page, we store your Page ID and a Page access token to create events and posts on your behalf. We do not access your personal Facebook profile, messages, or friends list. You can disconnect your Facebook Page at any time from your dashboard settings.</p>

        <h3>Usage Data</h3>
        <p>We may collect basic usage analytics (page views, browser type) to improve the service. We do not use tracking cookies for advertising.</p>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>Display events on the public calendar and embedded widgets</li>
          <li>Create and manage Facebook Events on your connected Page (when authorized)</li>
          <li>Send event-related notifications (if applicable)</li>
          <li>Improve and maintain the platform</li>
        </ul>

        <h2>Data Sharing</h2>
        <p>
          We do not sell your personal information. Event details are publicly visible on the calendar.
          We share data with Facebook/Meta only when you explicitly authorize it through Facebook Login
          and choose to publish events to your Facebook Page.
        </p>
        <p>
          <strong>Mobile app:</strong> To deliver push notifications, we send your push token and notification content to Expo's push service, which in turn uses Apple's APNs (iOS) or Google's FCM (Android). These services process notifications according to their respective privacy policies. We do not share your data with advertisers or third parties for marketing.
        </p>

        <h2>Data Storage & Security</h2>
        <p>
          Data is stored securely on Amazon Web Services (AWS) infrastructure with encryption at rest.
          Facebook tokens are stored in our database and used only for authorized Page actions.
        </p>

        <h2>Your Rights</h2>
        <ul>
          <li><strong>Mobile app:</strong> Disable push notifications and unregister your device at any time in Settings. Clear the city filter by selecting "All Wyoming."</li>
          <li>Disconnect your Facebook Page at any time</li>
          <li>Delete your events from the platform</li>
          <li>Request deletion of your account or push subscription by contacting us</li>
        </ul>

        <h2>Data Deletion</h2>
        <p>
          To request deletion of your data, contact us at the email below. When you disconnect Facebook,
          we immediately delete your Page access token. You can also remove the Casper Events app from
          your Facebook settings at <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer">facebook.com/settings</a>.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about this privacy policy or to request data deletion, contact us at{" "}
          <a href="mailto:privacy@casperevents.org">privacy@casperevents.org</a>.
        </p>
      </div>
    </div>
  );
}
