import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Reusable PageHeader component for consistent page titles,
 * descriptions, breadcrumbs, and optional call-to-actions.
 */
export default function PageHeader({
  title,
  description,
  badge,
  action,
  breadcrumbs = [],
  className = '',
}) {
  return (
    <div className={`mb-8 pb-6 border-b border-slate-200/80 ${className}`}>
      {/* Optional Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="flex-shrink-0 self-start sm:self-center">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
