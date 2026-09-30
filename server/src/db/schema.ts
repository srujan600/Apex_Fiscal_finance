import { DatabaseSync } from 'node:sqlite';

/**
 * Initializes all database tables, relations, and indexes.
 */
export function initSchema(db: DatabaseSync): void {
  db.exec(`
    -- Users table for authentication and RBAC limits
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('CFO', 'FINANCE_ADMIN', 'DEPT_MANAGER', 'EMPLOYEE', 'SYSTEM_ADMIN')),
      title TEXT NOT NULL,
      avatar TEXT NOT NULL,
      department_id TEXT,
      spending_limit_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Departments / Cost Centers table
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      lead_manager TEXT NOT NULL,
      manager_title TEXT NOT NULL,
      manager_avatar TEXT NOT NULL,
      headcount INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Sub-teams within departments
    CREATE TABLE IF NOT EXISTS sub_teams (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      lead TEXT NOT NULL,
      spend_cents INTEGER NOT NULL DEFAULT 0,
      members INTEGER NOT NULL DEFAULT 1
    );

    -- Department primary vendors
    CREATE TABLE IF NOT EXISTS department_vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      vendor_name TEXT NOT NULL,
      UNIQUE(department_id, vendor_name)
    );

    -- Spend Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      allocated_cents INTEGER NOT NULL DEFAULT 0,
      spent_cents INTEGER NOT NULL DEFAULT 0,
      committed_cents INTEGER NOT NULL DEFAULT 0,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('HEALTHY', 'ATTENTION', 'HIGH_RISK', 'CRITICAL_BREACH')) DEFAULT 'HEALTHY',
      threshold_percent REAL NOT NULL DEFAULT 85.0
    );

    -- Budget Envelopes table
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      department_id TEXT NOT NULL REFERENCES departments(id),
      department_name TEXT NOT NULL,
      fiscal_period TEXT NOT NULL DEFAULT 'Q3-2025',
      allocated_cents INTEGER NOT NULL DEFAULT 0,
      actual_settled_cents INTEGER NOT NULL DEFAULT 0,
      committed_cents INTEGER NOT NULL DEFAULT 0,
      available_cents INTEGER NOT NULL DEFAULT 0,
      utilization_rate REAL NOT NULL DEFAULT 0.0,
      projected_overrun_cents INTEGER NOT NULL DEFAULT 0,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('HEALTHY', 'ATTENTION', 'HIGH_RISK', 'CRITICAL_BREACH')) DEFAULT 'HEALTHY',
      days_to_run_out INTEGER NOT NULL DEFAULT 90,
      lead_manager TEXT NOT NULL,
      warning_threshold_pct REAL NOT NULL DEFAULT 85.0,
      hard_cap_threshold_pct REAL NOT NULL DEFAULT 100.0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Spending Requests / Requisitions table
    CREATE TABLE IF NOT EXISTS spending_requests (
      id TEXT PRIMARY KEY,
      tracking_number TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id),
      department_id TEXT NOT NULL REFERENCES departments(id),
      department_name TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
      vendor TEXT NOT NULL,
      business_purpose TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      requestor_role TEXT NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL CHECK(status IN ('PRE_CLEARED', 'PENDING_APPROVAL', 'APPROVED', 'APPROVED_OVERRIDE', 'BLOCKED', 'REJECTED')),
      risk_level TEXT NOT NULL CHECK(risk_level IN ('HEALTHY', 'ATTENTION', 'HIGH_RISK', 'CRITICAL_BREACH')),
      rule_triggered TEXT,
      policy_reason TEXT,
      pre_commitment_util REAL NOT NULL DEFAULT 0.0,
      post_commitment_util REAL NOT NULL DEFAULT 0.0,
      has_attachment INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Exceptions table for policy breaches & sovereign override triage
    CREATE TABLE IF NOT EXISTS exception_incidents (
      id TEXT PRIMARY KEY,
      incident_code TEXT UNIQUE NOT NULL,
      request_id TEXT REFERENCES spending_requests(id),
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      detection_source TEXT NOT NULL DEFAULT 'SysGuard L9 Engine',
      department TEXT NOT NULL,
      sub_department TEXT NOT NULL,
      vendor TEXT NOT NULL,
      business_purpose TEXT NOT NULL,
      violation_detail TEXT NOT NULL,
      commitment_value_cents INTEGER NOT NULL,
      breach_classification TEXT NOT NULL CHECK(breach_classification IN ('CRITICAL_EXCEPTION', 'WARNING_AUDIT', 'POLICY_OVERRIDE', 'CAPEX_UNSCHEDULED')),
      rule_code TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PENDING_DECISION', 'OVERRIDDEN', 'ENFORCED_REJECTED')) DEFAULT 'PENDING_DECISION',
      override_justification TEXT,
      offset_source TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Policy Rules table
    CREATE TABLE IF NOT EXISTS policy_rules (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      condition_expression TEXT NOT NULL,
      threshold_value_cents INTEGER NOT NULL,
      action_required TEXT NOT NULL CHECK(action_required IN ('AUTO_BLOCK', 'REQUIRE_CFO_OVERRIDE', 'REQUIRE_MANAGER', 'WARN_AUDIT')),
      target_entity TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'PAUSED')) DEFAULT 'ACTIVE',
      latency_ms INTEGER NOT NULL DEFAULT 14,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Cryptographic Internal Audit Trail table (append-only)
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      block_number INTEGER UNIQUE NOT NULL,
      tx_hash TEXT UNIQUE NOT NULL,
      prev_hash TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      actor TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_value TEXT NOT NULL,
      new_value TEXT NOT NULL,
      reason TEXT NOT NULL,
      verified_nodes TEXT NOT NULL DEFAULT '12/12 Consensus'
    );

    -- System Configuration & Emergency Killswitch table
    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY DEFAULT 'global',
      is_emergency_freeze_active INTEGER NOT NULL DEFAULT 0,
      inr_exchange_rate REAL NOT NULL DEFAULT 83.0,
      slack_webhook TEXT NOT NULL DEFAULT 'https://hooks.slack.com/services/T000/B000/apex-spend-guard',
      pagerduty_key TEXT NOT NULL DEFAULT 'pd-live-9a2c4e88102f9',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Aczen Nova Advisory Insights Cache table
    CREATE TABLE IF NOT EXISTS ai_insights (
      id TEXT PRIMARY KEY,
      context_type TEXT NOT NULL,
      context_id TEXT,
      prompt_summary TEXT NOT NULL,
      insight_text TEXT NOT NULL,
      model_version TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_budgets_dept ON budgets(department_id);
    CREATE INDEX IF NOT EXISTS idx_spending_status ON spending_requests(status);
    CREATE INDEX IF NOT EXISTS idx_spending_dept ON spending_requests(department_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exception_incidents(status);
    CREATE INDEX IF NOT EXISTS idx_audit_block ON audit_events(block_number DESC);
  `);
}
