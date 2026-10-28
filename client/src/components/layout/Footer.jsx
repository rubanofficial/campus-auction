import React from 'react';
import { Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Gavel className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-700">Campus Auction</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Built for student communities</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link to="/auctions" className="hover:text-indigo-600 transition-colors">
              Browse
            </Link>
            <Link to="/activity" className="hover:text-indigo-600 transition-colors">
              Activity
            </Link>
            <Link to="/notifications" className="hover:text-indigo-600 transition-colors">
              Notifications
            </Link>
          </div>

          <div>
            &copy; {currentYear} Campus Auction. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
