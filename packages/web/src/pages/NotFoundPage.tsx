import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center animate-fade-in">
      <p className="mb-4 text-6xl font-extrabold text-primary-500/30">404</p>
      <h1 className="mb-2 text-2xl font-extrabold text-gray-900">Page not found</h1>
      <p className="mb-8 text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary-500/25 transition-all hover:bg-primary-700 hover:shadow-lg"
        >
          <Home className="h-4 w-4" />
          Back to calendar
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    </div>
  );
}
