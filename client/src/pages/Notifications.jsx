import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock,
  Sparkles,
  Sliders,
  ShieldCheck,
  Check
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export default function Notifications() {
  const [filter, setFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Notifications (0)' },
    { id: 'bids', label: 'Bids & Outbid' },
    { id: 'won', label: 'Auctions Won' },
    { id: 'listings', label: 'Listing Updates' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Notifications"
        description="Stay notified about live outbid alerts, auction countdown conclusions, and campus pickup coordination."
        badge="Alert Center"
        action={
          <Button variant="outline" size="sm" icon={CheckCheck}>
            Mark All as Read
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <BellRing className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900">
            You're all caught up!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            No active alerts or outbid notices at this moment. When other campus students place higher bids or an auction you're watching is ending, you'll be alerted here.
          </p>
        </div>
      </div>

      {/* Notification Preferences Visual Preview */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Campus Notification Preferences</h3>
        </div>
        <p className="text-xs text-slate-500">
          Customize which updates you receive to your university email and browser.
        </p>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Instant Outbid Alerts</p>
              <p className="text-slate-500 text-[11px]">Notify immediately when someone outbids your current price</p>
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]">
              <Check className="w-3 h-3" /> Enabled
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">1-Hour Final Countdown</p>
              <p className="text-slate-500 text-[11px]">Reminder 60 minutes before watched auctions close</p>
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]">
              <Check className="w-3 h-3" /> Enabled
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">New Category Matches</p>
              <p className="text-slate-500 text-[11px]">Alert when a new bicycle or calculator is listed under your saved searches</p>
            </div>
            <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
              Disabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
