import { Link, useNavigate, useLocation } from "react-router-dom";
import { CalendarHeart, LogIn, LogOut, LayoutDashboard, UserPlus, Menu, X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useStore } from "@/lib/store";

export function Header() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-white/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25 transition-shadow group-hover:shadow-primary-500/40">
              <CalendarHeart className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-gray-900">Casper Events</span>
              <span className="hidden text-[10px] font-medium uppercase tracking-widest text-primary-500 sm:block">Community Calendar</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { to: "/", label: "Calendar" },
              { to: "/organizations", label: "Organizations" },
              { to: "/submit", label: "Submit Event" },
              { to: "/about", label: "About" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                  isActive(link.to)
                    ? "text-primary-700 bg-primary-50/80"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                  isActive("/dashboard")
                    ? "text-primary-700 bg-primary-50/80"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60",
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-red-50/80 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100/60 sm:inline-flex"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition-all hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-px active:translate-y-0"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Up</span>
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-1 inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100/60 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="animate-fade-in border-t border-gray-100/60 px-4 pb-4 pt-2 md:hidden">
          {[
            { to: "/", label: "Calendar" },
            { to: "/organizations", label: "Organizations" },
            { to: "/submit", label: "Submit Event" },
            { to: "/about", label: "About" },
            ...(!user ? [{ to: "/login", label: "Login" }] : []),
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(link.to) ? "text-primary-700 bg-primary-50/80" : "text-gray-600 hover:bg-gray-50",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
