import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { StatusBadge } from '../ui/StatusBadge';
import { TactileButton } from '../ui/TactileButton';
import { Modal } from '../ui/Modal';
import { BudgetEnvelope } from '../../types';

interface DepartmentReportRow {
  id: string;
  code: string;
  name: string;
  manager: string;
  allocated: number;
  spent: number;
  committed: number;
  totalLiability: number;
  variance: number;
  variancePct: number;
  utilPct: number;
  status: 'APPROVED' | 'WARNING' | 'CRITICAL' | 'BLOCKED';
}

export const ReportsView: React.FC = () => {
  const { currency, budgets, categories } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<'Q1' | 'Q2' | 'Q3' | 'FY2026'>('Q3');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Financial aggregates
  const totalAllocated = useMemo(() => budgets.reduce((s: number, b: BudgetEnvelope) => s + b.allocated, 0), [budgets]);
  const totalSettled = useMemo(() => budgets.reduce((s: number, b: BudgetEnvelope) => s + b.actualSettled, 0), [budgets]);
  const totalCommitted = useMemo(() => budgets.reduce((s: number, b: BudgetEnvelope) => s + b.committed, 0), [budgets]);
  const totalRunRate = totalSettled + totalCommitted;
  const totalRemaining = totalAllocated - totalRunRate;
  const totalBurnRate = totalAllocated > 0 ? (totalRunRate / totalAllocated) * 100 : 0;

  // Department Variance Rows derived from budgets
  const departmentRows: DepartmentReportRow[] = useMemo(() => {
    return budgets.map((b: BudgetEnvelope) => {
      const allocated = b.allocated;
      const spent = b.actualSettled;
      const committed = b.committed;
      const totalLiability = spent + committed;
      const variance = totalLiability - allocated;
      const variancePct = allocated > 0 ? (variance / allocated) * 100 : 0;
      const utilPct = allocated > 0 ? (totalLiability / allocated) * 100 : 0;

      let status: 'APPROVED' | 'WARNING' | 'CRITICAL' | 'BLOCKED' = 'APPROVED';
      if (utilPct > 100) status = 'BLOCKED';
      else if (utilPct > 90) status = 'CRITICAL';
      else if (utilPct > 80) status = 'WARNING';

      return {
        id: b.departmentId,
        code: b.code,
        name: b.departmentName,
        manager: b.leadManager,
        allocated,
        spent,
        committed,
        totalLiability,
        variance,
        variancePct,
        utilPct,
        status,
      };
    });
  }, [budgets]);

  const filteredDeptRows = useMemo(() => {
    if (selectedDeptFilter === 'ALL') return departmentRows;
    return departmentRows.filter((r) => r.id === selectedDeptFilter);
  }, [departmentRows, selectedDeptFilter]);

  // CSV Export Generator
  const handleExportCsv = () => {
    const headers = ['Cost Center', 'Department', 'Manager', 'Allocated', 'Spent', 'Committed', 'Total Run-Rate', 'Variance Amount', 'Variance %', 'Status'];
    const rows = departmentRows.map((r: DepartmentReportRow) => [
      r.code,
      `"${r.name}"`,
      `"${r.manager}"`,
      r.allocated,
      r.spent,
      r.committed,
      r.totalLiability,
      r.variance,
      `${r.variancePct.toFixed(2)}%`,
      r.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row: (string | number)[]) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `apex_fiscal_variance_report_${selectedPeriod}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast('Full corporate ledger CSV generated & downloaded successfully.');
    setTimeout(() => setExportToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Financial Performance & Variance Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30">
              GAAS / SOX COMPLIANT
            </span>
          </div>
          <p className="text-xs text-[#8c909f] mt-1 font-mono">
            Executive Ledger Synthesis · Budget Pacing Metrics · Real-time Variance Reconciliation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-[#0D1526] border border-[#1E293B] rounded p-1">
            {(['Q1', 'Q2', 'Q3', 'FY2026'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                  selectedPeriod === p
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-[#8c909f] hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Export Action Buttons */}
          <TactileButton variant="surface" size="sm" onClick={handleExportCsv}>
            <span className="material-symbols-outlined text-[16px] mr-1">download</span>
            Export CSV
          </TactileButton>

          <TactileButton variant="primary" size="sm" onClick={() => setPdfModalOpen(true)}>
            <span className="material-symbols-outlined text-[16px] mr-1">picture_as_pdf</span>
            Executive Dossier
          </TactileButton>
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportToast && (
        <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded text-xs font-mono text-[#10B981] flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{exportToast}</span>
        </div>
      )}

      {/* Executive Financial Telemetry KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Allocated */}
        <DoubleBezelCard>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c909f]">
              Net Budget Authorized ({selectedPeriod})
            </span>
            <div className="mt-1 text-2xl font-bold font-mono text-white tracking-tight">
              {formatCurrency(totalAllocated, currency)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#8c909f]">
              <span>Board Discretionary Cap</span>
              <span className="font-mono text-white">100.0%</span>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Total Spent */}
        <DoubleBezelCard>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c909f]">
              Incurred Cash Outflow
            </span>
            <div className="mt-1 text-2xl font-bold font-mono text-slate-100 tracking-tight">
              {formatCurrency(totalSettled, currency)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#8c909f]">
              <span>Cleared Invoices & Payroll</span>
              <span className="font-mono text-[#3B82F6]">
                {((totalSettled / totalAllocated) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Encumbered Commitments */}
        <DoubleBezelCard>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c909f]">
              Active Encumbrances (PO Pipeline)
            </span>
            <div className="mt-1 text-2xl font-bold font-mono text-[#F59E0B] tracking-tight">
              {formatCurrency(totalCommitted, currency)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#8c909f]">
              <span>Pre-cleared Purchase Orders</span>
              <span className="font-mono text-[#F59E0B]">
                {((totalCommitted / totalAllocated) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Net Available Runway */}
        <DoubleBezelCard className={totalRemaining < 0 ? 'border border-[#EF4444]/40' : ''}>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c909f]">
              Unencumbered Liquid Runway
            </span>
            <div
              className={`mt-1 text-2xl font-bold font-mono tracking-tight ${
                totalRemaining >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              {formatCurrency(totalRemaining, currency)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-[#8c909f]">Remaining Authorization</span>
              <span
                className={`font-mono font-bold ${
                  totalRemaining >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {(100 - totalBurnRate).toFixed(1)}% free
              </span>
            </div>
          </div>
        </DoubleBezelCard>
      </div>

      {/* Department Variance Ledger */}
      <DoubleBezelCard>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1E293B]">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                Departmental Budget vs. Run-Rate Variance Matrix
              </h2>
              <p className="text-xs text-[#8c909f] mt-0.5">
                Multi-center cost analysis including executed vouchers and committed contracts
              </p>
            </div>

            {/* Filter by Department */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8c909f]">Cost Center:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-[#0D1526] border border-[#1E293B] text-white text-xs rounded px-2.5 py-1.5 font-mono cursor-pointer"
              >
                <option value="ALL">All Cost Centers ({budgets.length})</option>
                {budgets.map((b: BudgetEnvelope) => (
                  <option key={b.departmentId} value={b.departmentId}>
                    {b.code} - {b.departmentName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* High-Density Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E293B] text-[#8c909f] bg-[#090D16]">
                  <th className="py-2.5 px-3 font-semibold">Cost Center</th>
                  <th className="py-2.5 px-3 font-semibold">Department & Lead</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Allocated</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Incurred</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Committed</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total Liability</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Variance ($)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Util %</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredDeptRows.map((row: DepartmentReportRow) => {
                  const isOver = row.variance > 0;
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-[#131E36]/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-white">
                        {row.code}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{row.name}</div>
                        <div className="text-[10px] text-[#8c909f]">
                          Lead: {row.manager}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {formatCurrency(row.allocated, currency)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {formatCurrency(row.spent, currency)}
                      </td>
                      <td className="py-3 px-3 text-right text-[#F59E0B]">
                        {formatCurrency(row.committed, currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {formatCurrency(row.totalLiability, currency)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-bold ${
                          isOver ? 'text-[#EF4444]' : 'text-[#10B981]'
                        }`}
                      >
                        {isOver ? '+' : ''}
                        {formatCurrency(row.variance, currency)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`font-bold ${
                              row.utilPct > 100
                                ? 'text-[#EF4444]'
                                : row.utilPct > 85
                                ? 'text-[#F59E0B]'
                                : 'text-[#10B981]'
                            }`}
                          >
                            {row.utilPct.toFixed(1)}%
                          </span>
                          <div className="w-12 bg-[#090D16] h-1.5 rounded-full overflow-hidden border border-[#1E293B]">
                            <div
                              className={`h-full ${
                                row.utilPct > 100
                                  ? 'bg-[#EF4444]'
                                  : row.utilPct > 85
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#10B981]'
                              }`}
                              style={{ width: `${Math.min(row.utilPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </DoubleBezelCard>

      {/* Category Spend Pacing Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DoubleBezelCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#3B82F6]">
                  pie_chart
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Operational Category Pacing
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8c909f]">
                Quarterly Target: 75.0%
              </span>
            </div>

            <div className="space-y-3.5">
              {categories.map((cat) => {
                const pacingPct = (cat.spent / cat.allocated) * 100;
                const isOverPaced = pacingPct > 75;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-[#8c909f]">
                          folder
                        </span>
                        <span className="font-bold text-white">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">
                          {formatCurrency(cat.spent, currency)} / {formatCurrency(cat.allocated, currency)}
                        </span>
                        <span
                          className={`font-bold ${
                            isOverPaced ? 'text-[#EF4444]' : 'text-[#10B981]'
                          }`}
                        >
                          {pacingPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-[#0D1526] h-2 rounded-full overflow-hidden border border-[#1E293B] relative">
                      {/* 75% Quarterly pacing benchmark marker */}
                      <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-white/40 z-10" />
                      <div
                        className={`h-full transition-all duration-500 ${
                          pacingPct > 100
                            ? 'bg-[#EF4444]'
                            : pacingPct > 80
                            ? 'bg-[#F59E0B]'
                            : 'bg-[#3B82F6]'
                        }`}
                        style={{ width: `${Math.min(pacingPct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DoubleBezelCard>

        {/* Audit Compliance & Scheduled Subscriptions */}
        <DoubleBezelCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">
                  mark_email_read
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Audit Subscriptions & Automation
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                Active Cron Active
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#0D1526] border border-[#1E293B] rounded flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Monday Morning CFO Variance Digest</div>
                  <div className="text-[11px] text-[#8c909f] mt-0.5 font-mono">
                    Weekly 08:00 EST · Encumbered PO review & runway forecast
                  </div>
                </div>
                <TactileButton variant="surface" size="sm">
                  Active
                </TactileButton>
              </div>

              <div className="p-3 bg-[#0D1526] border border-[#1E293B] rounded flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Monthly Board Fiscal Pack (PDF + Signed)</div>
                  <div className="text-[11px] text-[#8c909f] mt-0.5 font-mono">
                    1st of each month · Cryptographically hashed GAAS reconciliation
                  </div>
                </div>
                <TactileButton variant="surface" size="sm">
                  Active
                </TactileButton>
              </div>

              <div className="p-3 bg-[#0D1526] border border-[#1E293B] rounded flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Critical Cap Breach Webhook (Slack / PagerDuty)</div>
                  <div className="text-[11px] text-[#8c909f] mt-0.5 font-mono">
                    Instant trigger upon any department crossing 95% ceiling
                  </div>
                </div>
                <TactileButton variant="surface" size="sm">
                  Active
                </TactileButton>
              </div>
            </div>
          </div>
        </DoubleBezelCard>
      </div>

      {/* PDF Executive Dossier Modal Preview */}
      <Modal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title="Executive Fiscal Dossier (Pre-Print Preview)"
        maxWidth="xl"
      >
        <div className="space-y-6 text-slate-200">
          {/* Document Header */}
          <div className="border-b-2 border-slate-700 pb-4 flex justify-between items-start">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#3B82F6]">
                Confidential · Corporate Governance Directive
              </div>
              <h1 className="text-xl font-bold font-sans text-white mt-1">
                Apex Fiscal Executive Spend Dossier
              </h1>
              <p className="text-xs text-[#8c909f] font-mono mt-0.5">
                Period: Q3 FY 2026 · Generated on September 30, 2026 · Hash: #8F9A-40D9-92C1
              </p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded bg-[#10B981]/20 text-[#10B981] font-mono text-xs font-bold border border-[#10B981]/40">
                AUDIT VERIFIED
              </span>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div className="grid grid-cols-3 gap-4 font-mono text-xs p-4 bg-[#090D16] rounded border border-[#1E293B]">
            <div>
              <span className="text-[#8c909f] uppercase text-[10px]">Total Authorized Cap:</span>
              <div className="text-base font-bold text-white mt-0.5">
                {formatCurrency(totalAllocated, currency)}
              </div>
            </div>
            <div>
              <span className="text-[#8c909f] uppercase text-[10px]">Net Commitments Incurred:</span>
              <div className="text-base font-bold text-white mt-0.5">
                {formatCurrency(totalRunRate, currency)}
              </div>
            </div>
            <div>
              <span className="text-[#8c909f] uppercase text-[10px]">Runway Capacity:</span>
              <div
                className={`text-base font-bold mt-0.5 ${
                  totalRemaining >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {formatCurrency(totalRemaining, currency)} ({(100 - totalBurnRate).toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Detailed Narrative */}
          <div className="space-y-2 text-xs leading-relaxed text-[#c4c7d6]">
            <p>
              This document serves as the formal quarterly spend reconciliation for the executive committee. Total capital authorized across all four primary operating centers stands at <strong>{formatCurrency(totalAllocated, currency)}</strong>. Incurred expenditures plus active legal commitments amount to <strong>{formatCurrency(totalRunRate, currency)}</strong>, representing a net utilization velocity of <strong>{totalBurnRate.toFixed(1)}%</strong>.
            </p>
            <p>
              Pre-clearance compliance enforcement remains operational at 99.4% adherence. All pending requisitions exceeding $50,000 have completed multi-sig approval or have been frozen within the exception queue pending CFO discretionary sign-off.
            </p>
          </div>

          {/* Sign-off Stamps */}
          <div className="pt-4 border-t border-[#1E293B] grid grid-cols-2 gap-6 text-xs font-mono">
            <div className="p-3 bg-[#090D16] border border-[#1E293B] rounded">
              <span className="text-[10px] text-[#8c909f] uppercase">Group CFO Authorization</span>
              <div className="font-bold text-white mt-1">Marcus Vance, CFO</div>
              <div className="text-[10px] text-[#10B981] mt-0.5">Signature Validated: 0x94F2...3A19</div>
            </div>
            <div className="p-3 bg-[#090D16] border border-[#1E293B] rounded">
              <span className="text-[10px] text-[#8c909f] uppercase">Corporate Controller</span>
              <div className="font-bold text-white mt-1">Dr. Aris Thorne, VP Finance</div>
              <div className="text-[10px] text-[#10B981] mt-0.5">Signature Validated: 0x62B8...9F04</div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <TactileButton variant="surface" onClick={() => setPdfModalOpen(false)}>
              Close Preview
            </TactileButton>
            <TactileButton
              variant="primary"
              onClick={() => {
                window.print();
                setPdfModalOpen(false);
              }}
            >
              <span className="material-symbols-outlined text-[16px] mr-1">print</span>
              Print / Save as PDF
            </TactileButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
