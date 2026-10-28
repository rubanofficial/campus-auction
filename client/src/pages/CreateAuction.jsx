import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Calendar,
  Clock,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export default function CreateAuction() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form field states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Cycle');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('Like New');
  const [startingPrice, setStartingPrice] = useState('');
  const [minIncrement, setMinIncrement] = useState('50');
  const [closingDate, setClosingDate] = useState('');
  const [closingTime, setClosingTime] = useState('');
  
  // Selected photos state: array of { file, url, name, size }
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  
  // Informational banner state
  const [showInfoNotice, setShowInfoNotice] = useState(false);

  // Set default closing date and time (3 days from now at 18:00)
  useEffect(() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const yyyy = futureDate.getFullYear();
    const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
    const dd = String(futureDate.getDate()).padStart(2, '0');
    setClosingDate(`${yyyy}-${mm}-${dd}`);
    setClosingTime('18:00');
  }, []);

  // Cleanup all object URLs when component unmounts
  useEffect(() => {
    return () => {
      selectedPhotos.forEach((photo) => {
        if (photo.url) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, [selectedPhotos]);

  // Handle image files selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
    }));

    setSelectedPhotos((prev) => [...prev, ...newPhotos]);

    // Reset the input value so user can re-select the same file if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a photo from local preview and revoke its object URL
  const handleRemovePhoto = (indexToRemove) => {
    setSelectedPhotos((prev) => {
      const photoToRemove = prev[indexToRemove];
      if (photoToRemove?.url) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // Handle form submission (UI only - prevent real submission)
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowInfoNotice(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 1. Page Header with Back Link */}
      <div className="space-y-3">
        <Link
          to="/auctions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Browse Auctions</span>
        </Link>

        <PageHeader
          title="Create an Auction"
          description="List your pre-owned campus bicycle, calculator, textbooks, or electronics for fellow students to bid on."
          badge="Listing Form"
          breadcrumbs={[
            { label: 'Campus Home', href: '/' },
            { label: 'Browse Auctions', href: '/auctions' },
            { label: 'Create an Auction' },
          ]}
        />
      </div>

      {/* Informational Message Banner upon submit */}
      {showInfoNotice && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-indigo-900">
              Demonstration Mode — Form Submission Received
            </h3>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Your auction listing details and photo previews were validated locally. Database persistence, image storage APIs, and live auction scheduling will be enabled in upcoming backend updates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInfoNotice(false)}
            className="p-1 rounded-lg text-indigo-500 hover:text-indigo-900 hover:bg-indigo-100/60 ml-auto"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scope Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Campus Marketplace Listing Form:</span> All listings on Campus Auction are peer-to-peer exchanges with in-person campus pickup. All prices are in Indian Rupees (₹).
        </div>
      </div>

      {/* 2. Item Details Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Item Information */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            1. Item Details
          </h2>

          <div className="space-y-5">
            {/* Item Title */}
            <div>
              <label htmlFor="itemTitle" className="block text-xs font-bold text-slate-700 mb-1.5">
                Item Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="itemTitle"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hero Sprint Pro 26T Mountain Bicycle or Casio FX-991ES Plus"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Mention brand, exact model, and distinguishing features.
              </p>
            </div>

            {/* Category & Condition Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label htmlFor="itemCategory" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="itemCategory"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Cycle">Cycle</option>
                  <option value="Calculator">Calculator</option>
                  <option value="Books">Books</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Condition */}
              <div>
                <label htmlFor="itemCondition" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Condition <span className="text-rose-500">*</span>
                </label>
                <select
                  id="itemCondition"
                  required
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="itemDescription" className="block text-xs font-bold text-slate-700 mb-1.5">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="itemDescription"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe accessories included, campus usage history, any cosmetic scratches, semester courses used for, and pickup convenience..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Be honest about cosmetic defects to maintain high buyer trust ratings.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Timing */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              ₹
            </span>
            2. Auction Pricing & Closing Schedule
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Starting Price */}
            <div>
              <label htmlFor="startingPrice" className="block text-xs font-bold text-slate-700 mb-1.5">
                Starting Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  ₹
                </span>
                <input
                  id="startingPrice"
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 1500"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">The opening minimum bid required to start the auction.</p>
            </div>

            {/* Minimum Bid Increment */}
            <div>
              <label htmlFor="minIncrement" className="block text-xs font-bold text-slate-700 mb-1.5">
                Minimum Bid Increment (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  ₹
                </span>
                <input
                  id="minIncrement"
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  value={minIncrement}
                  onChange={(e) => setMinIncrement(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Minimum additional amount required for subsequent bids.</p>
            </div>

            {/* Closing Date */}
            <div>
              <label htmlFor="closingDate" className="block text-xs font-bold text-slate-700 mb-1.5">
                Closing Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="closingDate"
                  type="date"
                  required
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Date when the auction closes and highest bidder wins.</p>
            </div>

            {/* Closing Time */}
            <div>
              <label htmlFor="closingTime" className="block text-xs font-bold text-slate-700 mb-1.5">
                Closing Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="closingTime"
                  type="time"
                  required
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Preferred campus closing hour (e.g. 18:00 IST).</p>
            </div>
          </div>
        </div>

        {/* Section 3: Photo Selection UI & Local Preview */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              3. Item Photos
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            id="photoUploadInput"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Clickable Drag & Drop Zone */}
          <div
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Click to select photos or <span className="text-indigo-600 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WEBP. Select multiple photos to show all angles.
            </p>
          </div>

          {/* Local Image Previews Grid with Object URLs */}
          {selectedPhotos.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Selected Photos Preview ({selectedPhotos.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    selectedPhotos.forEach((p) => p.url && URL.revokeObjectURL(p.url));
                    setSelectedPhotos([]);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Clear All Photos
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {selectedPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-2xs"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Image Info Overlay on Hover */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      {/* Delete / Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(index);
                        }}
                        className="self-end p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="text-[10px] text-white font-medium truncate bg-slate-950/60 p-1 rounded">
                        {photo.name} ({photo.size})
                      </div>
                    </div>

                    {/* Badge for cover photo */}
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
                        Cover Photo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Form Actions: Create Auction & Cancel */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            as={Link}
            to="/auctions"
            variant="outline"
            size="md"
            className="w-full sm:w-auto text-center"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full sm:w-auto text-center px-8"
          >
            Create Auction
          </Button>
        </div>
      </form>
    </div>
  );
}
