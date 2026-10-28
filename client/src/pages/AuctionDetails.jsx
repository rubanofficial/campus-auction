import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  DollarSign,
  ShieldCheck,
  MapPin,
  Tag,
  ArrowLeft,
  User,
  History,
  AlertCircle,
  Sparkles,
  Share2,
  Heart,
  Bike
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export default function AuctionDetails() {
  const { id } = useParams();

  // Mock sample data for presentation and layout verification
  const item = {
    title: 'Trek FX 2 Disc Hybrid Bicycle (2023 Edition)',
    category: 'Bicycles & Scooters',
    condition: 'Gently Used - Excellent',
    currentBid: 165,
    startingBid: 80,
    bidCount: 7,
    reserveMet: true,
    pickupLocation: 'Campus Recreation Center / North Dorms',
    seller: {
      name: 'Jordan Miller',
      major: 'Mechanical Engineering, \'27',
      rating: '4.9 ★ (12 sales)',
      verified: true,
    },
    description:
      'Selling my Trek FX 2 hybrid bike. Used for commuting between West Campus dorms and Engineering Hall for two semesters. Always stored indoors. Includes mounted front LED light, water bottle cage, and kickstand. Tuned up last month at Campus Bike Shop with new brake pads.',
  };

  const bidHistory = [
    { bidder: 'Student #409', amount: 165, time: '12 minutes ago', isLeader: true },
    { bidder: 'Student #182', amount: 155, time: '45 minutes ago', isLeader: false },
    { bidder: 'Student #923', amount: 140, time: '2 hours ago', isLeader: false },
    { bidder: 'Student #409', amount: 120, time: '4 hours ago', isLeader: false },
    { bidder: 'Student #105', amount: 95, time: 'Yesterday', isLeader: false },
    { bidder: 'Student #311', amount: 80, time: 'Yesterday (Starting Bid)', isLeader: false },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header with Breadcrumbs */}
      <PageHeader
        title={item.title}
        description={`Listing ID: ${id || 'demo-preview'} · Posted 2 days ago`}
        badge="Active Auction"
        breadcrumbs={[
          { label: 'Campus Auctions', href: '/auctions' },
          { label: item.category, href: '/auctions' },
          { label: item.title },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Share2}>
              Share
            </Button>
            <Button variant="outline" size="sm" icon={Heart}>
              Watchlist
            </Button>
          </div>
        }
      />

      {/* Main Grid: Left Column (Image & Info), Right Column (Bid & Countdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photo Gallery Placeholder */}
          <div className="relative rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 aspect-video flex flex-col items-center justify-center text-slate-400 overflow-hidden shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-white/80 shadow-xs flex items-center justify-center text-indigo-600 mb-2">
              <Bike className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-slate-600">Auction Item Photo Placeholder</p>
            <p className="text-xs text-slate-400">High-resolution campus item photos preview</p>

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white shadow-xs">
                {item.condition}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 text-slate-700 backdrop-blur-xs shadow-xs">
                {item.category}
              </span>
            </div>
          </div>

          {/* Item Description Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">About this item</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {item.description}
            </p>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Pickup: <strong>{item.pickupLocation}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Protection: <strong>In-Person Verification</strong></span>
              </div>
            </div>
          </div>

          {/* Seller Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base">
                JM
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-slate-900 text-sm">{item.seller.name}</h3>
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500">{item.seller.major} · {item.seller.rating}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Message Seller
            </Button>
          </div>
        </div>

        {/* Right Column - 5 Cols (Bidding, Countdown & History) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Auction Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-5">
            {/* Countdown Timer */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-indigo-600" />
                Time Remaining
              </div>
              <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-xl font-bold text-indigo-900">01</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Days</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-xl font-bold text-indigo-900">04</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Hours</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-xl font-bold text-indigo-900">22</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Mins</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-xl font-bold text-indigo-900">18</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Secs</div>
                </div>
              </div>
            </div>

            {/* Current Price Display */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Current Highest Bid
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                  ${item.currentBid}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ({item.bidCount} bids placed)
                </span>
              </div>
              <div className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Reserve price has been met
              </div>
            </div>

            {/* Visual Bidding Form (UI Placeholder - No real bidding) */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Place Your Bid (Min. increment $5)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    disabled
                    value={item.currentBid + 5}
                    readOnly
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 text-sm font-semibold cursor-not-allowed"
                  />
                </div>
                <Button variant="primary" disabled className="px-5">
                  Place Bid
                </Button>
              </div>

              {/* Scope restriction note */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2 text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Frontend Shell Preview:</strong> Live bidding transactions and socket countdowns will be connected in future backend steps.
                </span>
              </div>
            </div>
          </div>

          {/* Bid History Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Bid History</h3>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {item.bidCount} bids total
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {bidHistory.map((bid, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{bid.bidder}</span>
                    {bid.isLeader && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        High Bidder
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">${bid.amount}</span>
                    <span className="block text-[11px] text-slate-400">{bid.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
