import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Gavel,
  Bell,
  PlusCircle,
  Menu,
  X,
  Compass,
  Home,
  Clock,
  GraduationCap,
  LogOut,
  Sparkles,
} from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ isSidebarOpen, onToggleSidebar }) {
  const { user, logout, unreadNotificationsCount } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'text-indigo-600 bg-indigo-50/80 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Hamburger & Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={isSidebarOpen ? 'Close sidebar navigation' : 'Open sidebar navigation'}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link
              to="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  Campus<span className="text-indigo-600">Auction</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-semibold text-slate-400 block -mt-1">
                  Student Marketplace
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            <NavLink to="/" end className={navLinkClass}>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </NavLink>
            <NavLink to="/auctions" className={navLinkClass}>
              <Compass className="w-4 h-4" />
              <span>Browse Auctions</span>
            </NavLink>
            <NavLink to="/ai-search" className={navLinkClass}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Search</span>
            </NavLink>
            <NavLink to="/activity" className={navLinkClass}>
              <Clock className="w-4 h-4" />
              <span>My Activity</span>
            </NavLink>
          </nav>

          {/* Right section: Action Button, Notifications, Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              as={Link}
              to="/auctions/create"
              variant="primary"
              size="sm"
              icon={PlusCircle}
              className="hidden sm:inline-flex"
            >
              Create Listing
            </Button>

            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {/* Dynamic notification badge indicator */}
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </Link>

            {/* Profile Avatar */}
            <div
              className="flex items-center gap-2 pl-1 border-l border-slate-200 sm:pl-2"
              title={`Student Profile: ${user?.name || 'Alex Rivera'} (${user?.email || 'alex.r@campus.edu'})`}
            >
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-300 text-indigo-700 font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'AR'}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"
                  title="Campus Verified Student"
                />
              </div>
              <div className="hidden lg:block text-left text-xs">
                <p className="font-semibold text-slate-800 leading-tight">
                  {user?.name || 'Alex Rivera'}
                </p>
                <p className="text-slate-500 text-[11px] flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-indigo-600" />
                  Verified Student
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
