import React, { useState } from 'react';
import {
  UploadCloud,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export default function CreateAuction() {
  const [condition, setCondition] = useState('Like New');
  const [category, setCategory] = useState('Bicycles & Scooters');

  const conditions = [
    { label: 'Brand New', desc: 'Unopened, original packaging' },
    { label: 'Like New', desc: 'Flawless with zero visible wear' },
    { label: 'Gently Used', desc: 'Minor cosmetic wear, 100% functional' },
    { label: 'Fair / Well-Loved', desc: 'Noticeable wear, still functional' },
  ];

  const categories = [
    'Bicycles & Scooters',
    'Electronics & Gadgets',
    'Course Textbooks & Notes',
    'Calculators & Lab Equipment',
    'Dorm Essentials & Furniture',
    'Apparel & Spirit Wear',
    'Sports & Outdoor Gear',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Create Auction Listing"
        description="List an item for campus students to bid on. Set your starting price, auction duration, and meeting spot."
        badge="Listing Form"
        breadcrumbs={[
          { label: 'Campus Auctions', href: '/auctions' },
          { label: 'Create Listing' },
        ]}
      />

      {/* Scope Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-800">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Frontend Visual Form Layout:</span>{' '}
          This page represents the complete UI specification for creating a listing. It is not connected to a backend database or image storage API.
        </div>
      </div>

      {/* Visual Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Item Basic Info */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            1. Item Details
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Item Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Texas Instruments TI-84 Plus CE Graphing Calculator"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
                defaultValue="TI-84 Plus CE Graphing Calculator"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Include brand, model name, and defining characteristics.
              </p>
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:border-indigo-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Campus Pickup Spot */}
              <div>
                <label htmlFor="location" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Campus Meeting Location
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="e.g. Student Union, Library Lobby, North Dorms"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
                  defaultValue="Student Union Ground Floor"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe accessories included, history of use, cosmetic condition, reason for selling..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
                defaultValue="Gently used for two calculus courses. Comes with protective sliding cover, USB charging cable, and fresh battery."
              />
            </div>

            {/* Condition Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Item Condition <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {conditions.map((item) => (
                  <label
                    key={item.label}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      condition === item.label
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      checked={condition === item.label}
                      onChange={() => setCondition(item.label)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing and Duration */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            2. Auction Pricing & Timing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Starting Price */}
            <div>
              <label htmlFor="startingPrice" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Starting Price ($ USD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                <input
                  id="startingPrice"
                  type="number"
                  placeholder="30"
                  defaultValue="35"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">First bid must equal or exceed this amount.</p>
            </div>

            {/* Minimum Increment */}
            <div>
              <label htmlFor="increment" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Minimum Bid Increment ($ USD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                <input
                  id="increment"
                  type="number"
                  placeholder="2"
                  defaultValue="5"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Minimum addition required for each subsequent bid.</p>
            </div>

            {/* Closing Date & Time */}
            <div className="sm:col-span-2">
              <label htmlFor="closingTime" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Auction Closing Date & Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative max-w-sm">
                <input
                  id="closingTime"
                  type="datetime-local"
                  defaultValue="2026-11-04T18:00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Recommended campus duration: 3 to 7 days.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Photo Upload Zone */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            3. Photos
          </h2>

          {/* Visual Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Drop photos here, or <span className="text-indigo-600 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PNG, JPG, or WEBP up to 5MB each (Max 6 photos)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" size="md">
            Save as Draft
          </Button>
          <Button variant="primary" size="md" type="submit">
            Publish Auction Listing
          </Button>
        </div>
      </form>
    </div>
  );
}
