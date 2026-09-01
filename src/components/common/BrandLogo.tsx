import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const badgeSizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
  };

  return (
    <div className="flex items-center gap-3 select-none" id="alfa-digi-logo-container">
      {/* Precision Geometric Enterprise Monogram */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/25 border border-indigo-200`}
        id="alfa-digi-brand-mark"
      >
        <span className="text-white font-black text-lg tracking-tight">A</span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-extrabold tracking-tight ${titleSizes[size]} text-slate-900`}
            id="alfa-digi-brand-title"
          >
            ALFA DIGI
          </span>
          <span
            className={`font-bold tracking-wider rounded-md font-mono ${badgeSizes[size]} bg-indigo-50 text-indigo-600 border border-indigo-200`}
            id="alfa-digi-erp-badge"
          >
            ERP
          </span>
        </div>
        {showTagline && (
          <span className="text-xs font-medium tracking-normal mt-0.5 text-slate-500">
            Smart Workforce &amp; Business Management
          </span>
        )}
      </div>
    </div>
  );
};

