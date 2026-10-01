import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

type ScenarioKey = 'baseline' | 'inflation' | 'hiring' | 'vendor';

interface ScenarioConfig {
  key: ScenarioKey;
  label: string;
  breachDate: string;
  overrun: number;
  daysLeft: number;
  multiplier: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
  projectionOct: number;
  projectionBreach: number;
  projectionDec: number;
}

export const SpendTrajectoryChart: React.FC = () => {
  const { currency } = useApp();
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('baseline');

  // Multi-scenario data points across fiscal timeline with September as current month
  const scenarios: Record<ScenarioKey, ScenarioConfig> = {
    baseline: {
      key: 'baseline',
      label: 'Baseline Model',
      breachDate: 'Nov 18',
      overrun: 3900000,
      daysLeft: 49,
      multiplier: 1.0,
      color: '#f59e0b',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200/80',
      dotColor: 'bg-amber-500',
      description: 'Historical velocity projection — ceiling breach in 49 days',
      projectionOct: 41.8,
      projectionBreach: 48.5,
      projectionDec: 52.8,
    },
    inflation: {
      key: 'inflation',
      label: '+5% Inflation',
      breachDate: 'Nov 04',
      overrun: 4720000,
      daysLeft: 35,
      multiplier: 1.05,
      color: '#ea580c',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      badgeBorder: 'border-orange-200/80',
      dotColor: 'bg-orange-500',
      description: 'Vendor unit cost escalation — accelerates breach by 14 days',
      projectionOct: 43.6,
      projectionBreach: 48.5,
      projectionDec: 55.4,
    },
    hiring: {
      key: 'hiring',
      label: 'Hiring Surge',
      breachDate: 'Oct 28',
      overrun: 5400000,
      daysLeft: 28,
      multiplier: 1.12,
      color: '#dc2626',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200/80',
      dotColor: 'bg-rose-500',
      description: 'Headcount onboarding surge — critical breach on Oct 28',
      projectionOct: 45.4,
      projectionBreach: 48.5,
      projectionDec: 58.8,
    },
    vendor: {
      key: 'vendor',
      label: 'Renegotiation',
      breachDate: 'Dec 08',
      overrun: 1200000,
      daysLeft: 69,
      multiplier: 0.94,
      color: '#10b981',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200/80',
      dotColor: 'bg-emerald-500',
      description: 'Contract renegotiation savings — defers breach to Dec 08',
      projectionOct: 38.6,
      projectionBreach: 44.8,
      projectionDec: 49.3,
    },
  };

  const currentScenario = scenarios[activeScenario];

  // Clean, evenly-spaced timeline avoiding label collision
  const rawData = [
    { date: 'Jul 01', actual: 6.2, committed: 8.5, projected: null, ceiling: 48.5 },
    { date: 'Jul 20', actual: 14.8, committed: 18.2, projected: null, ceiling: 48.5 },
    { date: 'Aug 01', actual: 21.9, committed: 26.5, projected: null, ceiling: 48.5 },
    { date: 'Aug 20', actual: 27.4, committed: 32.1, projected: null, ceiling: 48.5 },
    { date: 'Sep 01', actual: 31.2, committed: 35.8, projected: null, ceiling: 48.5 },
    { date: 'Sep 30', actual: 36.4, committed: 38.2, projected: 36.4, ceiling: 48.5, isToday: true },
    { date: 'Oct 15', actual: null, committed: null, projected: currentScenario.projectionOct, ceiling: 48.5 },
    { date: currentScenario.breachDate, actual: null, committed: null, projected: currentScenario.projectionBreach, ceiling: 48.5, isBreach: true },
    { date: 'Dec 31', actual: null, committed: null, projected: currentScenario.projectionDec, ceiling: 48.5 },
  ];

  const scenarioKeys: ScenarioKey[] = ['baseline', 'inflation', 'hiring', 'vendor'];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Module Header and Scenario Toggles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold text-blue-600 uppercase">
                Predictive Engine
              </span>
              <span className="text-slate-300 text-xs">|</span>
              <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">
                Monte Carlo 10k Iterations
              </span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Continuous Spend Lineage & Breach Trajectory
            </h3>
          </div>

          {/* Scenario Toggles (Flex wrap to never overflow) */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-mono">
            {scenarioKeys.map((key) => {
              const sc = scenarios[key];
              const isActive = activeScenario === key;
              return (
                <button
                  key={key}
                  id={`scenario-btn-${key}`}
                  onClick={() => setActiveScenario(key)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-semibold border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-colors shrink-0 ${
                      isActive ? sc.dotColor : 'bg-slate-300'
                    }`}
                  />
                  <span className="whitespace-nowrap">{sc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Canvas / Recharts Composed Area & Lines */}
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              key={activeScenario}
              data={rawData}
              margin={{ top: 15, right: 32, left: -15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="actualSpendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="scenarioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentScenario.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={currentScenario.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                interval={0}
                tickFormatter={(val) => val === 'Sep 30' ? 'Sep 30 (Today)' : val}
              />

              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                tickFormatter={(val) => `₹${Math.round(val * 8.3)} Cr`}
                domain={[0, 60]}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const validPayload = payload.filter((p) => p.value !== null && p.value !== undefined);
                    if (!validPayload.length) return null;
                    const displayLabel = label === 'Sep 30' ? 'Sep 30 (Today - Fiscal Anchor)' : label;
                    return (
                      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1.5">
                        <span className="text-slate-900 font-bold block">{displayLabel}</span>
                        {validPayload.map((entry, idx) => (
                          <div key={idx} className="flex justify-between gap-4 text-[11px]">
                            <span style={{ color: entry.color }} className="font-medium">
                              {entry.name}:
                            </span>
                            <span className="text-slate-900 font-bold">₹{((entry.value as number) * 8.3).toFixed(1)} Cr</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Hard Ceiling Line */}
              <ReferenceLine
                y={48.5}
                stroke="#ef4444"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: 'HARD CEILING (₹402.55 Cr)',
                  fill: '#dc2626',
                  fontSize: 9,
                  position: 'insideTopRight',
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 600,
                }}
              />

              {/* Actual Spend Area (up to Today) */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Settled Spend"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#actualSpendGradient)"
              />

              {/* Committed Spend Line (up to Today) */}
              <Line
                type="monotone"
                dataKey="committed"
                name="Committed Total"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 3, fill: '#6366f1' }}
              />

              {/* Projected Forward Area & Line (anchored at Today Sept 30) */}
              <Area
                type="monotone"
                dataKey="projected"
                name={`Projected (${currentScenario.label})`}
                stroke={currentScenario.color}
                strokeWidth={2.5}
                strokeDasharray="5 4"
                fillOpacity={1}
                fill="url(#scenarioGradient)"
                connectNulls={true}
                dot={{ r: 4, fill: currentScenario.color, stroke: '#ffffff', strokeWidth: 1.5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend and Crossover Summary Bar */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-600 rounded" />
            <span className="text-slate-500">Settled (₹302.12 Cr)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-indigo-500" />
            <span className="text-slate-500">Committed (₹317.06 Cr)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 border-t-2 border-dashed"
              style={{ borderColor: currentScenario.color }}
            />
            <span className="text-slate-700 font-medium">
              Trajectory (₹{(currentScenario.projectionDec * 8.3).toFixed(1)} Cr)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500" />
            <span className="text-rose-600 font-medium">Ceiling (₹402.55 Cr)</span>
          </div>
        </div>

        <div
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold border ${currentScenario.badgeBg} ${currentScenario.badgeText} ${currentScenario.badgeBorder}`}
        >
          <span className="material-symbols-outlined text-sm" data-icon="event_busy">
            event_busy
          </span>
          <span>
            Breach: {currentScenario.breachDate} ({currentScenario.daysLeft}d left) • Overrun: $
            {(currentScenario.overrun / 1000000).toFixed(1)}M
          </span>
        </div>
      </div>
    </div>
  );
};
