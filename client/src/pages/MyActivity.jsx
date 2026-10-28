import React, { useState } from 'react';
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
  ArrowRight,
  PlusCircle,
  Compass,
  Bike,
  Calculator,
  BookOpen,
  Laptop,
  Headphones,
  Lamp,
  Info,
  ShieldCheck,
  TrendingUp,
  PackageOpen
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

// Static demonstration activity data
const DEMO_ACTIVITY_DATA = {
  listings: [
    {
      id: 'hero-sprint-bicycle',
      title: 'Hero Sprint Pro 26T Mountain Bicycle (Single Speed)',
      category: 'Cycles',
      currentPrice: 3200,
      startingPrice: 2400,
      totalBids: 9,
      closingLabel: 'Closes in 3h 15m',
      status: 'Active',
      imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
      fallbackIcon: Bike,
      pickupSpot: 'Hostel 4 Cycle Stand',
      actionText: 'View Auction',
      actionHref: '/auctions/hero-sprint-bicycle',
    },
    {
      id: 'philips-rechargeable-desk-lamp',
      title: 'Philips Rechargeable LED Desk Study Lamp (EyeCare)',
      category: 'Electronics',
      currentPrice: 380,
      startingPrice: 300,
      totalBids: 7,
      closingLabel: 'Closes in 2h 50m',
      status: 'Awaiting Seller Approval',
      imageUrl: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=600&q=80',
      fallbackIcon: Lamp,
      pickupSpot: 'Boys Hostel Block B',
      actionText: 'View Auction',
      actionHref: '/auctions/philips-rechargeable-desk-lamp',
    },
  ],
  bids: [
    {
      id: 'casio-fx991es-plus',
      title: 'Casio FX-991ES Plus Scientific Calculator (2nd Edition)',
      category: 'Calculators',
      myBid: 850,
      currentPrice: 850,
      totalBids: 14,
      closingLabel: 'Ends in 1h 45m',
      status: 'Leading',
      imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
      fallbackIcon: Calculator,
      pickupSpot: 'Library Front Lawn',
      actionText: 'View Auction',
      actionHref: '/auctions/casio-fx991es-plus',
    },
    {
      id: 'boat-rockerz-550',
      title: 'boAt Rockerz 550 Over-Ear Wireless Bluetooth Headphones',
      category: 'Electronics',
      myBid: 850,
      currentPrice: 950,
      totalBids: 11,
      closingLabel: 'Ends in 11h 20m',
      status: 'Outbid',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      fallbackIcon: Headphones,
      pickupSpot: 'Dining Hall Annex',
      actionText: 'Increase Bid',
      actionHref: '/auctions/boat-rockerz-550',
    },
    {
      id: 'engineering-mathematics-grewal',
      title: 'Higher Engineering Mathematics - B.S. Grewal (44th Ed.)',
      category: 'Books',
      myBid: 420,
      currentPrice: 420,
      totalBids: 6,
      closingLabel: 'Ends in 5h 30m',
      status: 'Leading',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      fallbackIcon: BookOpen,
      pickupSpot: 'Mechanical Dept. Quad',
      actionText: 'View Auction',
      actionHref: '/auctions/engineering-mathematics-grewal',
    },
  ],
  won: [
    {
      id: 'aluminum-laptop-stand',
      title: 'Foldable Ergonomic Aluminum Laptop Stand (Multi-Angle)',
      category: 'Electronics',
      winningBid: 650,
      closedAt: 'Closed Yesterday at 7:00 PM',
      status: 'Reserved',
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
      fallbackIcon: Laptop,
      pickupSpot: 'Student Activity Center Entrance',
      actionText: 'Pickup Details',
      actionHref: '/auctions/aluminum-laptop-stand',
    },
    {
      id: 'casio-fx82ms-calculator',
      title: 'Casio FX-82MS Scientific Calculator with Slide Case',
      category: 'Calculators',
      winningBid: 450,
      closedAt: 'Closed 2 days ago',
      status: 'Pickup Failed',
      imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80',
      fallbackIcon: Calculator,
      pickupSpot: 'Hostel 2 Main Gate',
      actionText: 'Contact Seller',
      actionHref: '/auctions/casio-fx82ms-calculator',
    },
  ],
  sales: [
    {
      id: 'btwin-riverside-hybrid',
      title: 'Btwin Riverside 120 Hybrid Geared Bicycle (Large Frame)',
      category: 'Cycles',
      finalPrice: 4800,
      completedAt: 'Completed on Oct 24, 2026',
      buyerNote: 'Handed over to Kunal R. (Hostel 1)',
      status: 'Sold',
      imageUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=600&q=80',
      fallbackIcon: Bike,
      pickupSpot: 'Main Campus Gate',
      actionText: 'View Record',
      actionHref: '/auctions/btwin-riverside-hybrid',
    },
    {
      id: 'yonex-badminton-racket',
      title: 'Yonex Nanoray 10F Carbon Badminton Racket with Cover',
      category: 'Other',
      finalPrice: 850,
      completedAt: 'Closed on Oct 20, 2026',
      buyerNote: 'Reserve price not met by bidders',
      status: 'Unsold',
      imageUrl: '',
      fallbackIcon: Tag,
      pickupSpot: 'Sports Complex',
      actionText: 'Relist Item',
      actionHref: '/auctions/create',
    },
  ],
};

// Status badge styling helper
function StatusBadge({ status }) {
  const styles = {
    'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Leading': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Outbid': 'bg-rose-50 text-rose-700 border-rose-200',
    'Awaiting Seller Approval': 'bg-amber-50 text-amber-800 border-amber-200',
    'Reserved': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Sold': 'bg-teal-50 text-teal-800 border-teal-200',
    'Unsold': 'bg-slate-100 text-slate-700 border-slate-200',
    'Pickup Failed': 'bg-rose-50 text-rose-700 border-rose-200',
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
  const FallbackIcon = item.fallbackIcon || Tag;

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
                ₹{item.myBid.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / ₹{item.currentPrice.toLocaleString('en-IN')}
                </span>
              </span>
            ) : type === 'won' ? (
              <span>₹{item.winningBid.toLocaleString('en-IN')}</span>
            ) : type === 'sales' ? (
              <span>₹{item.finalPrice.toLocaleString('en-IN')}</span>
            ) : (
              <span>
                ₹{item.currentPrice.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-400">
                  ({item.totalBids} bids)
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
            className="text-xs"
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

  // Static summary card values (Clearly treated as demonstration metrics)
  const summaryCards = [
    {
      id: 'listings',
      label: 'Active Listings',
      count: 2,
      icon: Tag,
      color: 'text-indigo-600 bg-indigo-50',
      description: 'Items you currently have listed',
    },
    {
      id: 'bids',
      label: 'Active Bids',
      count: 3,
      icon: Gavel,
      color: 'text-amber-600 bg-amber-50',
      description: 'Auctions you are participating in',
    },
    {
      id: 'won',
      label: 'Auctions Won',
      count: 2,
      icon: Trophy,
      color: 'text-emerald-600 bg-emerald-50',
      description: 'Items won awaiting pickup',
    },
    {
      id: 'sales',
      label: 'Completed Sales',
      count: 4,
      icon: CheckCircle2,
      color: 'text-teal-600 bg-teal-50',
      description: 'Successfully handed-over sales',
    },
  ];

  // Tab configurations
  const tabs = [
    { id: 'listings', label: 'My Listings', count: DEMO_ACTIVITY_DATA.listings.length },
    { id: 'bids', label: 'My Bids', count: DEMO_ACTIVITY_DATA.bids.length },
    { id: 'won', label: 'Won Auctions', count: DEMO_ACTIVITY_DATA.won.length },
    { id: 'sales', label: 'Sales History', count: DEMO_ACTIVITY_DATA.sales.length },
  ];

  const currentItems = DEMO_ACTIVITY_DATA[activeTab] || [];

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

      {/* Demonstration Banner */}
      <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Demonstration Mode:</span> Showing sample activity records and statistics for UI validation. Prices are formatted in Indian Rupees (₹).
        </p>
      </div>

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
                {card.count}
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
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 4. Activity List / Cards for Active Tab */}
        <div className="space-y-3">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <ActivityCard key={item.id} item={item} type={activeTab} />
            ))
          ) : (
            <EmptyState
              title={`No ${tabs.find((t) => t.id === activeTab)?.label} Found`}
              description="There are currently no demonstration records for this activity category."
              actionText="Browse Auctions"
              actionHref="/auctions"
            />
          )}
        </div>
      </div>
    </div>
  );
}
