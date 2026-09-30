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
    md: 'h-2',
    lg: 'h-3',
  }[height];

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[#8c909f]">
              <span className="w-2 h-2 rounded-xs bg-[#3B82F6]" />
              Settled: {settledPercent.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1 text-[#8c909f]">
              <span className="w-2 h-2 rounded-xs bg-[#818CF8]" />
              Committed: {committedPercent.toFixed(0)}%
            </span>
          </div>
          <span className={`font-semibold ${isBreached ? 'text-[#ff8093]' : totalPercent > 85 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
            Total: {totalPercent.toFixed(1)}% {isBreached ? '(BREACH)' : ''}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className={`w-full ${heightClass} rounded-full bg-[#181B25] flex overflow-hidden border border-[#1E2D4A]/50`}>
        {/* Settled Bar */}
        <div
          className="bg-[#3B82F6] h-full transition-all duration-500 ease-out"
          style={{ width: `${settledPercent}%` }}
          title={`Settled: ${settledPercent.toFixed(1)}%`}
        />
        {/* Committed Bar */}
        <div
          className="bg-[#818CF8] h-full transition-all duration-500 ease-out"
          style={{ width: `${committedPercent}%` }}
          title={`Committed: ${committedPercent.toFixed(1)}%`}
        />
        {/* Buffer Headroom Bar */}
        <div
          className="bg-[#262A34] h-full transition-all duration-500 ease-out"
          style={{ width: `${bufferPercent}%` }}
          title={`Headroom: ${bufferPercent.toFixed(1)}%`}
        />
        {/* Overrun Deficit Bar if breached */}
        {isBreached && (
          <div
            className="bg-[#E11D48] h-full animate-pulse"
            style={{ width: `${overrunPercent}%` }}
            title={`Overrun Deficit: +${(totalPercent - 100).toFixed(1)}%`}
          />
        )}
      </div>
    </div>
  );
};
