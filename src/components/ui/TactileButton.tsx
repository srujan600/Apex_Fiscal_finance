import React from 'react';

interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'destructive' | 'surface' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconTrailing?: string;
  isLoading?: boolean;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  variant = 'surface',
  size = 'md',
  icon,
  iconTrailing,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-xl transition-all duration-200 active:scale-[0.98]';

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-xs gap-2',
    lg: 'h-11 px-5 text-sm gap-2.5 font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:shadow-md hover:shadow-slate-900/20 border border-transparent',
    destructive:
      'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-sm',
    surface:
      'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/90 hover:border-slate-300 shadow-sm',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 hover:border-slate-300',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined text-base animate-spin" data-icon="progress_activity">
          progress_activity
        </span>
      ) : icon ? (
        <span className="material-symbols-outlined text-base leading-none" data-icon={icon}>
          {icon}
        </span>
      ) : null}

      <span>{children}</span>

      {iconTrailing && !isLoading && (
        <span className="material-symbols-outlined text-base leading-none group-hover:translate-x-0.5 transition-transform duration-200" data-icon={iconTrailing}>
          {iconTrailing}
        </span>
      )}
    </button>
  );
};
