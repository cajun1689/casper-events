import { Link, useSearchParams } from "react-router-dom";

export default function UnsubscribedPage() {
  const [params] = useSearchParams();
  const fromDigest = params.get("digest") === "1";

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center animate-fade-in">
      <div className="mb-6 text-5xl">✓</div>
      <h1 className="mb-4 text-2xl font-extrabold text-gray-900">
        You&apos;re unsubscribed
      </h1>
      <p className="mb-8 text-gray-600">
        {fromDigest
          ? "You won't receive the weekly events digest anymore."
          : "You've been successfully unsubscribed."}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700"
      >
        Back to Calendar
      </Link>
    </div>
  );
}
