import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass, AlertTriangle, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-6 shadow-sm">
        <AlertTriangle className="w-10 h-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 mb-3">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
        Campus Page Not Found
      </h1>

      <p className="text-slate-600 max-w-md text-sm sm:text-base leading-relaxed mb-8">
        The auction page, item listing, or campus route you are trying to visit doesn't exist or may have been relocated.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button as={Link} to="/" variant="primary" size="md" icon={Home}>
          Return to Campus Home
        </Button>
        <Button as={Link} to="/auctions" variant="outline" size="md" icon={Compass}>
          Browse Auctions
        </Button>
      </div>
    </div>
  );
}
