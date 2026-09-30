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

interface ForecastDataPoint {
  month: string;
  actual?: number;
  committed?: number;
  projected: number;
  ceiling: number;
  isForecast: boolean;
}

export const ForecastingView: React.FC = () => {
  const { currency, budgets } = useApp();

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Spend Trajectory & Horizon Forecasting
            </h1>
            <StatusBadge status={isBreached ? 'BLOCKED' : 'APPROVED'} />
          </div>
          <p className="text-xs text-[#8c909f] mt-1 font-mono">
            Monte Carlo Predictive Engine · Multi-Curve Horizon Analysis · Macroeconomic Sensitivity Testing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['Q3_2026', 'H2_2026', 'FY_2026'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setTimeHorizon(h)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                timeHorizon === h
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#0D1526] text-[#8c909f] hover:text-white border border-[#1E293B]'
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
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c909f]">
              Approved Corporate Ceiling
            </span>
            <div className="mt-1 text-2xl font-bold font-mono text-white tracking-tight">
              {formatCurrency(totalCeiling, currency)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8c909f]">
              <span className="material-symbols-outlined text-[14px] text-[#3B82F6]">lock</span>
              <span>Fixed Q4 Board Authorization</span>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Projected Year-End */}
        <DoubleBezelCard className={isBreached ? 'border border-[#EF4444]/40' : ''}>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c909f]">
              Projected Year-End Run-Rate
            </span>
            <div
              className={`mt-1 text-2xl font-bold font-mono tracking-tight ${
                isBreached ? 'text-[#EF4444]' : 'text-[#10B981]'
              }`}
            >
              {formatCurrency(yearEndProjected, currency)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8c909f]">
              <span
                className={`material-symbols-outlined text-[14px] ${
                  isBreached ? 'text-[#EF4444]' : 'text-[#10B981]'
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
        <DoubleBezelCard className={isBreached ? 'border border-[#EF4444]/40' : ''}>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c909f]">
              Projected Fiscal Variance
            </span>
            <div
              className={`mt-1 text-2xl font-bold font-mono tracking-tight ${
                isBreached ? 'text-[#EF4444]' : 'text-[#10B981]'
              }`}
            >
              {isBreached ? '+' : ''}
              {formatCurrency(projectedVariance, currency)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`font-semibold ${
                  isBreached ? 'text-[#EF4444]' : 'text-[#10B981]'
                }`}
              >
                {isBreached ? 'DEFICIT RISK' : 'HEALTHY SURPLUS'}
              </span>
              <span className="text-[#8c909f]">vs baseline</span>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Breach Horizon */}
        <DoubleBezelCard className={isBreached ? 'border border-[#EF4444]/40' : ''}>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c909f]">
              Estimated Breach Horizon
            </span>
            <div
              className={`mt-1 text-lg font-bold font-mono tracking-tight truncate ${
                isBreached ? 'text-[#EF4444]' : 'text-[#10B981]'
              }`}
            >
              {breachDateString}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8c909f]">
              <span
                className={`material-symbols-outlined text-[14px] ${
                  isBreached ? 'text-[#EF4444]' : 'text-[#10B981]'
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
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Spend Trajectory: Actuals vs. Committed vs. Predictive Horizon
                  </h3>
                  <p className="text-xs text-[#8c909f] mt-0.5">
                    Continuous cumulative monthly progression with Monte Carlo variance envelope
                  </p>
                </div>

                {/* Legend Chips */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-[#3B82F6] rounded-full inline-block" />
                    <span className="text-slate-300">Actual Spend</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-[#F59E0B] rounded-full inline-block" />
                    <span className="text-slate-300">Committed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-[#EC4899] rounded-full inline-block border-t border-dashed" />
                    <span className="text-slate-300">Projected Run</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-[#EF4444] rounded-full inline-block" />
                    <span className="text-slate-300">Cap Limit</span>
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
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4899" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#8c909f"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1E293B' }}
                    />
                    <YAxis
                      stroke="#8c909f"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1E293B' }}
                      tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                      domain={[0, 60000000]}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 bg-[#0D1526]/95 border border-[#1E293B] rounded shadow-2xl backdrop-blur-md font-mono text-xs">
                              <div className="font-bold text-white mb-2 pb-1 border-b border-[#1E293B] flex items-center justify-between">
                                <span>{label} 2026</span>
                                {payload[0]?.payload?.isForecast && (
                                  <span className="text-[10px] text-[#EC4899] font-normal uppercase">
                                    Forecast Horizon
                                  </span>
                                )}
                              </div>
                              {payload.map((entry: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                                  <span style={{ color: entry.color }}>{entry.name}:</span>
                                  <span className="font-bold text-white">
                                    {formatCurrency(entry.value, currency)}
                                  </span>
                                </div>
                              ))}
                              <div className="mt-2 pt-1 border-t border-[#1E293B] flex items-center justify-between text-[11px]">
                                <span className="text-[#8c909f]">Corporate Ceiling:</span>
                                <span className="text-[#EF4444] font-bold">
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
                      stroke="#3B82F6"
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
                        value: 'ANNUAL BUDGET CAP ($48.5M)',
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
              <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#8c909f]">
                  <span className="material-symbols-outlined text-[16px] text-[#3B82F6]">
                    tune
                  </span>
                  <span>Sensitivity Multiplier:</span>
                  <span className="font-mono font-bold text-white">
                    {stressFactor > 0 ? `+${stressFactor}%` : `${stressFactor}%`}
                  </span>
                  <span className="text-[10px] text-[#8c909f] font-mono">
                    (Effective: {(totalMultiplier * 100).toFixed(1)}% of base)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[-10, -5, 0, 5, 10, 15].map((val) => (
                    <button
                      key={val}
                      onClick={() => setStressFactor(val)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                        stressFactor === val
                          ? 'bg-[#3B82F6] text-white font-bold'
                          : 'bg-[#0D1526] text-[#8c909f] hover:text-white border border-[#1E293B]'
                      }`}
                    >
                      {val > 0 ? `+${val}%` : `${val}%`}
                    </button>
                  ))}
                  <button
                    onClick={() => setStressFactor(0)}
                    className="px-2 py-1 rounded text-[11px] font-mono text-[#8c909f] hover:text-white underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
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
                <span className="text-xs font-bold text-white uppercase font-mono">
                  Macro Scenarios
                </span>
                <span className="material-symbols-outlined text-[16px] text-[#8c909f]">
                  science
                </span>
              </div>
              <p className="text-[11px] text-[#8c909f]">
                Simulate business conditions against pre-cleared burn trajectory.
              </p>

              <div className="space-y-2">
                {[
                  {
                    id: 'baseline',
                    name: 'Baseline Plan',
                    desc: 'Organic growth at 3.2% MoM burn',
                    badge: '1.0x',
                    color: 'text-slate-300',
                  },
                  {
                    id: 'inflation',
                    name: 'Cloud & SaaS Inflation',
                    desc: 'Vendor renewals +5% cost increase',
                    badge: '+5%',
                    color: 'text-amber-400',
                  },
                  {
                    id: 'hiring',
                    name: 'H2 Engineering Surge',
                    desc: '35 net-new hires with tooling & hardware',
                    badge: '+8%',
                    color: 'text-rose-400',
                  },
                  {
                    id: 'ai_spike',
                    name: 'LLM Inference Spike',
                    desc: 'OpenAI & Bedrock token volume doubling',
                    badge: '+12%',
                    color: 'text-purple-400',
                  },
                  {
                    id: 'renegotiation',
                    name: 'Vendor Optimization',
                    desc: 'Enterprise tier consolidation savings',
                    badge: '-6%',
                    color: 'text-emerald-400',
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenario(s.id)}
                    className={`w-full text-left p-2.5 rounded transition-all cursor-pointer border ${
                      selectedScenario === s.id
                        ? 'bg-[#131E36] border-[#3B82F6] shadow-sm'
                        : 'bg-[#0D1526] border-[#1E293B] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{s.name}</span>
                      <span className={`text-[10px] font-mono font-bold ${s.color}`}>
                        {s.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8c909f] mt-0.5 line-clamp-1">
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
                <span className="text-xs font-bold text-white uppercase font-mono">
                  Stress-Test Slider
                </span>
                <span className="text-xs font-mono font-bold text-[#3B82F6]">
                  {stressFactor > 0 ? `+${stressFactor}%` : `${stressFactor}%`}
                </span>
              </div>
              <p className="text-[11px] text-[#8c909f]">
                Fine-tune variance stress from -15% (freeze) to +25% (runaway cost).
              </p>

              <input
                type="range"
                min="-15"
                max="25"
                step="1"
                value={stressFactor}
                onChange={(e) => setStressFactor(parseInt(e.target.value, 10))}
                className="w-full accent-[#3B82F6] cursor-pointer bg-[#0D1526]"
              />

              <div className="flex justify-between text-[10px] font-mono text-[#8c909f]">
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
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#EF4444]">
                  report_problem
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Key Horizon Risk Drivers
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/20">
                3 Critical Vulnerabilities
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded bg-[#0D1526] border border-[#1E293B] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Cloud GPU Auto-Scaling Variance</span>
                  <span className="text-xs font-mono font-bold text-[#EF4444]">+$820,000 / Q3</span>
                </div>
                <p className="text-[11px] text-[#8c909f]">
                  Engineering training cluster scaling without spot instance quotas. Projected breach window: 28 days.
                </p>
                <div className="text-[10px] font-mono text-[#3B82F6]">
                  Affected Cost Center: Cloud Infrastructure (#104)
                </div>
              </div>

              <div className="p-3 rounded bg-[#0D1526] border border-[#1E293B] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Q4 Enterprise SaaS License True-Ups</span>
                  <span className="text-xs font-mono font-bold text-[#F59E0B]">+$440,000 / Q4</span>
                </div>
                <p className="text-[11px] text-[#8c909f]">
                  Workday, Snowflake, and Datadog annual seat expansion exceeds original budget allocation by 14.2%.
                </p>
                <div className="text-[10px] font-mono text-[#3B82F6]">
                  Affected Cost Center: Information Security & IT (#102)
                </div>
              </div>

              <div className="p-3 rounded bg-[#0D1526] border border-[#1E293B] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Q3 Global Summit & Travel Burn</span>
                  <span className="text-xs font-mono font-bold text-[#F59E0B]">+$285,000 / Q3</span>
                </div>
                <p className="text-[11px] text-[#8c909f]">
                  Executive summit airline bookings pacing 34% higher than historical Q2 baseline.
                </p>
                <div className="text-[10px] font-mono text-[#3B82F6]">
                  Affected Cost Center: Sales & Marketing (#101)
                </div>
              </div>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Automated Mitigation Recommendations */}
        <DoubleBezelCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">
                  lightbulb
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Prescriptive Mitigation Playbook
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                +$1,545,000 Recoverable
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded bg-[#0D1526] border border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#10B981]">
                      check_circle
                    </span>
                    <span className="text-xs font-bold text-white">
                      Enforce AWS Savings Plans & Spot Instances
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#10B981]">
                    +$620,000 Savings
                  </span>
                </div>
                <p className="text-[11px] text-[#8c909f]">
                  Commit to 1-year compute savings plan on base Kubernetes clusters to eliminate on-demand pricing.
                </p>
                <div className="flex justify-end">
                  <TactileButton variant="surface" size="sm">
                    Generate Policy Rule
                  </TactileButton>
                </div>
              </div>

              <div className="p-3 rounded bg-[#0D1526] border border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#10B981]">
                      check_circle
                    </span>
                    <span className="text-xs font-bold text-white">
                      Consolidate Redundant Analytics SaaS
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#10B981]">
                    +$480,000 Savings
                  </span>
                </div>
                <p className="text-[11px] text-[#8c909f]">
                  Merge Mixpanel and Amplitude seats into unified enterprise contract expiring October 2026.
                </p>
                <div className="flex justify-end">
                  <TactileButton variant="surface" size="sm">
                    Review Contract Overlap
                  </TactileButton>
                </div>
              </div>

              <div className="p-3 rounded bg-[#0D1526] border border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#10B981]">
                      check_circle
                    </span>
                    <span className="text-xs font-bold text-white">
                      Tighten Discretionary T&E Cap to $1.2k/trip
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#10B981]">
                    +$445,000 Savings
                  </span>
                </div>
                <p className="text-[11px] text-[#8c909f]">
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
