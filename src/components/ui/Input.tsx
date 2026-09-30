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
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-xs font-sans text-slate-700 font-medium block">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefixSymbol && (
          <span className="absolute left-3 text-xs font-mono text-slate-400 pointer-events-none select-none">
            {prefixSymbol}
          </span>
        )}
        <input
          className={`w-full h-9 text-xs font-mono bg-white text-slate-900 border ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
          } rounded-xl px-3 ${prefixSymbol ? 'pl-7' : ''} placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all duration-200 shadow-xs ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <span className="text-[10px] text-rose-600 block font-mono">{error}</span>
      ) : helperText ? (
        <span className="text-[10px] text-slate-500 block">{helperText}</span>
      ) : null}
    </div>
  );
};
