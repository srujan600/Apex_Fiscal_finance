import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { StatusBadge } from '../ui/StatusBadge';
import { TactileButton } from '../ui/TactileButton';
import { TierBadge, TierAuthorizationBanner, LockedActionIndicator } from '../common/TierRestrictedBadge';

interface ForecastDataPoint {
  month: string;
  actual?: number;
  committed?: number;
  projected: number;
  ceiling: number;
  isForecast: boolean;
}

export const ForecastingView: React.FC = () => {
  const { currency, budgets, canAdjustModels, isReadOnlyAuditor, governanceTier } = useApp();

  // Sensitivity Stress-Tester multiplier (-15% to +25%)
  const [stressFactor, setStressFactor] = useState<number>(0);
  const [selectedScenario, setSelectedScenario] = useState<string>('baseline');
  const [timeHorizon, setTimeHorizon] = useState<'Q3_2026' | 'H2_2026' | 'FY_2026'>('FY_2026');

  // Total Corporate Ceiling
  const totalCeiling = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.allocated, 0); // e.g. 48,500,000
  }, [budgets]);

  // Scenario multipliers
  const scenarioMultiplier = useMemo(() => {
    switch (selectedScenario) {
      case 'inflation':
        return 1.05;
      case 'hiring':
        return 1.08;
      case 'ai_spike':
        return 1.12;
      case 'renegotiation':
        return 0.94;
      case 'baseline':
      default:
        return 1.0;
    }
  }, [selectedScenario]);

  // Combined sensitivity multiplier
  const totalMultiplier = scenarioMultiplier * (1 + stressFactor / 100);

  // Dynamic projection dataset based on stress factor & scenario
  const chartData: ForecastDataPoint[] = useMemo(() => {
    const rawData = [
      { month: 'Jan', actual: 3800000, committed: 3800000, isForecast: false },
      { month: 'Feb', actual: 7900000, committed: 7900000, isForecast: false },
      { month: 'Mar', actual: 12200000, committed: 12200000, isForecast: false },
      { month: 'Apr', actual: 16500000, committed: 16500000, isForecast: false },
      { month: 'May', actual: 21100000, committed: 21100000, isForecast: false },
      { month: 'Jun', actual: 25900000, committed: 25900000, isForecast: false },
      { month: 'Jul', actual: 31200000, committed: 32100000, isForecast: false },
      { month: 'Aug', actual: 36400000, committed: 37800000, isForecast: false },
      { month: 'Sep', committed: 41900000, baselineProj: 42350000, isForecast: true },
      { month: 'Oct', committed: 44200000, baselineProj: 46100000, isForecast: true },
      { month: 'Nov', committed: 46800000, baselineProj: 49200000, isForecast: true },
      { month: 'Dec', committed: 48100000, baselineProj: 52400000, isForecast: true },
    ];

    return rawData.map((d) => {
      let projectedVal: number;
      if (!d.isForecast) {
        projectedVal = d.actual || 0;
      } else {
        const baseIncrement = (d.baselineProj! - 36400000);
        projectedVal = Math.round(36400000 + baseIncrement * totalMultiplier);
      }

      return {
        month: d.month,
        actual: d.actual,
        committed: d.committed,
        projected: projectedVal,
        ceiling: totalCeiling,
        isForecast: d.isForecast,
      };
    });
  }, [totalMultiplier, totalCeiling]);

  // Year-end projected spend & variance
  const yearEndProjected = chartData[chartData.length - 1].projected;
  const projectedVariance = yearEndProjected - totalCeiling;
  const isBreached = projectedVariance > 0;

  // Breach Horizon calculation
  const breachMonth = useMemo(() => {
    const breachPoint = chartData.find((d) => d.projected >= totalCeiling);
    if (!breachPoint) return null;
    return breachPoint.month;
  }, [chartData, totalCeiling]);

  const breachDateString = useMemo(() => {
    if (!breachMonth) return 'No Breach Projected (Safe Cap Runway)';
    if (breachMonth === 'Oct') return 'October 14, 2026';
    if (breachMonth === 'Nov') return 'November 18, 2026';
    if (breachMonth === 'Dec') return 'December 04, 2026';
    return `${breachMonth} 2026`;
  }, [breachMonth]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Spend Trajectory & Horizon Forecasting
            </h1>
            <StatusBadge status={isBreached ? 'BLOCKED' : 'APPROVED'} />
            <TierBadge tier={governanceTier} size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Monte Carlo Predictive Engine · Multi-Curve Horizon Analysis · Macroeconomic Sensitivity Testing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['Q3_2026', 'H2_2026', 'FY_2026'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setTimeHorizon(h)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-200 cursor-pointer ${
                timeHorizon === h
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {h.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Horizon Telemetry KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Ceiling */}
        <DoubleBezelCard>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">
              Approved Corporate Ceiling
            </span>
            <div className="mt-1 text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatCurrency(totalCeiling, currency)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="material-symbols-outlined text-[14px] text-blue-600">lock</span>
              <span>Fixed Q4 Board Authorization</span>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Projected Year-End */}
        <DoubleBezelCard className={isBreached ? 'border border-rose-300 bg-rose-50/20' : ''}>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">
              Projected Year-End Run-Rate
            </span>
            <div
              className={`mt-1 text-2xl font-bold font-mono tracking-tight ${
                isBreached ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(yearEndProjected, currency)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className={`material-symbols-outlined text-[14px] ${
                  isBreached ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {isBreached ? 'trending_up' : 'trending_flat'}
              </span>
              <span className="font-mono">
                {((yearEndProjected / totalCeiling) * 100).toFixed(1)}% of total cap
              </span>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Projected Variance */}
        <DoubleBezelCard className={isBreached ? 'border border-rose-300 bg-rose-50/20' : ''}>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">
              Projected Fiscal Variance
            </span>
            <div
              className={`mt-1 text-2xl font-bold font-mono tracking-tight ${
                isBreached ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {isBreached ? '+' : ''}
              {formatCurrency(projectedVariance, currency)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`font-semibold ${
                  isBreached ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {isBreached ? 'DEFICIT RISK' : 'HEALTHY SURPLUS'}
              </span>
              <span className="text-slate-500">vs baseline</span>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Breach Horizon */}
        <DoubleBezelCard className={isBreached ? 'border border-rose-300 bg-rose-50/20' : ''}>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">
              Estimated Breach Horizon
            </span>
            <div
              className={`mt-1 text-lg font-bold font-mono tracking-tight truncate ${
                isBreached ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {breachDateString}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className={`material-symbols-outlined text-[14px] ${
                  isBreached ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {isBreached ? 'warning' : 'verified_user'}
              </span>
              <span>{isBreached ? 'Enforcement Required' : 'Cap Preserved'}</span>
            </div>
          </div>
        </DoubleBezelCard>
      </div>

      {/* Main Interactive Forecast Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart Column (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <DoubleBezelCard>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Spend Trajectory: Actuals vs. Committed vs. Predictive Horizon
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Continuous cumulative monthly progression with Monte Carlo variance envelope
                  </p>
                </div>

                {/* Legend Chips */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-blue-600 rounded-full inline-block" />
                    <span className="text-slate-600">Actual Spend</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-amber-500 rounded-full inline-block" />
                    <span className="text-slate-600">Committed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-pink-500 rounded-full inline-block border-t border-dashed" />
                    <span className="text-slate-600">Projected Run</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-rose-500 rounded-full inline-block" />
                    <span className="text-slate-600">Cap Limit</span>
                  </div>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                      domain={[0, 60000000]}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 bg-white/95 border border-slate-200 rounded-xl shadow-xl backdrop-blur-md font-mono text-xs text-slate-800">
                              <div className="font-bold text-slate-900 mb-2 pb-1 border-b border-slate-100 flex items-center justify-between">
                                <span>{label} 2026</span>
                                {payload[0]?.payload?.isForecast && (
                                  <span className="text-[10px] text-pink-600 font-normal uppercase bg-pink-50 px-1.5 py-0.5 rounded">
                                    Forecast Horizon
                                  </span>
                                )}
                              </div>
                              {payload.map((entry: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                                  <span style={{ color: entry.color }}>{entry.name}:</span>
                                  <span className="font-bold text-slate-900">
                                    {formatCurrency(entry.value, currency)}
                                  </span>
                                </div>
                              ))}
                              <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Corporate Ceiling:</span>
                                <span className="text-rose-600 font-bold">
                                  {formatCurrency(totalCeiling, currency)}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Area fill for actual spend */}
                    <Area
                      type="monotone"
                      dataKey="actual"
                      name="Actual Incurred"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#actualGradient)"
                    />

                    {/* Committed line */}
                    <Line
                      type="monotone"
                      dataKey="committed"
                      name="Committed Contracts"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />

                    {/* Projected Forecast Line */}
                    <Line
                      type="monotone"
                      dataKey="projected"
                      name="Projected Trajectory"
                      stroke="#EC4899"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#EC4899' }}
                    />

                    {/* Pinned Ceiling Limit Line */}
                    <ReferenceLine
                      y={totalCeiling}
                      stroke="#EF4444"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      label={{
                        value: 'ANNUAL BUDGET CAP (₹402.55 Cr)',
                        position: 'top',
                        fill: '#EF4444',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Stress Factor Quick Controls Bar */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">
                    tune
                  </span>
                  <span>Sensitivity Multiplier:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {stressFactor > 0 ? `+${stressFactor}%` : `${stressFactor}%`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Effective: {(totalMultiplier * 100).toFixed(1)}% of base)
                  </span>
                </div>

                {canAdjustModels ? (
                  <div className="flex items-center gap-2">
                    {[-10, -5, 0, 5, 10, 15].map((val) => (
                      <button
                        key={val}
                        onClick={() => setStressFactor(val)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all duration-200 cursor-pointer ${
                          stressFactor === val
                            ? 'bg-slate-900 text-white font-bold shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        {val > 0 ? `+${val}%` : `${val}%`}
                      </button>
                    ))}
                    <button
                      onClick={() => setStressFactor(0)}
                      className="px-2 py-1 rounded-lg text-[11px] font-mono text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  <LockedActionIndicator reason="Tier 4 Read-Only: Model adjustments locked" />
                )}
              </div>
            </div>
          </DoubleBezelCard>
        </div>

        {/* Sidebar Controls & Scenario Matrix (1 col) */}
        <div className="space-y-4">
          {/* Scenario Selection */}
          <DoubleBezelCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase font-mono">
                  Macro Scenarios
                </span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  science
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Simulate business conditions against pre-cleared burn trajectory.
              </p>

              <div className="space-y-2">
                {[
                  {
                    id: 'baseline',
                    name: 'Baseline Plan',
                    desc: 'Organic growth at 3.2% MoM burn',
                    badge: '1.0x',
                    color: 'text-slate-600',
                  },
                  {
                    id: 'inflation',
                    name: 'Cloud & SaaS Inflation',
                    desc: 'Vendor renewals +5% cost increase',
                    badge: '+5%',
                    color: 'text-amber-600',
                  },
                  {
                    id: 'hiring',
                    name: 'H2 Engineering Surge',
                    desc: '35 net-new hires with tooling & hardware',
                    badge: '+8%',
                    color: 'text-rose-600',
                  },
                  {
                    id: 'ai_spike',
                    name: 'LLM Inference Spike',
                    desc: 'OpenAI & Bedrock token volume doubling',
                    badge: '+12%',
                    color: 'text-purple-600',
                  },
                  {
                    id: 'renegotiation',
                    name: 'Vendor Optimization',
                    desc: 'Enterprise tier consolidation savings',
                    badge: '-6%',
                    color: 'text-emerald-600',
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenario(s.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                      selectedScenario === s.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50/70 border-slate-200/80 text-slate-900 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${selectedScenario === s.id ? 'text-white' : 'text-slate-900'}`}>{s.name}</span>
                      <span className={`text-[10px] font-mono font-bold ${selectedScenario === s.id ? 'text-slate-200' : s.color}`}>
                        {s.badge}
                      </span>
                    </div>
                    <div className={`text-[10px] mt-0.5 line-clamp-1 ${selectedScenario === s.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {s.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DoubleBezelCard>

          {/* Interactive Sensitivity Slider */}
          <DoubleBezelCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase font-mono">
                  Stress-Test Slider
                </span>
                <span className="text-xs font-mono font-bold text-blue-600">
                  {stressFactor > 0 ? `+${stressFactor}%` : `${stressFactor}%`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Fine-tune variance stress from -15% (freeze) to +25% (runaway cost).
              </p>

              <input
                type="range"
                min="-15"
                max="25"
                step="1"
                value={stressFactor}
                onChange={(e) => setStressFactor(parseInt(e.target.value, 10))}
                disabled={!canAdjustModels}
                className={`w-full accent-slate-900 bg-slate-200 ${
                  canAdjustModels ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>-15% Freeze</span>
                <span>0% Plan</span>
                <span>+25% Surge</span>
              </div>
            </div>
          </DoubleBezelCard>
        </div>
      </div>

      {/* Risk Drivers & Algorithmic Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identified Risk Drivers */}
        <DoubleBezelCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-rose-600">
                  report_problem
                </span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Key Horizon Risk Drivers
                </h3>
              </div>
              <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                3 Critical Vulnerabilities
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Cloud GPU Auto-Scaling Variance</span>
                  <span className="text-xs font-mono font-bold text-rose-600">+₹6.81 Cr / Q3</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Engineering training cluster scaling without spot instance quotas. Projected breach window: 28 days.
                </p>
                <div className="text-[10px] font-mono text-blue-600">
                  Affected Cost Center: Cloud Infrastructure (#104)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Q4 Enterprise SaaS License True-Ups</span>
                  <span className="text-xs font-mono font-bold text-amber-600">+₹3.65 Cr / Q4</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Workday, Snowflake, and Datadog annual seat expansion exceeds original budget allocation by 14.2%.
                </p>
                <div className="text-[10px] font-mono text-blue-600">
                  Affected Cost Center: Information Security & IT (#102)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Q3 Global Summit & Travel Burn</span>
                  <span className="text-xs font-mono font-bold text-amber-600">+₹2.37 Cr / Q3</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Executive summit airline bookings pacing 34% higher than historical Q2 baseline.
                </p>
                <div className="text-[10px] font-mono text-blue-600">
                  Affected Cost Center: Sales & Marketing (#101)
                </div>
              </div>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Automated Mitigation Recommendations */}
        <DoubleBezelCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">
                  lightbulb
                </span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Prescriptive Mitigation Playbook
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +₹12.82 Cr Recoverable
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">
                      check_circle
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Enforce AWS Savings Plans & Spot Instances
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    +₹5.15 Cr Savings
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Commit to 1-year compute savings plan on base Kubernetes clusters to eliminate on-demand pricing.
                </p>
                <div className="flex justify-end">
                  <TactileButton variant="surface" size="sm">
                    Generate Policy Rule
                  </TactileButton>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">
                      check_circle
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Consolidate Redundant Analytics SaaS
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    +₹3.98 Cr Savings
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Merge Mixpanel and Amplitude seats into unified enterprise contract expiring October 2026.
                </p>
                <div className="flex justify-end">
                  <TactileButton variant="surface" size="sm">
                    Review Contract Overlap
                  </TactileButton>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">
                      check_circle
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Tighten Discretionary T&E Cap to ₹1.0L/trip
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    +₹3.69 Cr Savings
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Temporarily throttle domestic flight class caps and hotel allowances for non-client revenue teams.
                </p>
                <div className="flex justify-end">
                  <TactileButton variant="surface" size="sm">
                    Deploy Spending Throttle
                  </TactileButton>
                </div>
              </div>
            </div>
          </div>
        </DoubleBezelCard>
      </div>
    </div>
  );
};
