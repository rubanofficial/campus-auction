import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Compass,
  PlusCircle,
  Bike,
  Calculator,
  BookOpen,
  Laptop,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Tag,
  MapPin,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import Button from '../components/ui/Button';

// Category fallback icon mapping
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

// Calculate human-friendly time remaining
const formatTimeRemaining = (endsAt) => {
  if (!endsAt) return 'Active';
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${remHours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const formatCategoryName = (cat) => {
  if (!cat) return 'Item';
  const mapping = {
    cycle: 'Cycles',
    calculator: 'Calculators',
    books: 'Books',
    electronics: 'Electronics',
    other: 'Other',
  };
  return mapping[cat.toLowerCase()] || cat.charAt(0).toUpperCase() + cat.slice(1);
};

const formatConditionName = (cond) => {
  if (!cond) return 'Good';
  const mapping = {
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
  };
  return mapping[cond.toLowerCase()] || cond;
};

// Category shortcuts
const CATEGORIES = [
  {
    name: 'Cycles',
    key: 'cycle',
    description: 'Bikes, scooters & locks',
    icon: Bike,
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'Calculators',
    key: 'calculator',
    description: 'Graphing & scientific',
    icon: Calculator,
    iconBg: 'bg-purple-100 text-purple-700',
  },
  {
    name: 'Books',
    key: 'books',
    description: 'Course textbooks & notes',
    icon: BookOpen,
    iconBg: 'bg-amber-100 text-amber-700',
  },
  {
    name: 'Electronics',
    key: 'electronics',
    description: 'Laptops, tablets & audio',
    icon: Laptop,
    iconBg: 'bg-blue-100 text-blue-700',
  },
];

// Real Auction Card Component for Home page
function AuctionCard({ item }) {
  const [imageError, setImageError] = useState(false);
  const FallbackIcon = getCategoryIcon(item.category);
  const coverImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  const currentPrice = item.currentPrice || item.startingPrice || 0;
  const bidCount = item.bidCount || 0;
  const closingTimeText = formatTimeRemaining(item.endsAt);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
      {/* Card Image Thumbnail */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        {coverImage && !imageError ? (
          <img
            src={coverImage}
            alt={item.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-4">
            <FallbackIcon className="w-12 h-12 text-slate-300 mb-2" />
            <span className="text-xs font-medium text-slate-400">{formatCategoryName(item.category)}</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/95 text-slate-700 backdrop-blur-xs shadow-xs border border-slate-200/60">
            {formatCategoryName(item.category)}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600 text-white shadow-xs">
            {formatConditionName(item.condition)}
          </span>
        </div>

        {/* Closing Time Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-xs shadow-xs">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>{closingTimeText}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            <Link to={`/auctions/${item.id}`} className="focus:outline-none focus-visible:underline">
              {item.title}
            </Link>
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Seller: {item.sellerName || 'Verified Student'}</span>
          </p>
        </div>

        {/* Pricing & CTA Row */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
              Current Bid
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({bidCount} {bidCount === 1 ? 'bid' : 'bids'})
              </span>
            </div>
          </div>

          <Button
            as={Link}
            to={`/auctions/${item.id}`}
            variant="secondary"
            size="sm"
            className="group-hover:bg-indigo-600 group-hover:text-white transition-colors"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch real featured listings closing soon
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    fetch(`${apiBaseUrl}/api/auctions?limit=6&sort=closingSoon`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch listings`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setFeaturedAuctions(Array.isArray(data.auctions) ? data.auctions : []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message || 'Unable to connect to marketplace');
          setFeaturedAuctions([]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/auctions?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/auctions');
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Welcome Hero Section with Search Input */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-indigo-900/50">
        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Campus-Exclusive Bidding & Trading</span>
            <span className="text-indigo-400">·</span>
            <span className="flex items-center gap-1 text-emerald-300">

            </span>
          </div>

          {/* Headline & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Discover and bid on used campus essentials.
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-2xl">
              Buy and sell second-hand bicycles, calculators, semester textbooks, and dorm tech directly with fellow students. Fair bids, zero shipping fees, and convenient in-person campus pickup.
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-2xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cycles, TI-84 calculators, textbooks, electronics..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
              />
            </div>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              icon={Search}
              className="py-3.5 px-6 font-semibold"
            >
              Search
            </Button>
          </form>

          {/* Quick Popular Search Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-200/80">
            <span className="font-medium text-indigo-300">Popular:</span>
            {['Hero Cycle', 'Casio Calculator', 'Engineering Mathematics', 'Headphones', 'Laptop Stand'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSearchQuery(tag);
                  navigate(`/auctions?search=${encodeURIComponent(tag)}`);
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* AI Search CTA */}
          <div className="pt-1 flex items-center gap-2">
            <Link
              to="/ai-search"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-xs font-semibold backdrop-blur-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Try Natural-Language AI Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Ambient Gradient Glows */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 -bottom-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. Category Shortcuts: Cycles, Calculators, Books, Electronics */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Browse by Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Explore active listings organized by student needs
            </p>
          </div>
          <Link
            to="/auctions"
            className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            All Categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/auctions?category=${cat.key}`}
                className="group p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex items-start gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.iconBg} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {cat.name}
                    </h3>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Auctions Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Featured Campus Auctions
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              High-interest items closing soon. Bid before the clock runs out.
            </p>
          </div>

          <Button
            as={Link}
            to="/auctions"
            variant="outline"
            size="sm"
            icon={Compass}
          >
            View All Auctions
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 animate-pulse"
              >
                <div className="aspect-4/3 w-full bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-5 bg-slate-100 rounded-md w-20" />
                  <div className="h-8 bg-slate-100 rounded-xl w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-600">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMessage && featuredAuctions.length === 0 && (
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center space-y-3">
            <Tag className="w-8 h-8 text-indigo-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900">No Active Auctions Right Now</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first campus student to list a bicycle, textbook, or calculator for auction!
              </p>
            </div>
            <Button as={Link} to="/auctions/create" variant="primary" size="sm" icon={PlusCircle}>
              Create a Listing
            </Button>
          </div>
        )}

        {/* Real Auction Cards Grid */}
        {!isLoading && !errorMessage && featuredAuctions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAuctions.map((auction) => (
              <AuctionCard key={auction.id} item={auction} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Simple Call to Action (CTA) */}
      <section className="rounded-3xl bg-slate-900 text-white p-8 sm:p-10 border border-slate-800 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Campus Marketplace Community
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Ready to clear out your dorm or grab a great deal?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join students across campus exchanging textbooks, bikes, and tech safely. List an item in under 2 minutes or browse live auctions now.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <Button
              as={Link}
              to="/auctions"
              variant="outline"
              size="lg"
              icon={Compass}
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
            >
              Browse Auctions
            </Button>
            <Button
              as={Link}
              to="/auctions/create"
              variant="primary"
              size="lg"
              icon={PlusCircle}
            >
              Create Listing
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
