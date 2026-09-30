import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export const SpendTrajectoryChart: React.FC = () => {
  const { currency } = useApp();
  const [activeScenario, setActiveScenario] = useState<'baseline' | 'inflation' | 'hiring' | 'vendor'>('baseline');

  // Multi-scenario data points across Q3 timeline (Jul 01 - Sept 30)
  const scenarios = {
    baseline: {
      breachDate: 'Sept 18',
      overrun: 1850000,
      daysLeft: 11,
      multiplier: 1.0,
    },
    inflation: {
      breachDate: 'Sept 11',
      overrun: 2650000,
      daysLeft: 7,
      multiplier: 1.05,
    },
    hiring: {
      breachDate: 'Sept 06',
      overrun: 3400000,
      daysLeft: 4,
      multiplier: 1.12,
    },
    vendor: {
      breachDate: 'Sept 27',
      overrun: 450000,
      daysLeft: 19,
      multiplier: 0.94,
    },
  };

  const currentScenario = scenarios[activeScenario];

  const rawData = [
    { date: 'Jul 01', actual: 6.2, committed: 8.5, projected: null, ceiling: 48.5 },
    { date: 'Jul 10', actual: 11.4, committed: 14.8, projected: null, ceiling: 48.5 },
    { date: 'Jul 20', actual: 16.8, committed: 21.2, projected: null, ceiling: 48.5 },
    { date: 'Aug 01', actual: 21.9, committed: 27.5, projected: null, ceiling: 48.5 },
    { date: 'Aug 10', actual: 25.1, committed: 33.1, projected: null, ceiling: 48.5 },
    { date: 'Today (Day 68)', actual: 28.4, committed: 38.2, projected: 38.2, ceiling: 48.5 },
    { date: 'Sept 10', actual: null, committed: null, projected: 44.1 * currentScenario.multiplier, ceiling: 48.5 },
    { date: 'Sept 18 [BREACH]', actual: null, committed: null, projected: 48.5 * currentScenario.multiplier, ceiling: 48.5 },
    { date: 'Sept 30', actual: null, committed: null, projected: 52.8 * currentScenario.multiplier, ceiling: 48.5 },
  ];

  return (
    <div className="tactile-tier-1 rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Module Header and Scenario Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#1E2D4A] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold text-[#3B82F6] uppercase">
                Predictive Engine
              </span>
              <span className="text-[#8c909f] text-xs">|</span>
              <span className="text-[10px] font-mono text-[#8c909f] uppercase">
                Monte Carlo 10k Iterations
              </span>
            </div>
            <h3 className="text-sm md:text-base font-semibold text-white tracking-tight mt-0.5">
              Continuous Spend Lineage & Breach Trajectory
            </h3>
          </div>

          {/* Scenario Toggles from Stitch */}
          <div className="flex items-center gap-1 bg-[#090D16] p-1 rounded-lg border border-[#1E2D4A] text-xs font-mono">
            <button
              onClick={() => setActiveScenario('baseline')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                activeScenario === 'baseline'
                  ? 'bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/40 font-semibold'
                  : 'text-[#8c909f] hover:text-white'
              }`}
            >
              Baseline Model
            </button>
            <button
              onClick={() => setActiveScenario('inflation')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                activeScenario === 'inflation'
                  ? 'bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/40 font-semibold'
                  : 'text-[#8c909f] hover:text-white'
              }`}
            >
              +5% Inflation
            </button>
            <button
              onClick={() => setActiveScenario('hiring')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                activeScenario === 'hiring'
                  ? 'bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/40 font-semibold'
                  : 'text-[#8c909f] hover:text-white'
              }`}
            >
              Hiring Surge
            </button>
            <button
              onClick={() => setActiveScenario('vendor')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                activeScenario === 'vendor'
                  ? 'bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/40 font-semibold'
                  : 'text-[#8c909f] hover:text-white'
              }`}
            >
              Renegotiation
            </button>
          </div>
        </div>

        {/* Visual Canvas / Recharts Area */}
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rawData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actualSpendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#64748B"
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#1E2D4A' }}
                tickLine={false}
              />

              <YAxis
                stroke="#64748B"
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#1E2D4A' }}
                tickLine={false}
                tickFormatter={(val) => `$${val}M`}
                domain={[0, 60]}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0D1526] border border-[#1E2D4A] p-2.5 rounded shadow-xl text-xs font-mono space-y-1">
                        <span className="text-[#adc6ff] font-semibold block">{label}</span>
                        {payload.map((entry, idx) => (
                          <div key={idx} className="flex justify-between gap-4 text-[11px]">
                            <span style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="text-white font-bold">${entry.value}M</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Hard Ceiling Line from Stitch ($48.5M Red Warning Line) */}
              <ReferenceLine
                y={48.5}
                stroke="#E11D48"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: 'HARD CEILING ($48.5M)',
                  fill: '#ff8093',
                  fontSize: 9,
                  position: 'insideTopRight',
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 600,
                }}
              />

              {/* Actual Spend Area */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Settled Spend"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#actualSpendGradient)"
              />

              {/* Committed Spend Line */}
              <Line
                type="monotone"
                dataKey="committed"
                name="Committed Total"
                stroke="#818CF8"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 3, fill: '#818CF8' }}
              />

              {/* Projected Ascending Breach Trajectory */}
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected Trajectory"
                stroke="#F59E0B"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#E11D48', stroke: '#ffffff', strokeWidth: 1.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend and Crossover Summary Bar */}
      <div className="pt-3 border-t border-[#1E2D4A] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#3B82F6] rounded" />
            <span className="text-[#8c909f]">Settled Spend ($28.4M)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#818CF8]" />
            <span className="text-[#8c909f]">Committed Orders ($38.2M)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dotted border-[#F59E0B]" />
            <span className="text-[#8c909f]">Predictive Trajectory</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#E11D48]" />
            <span className="text-[#ff8093]">Hard Ceiling ($48.5M)</span>
          </div>
        </div>

        <div className="text-[#ff8093] flex items-center gap-1.5 font-semibold">
          <span className="material-symbols-outlined text-sm" data-icon="event_busy">
            event_busy
          </span>
          <span>
            Breach: {currentScenario.breachDate} ({currentScenario.daysLeft} Operating Days Left)
          </span>
        </div>
      </div>
    </div>
  );
};
