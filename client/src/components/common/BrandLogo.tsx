import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const iconSizes = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md' }) => {
  return (
    <img
      src="/alfa-logo.png"
      alt="Alfa Digi"
      className={`${iconSizes[size]} object-contain select-none`}
      draggable={false}
      id="alfa-digi-brand-mark"
    />
  );
};
