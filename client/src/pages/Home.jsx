import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Compass,
  PlusCircle,
  Bike,
  Calculator,
  BookOpen,
  Laptop,
  Headphones,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Tag,
  MapPin,
  TrendingUp,
  Layers
} from 'lucide-react';
import Button from '../components/ui/Button';

// Static sample data for Featured Auctions
const FEATURED_AUCTIONS = [
  {
    id: 'trek-fx2-hybrid',
    title: 'Trek FX 2 Disc Hybrid Bicycle (2023 Edition)',
    category: 'Cycles',
    condition: 'Like New',
    currentPrice: 165,
    bidCount: 12,
    closingTime: '4h 20m',
    pickupSpot: 'Student Recreation Center',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=700&q=80',
    fallbackIcon: Bike,
  },
  {
    id: 'ti-84-plus-ce',
    title: 'Texas Instruments TI-84 Plus CE Graphing Calculator',
    category: 'Calculators',
    condition: 'Excellent',
    currentPrice: 55,
    bidCount: 8,
    closingTime: '2h 15m',
    pickupSpot: 'Science & Math Hall',
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=700&q=80',
    fallbackIcon: Calculator,
  },
  {
    id: 'stewart-calculus',
    title: 'Calculus: Early Transcendentals (8th Ed.) - Stewart',
    category: 'Books',
    condition: 'Good Condition',
    currentPrice: 32,
    bidCount: 5,
    closingTime: '6h 45m',
    pickupSpot: 'Campus Main Library',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80',
    fallbackIcon: BookOpen,
  },
  {
    id: 'sony-wh1000xm4',
    title: 'Sony WH-1000XM4 Wireless Noise-Cancelling Headphones',
    category: 'Electronics',
    condition: 'Like New',
    currentPrice: 130,
    bidCount: 14,
    closingTime: '1d 03h',
    pickupSpot: 'Student Union Lobby',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80',
    fallbackIcon: Headphones,
  },
  {
    id: 'ipad-air-gen5',
    title: 'Apple iPad Air (5th Gen) 64GB Wi-Fi with Apple Pencil',
    category: 'Electronics',
    condition: 'Mint Condition',
    currentPrice: 340,
    bidCount: 19,
    closingTime: '18h 30m',
    pickupSpot: 'Engineering Building',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=700&q=80',
    fallbackIcon: Laptop,
  },
  {
    id: 'ninebot-scooter',
    title: 'Segway Ninebot KickScooter Max G30 (Long-Range)',
    category: 'Cycles',
    condition: 'Gently Used',
    currentPrice: 210,
    bidCount: 9,
    closingTime: '2d 08h',
    pickupSpot: 'West Dorm Quad',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=700&q=80',
    fallbackIcon: Bike,
  },
];

// Category shortcuts
const CATEGORIES = [
  {
    name: 'Cycles',
    description: 'Bikes, scooters & locks',
    icon: Bike,
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/60',
    iconBg: 'bg-emerald-100 text-emerald-700',
    count: '24 listings',
  },
  {
    name: 'Calculators',
    description: 'Graphing & scientific',
    icon: Calculator,
    color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 border-purple-200/60',
    iconBg: 'bg-purple-100 text-purple-700',
    count: '18 listings',
  },
  {
    name: 'Books',
    description: 'Course textbooks & notes',
    icon: BookOpen,
    color: 'from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200/60',
    iconBg: 'bg-amber-100 text-amber-700',
    count: '42 listings',
  },
  {
    name: 'Electronics',
    description: 'Laptops, tablets & audio',
    icon: Laptop,
    color: 'from-blue-500/10 to-cyan-500/10 text-blue-600 border-blue-200/60',
    iconBg: 'bg-blue-100 text-blue-700',
    count: '35 listings',
  },
];

// Single sample auction card component with graceful image fallback
function AuctionCard({ item }) {
  const [imageError, setImageError] = useState(false);
  const FallbackIcon = item.fallbackIcon || Tag;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
      {/* Card Image Thumbnail */}
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
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-xs shadow-xs">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>{item.closingTime}</span>
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
            <span>Pickup: {item.pickupSpot}</span>
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
                ${item.currentPrice}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({item.bidCount} bids)
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
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // UI-only search submission as required
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
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified .edu Only
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

          {/* Prominent UI Search Input */}
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
            {['Trek Bikes', 'TI-84 Plus', 'Stewart Calculus', 'Noise Cancelling', 'Electric Scooter'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-100 transition-colors cursor-pointer"
                onClick={() => setSearchQuery(tag)}
              >
                {tag}
              </span>
            ))}
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
                to="/auctions"
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
                  <span className="inline-block mt-2 text-[11px] font-semibold text-slate-400">
                    {cat.count}
                  </span>
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

        {/* Sample Auction Cards Grid (6 items) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_AUCTIONS.map((auction) => (
            <AuctionCard key={auction.id} item={auction} />
          ))}
        </div>
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
