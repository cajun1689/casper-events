import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { useStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import HomePage from "@/pages/HomePage";
import EventDetailPage from "@/pages/EventDetailPage";
import OrganizationsPage from "@/pages/OrganizationsPage";
import OrgDetailPage from "@/pages/OrgDetailPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import CreateEventPage from "@/pages/CreateEventPage";
import EditEventPage from "@/pages/EditEventPage";
import AdminPage from "@/pages/AdminPage";
import AdminEventsPage from "@/pages/AdminEventsPage";
import AdminReviewPage from "@/pages/AdminReviewPage";
import AdminOrgsPage from "@/pages/AdminOrgsPage";
import AdminCategoriesPage from "@/pages/AdminCategoriesPage";
import AdminBetaPage from "@/pages/AdminBetaPage";
import AdminDigestPage from "@/pages/AdminDigestPage";
import AdminSiteSponsorsPage from "@/pages/AdminSiteSponsorsPage";
import EmbedSettingsPage from "@/pages/EmbedSettingsPage";
import FacebookSettingsPage from "@/pages/FacebookSettingsPage";
import GoogleCalendarSettingsPage from "@/pages/GoogleCalendarSettingsPage";
import AboutPage from "@/pages/AboutPage";
import UpdatesPage from "@/pages/UpdatesPage";
import SubmitEventPage from "@/pages/SubmitEventPage";
import UnsubscribedPage from "@/pages/UnsubscribedPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function AuthRehydrator() {
  const { token, user, setAuth, logout } = useStore();

  useEffect(() => {
    if (!token || user) return;
    authApi
      .me()
      .then((profile) => {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAuth(
          token,
          {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            isAdmin: (profile.user as Record<string, unknown>)?.isAdmin as boolean,
          },
          profile.organization as { id: string; name: string; slug: string; status?: string } | null
        );
      })
      .catch(() => logout());
  }, [token, user, setAuth, logout]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthRehydrator />
        <div className="min-h-screen">
          <Header />
          <main className="animate-fade-in">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/organizations/:slug" element={<OrgDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/events/new" element={<CreateEventPage />} />
              <Route path="/dashboard/events/:id/edit" element={<EditEventPage />} />
              <Route path="/dashboard/embed" element={<EmbedSettingsPage />} />
              <Route path="/dashboard/facebook" element={<FacebookSettingsPage />} />
              <Route path="/dashboard/google-calendar" element={<GoogleCalendarSettingsPage />} />
              <Route path="/dashboard/settings" element={<FacebookSettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/reviews" element={<AdminReviewPage />} />
              <Route path="/admin/organizations" element={<AdminOrgsPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/beta" element={<AdminBetaPage />} />
              <Route path="/admin/digest" element={<AdminDigestPage />} />
              <Route path="/admin/site-sponsors" element={<AdminSiteSponsorsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/updates" element={<UpdatesPage />} />
              <Route path="/submit" element={<SubmitEventPage />} />
              <Route path="/unsubscribed" element={<UnsubscribedPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
