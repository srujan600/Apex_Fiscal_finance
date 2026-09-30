import React from 'react';

interface DoubleBezelCardProps {
  children: React.ReactNode;
  tier?: 1 | 2;
  className?: string;
  innerClassName?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const DoubleBezelCard: React.FC<DoubleBezelCardProps> = ({
  children,
  tier = 1,
  className = '',
  innerClassName = '',
  onClick,
  hoverEffect = true,
}) => {
  const tierClass = tier === 1 ? 'tactile-tier-1' : 'tactile-tier-2';
  const hoverClass = hoverEffect ? 'hover:border-[#3B82F6]/40 transition-colors' : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-lg ${tierClass} ${hoverClass} relative overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`p-4 md:p-5 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
