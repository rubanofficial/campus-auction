import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ShieldCheck,
  Tag,
  ArrowRight,
  Sparkles,
  Inbox,
  Loader2,
  RotateCw,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

// Helper to format timestamps into readable relative or date strings
const formatNotificationTime = (timestamp) => {
  if (!timestamp) return 'Recently';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hr${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Map notification type to display category tab
const getNotificationCategory = (type) => {
  switch (type?.toLowerCase()) {
    case 'new_auction':
      return 'Auctions';
    case 'bid':
    case 'outbid':
    case 'bid_placed':
    case 'bid_accepted':
      return 'Bids';
    case 'sale':
    case 'sold':
    case 'item_won':
      return 'Sales';
    default:
      return 'Auctions';
  }
};

// Map notification type to icon and color scheme
const getNotificationIconInfo = (type) => {
  switch (type?.toLowerCase()) {
    case 'new_auction':
      return {
        icon: Sparkles,
        iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      };
    case 'outbid':
      return {
        icon: AlertCircle,
        iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
      };
    case 'bid_accepted':
    case 'bid_leading':
      return {
        icon: Trophy,
        iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      };
    case 'item_won':
      return {
        icon: ShieldCheck,
        iconColor: 'text-teal-600 bg-teal-50 border-teal-200',
      };
    default:
      return {
        icon: Tag,
        iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      };
  }
};

export default function Notifications() {
  const { isAuthenticated, setUnreadNotificationsCount, refreshUnreadCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Categories list
  const categories = ['All', 'Auctions', 'Bids', 'Sales'];

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/notifications`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch notifications.');
      }

      const list = Array.isArray(data.notifications) ? data.notifications : [];
      setNotifications(list);

      // Keep unread count synchronized with AuthContext and Navbar badge
      const unread = typeof data.unreadCount === 'number'
        ? data.unreadCount
        : list.filter((n) => !n.isRead && !n.is_read).length;

      setUnreadNotificationsCount(unread);
    } catch (err) {
      setError(err.message || 'Unable to connect to notifications service.');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, isAuthenticated, setUnreadNotificationsCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark a single notification as read
  const handleMarkAsRead = async (id) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.isRead || target.is_read) return;

    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true, is_read: true } : notif
      )
    );
    setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));

    try {
      const response = await fetch(`${apiBaseUrl}/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert on server error
        fetchNotifications();
      }
    } catch {
      // Revert on network error
      fetchNotifications();
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (isMarkingAll) return;
    setIsMarkingAll(true);

    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true, is_read: true }))
    );
    setUnreadNotificationsCount(0);

    try {
      const response = await fetch(`${apiBaseUrl}/api/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        fetchNotifications();
      }
    } catch {
      fetchNotifications();
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Handle clicking on a notification item
  const handleNotificationClick = (notif) => {
    handleMarkAsRead(notif.id);

    const targetAuctionId = notif.auctionId || notif.auction_id;
    if (targetAuctionId) {
      navigate(`/auctions/${targetAuctionId}`);
    }
  };

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead && !n.is_read).length;

  // Filter notifications by active category
  const filteredNotifications = notifications.filter((notif) => {
    if (activeCategory === 'All') return true;
    const cat = getNotificationCategory(notif.type);
    return cat.toLowerCase() === activeCategory.toLowerCase();
  });

  // 1. Unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <Bell className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">Sign in to view notifications</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Sign in with your campus student account to see instant updates on published listings, outbid alerts, and marketplace activity.
          </p>
        </div>
        <div className="pt-2">
          <Button as={Link} to="/login" state={{ from: location }} variant="primary" size="md">
            Sign In to Your Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Notifications"
        description="Stay informed about newly published campus listings, live bidding updates, and marketplace activity."
        badge={unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up'}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={CheckCheck}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isMarkingAll}
          >
            {isMarkingAll ? 'Marking...' : 'Mark All as Read'}
          </Button>
        }
      />

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {categories.map((cat) => {
          const count =
            cat === 'All'
              ? notifications.length
              : notifications.filter(
                  (n) => getNotificationCategory(n.type).toLowerCase() === cat.toLowerCase()
                ).length;

          const isSelected = activeCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-indigo-500/50 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Loading, Error, or Notifications List */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading your notifications...</p>
          <p className="text-xs text-slate-400">Retrieving latest updates from campus marketplace</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Failed to load notifications</h3>
          <p className="text-xs text-rose-700 max-w-sm mx-auto">{error}</p>
          <Button variant="outline" size="sm" icon={RotateCw} onClick={fetchNotifications}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const isRead = notif.isRead ?? notif.is_read ?? false;
              const { icon: Icon, iconColor } = getNotificationIconInfo(notif.type);
              const category = getNotificationCategory(notif.type);
              const targetAuctionId = notif.auctionId || notif.auction_id;
              const formattedTime = formatNotificationTime(notif.createdAt || notif.created_at);

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    !isRead
                      ? 'bg-indigo-50/30 border-indigo-200/80 shadow-2xs hover:bg-indigo-50/50'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Icon Column */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${iconColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content Column */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {category}
                        </span>
                        {!isRead && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{formattedTime}</span>
                    </div>

                    <h3
                      className={`text-sm sm:text-base leading-snug ${
                        !isRead
                          ? 'font-bold text-slate-900'
                          : 'font-semibold text-slate-700'
                      }`}
                    >
                      {notif.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Action Links & Read Toggle */}
                    <div className="pt-2 flex items-center gap-3">
                      {targetAuctionId && (
                        <Link
                          to={`/auctions/${targetAuctionId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <span>View Auction</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      {!isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State for Category */
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <Inbox className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  No notifications in "{activeCategory}"
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  You don't have any updates in this category right now. New auction listings and marketplace alerts will appear here automatically.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                {activeCategory !== 'All' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveCategory('All')}
                  >
                    View All Notifications
                  </Button>
                )}
                <Button as={Link} to="/auctions" variant="primary" size="sm">
                  Browse Auctions
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Real-time In-App Notifications Informational Note */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            About Campus Auction Notifications
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Notifications are persistently stored in your campus profile. Whenever a new listing is published by fellow students, you receive an in-app notice with instant navigation to inspect the listing and participate.
        </p>
      </div>
    </div>
  );
}
