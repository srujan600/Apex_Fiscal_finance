import { DatabaseSync } from 'node:sqlite';

/**
 * Seeds initial baseline corporate spend data matching the existing frontend expectations.
 * All monetary amounts are stored in cents (multiplied by 100).
 */
export function seedDatabase(db: DatabaseSync): void {
  // Check if already seeded
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count > 0) {
    return;
  }

  // 1. Seed Users (5 Personas)
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, title, avatar, department_id, spending_limit_cents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr_cfo',
    'Victoria Sterling',
    'victoria.sterling@apexfiscal.com',
    'CFO',
    'Group Chief Financial Officer',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    'dept-cld',
    5000000000 // $50,000,000
  );

  insertUser.run(
    'usr_fa',
    'Marcus Vance',
    'marcus.vance@apexfiscal.com',
    'FINANCE_ADMIN',
    'VP Treasury & Global Allocations',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    'dept-cld',
    1000000000 // $10,000,000
  );

  insertUser.run(
    'usr_dm',
    'Sarah Jenkins',
    'sarah.jenkins@apexfiscal.com',
    'DEPT_MANAGER',
    'VP of Platform Engineering',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    'dept-eng',
    200000000 // $2,000,000
  );

  insertUser.run(
    'usr_emp',
    'Alex Rivera',
    'alex.rivera@apexfiscal.com',
    'EMPLOYEE',
    'Principal Cloud Infrastructure Architect',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    'dept-cld',
    25000000 // $250,000
  );

  insertUser.run(
    'usr_sa',
    'Devon Thorne',
    'devon.thorne@apexfiscal.com',
    'SYSTEM_ADMIN',
    'Lead Compliance & Risk Systems Architect',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    'dept-eng',
    100000000 // $1,000,000
  );

  // 2. Seed Departments
  const insertDept = db.prepare(`
    INSERT INTO departments (id, code, name, lead_manager, manager_title, manager_avatar, headcount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertDept.run(
    'dept-eng',
    'CC-101-ENG',
    'Engineering - Platform Core',
    'Sarah Jenkins',
    'VP of Platform Engineering',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    142
  );

  insertDept.run(
    'dept-mkt',
    'CC-204-MKT',
    'Global Marketing',
    'Elena Rostova',
    'Chief Marketing Officer',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    48
  );

  insertDept.run(
    'dept-cld',
    'CC-302-CLD',
    'Infrastructure & Cloud Operations',
    'Michael Chang',
    'VP Cloud Architecture & Site Reliability',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    64
  );

  insertDept.run(
    'dept-sls',
    'CC-401-SLS',
    'Sales Operations & Commercial',
    'Jonathan Pierce',
    'Senior Vice President of Global Sales',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    95
  );

  // 3. Seed Sub-Teams
  const insertSubTeam = db.prepare(`
    INSERT INTO sub_teams (id, department_id, name, lead, spend_cents, members)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSubTeam.run('sub-1', 'dept-eng', 'Core Infrastructure & Kubernetes', 'Alex Rivera', 640000000, 48);
  insertSubTeam.run('sub-2', 'dept-eng', 'Search & Generative AI Research', 'Dr. Aris Thorne', 480000000, 32);
  insertSubTeam.run('sub-3', 'dept-eng', 'Frontend Applications & Design Sys', 'Elena Rostova', 293000000, 62);
  insertSubTeam.run('sub-4', 'dept-mkt', 'Global Brand & Enterprise Campaigns', 'Marcus Sterling', 380000000, 22);
  insertSubTeam.run('sub-5', 'dept-mkt', 'Field Events & Developer Relations', 'Maya Lin', 220000000, 16);
  insertSubTeam.run('sub-6', 'dept-mkt', 'Product Marketing & Analysts', 'David Vance', 109600000, 10);
  insertSubTeam.run('sub-7', 'dept-cld', 'Multi-Cloud Transit & Telemetry', 'Sarah Chen', 540000000, 28);
  insertSubTeam.run('sub-8', 'dept-cld', 'Database Reliability & Snowflake', 'Vikram Patel', 420000000, 20);
  insertSubTeam.run('sub-9', 'dept-cld', 'Zero-Trust Network Access', 'John Bradley', 179600000, 16);
  insertSubTeam.run('sub-10', 'dept-sls', 'Enterprise Strategic Accounts', 'Rachel Scott', 390000000, 45);

  // 4. Seed Department Primary Vendors
  const insertVendor = db.prepare(`INSERT INTO department_vendors (department_id, vendor_name) VALUES (?, ?)`);
  ['Amazon Web Services', 'OpenAI', 'Datadog', 'GitHub Enterprise'].forEach((v) => insertVendor.run('dept-eng', v));
  ['Gartner', 'Google Ads', 'HubSpot', 'Salesforce'].forEach((v) => insertVendor.run('dept-mkt', v));
  ['Snowflake', 'Cloudflare', 'HashiCorp', 'PagerDuty'].forEach((v) => insertVendor.run('dept-cld', v));

  // 5. Seed Spend Categories
  const insertCat = db.prepare(`
    INSERT INTO categories (id, code, name, allocated_cents, spent_cents, committed_cents, risk_level, threshold_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertCat.run('cat-cld', 'CAT-CLOUD-01', 'Cloud Infrastructure & Compute', 1850000000, 1420000000, 290000000, 'HIGH_RISK', 92.4);
  insertCat.run('cat-saas', 'CAT-SAAS-02', 'Enterprise SaaS & Licenses', 920000000, 610000000, 180000000, 'ATTENTION', 85.8);
  insertCat.run('cat-cpx', 'CAT-CAPEX-03', 'Capital Equipment & Hardware', 840000000, 450000000, 160000000, 'HEALTHY', 72.6);
  insertCat.run('cat-adv', 'CAT-PROF-04', 'Consulting & Legal Retainers', 640000000, 360000000, 95000000, 'HEALTHY', 71.1);
  insertCat.run('cat-mkt', 'CAT-MKT-05', 'GTM Campaigns & Events', 600000000, 430000000, 125000000, 'HIGH_RISK', 92.5);

  // 6. Seed Budgets
  const insertBudget = db.prepare(`
    INSERT INTO budgets (
      id, code, department_id, department_name, fiscal_period,
      allocated_cents, actual_settled_cents, committed_cents, available_cents,
      utilization_rate, projected_overrun_cents, risk_level, days_to_run_out,
      lead_manager, warning_threshold_pct, hard_cap_threshold_pct
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBudget.run(
    'bgt-eng',
    'BGT-2025-ENG',
    'dept-eng',
    'Engineering - Platform Core',
    'Q3-2025',
    1500000000, // $15,000,000
    1170000000, // $11,700,000
    243000000,  // $2,430,000
    87000000,   // $870,000
    94.2,
    115000000,  // $1,150,000
    'CRITICAL_BREACH',
    11,
    'Sarah Jenkins',
    85.0,
    100.0
  );

  insertBudget.run(
    'bgt-mkt',
    'BGT-2025-MKT',
    'dept-mkt',
    'Global Marketing',
    'Q3-2025',
    800000000,  // $8,000,000
    520000000,  // $5,200,000
    189600000,  // $1,896,000
    90400000,   // $904,000
    88.7,
    42000000,   // $420,000
    'ATTENTION',
    24,
    'Elena Rostova',
    85.0,
    100.0
  );

  insertBudget.run(
    'bgt-cld',
    'BGT-2025-CLD',
    'dept-cld',
    'Infrastructure & Cloud Operations',
    'Q3-2025',
    1400000000, // $14,000,000
    980000000,  // $9,800,000
    159600000,  // $1,596,000
    260400000,  // $2,604,000
    81.4,
    0,
    'HEALTHY',
    48,
    'Michael Chang',
    85.0,
    100.0
  );

  insertBudget.run(
    'bgt-sls',
    'BGT-2025-SLS',
    'dept-sls',
    'Sales Operations & Commercial',
    'Q3-2025',
    1150000000, // $11,500,000
    600000000,  // $6,000,000
    137150000,  // $1,371,500
    412850000,  // $4,128,500
    64.1,
    0,
    'HEALTHY',
    85,
    'Jonathan Pierce',
    85.0,
    100.0
  );

  // 7. Seed Spending Requests
  const insertReq = db.prepare(`
    INSERT INTO spending_requests (
      id, tracking_number, category, category_id, department_id, department_name,
      amount_cents, vendor, business_purpose, requested_by, requestor_role,
      submitted_at, status, risk_level, rule_triggered, policy_reason,
      pre_commitment_util, post_commitment_util, has_attachment
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReq.run(
    'req-9418',
    'REQ-9418',
    'Cloud Infra / AWS Reserved',
    'cat-cld',
    'dept-eng',
    'Engineering - Platform Core',
    24000000, // $240,000
    'Amazon Web Services',
    'Data pipeline expansion Q3 · Cross-region failover cluster.',
    'Alex Rivera',
    'Principal Cloud Architect',
    'Today, 08:30 AM',
    'BLOCKED',
    'CRITICAL_BREACH',
    'RULE-ENG-08 (Hard Stop)',
    'Requisition causes Engineering quarterly commitment to exceed $15.0M ceiling.',
    94.2,
    101.8,
    1
  );

  insertReq.run(
    'req-9415',
    'REQ-9415',
    'Enterprise SaaS & Licenses',
    'cat-saas',
    'dept-eng',
    'Engineering - Platform Core',
    8500000, // $85,000
    'Datadog Enterprise APM',
    'Observability agent expansion for 120 Kubernetes nodes.',
    'Sarah Jenkins',
    'VP Engineering',
    'Today, 06:14 AM',
    'PENDING_APPROVAL',
    'HIGH_RISK',
    'RULE-ENG-05 (Level-2 VP Signoff)',
    'Amount exceeds $50k single-item threshold; headroom remains valid.',
    93.6,
    94.2,
    1
  );

  insertReq.run(
    'req-9409',
    'REQ-9409',
    'GTM Campaigns & Events',
    'cat-mkt',
    'dept-mkt',
    'Global Marketing',
    4500000, // $45,000
    'Gartner Research Subscriptions',
    'Magic Quadrant advisory reports and customer sentiment data.',
    'Elena Rostova',
    'CMO',
    'Yesterday, 04:20 PM',
    'APPROVED',
    'HEALTHY',
    'RULE-MKT-01 (Standard Pre-Clearance)',
    'Within approved discretionary advisory quota.',
    88.1,
    88.7,
    1
  );

  // 8. Seed Exception Incidents
  const insertEx = db.prepare(`
    INSERT INTO exception_incidents (
      id, incident_code, request_id, timestamp, detection_source,
      department, sub_department, vendor, business_purpose, violation_detail,
      commitment_value_cents, breach_classification, rule_code, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEx.run(
    'ex-9042',
    '#EX-9042',
    'req-9418',
    '14m ago',
    'SysGuard L9 Engine',
    'Engineering',
    'Platform AI Core',
    'OpenAI API Compute Expansion',
    'LLM fine-tuning and inference cluster token commitments for sovereign search.',
    'Exceeds AI Research Sub-cap by $120k. Causes departmental envelope to hit 96.5%.',
    34000000, // $340,000
    'CRITICAL_EXCEPTION',
    'RULE-ENG-08',
    'PENDING_DECISION'
  );

  insertEx.run(
    'ex-9038',
    '#EX-9038',
    null,
    '1h 02m ago',
    'AP-Router Sentinel',
    'Global Marketing',
    'Event Ops Tier 2',
    'Global Sales Kickoff Venue Deposit',
    'Hotel and conference center non-refundable deposit for Annual Americas Kickoff.',
    'Out-of-cycle commitment without VP Pre-clearance. Variance warning (+14.2% vs baseline).',
    18500000, // $185,000
    'WARNING_AUDIT',
    'RULE-MKT-03',
    'PENDING_DECISION'
  );

  insertEx.run(
    'ex-9031',
    '#EX-9031',
    null,
    '2h 45m ago',
    'Auto-Detect Ledger',
    'Infrastructure & Cloud',
    'Analytics Infrastructure',
    'Snowflake Enterprise Capacity Add-on',
    'Annual enterprise data lake auto-scaling credit expansion.',
    'Department utilization threshold breach (91.2%). Pre-approved escalation path available.',
    12000000, // $120,000
    'POLICY_OVERRIDE',
    'RULE-INFRA-02',
    'PENDING_DECISION'
  );

  insertEx.run(
    'ex-9024',
    '#EX-9024',
    null,
    '3h 11m ago',
    'HardStop Enforcer',
    'InfoSec & Compliance',
    'Identity & Access Mgmt',
    'Hardware Security Modules (HSM) Vault',
    'FIPS 140-3 Level 4 physical cryptographic signing modules.',
    'Unscheduled CapEx outside standard quarterly procurement window.',
    19500000, // $195,000
    'CRITICAL_EXCEPTION',
    'RULE-SEC-01',
    'PENDING_DECISION'
  );

  // 9. Seed Policy Rules
  const insertRule = db.prepare(`
    INSERT INTO policy_rules (
      id, code, name, condition_expression, threshold_value_cents,
      action_required, target_entity, status, latency_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRule.run(
    'pol-1',
    'RULE-ENG-08',
    'Hard Ceiling Auto-Lockdown',
    'IF post_commitment_utilization > 100%',
    100, // 100%
    'AUTO_BLOCK',
    'All Departments',
    'ACTIVE',
    14
  );

  insertRule.run(
    'pol-2',
    'RULE-ENG-05',
    'High-Velocity Spend Multi-Sig Gate',
    'IF single_requisition_amount > $50,000',
    5000000, // $50,000
    'REQUIRE_CFO_OVERRIDE',
    'Engineering & Product',
    'ACTIVE',
    12
  );

  insertRule.run(
    'pol-3',
    'RULE-PREDICT-01',
    'Monte Carlo Breach Horizon Warning',
    'IF projected_run_rate_breach < 30_days',
    30,
    'WARN_AUDIT',
    'Global Enterprise Vault',
    'ACTIVE',
    18
  );

  // 10. Seed Audit Events
  const insertAudit = db.prepare(`
    INSERT INTO audit_events (
      id, block_number, tx_hash, prev_hash, timestamp, actor, actor_role,
      action, entity, entity_id, old_value, new_value, reason, verified_nodes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    'aud-8941204',
    8941204,
    '0x9f1a8e4c7d8a94b2e106c014fa231',
    '0x3c71a9b20e184fa98d02e88a0b5c1',
    '2 mins ago',
    'Victoria Sterling',
    'CFO',
    'POLICY_OVERRIDE_EXECUTED',
    'Requisition',
    '#REQ-9402',
    'STATUS: BLOCKED (102.4% Util)',
    'STATUS: APPROVED_OVERRIDE (Offset: Cloud Ops Reserves)',
    'Critical mission-essential failover cluster before Q3 freeze.',
    '12/12 Consensus'
  );

  insertAudit.run(
    'aud-8941203',
    8941203,
    '0x3c71a9b20e184fa98d02e88a0b5c1',
    '0x629ab48102d1847e90c74a123eb40',
    '18 mins ago',
    'SysGuard L9 Daemon',
    'SYSTEM_ADMIN',
    'AUTO_BLOCK_TRIGGERED',
    'Exception Incident',
    '#EX-9042',
    'STATUS: EVALUATING',
    'STATUS: HARD_STOP_ACTIVE',
    'Proposed OpenAI spend causes Engineering cap breach ($15.0M ceiling).',
    '12/12 Consensus'
  );

  insertAudit.run(
    'aud-8941202',
    8941202,
    '0x629ab48102d1847e90c74a123eb40',
    null,
    '42 mins ago',
    'Marcus Vance',
    'FINANCE_ADMIN',
    'BUDGET_REALLOCATION_LOGGED',
    'Department Budget',
    'BGT-2025-SLS',
    'AVAILABLE: $4,628,500',
    'AVAILABLE: $4,128,500 (Transferred $500k to Contingency)',
    'Board-mandated buffer preservation directive.',
    '12/12 Consensus'
  );

  // 11. Seed System Settings
  db.exec(`
    INSERT OR IGNORE INTO system_settings (id, is_emergency_freeze_active, inr_exchange_rate)
    VALUES ('global', 0, 83.0);
  `);
}
