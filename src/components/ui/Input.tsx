import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefixSymbol?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  prefixSymbol,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="text-[11px] font-sans text-[#8c909f] font-medium block">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefixSymbol && (
          <span className="absolute left-2.5 text-xs font-mono text-[#8c909f] pointer-events-none select-none">
            {prefixSymbol}
          </span>
        )}
        <input
          className={`w-full h-8 text-xs font-mono bg-[#0D1526] text-[#dfe2ef] border ${
            error ? 'border-[#E11D48]' : 'border-[#1E2D4A]'
          } rounded px-2.5 ${prefixSymbol ? 'pl-6' : ''} focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-colors placeholder-[#424754] ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <span className="text-[10px] text-[#ff8093] block font-mono">{error}</span>
      ) : helperText ? (
        <span className="text-[10px] text-[#8c909f] block">{helperText}</span>
      ) : null}
    </div>
  );
};
