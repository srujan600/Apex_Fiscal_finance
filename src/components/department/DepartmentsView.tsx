import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { ThresholdMeter } from '../ui/ThresholdMeter';
import { TactileButton } from '../ui/TactileButton';
import { Modal } from '../ui/Modal';
import { api, DepartmentDetail } from '../../services/api';

const baselineDepartments: DepartmentDetail[] = [
    {
      id: 'dept-eng',
      name: 'Engineering - Platform Core',
      code: 'CC-101-ENG',
      leadManager: 'Sarah Jenkins',
      managerTitle: 'VP of Platform Engineering',
      managerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      headcount: 142,
      allocated: 15000000,
      settled: 11700000,
      committed: 2430000,
      riskLevel: 'CRITICAL_BREACH',
      subTeams: [
        { name: 'Core Infrastructure & Kubernetes', lead: 'Alex Rivera', spend: 6400000, members: 48 },
        { name: 'Search & Generative AI Research', lead: 'Dr. Aris Thorne', spend: 4800000, members: 32 },
        { name: 'Frontend Applications & Design Sys', lead: 'Elena Rostova', spend: 2930000, members: 62 },
      ],
      primaryVendors: ['Amazon Web Services', 'OpenAI', 'Datadog', 'GitHub Enterprise'],
    },
    {
      id: 'dept-mkt',
      name: 'Global Marketing',
      code: 'CC-204-MKT',
      leadManager: 'Elena Rostova',
      managerTitle: 'Chief Marketing Officer',
      managerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      headcount: 48,
      allocated: 8000000,
      settled: 5200000,
      committed: 1896000,
      riskLevel: 'ATTENTION',
      subTeams: [
        { name: 'Global Brand & Enterprise Campaigns', lead: 'Marcus Sterling', spend: 3800000, members: 22 },
        { name: 'Field Events & Developer Relations', lead: 'Maya Lin', spend: 2200000, members: 16 },
        { name: 'Product Marketing & Analysts', lead: 'David Vance', spend: 1096000, members: 10 },
      ],
      primaryVendors: ['Gartner', 'Google Ads', 'HubSpot', 'Salesforce'],
    },
    {
      id: 'dept-cld',
      name: 'Infrastructure & Cloud Operations',
      code: 'CC-302-CLD',
      leadManager: 'Michael Chang',
      managerTitle: 'VP Cloud Architecture & Site Reliability',
      managerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      headcount: 64,
      allocated: 14000000,
      settled: 9800000,
      committed: 1596000,
      riskLevel: 'HEALTHY',
      subTeams: [
        { name: 'Multi-Cloud Transit & Telemetry', lead: 'Sarah Chen', spend: 5400000, members: 28 },
        { name: 'Database Reliability & Snowflake', lead: 'Vikram Patel', spend: 4200000, members: 20 },
        { name: 'Zero-Trust Network Access', lead: 'John Bradley', spend: 1796000, members: 16 },
      ],
      primaryVendors: ['Snowflake', 'Cloudflare', 'HashiCorp', 'PagerDuty'],
    },
    {
      id: 'dept-sls',
      name: 'Sales Operations & Commercial',
      code: 'CC-401-SLS',
      leadManager: 'Jonathan Pierce',
      managerTitle: 'Senior Vice President of Global Sales',
      managerAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
      headcount: 95,
      allocated: 11500000,
      settled: 6000000,
      committed: 1371500,
      riskLevel: 'HEALTHY',
      subTeams: [
        { name: 'Enterprise Strategic Accounts', lead: 'Rachel Scott', spend: 3900000, members: 45 },
        { name: 'Sales Enablement & Compensation', lead: 'Brian Miller', spend: 2100000, members: 25 },
        { name: 'Revenue Intelligence & Analytics', lead: 'Jessica Wu', spend: 1371500, members: 25 },
      ],
      primaryVendors: ['Gong.io', 'ZoomInfo', 'Salesforce', 'LinkedIn Sales Nav'],
    },
  ];

export const DepartmentsView: React.FC = () => {
  const { currency, setActiveTab } = useApp();
  const [selectedDept, setSelectedDept] = useState<DepartmentDetail | null>(null);
  const [departments, setDepartments] = useState<DepartmentDetail[]>(baselineDepartments);

  useEffect(() => {
    api.getDepartments()
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setDepartments(data);
        }
      })
      .catch((err) => {
        console.warn('Backend departments fetch fallback to baseline:', err.message);
      });
  }, []);

  const totalHeadcount = departments.reduce((acc, d) => acc + d.headcount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
              Corporate Hierarchy
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-medium">ORGANIZATION MAP</span>
          </div>
          <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight mt-1">
            Cost Centers & Department Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational hierarchy, headcount distribution, designated lead approvers, and risk posture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TactileButton variant="surface" icon="account_balance" onClick={() => setActiveTab('budgets')}>
            View Master Allocations
          </TactileButton>
        </div>
      </div>

      {/* Organization Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">TOTAL COST CENTERS</span>
          <span className="text-xl font-mono font-bold text-slate-900 block mt-1">4 Active Units</span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">100% Policy Bound</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">GLOBAL HEADCOUNT</span>
          <span className="text-xl font-mono font-bold text-blue-600 block mt-1">{totalHeadcount} FTEs</span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Active Requisitioners</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">AVERAGE BURN PER FTE</span>
          <span className="text-xl font-mono font-bold text-indigo-600 block mt-1">
            {formatCurrency(Math.round(142400 / (totalHeadcount || 1)), currency, 'compact')}/day
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Blended run-rate</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">BREACH RISK CONCENTRATION</span>
          <span className="text-xl font-mono font-bold text-rose-600 block mt-1">1 Critical Center</span>
          <span className="text-[10px] font-mono text-rose-600 block mt-0.5 font-medium">Engineering Core (94.2%)</span>
        </div>
      </div>

      {/* Departments Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {departments.map((dept) => {
          const inFlight = dept.settled + dept.committed;
          const utilRate = (inFlight / dept.allocated) * 100;
          const available = dept.allocated - inFlight;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Department Header */}
                <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                        {dept.code}
                      </span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">
                        {dept.headcount} Members
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                      {dept.name}
                    </h2>
                  </div>
                  <StatusBadge status={dept.riskLevel} />
                </div>

                {/* Manager Information Lockup */}
                <div className="flex items-center gap-3 my-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <img
                    src={dept.managerAvatar}
                    alt={dept.leadManager}
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">{dept.leadManager}</span>
                    <span className="text-[10px] font-mono text-slate-500 block">{dept.managerTitle}</span>
                  </div>
                </div>

                {/* Budget Utilization Breakdown */}
                <div className="space-y-2 mb-3.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Current Utilization:</span>
                    <span className="font-bold text-slate-900">
                      {utilRate.toFixed(1)}% ({formatCurrency(inFlight, currency, 'compact')} / {formatCurrency(dept.allocated, currency, 'compact')})
                    </span>
                  </div>

                  <ThresholdMeter
                    allocated={dept.allocated}
                    settled={dept.settled}
                    committed={dept.committed}
                    height="md"
                    showLabels={false}
                  />

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                    <div>
                      <span className="text-slate-400 block font-medium">Settled Disbursed:</span>
                      <span className="text-slate-900 font-semibold">{formatCurrency(dept.settled, currency, 'compact')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block font-medium">Available Headroom:</span>
                      <span className="text-emerald-600 font-bold">{formatCurrency(available, currency, 'compact')}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Vendors */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-2 font-semibold">
                    Primary Counterparty Commitments
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dept.primaryVendors.map((vendor, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-50 text-slate-700 border border-slate-200/80"
                      >
                        {vendor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3.5 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 font-medium">
                  Sub-Teams: {dept.subTeams.length} units
                </span>
                <TactileButton variant="surface" size="sm" onClick={() => setSelectedDept(dept)}>
                  Cost Center Dossier
                </TactileButton>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Detail Modal */}
      {selectedDept && (
        <Modal
          isOpen={!!selectedDept}
          onClose={() => setSelectedDept(null)}
          title={`Cost Center Governance: ${selectedDept.name}`}
          subtitle={`${selectedDept.code} · ${selectedDept.headcount} FTEs · Lead: ${selectedDept.leadManager}`}
          badge={selectedDept.riskLevel}
          badgeVariant={selectedDept.riskLevel === 'CRITICAL_BREACH' ? 'destructive' : 'primary'}
          maxWidth="lg"
          footer={
            <TactileButton variant="surface" onClick={() => setSelectedDept(null)}>
              Close Dossier
            </TactileButton>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                Sub-Team Organizational Hierarchy & Allocation
              </span>
              <div className="space-y-2">
                {selectedDept.subTeams.map((sub, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <span className="text-slate-900 font-semibold block">{sub.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Lead: {sub.lead} · {sub.members} Members
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(sub.spend, currency, 'compact')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-600">
              <span>Cost Center Authority: Pre-clearance required on all requisitions exceeding ₹20,75,000 (INR).</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
