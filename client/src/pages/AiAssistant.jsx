import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  AlertCircle,
  Loader2,
  Bike,
  Calculator,
  BookOpen,
  Laptop,
  CheckCircle2,
  Filter,
  DollarSign,
  Compass,
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

// Preset example prompts
const EXAMPLE_PROMPTS = [
  'Give me a calculator under 1500',
  'Which bicycles are closing soon?',
  'Find electronics under ₹2500',
  'Show textbooks below ₹500',
  'Find the cheapest available items',
];

export default function AiAssistant() {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const [prompt, setPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSearch = async (queryText) => {
    const textToSearch = (queryText || prompt).trim();
    if (!textToSearch || isSearching) return;

    setPrompt(textToSearch);
    setIsSearching(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/ai/search`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSearch }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to process AI natural language search.');
      }

      setSearchResponse(data);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to connect to AI assistant server. Please try again.');
      setSearchResponse(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch(prompt);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header */}
      <PageHeader
        title="AI Product Assistant"
        description="Search campus auctions using conversational natural language. Describe your budget, category, or condition to get instant matches."
        badge="Gemini Powered"
        action={
          <Button as={Link} to="/auctions" variant="outline" size="sm" icon={Compass}>
            Browse All Listings
          </Button>
        }
      />

      {/* 2. Natural Language Input Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-800/40 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Natural-Language Product Search</h2>
            <p className="text-xs text-indigo-200/80">
              Type what you need in plain English — our AI extracts price caps, categories, and urgency.
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Give me a calculator under 1200' or 'Which bicycles are closing soon?'"
              disabled={isSearching}
              className="w-full pl-4 pr-32 py-4 rounded-2xl bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg disabled:opacity-80"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSearching || !prompt.trim()}
                className="py-2.5 px-4 font-bold shadow-md"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Example Prompt Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-indigo-300/80 block">
              Try asking:
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleSearch(example)}
                  disabled={isSearching}
                  className="text-xs px-3 py-1.5 rounded-xl bg-indigo-800/40 hover:bg-indigo-700/60 text-indigo-100 border border-indigo-700/50 transition-colors text-left disabled:opacity-50"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* 3. Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-900">Search Error</h3>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 4. AI Results Section */}
      {searchResponse && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary & Extracted Criteria Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-bold text-slate-900">AI Assistant Response</h3>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {searchResponse.summary}
                </p>
              </div>
            </div>

            {/* Extracted Criteria Badges */}
            {searchResponse.criteria && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Extracted Filters:
                </span>
                {searchResponse.criteria.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    <Tag className="w-3 h-3" />
                    Category: {formatCategoryName(searchResponse.criteria.category)}
                  </span>
                )}
                {searchResponse.criteria.maxPrice && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                    <DollarSign className="w-3 h-3" />
                    Max Budget: ₹{searchResponse.criteria.maxPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {searchResponse.criteria.condition && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                    Condition: {formatConditionName(searchResponse.criteria.condition)}
                  </span>
                )}
                {searchResponse.criteria.closingSoon && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold border border-amber-100">
                    <Clock className="w-3 h-3" />
                    Closing Soonest
                  </span>
                )}
                {searchResponse.criteria.keyword && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    Keyword: "{searchResponse.criteria.keyword}"
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Results Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Matching Campus Listings ({searchResponse.results?.length || 0})
              </h3>
              <span className="text-xs text-slate-500">
                Verified live database results
              </span>
            </div>

            {searchResponse.results && searchResponse.results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {searchResponse.results.map((item) => {
                  const FallbackIcon = getCategoryIcon(item.category);
                  const closingTimeText = formatTimeRemaining(item.endsAt);
                  const currentPrice = item.currentPrice || item.startingPrice || 0;

                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-4">
                            <FallbackIcon className="w-12 h-12 text-slate-300 mb-2" />
                            <span className="text-xs font-medium text-slate-400">
                              {formatCategoryName(item.category)}
                            </span>
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/95 text-slate-700 backdrop-blur-xs shadow-xs border border-slate-200/60">
                            {formatCategoryName(item.category)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600 text-white shadow-xs">
                            {formatConditionName(item.condition)}
                          </span>
                        </div>

                        {/* Closing Time */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-xs shadow-xs">
                          <Clock className="w-3.5 h-3.5 text-amber-300" />
                          <span>{closingTimeText}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            <Link to={`/auctions/${item.id}`} className="focus:outline-none focus-visible:underline">
                              {item.title}
                            </Link>
                          </h4>
                          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>Seller: {item.sellerName || 'Verified Student'}</span>
                          </p>
                        </div>

                        {/* Price & CTA */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                              {item.bidCount > 0 ? 'Current Bid' : 'Starting Price'}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-extrabold text-slate-900">
                                ₹{(item.bidCount > 0 ? (item.currentPrice || item.startingPrice) : item.startingPrice).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                ({item.bidCount || 0} {item.bidCount === 1 ? 'bid' : 'bids'})
                              </span>
                            </div>
                            {item.bidCount > 0 && item.startingPrice && (
                              <span className="text-[10px] text-slate-400 block">
                                Starts at ₹{item.startingPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          <Button
                            as={Link}
                            to={`/auctions/${item.id}`}
                            variant="secondary"
                            size="sm"
                            className="group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                          >
                            Bid Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                  <Search className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h4 className="text-lg font-bold text-slate-900">No Listings Matched Your Query</h4>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Try adjusting your budget cap or using broader keywords like "cycles", "calculator", or "textbooks".
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <Button as={Link} to="/auctions" variant="primary" size="sm">
                    Browse All Auctions
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

