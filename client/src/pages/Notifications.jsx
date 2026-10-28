import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  ExternalLink,
  Info,
  Sparkles,
  Inbox
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

// Static demonstration notifications
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'You were outbid on boAt Rockerz 550 Wireless Headphones',
    message: 'Another student placed a higher bid of ₹950. Tap to review the auction and place a counter-bid before the auction closes.',
    timestamp: '15 minutes ago',
    category: 'Bids',
    isRead: false,
    icon: AlertCircle,
    iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
    link: '/auctions/boat-rockerz-550',
    linkText: 'View Auction',
  },
  {
    id: 'notif-2',
    title: 'You are the leading bidder on Casio FX-991ES Plus!',
    message: 'Your bid of ₹850 is currently the highest. There is approximately 1 hour and 45 minutes remaining until the auction concludes.',
    timestamp: '1 hour ago',
    category: 'Bids',
    isRead: false,
    icon: Trophy,
    iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    link: '/auctions/casio-fx991es-plus',
    linkText: 'View Auction',
  },
  {
    id: 'notif-3',
    title: 'Auction closing soon: Hero Sprint Pro 26T Mountain Bicycle',
    message: 'Less than 3 hours remaining on your watched item. Current leading bid is ₹3,200. Place your final bid before closing.',
    timestamp: '2 hours ago',
    category: 'Auctions',
    isRead: false,
    icon: Clock,
    iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
    link: '/auctions/hero-sprint-bicycle',
    linkText: 'View Auction',
  },
  {
    id: 'notif-4',
    title: 'Seller approved winning bid for Foldable Aluminum Laptop Stand',
    message: 'The seller accepted your winning price of ₹650. The item has been marked as reserved for in-person campus handover.',
    timestamp: 'Yesterday at 7:30 PM',
    category: 'Auctions',
    isRead: true,
    icon: CheckCircle2,
    iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    link: '/activity',
    linkText: 'View in My Activity',
  },
  {
    id: 'notif-5',
    title: 'Item Reserved: Casio FX-82MS Scientific Calculator',
    message: 'Your won item is reserved for pickup near Hostel 2 Main Gate. Please inspect the item prior to physical payment.',
    timestamp: '2 days ago',
    category: 'Auctions',
    isRead: true,
    icon: ShieldCheck,
    iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    link: '/activity',
    linkText: 'View Pickup Details',
  },
  {
    id: 'notif-6',
    title: 'Campus Pickup Confirmed: Btwin Riverside 120 Hybrid',
    message: 'Buyer Kunal R. confirmed physical receipt and cash handover at Main Campus Gate. Your sale is recorded as completed.',
    timestamp: '3 days ago',
    category: 'Sales',
    isRead: true,
    icon: Tag,
    iconColor: 'text-teal-600 bg-teal-50 border-teal-200',
    link: '/activity',
    linkText: 'View Sales History',
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState('All');

  // Categories list
  const categories = ['All', 'Bids', 'Auctions', 'Sales'];

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark a single notification as read
  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
  };

  // Filter notifications by active category
  const filteredNotifications = notifications.filter((notif) => {
    if (activeCategory === 'All') return true;
    return notif.category.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Notifications"
        description="Stay informed about live outbid alerts, closing countdowns, seller price approvals, and campus pickup coordination."
        badge={unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up'}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={CheckCheck}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All as Read
          </Button>
        }
      />

      {/* Demonstration Notice */}
      <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Demonstration Mode:</span> Showing sample student notifications. Click any notification to toggle its read status or use the category tabs to filter.
        </p>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {categories.map((cat) => {
          const count =
            cat === 'All'
              ? notifications.length
              : notifications.filter(
                  (n) => n.category.toLowerCase() === cat.toLowerCase()
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

      {/* 3. Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => {
            const Icon = notif.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  !notif.isRead
                    ? 'bg-indigo-50/30 border-indigo-200/80 shadow-2xs hover:bg-indigo-50/50'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Icon Column */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${notif.iconColor}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content Column */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {notif.category}
                      </span>
                      {!notif.isRead && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{notif.timestamp}</span>
                  </div>

                  <h3
                    className={`text-sm sm:text-base leading-snug ${
                      !notif.isRead
                        ? 'font-bold text-slate-900'
                        : 'font-semibold text-slate-700'
                    }`}
                  >
                    {notif.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Action Link */}
                  {notif.link && (
                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        to={notif.link}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <span>{notif.linkText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-600"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  )}
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
                You don't have any updates or alerts in this category right now. Activity notices will appear here automatically.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCategory('All')}
              >
                View All Notifications
              </Button>
              <Button as={Link} to="/auctions" variant="primary" size="sm">
                Browse Auctions
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Browser Notifications Informational Note */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            About Browser & Push Alerts
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Campus Auction currently displays real-time updates inside this web interface in demonstration mode. Push notifications to your browser and automated alerts to your official university .edu email will be supported in a future update. No device permissions are required at this time.
        </p>
      </div>
    </div>
  );
}
