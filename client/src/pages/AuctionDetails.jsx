import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Clock,
  ShieldCheck,
  MapPin,
  Tag,
  ArrowLeft,
  History,
  AlertCircle,
  Sparkles,
  Share2,
  Heart,
  Bike,
  Calculator,
  BookOpen,
  Laptop,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Loader2,
  Lock,
  UserCheck,
  Radio,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';

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

// Calculate countdown components
const calculateTimeLeft = (endsAt) => {
  if (!endsAt) return { hours: '00', minutes: '00', seconds: '00', isEnded: false };
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { hours: '00', minutes: '00', seconds: '00', isEnded: true };

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    hours: String(totalHours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    isEnded: false,
  };
};

export default function AuctionDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00', isEnded: false });
  const [successBanner, setSuccessBanner] = useState(location.state?.successMessage || null);

  // Interactive Bidding Form State
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [bidSuccess, setBidSuccess] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Refresh auction and bid data from authoritative HTTP APIs
  const refreshAuctionData = useCallback(async () => {
    try {
      const [resAuction, resBids] = await Promise.all([
        fetch(`${apiBaseUrl}/api/auctions/${id}`, { credentials: 'include' }),
        fetch(`${apiBaseUrl}/api/auctions/${id}/bids`, { credentials: 'include' }),
      ]);

      if (resAuction.ok) {
        const dataA = await resAuction.json();
        if (dataA.auction) setAuction(dataA.auction);
      }
      if (resBids.ok) {
        const dataB = await resBids.json();
        if (Array.isArray(dataB.bids)) setBids(dataB.bids);
      }
    } catch (e) {
      console.warn('[AuctionDetails] Failed to refresh auction data:', e.message);
    }
  }, [id, apiBaseUrl]);

  // Fetch auction details and bid history on mount or route change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    // 1. Fetch auction details
    const fetchDetails = fetch(`${apiBaseUrl}/api/auctions/${id}`, {
      credentials: 'include',
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}: Auction not found`);
      }
      return data.auction;
    });

    // 2. Fetch bid history
    const fetchBids = fetch(`${apiBaseUrl}/api/auctions/${id}/bids`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return [];
        const data = await res.json().catch(() => ({}));
        return Array.isArray(data.bids) ? data.bids : [];
      })
      .catch(() => []);

    Promise.all([fetchDetails, fetchBids])
      .then(([auctionData, bidsData]) => {
        if (isMounted) {
          setAuction(auctionData);
          setBids(bidsData);
          setTimeLeft(calculateTimeLeft(auctionData.endsAt));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message || 'Auction listing not found.');
          setAuction(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, apiBaseUrl]);

  // Real-time Socket.IO room lifecycle and live bid listener
  useEffect(() => {
    if (!id) return;

    const socket = getSocket();

    setIsLiveConnected(socket.connected);

    const onConnect = () => {
      setIsLiveConnected(true);
      // Join auction room on connect/reconnect
      socket.emit('auction:join', { auctionId: id });
      // Re-synchronize data on reconnect in case events were missed during network disruption
      refreshAuctionData();
    };

    const onDisconnect = () => {
      setIsLiveConnected(false);
    };

    if (socket.connected) {
      socket.emit('auction:join', { auctionId: id });
    }

    // Handle real-time accepted bid update from other student bidders
    const onBidUpdated = (payload) => {
      if (!payload || payload.auctionId !== id) return;

      // Update current price, leader, and count atomically
      if (payload.auction) {
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentPrice: payload.auction.currentPrice ?? payload.bid?.amount ?? prev.currentPrice,
            bidCount: payload.auction.bidCount ?? prev.bidCount + 1,
            currentLeaderId: payload.auction.currentLeaderId ?? prev.currentLeaderId,
            currentLeaderName: payload.auction.currentLeaderName ?? payload.bid?.bidderName ?? prev.currentLeaderName,
          };
        });
      }

      // Prepend bid record to history if not already present (prevents duplicates from HTTP response)
      if (payload.bid && payload.bid.id) {
        setBids((prev) => {
          const exists = prev.some((b) => b.id === payload.bid.id);
          if (exists) return prev;
          return [payload.bid, ...prev];
        });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('auction:bid-updated', onBidUpdated);

    return () => {
      // Leave room and detach listeners when unmounting or switching auctions
      socket.emit('auction:leave', { auctionId: id });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('auction:bid-updated', onBidUpdated);
    };
  }, [id, refreshAuctionData]);

  // Live countdown timer ticker
  useEffect(() => {
    if (!auction?.endsAt) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(auction.endsAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [auction?.endsAt]);

  // Synchronize bid input with minimum next acceptable bid
  useEffect(() => {
    if (auction) {
      const curPrice = auction.currentPrice || auction.startingPrice || 0;
      const startPrice = auction.startingPrice || 0;
      const minInc = auction.minBidIncrement || 50;
      const count = auction.bidCount || 0;
      const calculatedMinNext = count > 0 ? curPrice + minInc : startPrice;
      setBidAmount(String(calculatedMinNext));
    }
  }, [auction?.id, auction?.currentPrice, auction?.bidCount, auction?.startingPrice, auction?.minBidIncrement]);

  // Loading State
  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800">Loading Auction Details...</h2>
          <p className="text-xs text-slate-400">Retrieving verified student listing from campus marketplace</p>
        </div>
      </div>
    );
  }

  // Error / 404 Not Found State
  if (errorMessage || !auction) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Auction Listing Not Found</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {errorMessage || 'The requested listing does not exist, has expired, or was removed.'}
          </p>
        </div>
        <div className="pt-2">
          <Button as={Link} to="/auctions" variant="primary" size="md">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse Live Auctions
          </Button>
        </div>
      </div>
    );
  }

  // Formatted data items & bidding eligibility
  const gallery = Array.isArray(auction.images) && auction.images.length > 0 ? auction.images : [];
  const currentPrice = auction.currentPrice || auction.startingPrice || 0;
  const startingPrice = auction.startingPrice || 0;
  const minIncrement = auction.minBidIncrement || 50;
  const bidCount = auction.bidCount || 0;
  const minNextBid = bidCount > 0 ? currentPrice + minIncrement : startingPrice;
  const isSeller = Boolean(user?.id && (user.id === auction.sellerId || user.id === auction.seller_id));
  const isEnded = Boolean(auction.endsAt && (new Date(auction.endsAt).getTime() <= Date.now() || timeLeft.isEnded));
  const isClosed = Boolean(auction.status !== 'active' || auction.outcome !== null || isEnded);
  const isUserLeading = Boolean(user?.id && (auction.currentLeaderId === user.id || auction.current_leader_id === user.id));
  const FallbackIcon = getCategoryIcon(auction.category);

  const formattedClosingDate = auction.endsAt
    ? new Date(auction.endsAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    : 'Closing soon';

  // Handle bid form submission
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError(null);
    setBidSuccess(null);

    // 1. Enforce authentication
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // 2. Reject bids from listing seller
    if (isSeller) {
      setBidError('Sellers are not permitted to bid on their own listings.');
      return;
    }

    // 3. Reject bids on ended or inactive auctions
    if (isClosed) {
      setBidError('This auction has ended and is closed for bidding.');
      return;
    }

    // 4. Validate bid amount
    const parsedAmount = parseInt(bidAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setBidError('Please enter a valid positive whole-rupee bid amount.');
      return;
    }

    if (parsedAmount < minNextBid) {
      setBidError(`Bid amount must be at least ₹${minNextBid.toLocaleString('en-IN')}.`);
      return;
    }

    setIsPlacingBid(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auctions/${id}/bids`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parsedAmount }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setBidError(data.message || data.error || 'Failed to place bid. Please try again.');
        setIsPlacingBid(false);
        return;
      }

      // Successful bid placement
      setBidSuccess(`Your bid of ₹${parsedAmount.toLocaleString('en-IN')} was placed successfully! You are now the leading bidder.`);

      // Update local auction state immediately
      if (data.auction) {
        setAuction((prev) => ({
          ...prev,
          currentPrice: data.auction.currentPrice,
          bidCount: data.auction.bidCount,
          currentLeaderId: data.auction.currentLeaderId,
          currentLeaderName: data.auction.currentLeaderName,
        }));
      }

      // Re-fetch bids to update bid history with real server records
      try {
        const bidsRes = await fetch(`${apiBaseUrl}/api/auctions/${id}/bids`, {
          credentials: 'include',
        });
        if (bidsRes.ok) {
          const bidsData = await bidsRes.json();
          if (Array.isArray(bidsData.bids)) {
            setBids(bidsData.bids);
          }
        } else if (data.bid) {
          setBids((prev) => [data.bid, ...prev]);
        }
      } catch {
        if (data.bid) {
          setBids((prev) => [data.bid, ...prev]);
        }
      }
    } catch (networkError) {
      setBidError('Unable to connect to campus auction server. Please check your connection and try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

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
          title={auction.title}
          description={`Listing Reference: #${auction.id.slice(0, 8)} · Verified student listing at campus`}
          badge={auction.status === 'active' ? 'Active Auction' : auction.status}
          breadcrumbs={[
            { label: 'Campus Home', href: '/' },
            { label: 'Browse Auctions', href: '/auctions' },
            { label: formatCategoryName(auction.category), href: `/auctions?category=${auction.category}` },
            { label: auction.title },
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

      {/* Creation Success Banner (if redirected after creating) */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3 shadow-xs animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <h3 className="font-bold text-sm text-emerald-950">Listing Live on Marketplace</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">{successBanner}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Campus Notice */}
      <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Campus Marketplace Listing:</span> In-person campus exchange with zero shipping fees. Inspect the item in person before payment.
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Images, Details, Seller */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo Gallery Viewport */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="relative aspect-4/3 w-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
              {!imageError && gallery[selectedImageIndex] ? (
                <img
                  src={gallery[selectedImageIndex]}
                  alt={auction.title}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover transition-opacity duration-200"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <FallbackIcon className="w-16 h-16 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">{auction.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatCategoryName(auction.category)} Photo Placeholder</p>
                </div>
              )}

              {/* Badges on Top of Photo */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white shadow-xs">
                  {formatConditionName(auction.condition)}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 text-slate-800 backdrop-blur-xs border border-slate-200/60 shadow-xs">
                  {formatCategoryName(auction.category)}
                </span>
              </div>
            </div>

            {/* Thumbnail Selectors */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setImageError(false);
                    }}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImageIndex === idx
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
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {auction.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">Campus Pickup</span>
                  <span className="text-slate-500">In-person handoff at campus quad / hostel</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">Campus Trust</span>
                  <span className="text-slate-500">Inspect the item in person before payment</span>
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
                  {auction.sellerName ? auction.sellerName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {auction.sellerName || 'Verified Student Seller'}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Student
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Campus Community Member
                  </p>
                </div>
              </div>

              <Button as={Link} to="/auctions" variant="outline" size="sm">
                Browse More Listings
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Status, Pricing, Bid Form, Bid History */}
        <div className="lg:col-span-5 space-y-6">
          {/* 2. Auction Status, Pricing & Visual Countdown Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-5">
            {/* Countdown Timer Display */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700 uppercase tracking-wider px-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>{timeLeft.isEnded ? 'Auction Ended' : 'Time Remaining'}</span>
                </div>
                {isLiveConnected && !timeLeft.isEnded && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 normal-case bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Bidding
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-2xl font-black text-indigo-950">{timeLeft.hours}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Hours</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-2xl font-black text-indigo-950">{timeLeft.minutes}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Minutes</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-2xl font-black text-indigo-950">{timeLeft.seconds}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Seconds</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Closes: {formattedClosingDate}</span>
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
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({bidCount} {bidCount === 1 ? 'bid placed' : 'bids placed'})
                  </span>
                </div>
                {auction.currentLeaderName && (
                  <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Leading bidder: <span className="font-bold">{auction.currentLeaderName}</span>
                    {isUserLeading && (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        (You)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Price Details Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Starting Price</span>
                  <span className="font-bold text-slate-800">
                    ₹{startingPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Min. Increment</span>
                  <span className="font-bold text-slate-800">
                    ₹{minIncrement.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5" />
                Highest bid at closing time wins the item.
              </div>
            </div>

            {/* 3. Bid Form UI */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              {!isAuthenticated ? (
                /* Unauthenticated Visitor State */
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-slate-800">Sign in to place a bid</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        You must be signed in with a campus student account to participate in this auction.
                      </p>
                    </div>
                  </div>
                  <Button
                    as={Link}
                    to="/login"
                    state={{ from: location }}
                    variant="primary"
                    className="w-full justify-center text-xs font-bold"
                  >
                    Sign In to Place Bid
                  </Button>
                  <p className="text-[11px] text-center text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
                      Register with student email
                    </Link>
                  </p>
                </div>
              ) : isSeller ? (
                /* Seller State */
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-amber-900">Seller Listing Notice</h3>
                      <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                        You are the seller of this auction listing. To maintain auction fairness and marketplace integrity, sellers cannot place bids on their own listings.
                      </p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg">
                      <UserCheck className="w-3.5 h-3.5" />
                      Seller Account (Read Only)
                    </span>
                  </div>
                </div>
              ) : isClosed ? (
                /* Closed Auction State */
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-200 text-slate-600 mx-auto">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Bidding Is Closed</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    This auction has ended and is no longer accepting new bids.
                  </p>
                </div>
              ) : (
                /* Active Bid Placement Form for Eligible Student */
                <form onSubmit={handleBidSubmit} className="space-y-3">
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
                        step="1"
                        min={minNextBid}
                        value={bidAmount}
                        onChange={(e) => {
                          setBidAmount(e.target.value);
                          if (bidError) setBidError(null);
                        }}
                        disabled={isPlacingBid}
                        placeholder={String(minNextBid)}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isPlacingBid || !bidAmount}
                      className="px-5 shrink-0"
                    >
                      {isPlacingBid ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                          Placing...
                        </>
                      ) : (
                        'Place Bid'
                      )}
                    </Button>
                  </div>

                  {/* Minimum Acceptable Bid Hint */}
                  <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    Minimum acceptable bid is ₹{minNextBid.toLocaleString('en-IN')}
                  </p>

                  {/* Quick Increment Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">Quick add:</span>
                    {[50, 100, 250].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => {
                          const currentVal = parseInt(bidAmount, 10) || minNextBid;
                          setBidAmount(String(currentVal + inc));
                          if (bidError) setBidError(null);
                        }}
                        disabled={isPlacingBid}
                        className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                      >
                        +₹{inc}
                      </button>
                    ))}
                  </div>

                  {/* Error Alert Banner */}
                  {bidError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <p className="font-semibold leading-relaxed">{bidError}</p>
                    </div>
                  )}

                  {/* Success Alert Banner */}
                  {bidSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2 text-xs animate-in fade-in duration-150">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="font-semibold leading-relaxed">{bidSuccess}</p>
                    </div>
                  )}
                </form>
              )}
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
                {bids.length} {bids.length === 1 ? 'bid' : 'bids'} recorded
              </span>
            </div>

            {bids.length === 0 ? (
              <div className="py-6 text-center space-y-1 text-slate-400">
                <p className="text-xs font-semibold text-slate-600">No bids placed yet</p>
                <p className="text-[11px]">Opening bid starts at ₹{startingPrice.toLocaleString('en-IN')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {bids.map((bid, i) => {
                  const bidderDisplayName = bid.bidderName || bid.bidder_name || 'Student Bidder';
                  const isUserBid = user?.id && (bid.bidderId === user.id || bid.bidder_id === user.id);
                  const bidTime = bid.createdAt || bid.created_at;

                  return (
                    <div key={bid.id || i} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{bidderDisplayName}</span>
                          {isUserBid && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              You
                            </span>
                          )}
                          {i === 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Leading
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {bidTime
                            ? new Date(bidTime).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                            : 'Recently'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900">
                          ₹{Number(bid.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 text-center border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                All bids are public and verified to ensure campus auction transparency.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
