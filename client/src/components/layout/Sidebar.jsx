import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  Activity,
  Bell,
  ShieldCheck,
  Bike,
  Laptop,
  BookOpen,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { logout, unreadNotificationsCount } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    if (window.innerWidth < 1024) onClose();
    navigate('/login', { replace: true });
  };
  const navItems = [
    { label: 'Dashboard / Home', href: '/', icon: LayoutDashboard },
    { label: 'Browse Auctions', href: '/auctions', icon: Compass },
    { label: 'AI Assistant', href: '/ai-search', icon: Sparkles, aiBadge: true },
    { label: 'Create Listing', href: '/auctions/create', icon: PlusCircle, highlight: true },
    { label: 'My Activity', href: '/activity', icon: Activity },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? String(unreadNotificationsCount) : null,
    },
  ];

  const popularCategories = [
    { name: 'Bicycles & Scooters', icon: Bike },
    { name: 'Laptops & Gadgets', icon: Laptop },
    { name: 'Textbooks & Notes', icon: BookOpen },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
          } lg:static lg:h-[calc(100vh-4rem)] lg:flex-shrink-0`}
        aria-label="Sidebar Navigation"
      >
        <div className="space-y-6">
          {/* Mobile Header in Drawer */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 lg:hidden">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Navigation Menu
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Nav Links */}
          <nav className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Campus Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  onClick={() => {
                    // Close on mobile when link is clicked
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={linkClass}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.aiBadge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-100 text-amber-800 uppercase tracking-wider">
                      AI
                    </span>
                  )}
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Popular Categories preview shortcuts */}
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Top Categories
            </div>
            <div className="space-y-1">
              {popularCategories.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <NavLink
                    key={cat.name}
                    to="/auctions"
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <CatIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cat.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* Logout Action */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors w-full text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Safety & Trust Box at bottom */}
        <div className="pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Campus Verified</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Every bidder & seller is verified with their official university email.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
