import React from 'react';

interface ThresholdMeterProps {
  allocated: number;
  settled: number;
  committed: number;
  height?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export const ThresholdMeter: React.FC<ThresholdMeterProps> = ({
  allocated,
  settled,
  committed,
  height = 'md',
  showLabels = false,
  className = '',
}) => {
  const settledPercent = Math.min(100, Math.max(0, (settled / allocated) * 100));
  const committedPercent = Math.min(100 - settledPercent, Math.max(0, (committed / allocated) * 100));
  const totalPercent = ((settled + committed) / allocated) * 100;
  const isBreached = totalPercent > 100;
  const overrunPercent = isBreached ? Math.min(30, totalPercent - 100) : 0;
  const bufferPercent = Math.max(0, 100 - (settledPercent + committedPercent));

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  }[height];

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Settled: {settledPercent.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Committed: {committedPercent.toFixed(0)}%
            </span>
          </div>
          <span
            className={`font-semibold ${
              isBreached ? 'text-rose-600' : totalPercent > 85 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            Total: {totalPercent.toFixed(1)}% {isBreached ? '(BREACH)' : ''}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className={`w-full ${heightClass} rounded-full bg-slate-100 flex overflow-hidden border border-slate-200/70 shadow-xs`}>
        {/* Settled Bar */}
        <div
          className="bg-blue-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${settledPercent}%` }}
          title={`Settled: ${settledPercent.toFixed(1)}%`}
        />
        {/* Committed Bar */}
        <div
          className="bg-indigo-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${committedPercent}%` }}
          title={`Committed: ${committedPercent.toFixed(1)}%`}
        />
        {/* Buffer Headroom Bar */}
        <div
          className="bg-slate-200/60 h-full transition-all duration-500 ease-out"
          style={{ width: `${bufferPercent}%` }}
          title={`Headroom: ${bufferPercent.toFixed(1)}%`}
        />
        {/* Overrun Deficit Bar if breached */}
        {isBreached && (
          <div
            className="bg-rose-500 h-full animate-pulse"
            style={{ width: `${overrunPercent}%` }}
            title={`Overrun Deficit: +${(totalPercent - 100).toFixed(1)}%`}
          />
        )}
      </div>
    </div>
  );
};
