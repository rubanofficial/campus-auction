import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
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
  Bike,
  Calculator,
  BookOpen,
  Laptop,
  Headphones,
  Lamp,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Calendar,
  DollarSign,
  Info,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

// Static demonstration item dataset mapped by route ID
const DEMO_ITEMS = {
  'hero-sprint-bicycle': {
    id: 'hero-sprint-bicycle',
    title: 'Hero Sprint Pro 26T Mountain Bicycle (Single Speed)',
    category: 'Cycles',
    condition: 'Good',
    startingPrice: 2400,
    currentPrice: 3200,
    minIncrement: 100,
    closingDateTime: 'October 29, 2026 at 6:00 PM IST',
    closingRemaining: '03h : 15m : 00s',
    bidsCount: 9,
    reserveMet: true,
    pickupLocation: 'Hostel 4 Cycle Stand, West Campus',
    seller: {
      name: 'Rohan Sharma',
      department: 'B.Tech Mechanical Engineering, 4th Year',
      room: 'Hostel 4, Room 218',
      rating: '4.9 ★ (8 campus transactions)',
      verified: true,
      memberSince: 'August 2024',
    },
    description:
      'Selling my reliable Hero Sprint Pro 26T single speed mountain bike. Used primarily for daily commutes between Hostel 4, Mechanical workshops, and the Central Library. Both front and rear V-brakes were tuned and fitted with fresh brake pads at the Campus Cycle Workshop last month. Comes with a sturdy metal basket, bell, and heavy-duty cable number lock.',
    gallery: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=80',
    ],
    fallbackIcon: Bike,
    bidHistory: [
      { bidder: 'Rahul S. (Roll #23ME104)', amount: 3200, time: 'Today at 2:45 PM', isLeader: true },
      { bidder: 'Priya M. (Roll #22CS089)', amount: 3100, time: 'Today at 1:15 PM', isLeader: false },
      { bidder: 'Amit V. (Roll #24EE012)', amount: 2950, time: 'Today at 11:30 AM', isLeader: false },
      { bidder: 'Sneha K. (Roll #23CH045)', amount: 2700, time: 'Yesterday at 8:10 PM', isLeader: false },
      { bidder: 'Karthik N. (Roll #21CE078)', amount: 2400, time: 'Yesterday at 4:00 PM (Starting Bid)', isLeader: false },
    ],
    questions: [
      {
        author: 'Arjun P. (Student #302)',
        date: 'Yesterday at 5:30 PM',
        question: 'Are both tires holding pressure well, or is there any puncture history?',
        answer: 'Both tubes are in great shape! Filled air yesterday at the campus gate pump and they hold pressure perfectly.',
      },
      {
        author: 'Divya R. (Student #119)',
        date: 'Today at 10:15 AM',
        question: 'Can you hand it over near the Student Activity Center instead of Hostel 4?',
        answer: 'Yes, absolutely. I can bring it to the SAC entrance during lunch break or after 5 PM.',
      },
    ],
  },
  'casio-fx991es-plus': {
    id: 'casio-fx991es-plus',
    title: 'Casio FX-991ES Plus Scientific Calculator (2nd Edition)',
    category: 'Calculators',
    condition: 'Like New',
    startingPrice: 500,
    currentPrice: 850,
    minIncrement: 50,
    closingDateTime: 'October 29, 2026 at 4:30 PM IST',
    closingRemaining: '01h : 45m : 00s',
    bidsCount: 14,
    reserveMet: true,
    pickupLocation: 'Library Front Lawn, Main Campus',
    seller: {
      name: 'Ananya Deshmukh',
      department: 'Electrical Engineering, 3rd Year',
      room: 'Girls Hostel 2, Room 104',
      rating: '5.0 ★ (5 campus sales)',
      verified: true,
      memberSince: 'January 2025',
    },
    description:
      'Genuine Casio FX-991ES Plus 2nd Edition scientific calculator. Essential for engineering mathematics, circuit theory, and university semester exams. Natural textbook display with 417 functions. Includes original sliding hard cover and fresh button cell battery.',
    gallery: [
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80',
    ],
    fallbackIcon: Calculator,
    bidHistory: [
      { bidder: 'Vikas T. (Roll #24CS031)', amount: 850, time: 'Today at 3:10 PM', isLeader: true },
      { bidder: 'Deepak G. (Roll #23EE082)', amount: 800, time: 'Today at 1:40 PM', isLeader: false },
      { bidder: 'Meera B. (Roll #24IT019)', amount: 750, time: 'Today at 11:00 AM', isLeader: false },
      { bidder: 'Aditya S. (Roll #22ME099)', amount: 650, time: 'Yesterday at 9:15 PM', isLeader: false },
      { bidder: 'Suresh L. (Roll #23EC014)', amount: 500, time: 'Yesterday at 6:00 PM (Starting Bid)', isLeader: false },
    ],
    questions: [
      {
        author: 'Nikhil K. (Student #441)',
        date: 'Today at 11:20 AM',
        question: 'Does this model have matrix and complex number calculation modes?',
        answer: 'Yes, it supports up to 3x3 matrices, vectors, complex numbers, and equation solving.',
      },
    ],
  },
  'engineering-mathematics-grewal': {
    id: 'engineering-mathematics-grewal',
    title: 'Higher Engineering Mathematics - B.S. Grewal (44th Ed.)',
    category: 'Books',
    condition: 'Good',
    startingPrice: 300,
    currentPrice: 420,
    minIncrement: 30,
    closingDateTime: 'October 29, 2026 at 8:15 PM IST',
    closingRemaining: '05h : 30m : 00s',
    bidsCount: 6,
    reserveMet: true,
    pickupLocation: 'Mechanical Dept. Quad',
    seller: {
      name: 'Adarsh Gupta',
      department: 'Civil Engineering, 4th Year',
      room: 'Hostel 1, Room 312',
      rating: '4.8 ★ (11 textbook exchanges)',
      verified: true,
      memberSince: 'July 2023',
    },
    description:
      'Standard Higher Engineering Mathematics reference book by Dr. B.S. Grewal (44th Edition). Covers Calculus, Differential Equations, Linear Algebra, and Numerical Methods. Spine is intact, all pages clean with light pencil highlights on key formulas.',
    gallery: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    ],
    fallbackIcon: BookOpen,
    bidHistory: [
      { bidder: 'Varun M. (Roll #25CS044)', amount: 420, time: 'Today at 1:20 PM', isLeader: true },
      { bidder: 'Siddharth R. (Roll #25EE018)', amount: 390, time: 'Today at 10:45 AM', isLeader: false },
      { bidder: 'Naveen C. (Roll #25ME091)', amount: 360, time: 'Yesterday at 7:30 PM', isLeader: false },
      { bidder: 'Pooja T. (Roll #25IT002)', amount: 300, time: 'Yesterday at 3:00 PM (Starting Bid)', isLeader: false },
    ],
    questions: [
      {
        author: 'Ravi S. (Student #088)',
        date: 'Today at 9:00 AM',
        question: 'Are all Laplace transform tables in the appendix included without torn pages?',
        answer: 'Yes! The appendix and Laplace transform reference tables are 100% intact.',
      },
    ],
  },
};

export default function AuctionDetails() {
  const { id } = useParams();

  // Load item by ID, or fallback to the primary hero sprint bicycle demo item
  const item = DEMO_ITEMS[id] || {
    ...DEMO_ITEMS['hero-sprint-bicycle'],
    id: id || 'hero-sprint-bicycle',
    title: id ? `Campus Auction Item: ${id.replace(/-/g, ' ')}` : DEMO_ITEMS['hero-sprint-bicycle'].title,
  };

  const minNextBid = item.currentPrice + item.minIncrement;

  // Selected gallery image index
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const FallbackIcon = item.fallbackIcon || Tag;

  return (
    <div className="space-y-8">
      {/* 1. Header with Breadcrumbs and Back Navigation */}
      <div className="space-y-3">
        <Link
          to="/auctions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Browse Auctions</span>
        </Link>

        <PageHeader
          title={item.title}
          description={`Listing Reference: #${item.id} · Verified student listing at campus`}
          badge="Active Demonstration Auction"
          breadcrumbs={[
            { label: 'Campus Home', href: '/' },
            { label: 'Browse Auctions', href: '/auctions' },
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
      </div>

      {/* Demonstration Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Demonstration Preview:</span> This is a frontend presentation view. Prices are in Indian Rupees (₹). Live bidding, socket countdowns, and student messaging will be enabled in future releases.
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Images, Details, Seller, Q&A */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo Gallery Viewport */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="relative aspect-4/3 w-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
              {!imageError && item.gallery && item.gallery[selectedImageIndex] ? (
                <img
                  src={item.gallery[selectedImageIndex]}
                  alt={item.title}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover transition-opacity duration-200"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <FallbackIcon className="w-16 h-16 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.category} Photo Placeholder</p>
                </div>
              )}

              {/* Badges on Top of Photo */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white shadow-xs">
                  {item.condition}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 text-slate-800 backdrop-blur-xs border border-slate-200/60 shadow-xs">
                  {item.category}
                </span>
              </div>
            </div>

            {/* Thumbnail Selectors */}
            {item.gallery && item.gallery.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1">
                {item.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setImageError(false);
                    }}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Description Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Item Details & Condition
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {item.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">Campus Pickup Spot</span>
                  <span className="text-slate-500">{item.pickupLocation}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">Campus Trust</span>
                  <span className="text-slate-500">In-person item inspection prior to payment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Information Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Seller Profile
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-100 to-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-base border border-indigo-200">
                  {item.seller.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {item.seller.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Student
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.seller.department} · {item.seller.room}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.seller.rating} · Campus member since {item.seller.memberSince}
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm">
                View Seller Listings
              </Button>
            </div>
          </div>

          {/* 5. Questions & Answers Section Placeholder */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Item Questions & Campus Q&A
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {item.questions ? item.questions.length : 0} questions asked
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Have questions about sizing, wear, or campus meeting times? Post questions here for the seller to answer publicly.
            </p>

            {/* Existing Questions List */}
            <div className="space-y-4">
              {item.questions && item.questions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-700">{q.author}</span>
                    <span>{q.date}</span>
                  </div>
                  <p className="text-slate-800 font-medium">Q: {q.question}</p>
                  <div className="pl-3 border-l-2 border-indigo-400 pt-1 text-slate-600">
                    <span className="font-bold text-indigo-700">Seller: </span>
                    {q.answer}
                  </div>
                </div>
              ))}
            </div>

            {/* Question Input Placeholder */}
            <div className="pt-2 space-y-2">
              <label htmlFor="questionInput" className="block text-xs font-semibold text-slate-700">
                Ask the Seller a Question
              </label>
              <div className="flex gap-2">
                <input
                  id="questionInput"
                  type="text"
                  placeholder="e.g. Can we meet near the Student Union during lunch hours?"
                  disabled
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs placeholder:text-slate-400 focus:outline-none cursor-not-allowed"
                />
                <Button variant="outline" size="sm" disabled>
                  Ask Question
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                Demonstration placeholder: Buyer-to-seller messaging will be enabled when campus notifications launch.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Status, Pricing, Bid Form, Bid History */}
        <div className="lg:col-span-5 space-y-6">
          {/* 2. Auction Status, Pricing & Visual Countdown Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-5">
            {/* Countdown Timer Display (Static Demo) */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-indigo-600" />
                Time Remaining (Demo)
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-2xl font-black text-indigo-950">03</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Hours</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-2xl font-black text-indigo-950">15</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Minutes</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-2xl font-black text-indigo-950">00</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Seconds</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Closes: {item.closingDateTime}</span>
              </div>
            </div>

            {/* Price Information */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Current Leading Bid
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                    ₹{item.currentPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({item.bidsCount} bids placed)
                  </span>
                </div>
              </div>

              {/* Price Details Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Starting Price</span>
                  <span className="font-bold text-slate-800">
                    ₹{item.startingPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Min. Increment</span>
                  <span className="font-bold text-slate-800">
                    ₹{item.minIncrement.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5" />
                Reserve price met · Top bid wins at close
              </div>
            </div>

            {/* 3. Bid Form UI (Visual Only) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label htmlFor="bidInput" className="block text-xs font-bold text-slate-700">
                Place Your Bid (₹)
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    id="bidInput"
                    type="number"
                    defaultValue={minNextBid}
                    disabled
                    readOnly
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm font-bold cursor-not-allowed"
                  />
                </div>
                <Button variant="primary" disabled className="px-5">
                  Place Bid
                </Button>
              </div>

              {/* Minimum Acceptable Bid Hint */}
              <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                Minimum acceptable bid is ₹{minNextBid.toLocaleString('en-IN')}
              </p>

              {/* Short informational message */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2 text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Demonstration Notice:</strong> Live bidding functionality and automatic bid tracking will be enabled in upcoming releases.
                </span>
              </div>
            </div>
          </div>

          {/* 4. Public Bid History Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Public Bid History
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {item.bidHistory ? item.bidHistory.length : 0} bids shown
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {item.bidHistory && item.bidHistory.map((bid, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{bid.bidder}</span>
                      {bid.isLeader && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Leading
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{bid.time}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      ₹{bid.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400">
                All bids are public and verified to prevent shill bidding.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
