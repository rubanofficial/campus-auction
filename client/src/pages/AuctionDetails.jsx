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
  Zap,
  X,
  Info,
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

  // Auto Bid State
  const [autoBidConfig, setAutoBidConfig] = useState(null);
  const [isLoadingAutoBid, setIsLoadingAutoBid] = useState(false);
  const [isAutoBidModalOpen, setIsAutoBidModalOpen] = useState(false);
  const [autoBidMaxAmount, setAutoBidMaxAmount] = useState('');
  const [isSubmittingAutoBid, setIsSubmittingAutoBid] = useState(false);
  const [isCancellingAutoBid, setIsCancellingAutoBid] = useState(false);
  const [autoBidError, setAutoBidError] = useState(null);
  const [autoBidSuccess, setAutoBidSuccess] = useState(null);

  // Refresh user's own Auto Bid status
  const fetchAutoBidStatus = useCallback(async () => {
    if (!isAuthenticated || !id) {
      setAutoBidConfig(null);
      return;
    }
    try {
      setIsLoadingAutoBid(true);
      const res = await fetch(`${apiBaseUrl}/api/auctions/${id}/auto-bid`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.configured && data.autoBid) {
          setAutoBidConfig(data.autoBid);
        } else {
          setAutoBidConfig(null);
        }
      }
    } catch (e) {
      console.warn('[AuctionDetails] Failed to fetch auto-bid status:', e.message);
    } finally {
      setIsLoadingAutoBid(false);
    }
  }, [id, isAuthenticated, apiBaseUrl]);

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

      // Re-synchronize auto-bid status if user is signed in
      if (isAuthenticated) {
        fetchAutoBidStatus();
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
  }, [id, refreshAuctionData, isAuthenticated, fetchAutoBidStatus]);

  // Synchronize user's Auto Bid status when authentication or auction ID changes
  useEffect(() => {
    fetchAutoBidStatus();
  }, [fetchAutoBidStatus]);

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
      const curPrice = Number(auction.currentPrice ?? auction.current_price ?? auction.startingPrice ?? auction.starting_price ?? 0);
      const startPrice = Number(auction.startingPrice ?? auction.starting_price ?? 0);
      const minInc = Number(auction.minBidIncrement ?? auction.min_bid_increment ?? 50);
      const count = Number(auction.bidCount ?? auction.bid_count ?? 0);
      const calculatedMinNext = count > 0 ? curPrice + minInc : startPrice;
      setBidAmount(String(calculatedMinNext));
    }
  }, [
    auction?.id,
    auction?.currentPrice,
    auction?.current_price,
    auction?.bidCount,
    auction?.bid_count,
    auction?.startingPrice,
    auction?.starting_price,
    auction?.minBidIncrement,
    auction?.min_bid_increment,
  ]);

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
  const currentPrice = Number(auction.currentPrice ?? auction.current_price ?? auction.startingPrice ?? auction.starting_price ?? 0);
  const startingPrice = Number(auction.startingPrice ?? auction.starting_price ?? 0);
  const minIncrement = Number(auction.minBidIncrement ?? auction.min_bid_increment ?? 50);
  const bidCount = Number(auction.bidCount ?? auction.bid_count ?? 0);
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

      // Check if user is actually leading
      const isLeader = Boolean(
        data.isLeader ??
        (data.auction?.currentLeaderId === user?.id || data.auction?.current_leader_id === user?.id)
      );

      if (isLeader) {
        setBidSuccess(
          data.message ||
          `Your bid of ₹${parsedAmount.toLocaleString('en-IN')} was placed successfully! You are now the leading bidder.`
        );
      } else {
        const leaderName = data.auction?.currentLeaderName || data.auction?.current_leader_name || 'Another bidder';
        const currentVal = data.auction?.currentPrice ?? data.auction?.current_price ?? (parsedAmount + minIncrement);
        setBidSuccess(
          data.message ||
          `Your bid of ₹${parsedAmount.toLocaleString('en-IN')} was accepted, but ${leaderName} automatically placed a counter-bid of ₹${currentVal?.toLocaleString('en-IN')} to take the lead.`
        );
      }

      // Update local auction state immediately from response
      if (data.auction) {
        setAuction((prev) => ({
          ...prev,
          currentPrice: data.auction.currentPrice ?? data.auction.current_price ?? prev?.currentPrice,
          current_price: data.auction.currentPrice ?? data.auction.current_price ?? prev?.current_price,
          bidCount: data.auction.bidCount ?? data.auction.bid_count ?? prev?.bidCount,
          bid_count: data.auction.bidCount ?? data.auction.bid_count ?? prev?.bid_count,
          currentLeaderId: data.auction.currentLeaderId ?? data.auction.current_leader_id ?? prev?.currentLeaderId,
          current_leader_id: data.auction.currentLeaderId ?? data.auction.current_leader_id ?? prev?.current_leader_id,
          currentLeaderName: data.auction.currentLeaderName ?? data.auction.current_leader_name ?? prev?.currentLeaderName,
          current_leader_name: data.auction.currentLeaderName ?? data.auction.current_leader_name ?? prev?.current_leader_name,
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
          if (bidsData.auction) {
            setAuction((prev) => ({
              ...prev,
              currentPrice: bidsData.auction.currentPrice ?? bidsData.auction.current_price ?? prev?.currentPrice,
              current_price: bidsData.auction.currentPrice ?? bidsData.auction.current_price ?? prev?.current_price,
              bidCount: bidsData.auction.bidCount ?? bidsData.auction.bid_count ?? prev?.bidCount,
              bid_count: bidsData.auction.bidCount ?? bidsData.auction.bid_count ?? prev?.bid_count,
              currentLeaderId: bidsData.auction.currentLeaderId ?? bidsData.auction.current_leader_id ?? prev?.currentLeaderId,
              current_leader_id: bidsData.auction.currentLeaderId ?? bidsData.auction.current_leader_id ?? prev?.current_leader_id,
              currentLeaderName: bidsData.auction.currentLeaderName ?? bidsData.auction.current_leader_name ?? prev?.currentLeaderName,
              current_leader_name: bidsData.auction.currentLeaderName ?? bidsData.auction.current_leader_name ?? prev?.current_leader_name,
            }));
          }
        } else if (data.bid) {
          setBids((prev) => [data.bid, ...prev]);
        }
      } catch {
        if (data.bid) {
          setBids((prev) => [data.bid, ...prev]);
        }
      }

      // Synchronize auto-bid status
      fetchAutoBidStatus();
    } catch (networkError) {
      setBidError('Unable to connect to campus auction server. Please check your connection and try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  // Handle Auto Bid activation/update submission
  const handleAutoBidSubmit = async (e) => {
    e.preventDefault();
    setAutoBidError(null);
    setAutoBidSuccess(null);

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (isSeller) {
      setAutoBidError('Sellers are not permitted to configure Auto Bid on their own listings.');
      return;
    }

    if (isClosed) {
      setAutoBidError('This auction has ended and is closed for bidding.');
      return;
    }

    const parsedMax = parseInt(autoBidMaxAmount, 10);
    if (isNaN(parsedMax) || parsedMax <= 0) {
      setAutoBidError('Please enter a valid positive whole-rupee maximum limit.');
      return;
    }

    const requiredMin = isUserLeading ? currentPrice : minNextBid;
    if (parsedMax < requiredMin) {
      setAutoBidError(
        isUserLeading
          ? `Your maximum limit cannot be lower than your current leading bid of ₹${currentPrice.toLocaleString('en-IN')}.`
          : `Maximum bid must be at least ₹${minNextBid.toLocaleString('en-IN')} to participate.`
      );
      return;
    }

    setIsSubmittingAutoBid(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auctions/${id}/auto-bid`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxAmount: parsedMax }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setAutoBidError(data.message || data.error || 'Failed to activate Auto Bid. Please try again.');
        setIsSubmittingAutoBid(false);
        return;
      }

      setAutoBidConfig(data.autoBid);
      setBidSuccess(`Auto Bid activated successfully with a maximum limit of ₹${parsedMax.toLocaleString('en-IN')}!`);
      setIsAutoBidModalOpen(false);

      // Refresh auction and bid history
      await refreshAuctionData();
    } catch {
      setAutoBidError('Unable to connect to campus auction server. Please check your connection and try again.');
    } finally {
      setIsSubmittingAutoBid(false);
    }
  };

  // Handle Auto Bid deactivation
  const handleCancelAutoBid = async () => {
    setAutoBidError(null);
    setAutoBidSuccess(null);
    setIsCancellingAutoBid(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auctions/${id}/auto-bid`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setAutoBidConfig(null);
        setBidSuccess('Auto Bid has been deactivated for this auction.');
      } else {
        setBidError(data.message || 'Failed to deactivate Auto Bid.');
      }
    } catch {
      setBidError('Failed to deactivate Auto Bid due to network error.');
    } finally {
      setIsCancellingAutoBid(false);
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
                      className="px-4 shrink-0 font-bold"
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login', { state: { from: location } });
                          return;
                        }
                        setAutoBidError(null);
                        setAutoBidSuccess(null);
                        const suggested = autoBidConfig?.maxAmount || (minNextBid + minIncrement * 2);
                        setAutoBidMaxAmount(String(suggested));
                        setIsAutoBidModalOpen(true);
                      }}
                      disabled={isPlacingBid || isSeller || isClosed}
                      className="px-3.5 shrink-0 border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 font-bold"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1 text-amber-600 fill-amber-500" />
                      Auto Bid
                    </Button>
                  </div>

                  {/* Active Auto Bid Status Display */}
                  {autoBidConfig && autoBidConfig.isActive && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                            Auto Bid Active
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Up to ₹{autoBidConfig.maxAmount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        The system will automatically defend your position up to ₹{autoBidConfig.maxAmount?.toLocaleString('en-IN')}.
                        {isUserLeading ? ' You currently hold the highest bid.' : ' Waiting for the next competing bid.'}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setAutoBidError(null);
                            setAutoBidSuccess(null);
                            setAutoBidMaxAmount(String(autoBidConfig.maxAmount || minNextBid));
                            setIsAutoBidModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-2"
                        >
                          Change Max Limit
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelAutoBid}
                          disabled={isCancellingAutoBid}
                          className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-100/60 px-2 py-0.5 rounded transition-colors"
                        >
                          {isCancellingAutoBid ? 'Deactivating...' : 'Deactivate Auto Bid'}
                        </button>
                      </div>
                    </div>
                  )}

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

                  {/* Success / Outbid Notification Alert Banner */}
                  {bidSuccess && (
                    <div
                      className={`p-3 rounded-xl border flex items-start gap-2 text-xs animate-in fade-in duration-150 ${
                        isUserLeading
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}
                    >
                      {isUserLeading ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      )}
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

      {/* Auto Bid Configuration Modal */}
      {isAutoBidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auto-bid-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h3 id="auto-bid-modal-title" className="text-sm font-bold text-slate-900">
                    Configure Auto Bid
                  </h3>
                  <p className="text-[11px] text-slate-500">Automated proxy bidding assistant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingAutoBid) setIsAutoBidModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-950 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>How Auto Bid works</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Set your maximum budget. When another student places a bid, the system will automatically place the minimum necessary response to keep you in the lead, but will <strong>never exceed</strong> your maximum limit.
              </p>
            </div>

            {/* Pricing Context */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Current Price:</span>
                <p className="font-bold text-slate-800 text-sm">₹{currentPrice.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Minimum Required:</span>
                <p className="font-bold text-indigo-600 text-sm">
                  ₹{(isUserLeading ? currentPrice : minNextBid).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAutoBidSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="autoBidMaxInput" className="block text-xs font-bold text-slate-700">
                  Your Maximum Bid Limit (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    id="autoBidMaxInput"
                    type="number"
                    step="1"
                    min={isUserLeading ? currentPrice : minNextBid}
                    value={autoBidMaxAmount}
                    onChange={(e) => {
                      setAutoBidMaxAmount(e.target.value);
                      if (autoBidError) setAutoBidError(null);
                    }}
                    disabled={isSubmittingAutoBid}
                    placeholder={String(minNextBid + minIncrement * 2)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Bids are incremented in whole multiples of ₹{minIncrement} only when challenged.
                </p>
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] text-slate-400 font-medium">Add to min:</span>
                {[100, 250, 500].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => {
                      const base = isUserLeading ? currentPrice : minNextBid;
                      setAutoBidMaxAmount(String(base + inc));
                      if (autoBidError) setAutoBidError(null);
                    }}
                    disabled={isSubmittingAutoBid}
                    className="text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    +₹{inc}
                  </button>
                ))}
              </div>

              {/* Error Alert inside Modal */}
              {autoBidError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{autoBidError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAutoBidModalOpen(false)}
                  disabled={isSubmittingAutoBid}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingAutoBid || !autoBidMaxAmount}
                  className="px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-none font-bold text-white shadow-sm"
                >
                  {isSubmittingAutoBid ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Configuring...
                    </>
                  ) : (
                    'Confirm Auto Bid'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
