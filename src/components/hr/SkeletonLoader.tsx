import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" id="hr-dashboard-skeleton">
      {/* Welcome Banner Skeleton */}
      <div className="h-28 rounded-2xl bg-white/[0.03] border border-white/5" />

      {/* KPI Cards Skeleton (8 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-white/5" />
              <div className="w-12 h-4 rounded-full bg-white/5" />
            </div>
            <div className="w-16 h-7 rounded-md bg-white/5" />
            <div className="w-24 h-3.5 rounded-md bg-white/5" />
          </div>
        ))}
      </div>

      {/* Attendance summary & shifts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-72 rounded-2xl bg-white/[0.03] border border-white/5" />
        <div className="lg:col-span-5 h-72 rounded-2xl bg-white/[0.03] border border-white/5" />
      </div>

      {/* Table Skeleton */}
      <div className="h-96 rounded-2xl bg-white/[0.03] border border-white/5" />
    </div>
  );
};
