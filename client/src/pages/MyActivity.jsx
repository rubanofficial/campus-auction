import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Gavel,
  Trophy,
  Tag,
  Heart,
  Compass,
  PlusCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export default function MyActivity() {
  const [activeTab, setActiveTab] = useState('bids');

  const tabs = [
    { id: 'bids', label: 'Active Bids', count: 0, icon: Gavel },
    { id: 'won', label: 'Auctions Won', count: 0, icon: Trophy },
    { id: 'listings', label: 'My Listings', count: 0, icon: Tag },
    { id: 'watchlist', label: 'Watchlist', count: 0, icon: Heart },
  ];

  const emptyStates = {
    bids: {
      title: 'No active bids placed yet',
      description: 'You are not currently competing in any auctions. Explore campus listings to place your first bid on laptops, bikes, or textbooks.',
      actionText: 'Browse Active Auctions',
      actionHref: '/auctions',
      icon: Gavel,
    },
    won: {
      title: 'No auctions won yet',
      description: 'When you place the winning bid and the auction clock expires, your won items and pickup instructions will appear right here.',
      actionText: 'Explore Auctions',
      actionHref: '/auctions',
      icon: Trophy,
    },
    listings: {
      title: 'You haven\'t listed any items for sale',
      description: 'Got dorm gear or old semester textbooks you no longer need? Turn them into campus cash by creating an auction in under 2 minutes.',
      actionText: 'Create Your First Listing',
      actionHref: '/auctions/create',
      icon: Tag,
    },
    watchlist: {
      title: 'Your watchlist is empty',
      description: 'Bookmark items you want to keep an eye on to get real-time price drops and final-countdown reminders.',
      actionText: 'Browse Auctions to Save',
      actionHref: '/auctions',
      icon: Heart,
    },
  };

  const currentEmpty = emptyStates[activeTab];
  const CurrentIcon = currentEmpty.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Campus Activity"
        description="Track your live bids, won auctions, active selling listings, and saved watchlist items in one central place."
        badge="Activity Dashboard"
        action={
          <Button as={Link} to="/auctions" variant="primary" icon={Compass}>
            Find Auctions
          </Button>
        }
      />

      {/* Quick Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{tab.label}</span>
                <TabIcon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{tab.count}</div>
            </button>
          );
        })}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Clear Empty State */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <CurrentIcon className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900">
            {currentEmpty.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {currentEmpty.description}
          </p>
        </div>
        <div className="pt-2">
          <Button
            as={Link}
            to={currentEmpty.actionHref}
            variant="primary"
            size="md"
            icon={ArrowRight}
            iconPosition="right"
          >
            {currentEmpty.actionText}
          </Button>
        </div>
      </div>
    </div>
  );
}
