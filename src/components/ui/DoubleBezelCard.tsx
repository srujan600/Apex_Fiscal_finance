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
  const isInteractive = Boolean(onClick);
  const hoverClass =
    hoverEffect || isInteractive
      ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-300/80'
      : 'transition-all duration-200';

  const tierBg = tier === 1 ? 'bg-white' : 'bg-slate-50/50';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl ${tierBg} border border-slate-200/80 shadow-sm relative overflow-hidden ${hoverClass} ${
        isInteractive ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className={`p-5 md:p-6 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
