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
    <div className="w-full space-y-1">
      {label && (
        <label className="text-[11px] font-sans text-[#8c909f] font-medium block">
          {label}
        </label>
      )}
      <select
        className={`w-full h-8 text-xs font-sans bg-[#0D1526] text-[#dfe2ef] border ${
          error ? 'border-[#E11D48]' : 'border-[#1E2D4A]'
        } rounded px-2.5 focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-colors cursor-pointer ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0D1526] text-[#dfe2ef]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-[10px] text-[#ff8093] block font-mono">{error}</span>}
    </div>
  );
};
