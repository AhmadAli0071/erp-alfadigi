import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn" id="hr-dashboard-skeleton">
      {/* Welcome Banner Skeleton */}
      <div className="h-20 rounded-2xl skeleton-shimmer border border-slate-200/60" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-white/70 border border-slate-200/70 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl skeleton-shimmer" />
              <div className="w-12 h-4 rounded-full skeleton-shimmer" />
            </div>
            <div className="w-16 h-7 rounded-lg skeleton-shimmer" />
            <div className="w-24 h-3 rounded skeleton-shimmer" />
            <div className="pt-2 border-t border-slate-200/70 space-y-2">
              <div className="w-20 h-3 rounded skeleton-shimmer" />
              <div className="w-14 h-2.5 rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Attention strip */}
      <div className="h-28 rounded-2xl skeleton-shimmer border border-slate-200/60" />

      {/* Attendance summary & shifts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-72 rounded-2xl skeleton-shimmer border border-slate-200/60" />
        <div className="lg:col-span-5 h-72 rounded-2xl skeleton-shimmer border border-slate-200/60" />
      </div>

      {/* Table Skeleton */}
      <div className="h-96 rounded-2xl skeleton-shimmer border border-slate-200/60" />
    </div>
  );
};
