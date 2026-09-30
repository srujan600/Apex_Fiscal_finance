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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E2D4A]/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/30">
              Corporate Hierarchy
            </span>
            <span className="text-[11px] font-mono text-[#8c909f]">ORGANIZATION MAP</span>
          </div>
          <h1 className="text-xl md:text-2xl text-white font-semibold tracking-tight mt-1">
            Cost Centers & Department Governance
          </h1>
          <p className="text-xs text-[#8c909f] mt-0.5">
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
        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">TOTAL COST CENTERS</span>
          <span className="text-xl font-mono font-bold text-white block mt-1">4 Active Units</span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">100% Policy Bound</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">GLOBAL HEADCOUNT</span>
          <span className="text-xl font-mono font-bold text-[#3B82F6] block mt-1">{totalHeadcount} FTEs</span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">Active Requisitioners</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">AVERAGE BURN PER FTE</span>
          <span className="text-xl font-mono font-bold text-[#818CF8] block mt-1">
            {formatCurrency(142400 / totalHeadcount, currency, 'compact')}/day
          </span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">Blended run-rate</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">BREACH RISK CONCENTRATION</span>
          <span className="text-xl font-mono font-bold text-[#ff8093] block mt-1">1 Critical Center</span>
          <span className="text-[10px] font-mono text-[#ff8093] block mt-0.5">Engineering Core (94.2%)</span>
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
              className="tactile-tier-1 rounded-xl p-5 border border-[#1E2D4A] hover:border-[#3B82F6]/50 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Department Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1E2D4A]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#3B82F6] uppercase">
                        {dept.code}
                      </span>
                      <span className="text-xs text-[#8c909f]">·</span>
                      <span className="text-[10px] font-mono text-[#8c909f]">
                        {dept.headcount} Members
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-white tracking-tight mt-0.5">
                      {dept.name}
                    </h2>
                  </div>
                  <StatusBadge status={dept.riskLevel} />
                </div>

                {/* Manager Information Lockup */}
                <div className="flex items-center gap-3 my-3.5 p-2.5 rounded bg-[#090D16] border border-[#1E2D4A]">
                  <img
                    src={dept.managerAvatar}
                    alt={dept.leadManager}
                    className="w-9 h-9 rounded-full border border-[#3B82F6]/40 object-cover"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">{dept.leadManager}</span>
                    <span className="text-[10px] font-mono text-[#8c909f] block">{dept.managerTitle}</span>
                  </div>
                </div>

                {/* Budget Utilization Breakdown */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8c909f]">Current Utilization:</span>
                    <span className="font-bold text-white">
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
                      <span className="text-[#8c909f] block">Settled Disbursed:</span>
                      <span className="text-white font-medium">{formatCurrency(dept.settled, currency, 'compact')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#8c909f] block">Available Headroom:</span>
                      <span className="text-[#10B981] font-bold">{formatCurrency(available, currency, 'compact')}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Vendors */}
                <div className="pt-2 border-t border-[#1E2D4A]/60">
                  <span className="text-[10px] font-mono text-[#8c909f] uppercase block mb-1.5">
                    Primary Counterparty Commitments
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dept.primaryVendors.map((vendor, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#131E36] text-[#c2c6d6] border border-[#1E2D4A]"
                      >
                        {vendor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3.5 border-t border-[#1E2D4A] mt-4 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#8c909f]">
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
            <div className="p-3 bg-[#090D16] border border-[#1E2D4A] rounded space-y-2">
              <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
                Sub-Team Organizational Hierarchy & Allocation
              </span>
              <div className="space-y-2">
                {selectedDept.subTeams.map((sub, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-[#0D1526] border border-[#1E2D4A] flex items-center justify-between"
                  >
                    <div>
                      <span className="text-white font-medium block">{sub.name}</span>
                      <span className="text-[10px] text-[#8c909f] font-mono">
                        Lead: {sub.lead} · {sub.members} Members
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(sub.spend, currency, 'compact')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded bg-[#131E36]/40 border border-[#2A3E66] text-xs font-mono text-[#8c909f]">
              <span>Cost Center Authority: Pre-clearance required on all requisitions exceeding $25,000 USD.</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
