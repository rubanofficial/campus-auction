import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  PackageSearch,
  Tag,
  ArrowUpDown,
  PlusCircle,
  ExternalLink,
  Clock,
  Flame
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export default function Auctions() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Bicycles & Scooters',
    'Electronics & Gadgets',
    'Course Textbooks',
    'Calculators & Tools',
    'Dorm Essentials',
    'Sports & Outdoor',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Browse Campus Auctions"
        description="Discover active auctions from fellow students on campus. Bid to win great deals before the clock runs out."
        badge="Live Marketplace"
        action={
          <Button as={Link} to="/auctions/create" variant="primary" icon={PlusCircle}>
            List an Item
          </Button>
        }
      />

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, brand, or model (e.g., TI-84, Trek, MacBook)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[170px]">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                defaultValue="ending_soonest"
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none appearance-none"
              >
                <option value="ending_soonest">Ending Soonest</option>
                <option value="newest">Newly Listed</option>
                <option value="lowest_bid">Current Bid: Low to High</option>
                <option value="highest_bid">Current Bid: High to Low</option>
                <option value="most_bids">Most Bids</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 pr-1">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Preview Item (To allow viewing AuctionDetails easily) */}
      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-600 text-white text-[11px] uppercase tracking-wide">
            Sample Preview
          </span>
          <span>Want to preview the detailed auction view? Check our sample listing:</span>
        </div>
        <Link
          to="/auctions/trek-fx2-hybrid"
          className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2"
        >
          View Trek FX 2 Bicycle Details <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Empty State */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <PackageSearch className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900">
            No live auctions found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            There are currently no active auctions matching "{selectedCategory}". As campus sellers publish new listings, they will appear here in real time.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </Button>
          <Button
            as={Link}
            to="/auctions/create"
            variant="primary"
            size="sm"
            icon={PlusCircle}
          >
            Create First Listing
          </Button>
        </div>
      </div>
    </div>
  );
}
