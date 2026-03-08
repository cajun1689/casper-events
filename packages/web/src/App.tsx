import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
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
import EmbedSettingsPage from "@/pages/EmbedSettingsPage";
import FacebookSettingsPage from "@/pages/FacebookSettingsPage";
import GoogleCalendarSettingsPage from "@/pages/GoogleCalendarSettingsPage";
import AboutPage from "@/pages/AboutPage";
import SubmitEventPage from "@/pages/SubmitEventPage";
import UnsubscribedPage from "@/pages/UnsubscribedPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";

export default function App() {
  return (
    <BrowserRouter>
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
            <Route path="/about" element={<AboutPage />} />
            <Route path="/submit" element={<SubmitEventPage />} />
            <Route path="/unsubscribed" element={<UnsubscribedPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
