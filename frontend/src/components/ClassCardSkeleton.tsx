import React from 'react';

export const ClassCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between animate-pulse">
      <div>
        {/* Header Placeholder: Class Title & Badge */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-200 rounded-md w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
          <div className="h-6 bg-slate-200 rounded-full w-24 shrink-0" />
        </div>

        {/* 1. Capacity Bar Skeleton */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <div className="h-3 bg-slate-200 rounded w-24" />
            <div className="h-3 bg-slate-100 rounded w-16" />
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-200 rounded-full w-2/3" />
          </div>
          <div className="flex justify-between items-center mt-1">
            <div className="h-2.5 bg-slate-100 rounded w-4" />
            <div className="h-2.5 bg-slate-100 rounded w-24" />
          </div>
        </div>

        {/* 2. Mini Seat Grid Skeleton (5 rows x 12 cols = 60 nodes) */}
        <div className="mb-5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <div className="h-3 bg-slate-200 rounded w-28" />
            <div className="h-2.5 bg-slate-100 rounded w-20" />
          </div>

          <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5 justify-center py-1">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-sm ${
                  i < 12
                    ? 'bg-emerald-200/60'
                    : i < 18
                    ? 'bg-amber-200/60'
                    : 'bg-slate-200/60'
                }`}
              />
            ))}
          </div>

          {/* Legend Skeleton */}
          <div className="flex items-center justify-center gap-4 pt-2.5 mt-2 border-t border-slate-100">
            <div className="h-2.5 bg-slate-200 rounded w-16" />
            <div className="h-2.5 bg-slate-200 rounded w-14" />
            <div className="h-2.5 bg-slate-200 rounded w-16" />
          </div>
        </div>

        {/* 3. Metrics Grid Skeleton */}
        <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-gray-50/80 border border-gray-100 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-2.5 bg-slate-200 rounded w-10" />
              <div className="h-4 bg-slate-200 rounded w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Action Button Skeleton */}
      <div>
        <div className="w-full h-10 rounded-xl bg-slate-200/90" />
      </div>
    </div>
  );
};
