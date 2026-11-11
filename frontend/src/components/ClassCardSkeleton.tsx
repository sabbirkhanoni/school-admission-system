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
      </div>
    </div>
  );
};
