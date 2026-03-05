import { Link, useNavigate } from "react-router-dom";
import { CalendarHeart, LogIn, LogOut, LayoutDashboard, UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";

export function Header() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-primary-600 transition-colors hover:text-primary-700">
            <CalendarHeart className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight">CYH Community Calendar</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              Home
            </Link>
            <Link
              to="/organizations"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              Organizations
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
