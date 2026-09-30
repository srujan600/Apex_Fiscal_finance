import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
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
      <select
        className={`w-full h-9 text-xs font-sans bg-white text-slate-900 border ${
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
        } rounded-xl px-3 focus:outline-none focus:ring-4 transition-all duration-200 cursor-pointer shadow-xs ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-[10px] text-rose-600 block font-mono">{error}</span>}
    </div>
  );
};
