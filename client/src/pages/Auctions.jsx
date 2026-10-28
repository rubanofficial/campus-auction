import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Filter,
  X,
  Clock,
  Tag,
  MapPin,
  Bike,
  Calculator,
  BookOpen,
  Laptop,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
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

// Capitalize helper
const formatCategoryName = (cat) => {
  if (!cat) return 'Item';
  const mapping = {
    cycle: 'Cycle',
    calculator: 'Calculator',
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

// Real Auction Card Component
function AuctionCard({ item }) {
  const [imageError, setImageError] = useState(false);
  const FallbackIcon = getCategoryIcon(item.category);
  const coverImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;

  const currentPrice = item.currentPrice || item.startingPrice || 0;
  const bidCount = item.bidCount || 0;
  const minIncrement = item.minBidIncrement || 50;
  const minNextBid = bidCount > 0 ? currentPrice + minIncrement : currentPrice;
  const closingTimeText = formatTimeRemaining(item.endsAt);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
      {/* Thumbnail Viewport */}
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
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/85 text-white backdrop-blur-xs shadow-xs">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>{closingTimeText}</span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            <Link to={`/auctions/${item.id}`} className="focus:outline-none focus-visible:underline">
              {item.title}
            </Link>
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Seller: {item.sellerName || 'Verified Student'}</span>
          </p>
        </div>

        {/* Pricing, Next Bid & Action Button */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-end justify-between">
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

            {/* Minimum Next Bid Hint */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Min. Next Bid
              </span>
              <span className="text-xs font-bold text-indigo-600">
                ₹{minNextBid.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <Button
            as={Link}
            to={`/auctions/${item.id}`}
            variant="primary"
            size="sm"
            className="w-full text-center py-2"
          >
            View Auction
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Auctions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Filter states initialized from URL params if present
  const initialCategory = searchParams.get('category') || 'All';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory !== 'All'
      ? initialCategory.charAt(0).toUpperCase() + initialCategory.slice(1).toLowerCase()
      : 'All'
  );
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('closingSoon');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Data states
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const categories = ['All', 'Cycle', 'Calculator', 'Books', 'Electronics', 'Other'];
  const conditions = ['All', 'Like New', 'Good', 'Fair'];

  // Fetch listings from backend API
  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '30');

      if (sortBy) {
        params.append('sort', sortBy);
      }

      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory.toLowerCase());
      }

      if (selectedCondition && selectedCondition !== 'All') {
        params.append('condition', selectedCondition.toLowerCase().replace(/\s+/g, '_'));
      }

      const parsedMin = parseInt(minPrice, 10);
      if (!isNaN(parsedMin) && parsedMin >= 0) {
        params.append('minPrice', parsedMin.toString());
      }

      const parsedMax = parseInt(maxPrice, 10);
      if (!isNaN(parsedMax) && parsedMax >= 0) {
        params.append('maxPrice', parsedMax.toString());
      }

      if (searchQuery.trim().length > 0) {
        params.append('search', searchQuery.trim());
      }

      const res = await fetch(`${apiBaseUrl}/api/auctions?${params.toString()}`, {
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}: Failed to load auctions`);
      }

      setAuctions(Array.isArray(data.auctions) ? data.auctions : []);
      setTotalCount(data.pagination?.totalResults || (data.auctions ? data.auctions.length : 0));
    } catch (err) {
      setErrorMessage(err.message || 'Could not connect to the campus marketplace server.');
      setAuctions([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, selectedCategory, selectedCondition, minPrice, maxPrice, sortBy, searchQuery]);

  // Debounced fetch on filter/search change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAuctions();
    }, 250);

    return () => clearTimeout(handler);
  }, [fetchAuctions]);

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedCondition('All');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('closingSoon');
    setSearchQuery('');
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Browse Auctions"
        description="Discover and bid on verified second-hand campus items listed by fellow students. All prices shown in Indian Rupees (₹)."
        badge={isLoading ? 'Loading...' : `${totalCount} Active ${totalCount === 1 ? 'Listing' : 'Listings'}`}
        breadcrumbs={[
          { label: 'Campus Home', href: '/' },
          { label: 'Browse Auctions' },
        ]}
        action={
          <Button as={Link} to="/auctions/create" variant="primary" size="sm" icon={PlusCircle}>
            Create Listing
          </Button>
        }
      />

      {/* AI Assistant Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-indigo-950">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <p>
            <span className="font-bold">Natural-Language Search:</span> Looking for items under a specific budget? Ask our AI assistant in plain English.
          </p>
        </div>
        <Link
          to="/ai-search"
          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 shrink-0 hover:underline"
        >
          <span>Try AI Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Prominent Search Bar & Sort Row */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or model (e.g. Hero, Casio, Grewal)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls: Mobile Filter Toggle & Sort Dropdown */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2">
          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            aria-expanded={isMobileFilterOpen}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filters</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMobileFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Sort Selection */}
          <div className="relative min-w-[170px]">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-8 pr-7 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none appearance-none"
            >
              <option value="closingSoon">Closing Soonest</option>
              <option value="newest">Newly Listed</option>
              <option value="priceLowToHigh">Price: Low to High</option>
              <option value="priceHighToLow">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Responsive Filter Panel + Auction Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* 3. Filter Sidebar Panel */}
        <aside
          className={`lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6 ${
            isMobileFilterOpen ? 'block' : 'hidden lg:block'
          }`}
          aria-label="Filter Auctions"
        >
          {/* Filter Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Filters</h2>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Filter 1: Category */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Category
            </label>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <label
                  key={cat}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="categoryFilter"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{cat}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Filter 2: Condition */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Item Condition
            </label>
            <div className="space-y-1.5">
              {conditions.map((cond) => (
                <label
                  key={cond}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedCondition === cond
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="conditionFilter"
                      checked={selectedCondition === cond}
                      onChange={() => setSelectedCondition(cond)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{cond}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Filter 3: Price Range (₹) */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Starting Price Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters Action Button */}
          <div className="pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full text-center"
            >
              Reset All Filters
            </Button>
          </div>
        </aside>

        {/* 4. Auction Cards Grid Section */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {isLoading ? (
                'Loading active listings...'
              ) : (
                <>
                  Showing <strong className="text-slate-800">{auctions.length}</strong> {auctions.length === 1 ? 'auction' : 'auctions'}
                </>
              )}
            </span>
            <span className="hidden sm:inline text-slate-400">
              Campus pickup only · Zero shipping charges
            </span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-center space-y-3 shadow-xs">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-base text-rose-950">Unable to Load Auctions</h3>
                <p className="text-xs text-rose-800 max-w-md mx-auto">{errorMessage}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAuctions}
                icon={RefreshCw}
                className="mt-2 bg-white"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !errorMessage && auctions.length === 0 && (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Tag className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-bold text-base text-slate-900">No Auctions Found</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No active listings match your current search or filter criteria. Try clearing some filters or be the first to list an item!
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <Button as={Link} to="/auctions/create" variant="primary" size="sm" icon={PlusCircle}>
                  Create Auction
                </Button>
              </div>
            </div>
          )}

          {/* Real Auction Cards Grid */}
          {!isLoading && !errorMessage && auctions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} item={auction} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
