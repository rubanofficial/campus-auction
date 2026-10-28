import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Timer,
  ShieldCheck,
  Bot,
  Zap,
  Bike,
  Laptop,
  BookOpen,
  Calculator,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export default function Home() {
  const upcomingFeatures = [
    {
      title: 'Real-Time Live Bidding',
      description: 'Dynamic countdown timers and instant bid increments powered by real-time campus socket sync.',
      icon: Timer,
      badge: 'In Development',
    },
    {
      title: 'Verified Student Profiles',
      description: 'Safe, community-only transactions verified via official university .edu email domains.',
      icon: ShieldCheck,
      badge: 'Campus Security',
    },
    {
      title: 'AI Listing Assistant',
      description: 'Smart valuation suggestions, auto-generated descriptions, and condition analysis for textbooks and tech.',
      icon: Bot,
      badge: 'Coming Soon',
    },
    {
      title: 'Automated Proxy Bidding',
      description: 'Set your maximum budget and let our smart system place incremental bids while you attend class.',
      icon: Zap,
      badge: 'Planned',
    },
  ];

  const popularCategories = [
    { name: 'Bicycles & Scooters', count: '14 active', icon: Bike, color: 'text-emerald-600 bg-emerald-50' },
    { name: 'Laptops & Tech', count: '28 active', icon: Laptop, color: 'text-blue-600 bg-blue-50' },
    { name: 'Course Textbooks', count: '45 active', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
    { name: 'Calculators & Gear', count: '19 active', icon: Calculator, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <PageHeader
        title="Welcome to Campus Auction"
        description="The trusted student-to-student marketplace. Buy, sell, and bid on used campus essentials with ease."
        badge="Fall 2026 Edition"
        action={
          <div className="flex items-center gap-2">
            <Button as={Link} to="/auctions" variant="outline" icon={Compass}>
              Browse Auctions
            </Button>
            <Button as={Link} to="/auctions/create" variant="primary" icon={PlusCircle}>
              List an Item
            </Button>
          </div>
        }
      />

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Zero Commission Campus Trading
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Turn unused dorm gear into cash, or snag your next campus ride.
          </h2>
          <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed">
            From graphing calculators to road bicycles, discover peer-to-peer campus auctions with instant pickup right at the Student Union or Library.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              as={Link}
              to="/auctions"
              variant="accent"
              size="lg"
              icon={Compass}
            >
              Explore Auctions Now
            </Button>
            <Button
              as={Link}
              to="/auctions/create"
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Sell Your Gear
            </Button>
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Featured Campus Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Popular Categories</h2>
            <p className="text-xs text-slate-500">Find gear students frequently buy and sell</p>
          </div>
          <Link
            to="/auctions"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View all categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {popularCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to="/auctions"
                className="group p-4 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{cat.count}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Upcoming Auction System Features */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Upcoming Auction Platform Features</h2>
          </div>
          <p className="text-xs text-slate-500">
            Roadmap features currently being engineered for full campus launch
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {feat.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
