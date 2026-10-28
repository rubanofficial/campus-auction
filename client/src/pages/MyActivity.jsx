import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Gavel,
  Trophy,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  PlusCircle,
  Compass,
  Bike,
  Calculator,
  BookOpen,
  Laptop,
  PackageOpen,
  Loader2,
  RefreshCw,
  UserCheck,
  XCircle,
  X
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

// Category icon fallback helper
const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'cycle':
    case 'cycles':
      return Bike;
    case 'calculator':
    case 'calculators':
      return Calculator;
    case 'books':
    case 'book':
      return BookOpen;
    case 'electronics':
    case 'electronic':
      return Laptop;
    default:
      return Tag;
  }
};

// Status badge styling helper
function StatusBadge({ status }) {
  const styles = {
    'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Leading': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Outbid': 'bg-rose-50 text-rose-700 border-rose-200',
    'Awaiting Seller Approval': 'bg-amber-50 text-amber-800 border-amber-200',
    'Awaiting Seller Decision': 'bg-amber-50 text-amber-800 border-amber-200',
    'Awaiting Decision': 'bg-amber-50 text-amber-800 border-amber-200',
    'Reserved': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Completed': 'bg-teal-50 text-teal-800 border-teal-200',
    'Sold': 'bg-teal-50 text-teal-800 border-teal-200',
    'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
    'Declined': 'bg-rose-50 text-rose-700 border-rose-200',
    'Unsold': 'bg-slate-100 text-slate-700 border-slate-200',
    'Cancelled': 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const badgeStyle = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
      {status}
    </span>
  );
}

// Single activity item row/card component with thumbnail fallback
function ActivityCard({ item, type }) {
  const [imageError, setImageError] = useState(!item.imageUrl);
  const FallbackIcon = getCategoryIcon(item.category);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
      {/* Left: Thumbnail & Info */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {!imageError && item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <FallbackIcon className="w-8 h-8 text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {item.category}
            </span>
            <StatusBadge status={item.status} />
          </div>

          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate">
            {item.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
            {item.pickupSpot && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{item.pickupSpot}</span>
              </span>
            )}
            {item.closingLabel && (
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>{item.closingLabel}</span>
              </span>
            )}
            {item.closedAt && (
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{item.closedAt}</span>
              </span>
            )}
            {item.completedAt && (
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{item.completedAt}</span>
              </span>
            )}
            {item.buyerNote && (
              <span className="text-slate-500 font-medium truncate">
                · {item.buyerNote}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Pricing & CTA Button */}
      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
        <div className="text-left sm:text-right">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
            {type === 'bids'
              ? 'Your Bid / Current'
              : type === 'won'
              ? 'Winning Bid'
              : type === 'sales'
              ? 'Final Price'
              : 'Current Bid'}
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {type === 'bids' ? (
              <span>
                ₹{Number(item.myBid || 0).toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / ₹{Number(item.currentPrice || 0).toLocaleString('en-IN')}
                </span>
              </span>
            ) : type === 'won' ? (
              <span>₹{Number(item.winningBid || 0).toLocaleString('en-IN')}</span>
            ) : type === 'sales' ? (
              <span>₹{Number(item.finalPrice || 0).toLocaleString('en-IN')}</span>
            ) : (
              <span>
                ₹{Number(item.currentPrice || 0).toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-400">
                  ({item.totalBids || 0} {item.totalBids === 1 ? 'bid' : 'bids'})
                </span>
              </span>
            )}
          </div>
        </div>

        {item.actionText && (
          <Button
            as={Link}
            to={item.actionHref || '/auctions'}
            variant="outline"
            size="sm"
            className="text-xs font-semibold"
          >
            {item.actionText}
          </Button>
        )}
      </div>
    </div>
  );
}

// Reusable Empty State component
function EmptyState({ title, description, actionText, actionHref }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
        <PackageOpen className="w-8 h-8" />
      </div>
      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      {actionText && (
        <div className="pt-2">
          <Button as={Link} to={actionHref || '/auctions'} variant="primary" size="md">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MyActivity() {
  const [activeTab, setActiveTab] = useState('listings');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activityData, setActivityData] = useState({
    summary: {
      activeListings: 0,
      activeBids: 0,
      auctionsWon: 0,
      completedSales: 0,
    },
    listings: [],
    bids: [],
    won: [],
    sales: [],
  });

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Fetch real activity data from backend
  const fetchActivity = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/activity`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to load activity records.');
      }

      setActivityData({
        summary: data.summary || {
          activeListings: 0,
          activeBids: 0,
          auctionsWon: 0,
          completedSales: 0,
        },
        listings: Array.isArray(data.listings) ? data.listings : [],
        bids: Array.isArray(data.bids) ? data.bids : [],
        won: Array.isArray(data.won) ? data.won : [],
        sales: Array.isArray(data.sales) ? data.sales : [],
      });
    } catch (err) {
      console.error('[MyActivity] Error loading activity:', err.message);
      setErrorMessage(err.message || 'Unable to connect to campus server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Dynamic summary card metrics
  const summaryCards = [
    {
      id: 'listings',
      label: 'Active Listings',
      count: activityData.summary.activeListings || 0,
      icon: Tag,
      color: 'text-indigo-600 bg-indigo-50',
      description: 'Items you currently have listed',
    },
    {
      id: 'bids',
      label: 'Active Bids',
      count: activityData.summary.activeBids || 0,
      icon: Gavel,
      color: 'text-amber-600 bg-amber-50',
      description: 'Auctions you are participating in',
    },
    {
      id: 'won',
      label: 'Auctions Won',
      count: activityData.summary.auctionsWon || 0,
      icon: Trophy,
      color: 'text-emerald-600 bg-emerald-50',
      description: 'Items won awaiting pickup',
    },
    {
      id: 'sales',
      label: 'Completed Sales',
      count: activityData.summary.completedSales || 0,
      icon: CheckCircle2,
      color: 'text-teal-600 bg-teal-50',
      description: 'Successfully handed-over sales',
    },
  ];

  // Tab configurations with live counts
  const tabs = [
    { id: 'listings', label: 'My Listings', count: activityData.listings.length },
    { id: 'bids', label: 'My Bids', count: activityData.bids.length },
    { id: 'won', label: 'Won Auctions', count: activityData.won.length },
    { id: 'sales', label: 'Sales History', count: activityData.sales.length },
  ];

  const currentItems = activityData[activeTab] || [];

  // Empty state configurations per tab
  const emptyStateConfig = {
    listings: {
      title: 'No Listings Found',
      description: "You haven't listed any items for auction yet. Start selling unused campus gear, calculators, or textbooks.",
      actionText: 'List New Item',
      actionHref: '/auctions/create',
    },
    bids: {
      title: 'No Active Bids',
      description: "You haven't placed any bids on active listings yet. Explore verified student auctions to start bidding.",
      actionText: 'Browse Live Auctions',
      actionHref: '/auctions',
    },
    won: {
      title: 'No Won Auctions',
      description: "You have not won any auctions yet. When you hold the highest bid on a closed listing, your item will appear here for pickup coordination.",
      actionText: 'Explore Auctions',
      actionHref: '/auctions',
    },
    sales: {
      title: 'No Completed Sales',
      description: "You have not completed any sale handovers yet. Once an auction closes and the item handover is completed, your sale record will appear here.",
      actionText: 'List an Item',
      actionHref: '/auctions/create',
    },
  };

  const emptyConfig = emptyStateConfig[activeTab] || emptyStateConfig.listings;

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <PageHeader
        title="My Activity"
        description="Track your active selling listings, current auction bids, won campus items, and past sales records."
        badge="Activity Dashboard"
        action={
          <div className="flex items-center gap-2">
            <Button as={Link} to="/auctions" variant="outline" size="sm" icon={Compass}>
              Browse Auctions
            </Button>
            <Button as={Link} to="/auctions/create" variant="primary" size="sm" icon={PlusCircle}>
              List New Item
            </Button>
          </div>
        }
      />

      {/* Error Banner with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={fetchActivity}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Four Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const isSelected = activeTab === card.id;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveTab(card.id)}
              className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {isLoading ? (
                  <span className="inline-block w-8 h-7 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                  card.count
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {card.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* 3. Activity Tabs Interface */}
      <div className="space-y-6">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6 overflow-x-auto" aria-label="Activity Tabs">
            {tabs.map((tab) => {
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isCurrent
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isCurrent
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isLoading ? '...' : tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 4. Activity List / Cards for Active Tab */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading your activity records...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <ActivityCard key={item.id} item={item} type={activeTab} />
              ))
            ) : (
              <EmptyState
                title={emptyConfig.title}
                description={emptyConfig.description}
                actionText={emptyConfig.actionText}
                actionHref={emptyConfig.actionHref}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
