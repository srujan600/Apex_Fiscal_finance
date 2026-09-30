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
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded';

  const sizeClasses = {
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-8 px-3.5 text-xs gap-2',
    lg: 'h-10 px-5 text-sm gap-2.5 font-semibold',
  }[size];

  const variantClasses = {
    primary: 'btn-tactile-primary text-white',
    destructive: 'btn-tactile-destructive',
    surface: 'btn-tactile-surface text-[#dfe2ef]',
    ghost: 'bg-transparent hover:bg-[#1E2D4A]/50 text-[#8c909f] hover:text-white border border-transparent hover:border-[#1E2D4A]',
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
        <span className="material-symbols-outlined text-base leading-none" data-icon={iconTrailing}>
          {iconTrailing}
        </span>
      )}
    </button>
  );
};
