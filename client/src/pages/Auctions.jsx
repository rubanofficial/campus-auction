import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Headphones,
  Lamp,
  ArrowUpDown,
  Sparkles,
  Info,
  ChevronDown
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

// Static sample demonstration auctions for campus browsing
const SAMPLE_AUCTIONS = [
  {
    id: 'hero-sprint-bicycle',
    title: 'Hero Sprint Pro 26T Mountain Bicycle (Single Speed)',
    category: 'Cycles',
    condition: 'Good',
    currentPrice: 3200,
    minNextBid: 3300,
    closingTime: '3h 15m',
    bidsCount: 9,
    pickupLocation: 'Hostel 4 Cycle Stand',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
    fallbackIcon: Bike,
  },
  {
    id: 'casio-fx991es-plus',
    title: 'Casio FX-991ES Plus Scientific Calculator (2nd Edition)',
    category: 'Calculators',
    condition: 'Like New',
    currentPrice: 850,
    minNextBid: 900,
    closingTime: '1h 45m',
    bidsCount: 14,
    pickupLocation: 'Library Front Lawn',
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
    fallbackIcon: Calculator,
  },
  {
    id: 'engineering-mathematics-grewal',
    title: 'Higher Engineering Mathematics - B.S. Grewal (44th Ed.)',
    category: 'Books',
    condition: 'Good',
    currentPrice: 420,
    minNextBid: 450,
    closingTime: '5h 30m',
    bidsCount: 6,
    pickupLocation: 'Mechanical Dept. Quad',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    fallbackIcon: BookOpen,
  },
  {
    id: 'aluminum-laptop-stand',
    title: 'Foldable Ergonomic Aluminum Laptop Stand (Multi-Angle)',
    category: 'Electronics',
    condition: 'Like New',
    currentPrice: 650,
    minNextBid: 700,
    closingTime: '7h 10m',
    bidsCount: 8,
    pickupLocation: 'Student Activity Center',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
    fallbackIcon: Laptop,
  },
  {
    id: 'boat-rockerz-550',
    title: 'boAt Rockerz 550 Over-Ear Wireless Bluetooth Headphones',
    category: 'Electronics',
    condition: 'Good',
    currentPrice: 950,
    minNextBid: 1000,
    closingTime: '11h 20m',
    bidsCount: 11,
    pickupLocation: 'Dining Hall Annex',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    fallbackIcon: Headphones,
  },
  {
    id: 'philips-rechargeable-desk-lamp',
    title: 'Philips Rechargeable LED Desk Study Lamp (EyeCare)',
    category: 'Electronics',
    condition: 'Fair',
    currentPrice: 380,
    minNextBid: 410,
    closingTime: '2h 50m',
    bidsCount: 7,
    pickupLocation: 'Boys Hostel Block B',
    imageUrl: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=600&q=80',
    fallbackIcon: Lamp,
  },
  {
    id: 'btwin-riverside-hybrid',
    title: 'Btwin Riverside 120 Hybrid Geared Bicycle (Large Frame)',
    category: 'Cycles',
    condition: 'Good',
    currentPrice: 4800,
    minNextBid: 4950,
    closingTime: '1d 04h',
    bidsCount: 16,
    pickupLocation: 'Main Campus Gate',
    imageUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=600&q=80',
    fallbackIcon: Bike,
  },
  {
    id: 'casio-fx82ms-calculator',
    title: 'Casio FX-82MS Scientific Calculator with Slide Case',
    category: 'Calculators',
    condition: 'Like New',
    currentPrice: 450,
    minNextBid: 480,
    closingTime: '9h 15m',
    bidsCount: 5,
    pickupLocation: 'Computing Lab 2',
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80',
    fallbackIcon: Calculator,
  },
];

// Single sample auction card component with image error fallback
function AuctionCard({ item }) {
  const [imageError, setImageError] = useState(false);
  const FallbackIcon = item.fallbackIcon || Tag;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
      {/* Thumbnail Viewport */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        {!imageError ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-4">
            <FallbackIcon className="w-12 h-12 text-slate-300 mb-2" />
            <span className="text-xs font-medium text-slate-400">{item.category}</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/95 text-slate-700 backdrop-blur-xs shadow-xs border border-slate-200/60">
            {item.category}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600 text-white shadow-xs">
            {item.condition}
          </span>
        </div>

        {/* Closing Time Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/85 text-white backdrop-blur-xs shadow-xs">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>{item.closingTime}</span>
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
            <span>Pickup: {item.pickupLocation}</span>
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
                  ₹{item.currentPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  ({item.bidsCount} bids)
                </span>
              </div>
            </div>

            {/* Minimum Next Bid Hint */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Min. Next Bid
              </span>
              <span className="text-xs font-bold text-indigo-600">
                ₹{item.minNextBid.toLocaleString('en-IN')}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [closingSoonOnly, setClosingSoonOnly] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categories = ['All', 'Cycles', 'Calculators', 'Books', 'Electronics'];
  const conditions = ['All', 'Like New', 'Good', 'Fair'];

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedCondition('All');
    setMinPrice('');
    setMaxPrice('');
    setClosingSoonOnly(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Browse Auctions"
        description="Discover and bid on verified second-hand campus items listed by fellow students. All prices shown in Indian Rupees (₹)."
        badge={`${SAMPLE_AUCTIONS.length} Active Listings`}
        breadcrumbs={[
          { label: 'Campus Home', href: '/' },
          { label: 'Browse Auctions' },
        ]}
      />

      {/* Demonstration Notice */}
      <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Demonstration Mode:</span> Showing {SAMPLE_AUCTIONS.length} sample active auctions for UI browsing. Filtering and bidding controls are preview-only.
        </p>
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
            placeholder="Search by title, brand, or model (e.g. Hero, Casio, Grewal)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
          />
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
          <div className="relative min-w-[160px]">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              defaultValue="closing_soon"
              className="w-full pl-8 pr-7 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none appearance-none"
            >
              <option value="closing_soon">Closing Soonest</option>
              <option value="lowest_bid">Price: Low to High</option>
              <option value="highest_bid">Price: High to Low</option>
              <option value="most_bids">Most Bids</option>
              <option value="newest">Newly Listed</option>
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
              Price Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  placeholder="Min"
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
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Filter 4: Closing Soon Checkbox */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-start gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={closingSoonOnly}
                onChange={(e) => setClosingSoonOnly(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-900 block">Closing Soon</span>
                <span className="text-[11px] text-slate-400">Ends within 24 hours</span>
              </div>
            </label>
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
              Showing <strong className="text-slate-800">{SAMPLE_AUCTIONS.length}</strong> campus auction listings
            </span>
            <span className="hidden sm:inline text-slate-400">
              Campus pickup only · Zero shipping charges
            </span>
          </div>

          {/* 6-8 Sample Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {SAMPLE_AUCTIONS.map((auction) => (
              <AuctionCard key={auction.id} item={auction} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
