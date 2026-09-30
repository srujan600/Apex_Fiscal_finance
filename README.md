# APEX FISCAL | Corporate Spend Control & Budget Enforcement System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-000000.svg)](https://expressjs.com/)
[![Aczen Nova AI](https://img.shields.io/badge/AI%20Copilot-Aczen%20Nova-8B5CF6.svg)](#aczen-nova-ai-copilot-integration)
[![Tests](https://img.shields.io/badge/Tests-88%20Passing-10B981.svg)](#automated-testing-suite)
[![SOX Compliant](https://img.shields.io/badge/Governance-SOX%20404%20%2F%20GAAS-10B981.svg)](#)

> **Apex Fiscal (SpendGuard L4 Core)** is an enterprise-grade corporate spend governance, real-time budget enforcement, and autonomous risk mitigation system designed for CFOs, treasury leaders, and department managers.
>
> Built in strict fidelity to the **Google Stitch** tactile design language, the system enforces the operational paradigm:  
> $$\mathbf{CONTROL} \longrightarrow \mathbf{RISK} \longrightarrow \mathbf{ACTION}$$

---

## Key Capabilities & Highlights

- **Aczen Nova AI Copilot:** Native conversational intelligence powered by Aczen Nova (`NOVA_API_KEY`) with intent routing across live general ledgers, department burn analytics, vendor exposures, pre-clearance simulation, and policy rules.
- **Continuous Spend Lineage & Breach Trajectory:** Interactive Recharts `ComposedChart` featuring actual settled spend, committed orders, and dynamic forward trajectories across 4 macroeconomic scenarios with calendar breach estimations.
- **Deterministic Pre-Clearance Sandbox:** Sub-15ms pre-clearance engine comparing proposed purchase amounts against real-time envelope capacity before commitment.
- **Dual Currency Engine:** Real-time toggle between USD ($ Millions/Thousands) and INR (₹ Lakhs/Crores) across all metrics, tables, meters, and charts.
- **Cryptographic Audit Trail:** SHA-256 hash-chained append-only transaction ledger with tamper verification and PBFT state diff inspector.
- **5-Persona RBAC Governance:** Granular permission boundaries for `CFO`, `FINANCE_ADMIN`, `DEPT_MANAGER`, `EMPLOYEE`, and `SYSTEM_ADMIN`.
- **Global Outflow Killswitch:** Discretionary enterprise-wide emergency spend freeze protocol with dual-confirmation safeguards.
- **88-Test Verification Suite:** 100% automated test coverage across data domains, auth, concurrency, policy evaluation, forecasting, and AI resilience.

---

## Aczen Nova AI Copilot Integration

The system features an integrated executive AI assistant powered by **Aczen Nova**:

### Architecture & Capabilities
- **Runtime Environment Security:** Uses `process.env.NOVA_API_KEY` configured in `.env` with strict runtime presence validation; fails gracefully with structured fallbacks if unconfigured.
- **Natural Language Intent Router:** Directs user queries to dedicated handlers:
  - `DEPARTMENT_SPEND_ANALYSIS`: Live analysis of all 8 departments (e.g., identifying Finance & Accounts at ₹1.18 Cr / 124.3% utilization vs. Engineering at ₹1.05 Cr).
  - `VENDOR_SPEND_ANALYSIS`: Vendor concentration, contract run-rates, and renegotiation exposure.
  - `PRE_CLEARANCE_SIMULATION`: Real-time hypothetical requisition evaluation before submission.
  - `ACZEN_NOVA_LIVE_BOOKS`: Real-time general ledger synthesis across cost envelopes.
  - `BUDGET_QUERY`: Headroom, burn rate, and days-to-exhaustion inquiries.
  - `FORECAST_SCENARIO`: Macroeconomic sensitivity evaluations.
  - `POLICY_GOVERNANCE`: Statutory gate checks and approval requirement inquiries.
- **Dual Streaming & REST Endpoints:** Exposes both Server-Sent Events (SSE) streaming (`POST /api/ai/agent/stream`) for typewriter-smooth responses and synchronous JSON (`POST /api/ai/agent`).
- **Interactive UI Widget:** Persistent floating Copilot modal (`NovaCopilotWidget.tsx`) with quick-action prompts, copy-to-clipboard, markdown formatting, and clear conversational history.

---

## Continuous Spend Lineage & Scenario Engine

The primary dashboard features a dynamic predictive Recharts `ComposedChart` tracking the fiscal timeline from Q3 through Q4 (`Jul 01` $\to$ `Today (Sept 30)` $\to$ `Dec 31`):

| Scenario Toggle | Burn Rate Multiplier | Breach Date | Year-End Spend | Risk Level |
|---|---|---|---|---|
| **Baseline Model** | $1.00\times$ | Nov 18 (49d left) | $52.8M | Warning (Amber) |
| **+5% Inflation** | $1.05\times$ | Nov 04 (35d left) | $55.4M | Elevated Risk (Orange) |
| **Hiring Surge** | $1.12\times$ | Oct 28 (28d left) | $58.8M | Critical Breach (Red) |
| **Renegotiation** | $0.94\times$ | Dec 08 (69d left) | $49.3M | Controlled (Emerald) |

- **Anchored Forward Projections:** Seamless transition at `Today (Sept 30)` from historical settled spend ($36.4M) and committed orders ($38.2M) into forward trajectory curves.
- **Visual Feedback:** Instant curve reshaping, color shifts, and breach status badge updates upon toggling scenario options.

---

## Workspace Navigation & View Suite

The application includes 11 dedicated, fully interactive executive views:

### 1. Control Center (`DashboardView`)
- **Executive KPI Telemetry:** Approved Corporate Ceiling ($48.5M / ₹402.55 Cr), Burn Velocity ($142.4k/day), Projected Fiscal Variance (-$1.85M deficit risk with breach horizon), and Active Critical Exceptions.
- **Continuous Spend Lineage Chart:** Multi-scenario trajectory graph with hard ceiling reference line ($48.5M).
- **Department Risk Matrix:** Multi-segment utilization gauges and triage shortcuts for all cost centers.
- **Pre-Clearance Sandbox:** Instant simulation testing synthetic amounts against live budgets with sub-20ms latency.
- **Critical Exception Ledger:** Tabular incident matrix with justification dossiers and one-click rejection / override actions.

### 2. Budget Allocation (`BudgetsView`)
- Multi-center budget list ledger with live search and risk filters (`HEALTHY`, `ATTENTION`, `CRITICAL_BREACH`).
- Threshold utilization meters, projected overruns, and days-to-exhaustion indicators.
- Modals for **Budget Detail Dossier**, **Create Budget Envelope**, and **Edit Budget Allocation**.

### 3. Pre-Clearance Requisitions (`SpendingView`)
- Real-time purchase order pipeline with status filters (`PRE_CLEARED`, `PENDING_APPROVAL`, `APPROVED`, `BLOCKED`).
- **New Requisition Flow Modal:** Live budget context checker comparing requested amounts against remaining department capacity to output deterministic pre-verdicts before submission.
- **Audit Dossier Modal:** Comprehensive requisition inspection with signed legal attachment previews.

### 4. Enterprise Approval Queue (`ApprovalsView`)
- High-density triage table with multi-sig hierarchy indicators (`L1 Manager` $\to$ `L2 VP` $\to$ `L3 Policy Gate` $\to$ `L4 CFO`).
- Direct action buttons: `Approve`, `Reject`, `Escalate to CFO Multi-Sig`, and `Request Justification`.

### 5. Exception Triage & Rebalance Engine (`ExceptionsView`)
- Dedicated incident cards categorized by severity (`CRITICAL`, `WARNING`, `ADVISORY`).
- **Level-4 CFO Sovereign Override Modal:** Discretionary override workflow requiring strategic reserve offset selection and audit memo.
- **Cross-Department Budget Rebalance Modal:** Real-time capital reallocation from surplus cost centers to clear blocked pipelines without increasing aggregate corporate ceilings.

### 6. Forecast Engine & Sensitivity Tester (`ForecastingView`)
- Multi-curve predictive trajectory with Monte Carlo variance envelope.
- Calendar breach horizon estimation with 95% confidence bounds.
- **Interactive Sensitivity Slider:** Real-time burn multiplier adjustment from -15% (spending freeze) to +25% (runaway cost).
- Macro scenario suite: Baseline, Cloud & SaaS Inflation, Engineering Surge, LLM Inference Spike, and Vendor Optimization.

### 7. Cost Centers (`DepartmentsView`)
- Department hierarchy cards, headcount tracking, and primary vendor lists across all 8 enterprise departments.
- Sub-teams breakdown modal with lead allocations and burn metrics.

### 8. Spend Categories (`CategoriesView`)
- Operational category limits for Cloud Compute, Enterprise SaaS, Capex Hardware, and Professional Services.
- Visual threshold gauges with statutory warning markers at 80% and 90%.

### 9. Enforcement Policy Rules (`PolicyEngineView`)
- Visual IF-THEN statutory rule graph builder.
- Interactive policy evaluation sandbox providing deterministic verdicts in ~13.4ms.
- High-density policy table with live Active/Paused rule toggles.

### 10. Financial Performance Reports (`ReportsView`)
- SOX/GAAS compliant departmental budget vs. run-rate variance matrix.
- Category spend pacing against quarterly benchmarks.
- **Export CSV Ledger:** Instant browser generation and download of complete corporate ledger data.
- **Executive Fiscal Dossier:** Formatted pre-print PDF preview with digital signatures from Group CFO and Corporate Controller.

### 11. Audit Trail & System Settings (`AuditLogsView` & `SettingsView`)
- **Cryptographic Audit Trail:** Append-only ledger with SHA-256 transaction hashes, PBFT consensus stamps, and side-by-side state diff inspector.
- **5-Persona RBAC Governance:** Interactive permission matrix and instant perspective switcher across `CFO`, `FINANCE_ADMIN`, `DEPT_MANAGER`, `EMPLOYEE`, and `SYSTEM_ADMIN`.
- **Global Capital Outflow Killswitch:** Discretionary emergency freeze protocol with safety confirmation modal.

---

## Technical Architecture

```
finathon-2/
├── src/                          # Frontend Application (React 19 + TypeScript + Vite)
│   ├── components/               # UI Component Suite
│   │   ├── ai/                   # Aczen Nova AI Copilot Widget & Floating Launcher
│   │   ├── dashboard/            # SpendTrajectoryChart, MetricCards, PreClearanceSandbox
│   │   ├── budgets/              # BudgetAllocation, Dossier, Edit Modals
│   │   ├── spending/             # Requisition Pipeline, New Spending Modal
│   │   ├── approvals/            # Multi-Sig Approval Queue
│   │   ├── exceptions/           # Exception Triage & CFO Override Modals
│   │   ├── forecasting/          # Monte Carlo Forecast Engine & Sliders
│   │   ├── policy/               # Policy Engine & Visual Rule Builder
│   │   ├── reports/              # Variance Reports & Ledger Export
│   │   ├── audit/                # Cryptographic Hash-Chain Ledger View
│   │   └── navigation/           # Sidebar, Header, Currency Switcher, Persona Switcher
│   ├── context/                  # Global Application State (AppContext, Currency, RBAC)
│   ├── types/                    # Enterprise TypeScript Domain Interfaces
│   └── utils/                    # Formatters (USD/INR), Cryptographic Utilities
├── server/                       # Backend Application (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── ai/nova/              # Aczen Nova Client, Sanitizer, JSON Validator
│   │   ├── api/routes/           # AI Agent, Budgets, Spending, Policies, Forecasts, Audit
│   │   ├── db/                   # Database Schemas, In-Memory DB, Seed Data
│   │   ├── middleware/           # RBAC Guard, Rate Limiting, OWASP Security Headers
│   │   └── server.ts             # Express Server Initialization (Port 5000)
│   └── tests/                    # 88 Automated Node.js Tests Across 11 Phases
├── .env                          # Local Environment Configuration (NOVA_API_KEY, Ports)
└── package.json                  # Root Dependencies & Orchestration Scripts
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript (Strict Mode) |
| **Build Tooling** | Vite 6 |
| **Styling** | Tailwind CSS v4 + Stitch Dark/Light Theme Tokens |
| **Data Visualization** | Recharts (Responsive ComposedCharts, Areas, ReferenceLines) |
| **Backend Framework** | Node.js + Express 5 (TypeScript via `tsx`) |
| **AI / Copilot Engine** | Aczen Nova AI Client (`NOVA_API_KEY`) with SSE Streaming |
| **Database** | Relational In-Memory SQLite Schema with Integer Cents Accounting |
| **Security & Compliance** | OWASP Security Headers, PBFT SHA-256 Audit Hashes, SOX 404 RBAC |
| **Test Runner** | Node.js Native Test Runner (`tsx --test`) |

---

## Automated Testing Suite

The backend contains **88 automated unit and end-to-end integration tests** covering 11 critical operational phases:

```bash
npm test
```

### Test Coverage Highlights:
- **Phase 1: Foundation:** In-memory schema creation, integer cents seeding, atomic rollbacks, Nova client sanitization.
- **Phase 2: Data Domains:** Users, departments, categories, sub-teams, and 404 handlers.
- **Phase 4: Spending & Transactions:** Sub-15ms pre-clearance simulation, concurrency double-spend prevention, idempotency deduplication.
- **Phase 5: Policy Engine:** Deterministic rule evaluation, dynamic active/paused rule gating, audit logging.
- **Phase 7: Forecasting & Sensitivity:** Trajectory curves, macro scenario multipliers, stress factor variance, risk driver detection.
- **Phase 10: Security Hardening:** OWASP enterprise headers, sliding-window rate limiting, prototype pollution guard, negative amount rejection.
- **Phase 11: End-to-End Verification:** Health checks, live headroom verification, cryptographic audit chain hash verification.

---

## Getting Started

### Prerequisites
- Node.js 18+ (Node.js 20+ LTS recommended)
- npm or pnpm

### 1. Installation
```bash
# Clone the repository
git clone <repository-url>
cd "finathon 2"

# Install dependencies
npm install
```

### 2. Environment Configuration
Verify or create `.env` in the project root:
```env
NOVA_API_KEY=your_aczen_nova_api_key_here
NOVA_BASE_URL=https://www.aczen.in/nova-api/v1
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
DATABASE_PATH=./data/apex_fiscal.db
AUTH_SECRET=apex_fiscal_dev_jwt_secret_change_in_production
```

### 3. Running the Application

Open two terminal sessions or run concurrently:

**Terminal 1 — Express Backend API (Port 5000):**
```bash
npm run server
```

**Terminal 2 — Vite Frontend Dev Server (Port 3000):**
```bash
npm run dev
```

Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Running Verification Tests
```bash
npm test
```

### 5. Production Build
```bash
npm run build
```
Compiles TypeScript using `tsc -b` and produces optimized bundles in `dist/`.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/agent` | Aczen Nova AI query handler (Synchronous JSON) |
| `POST` | `/api/ai/agent/stream` | Aczen Nova AI real-time SSE streaming endpoint |
| `GET` | `/api/ai/management-insights` | Synthesized liquidity, cost exposures, and policy score |
| `POST` | `/api/ai/explain-budget` | Deep narrative breakdown of departmental budget status |
| `GET` | `/api/spending` | List purchase requisitions with filtering and search |
| `POST` | `/api/spending/simulate` | Deterministic pre-clearance simulation (sub-15ms) |
| `GET` | `/api/budgets` | Live departmental budget envelopes and headroom |
| `GET` | `/api/departments` | Cost centers with sub-teams, headcount, and utilization |
| `GET` | `/api/policies` | Active and paused statutory governance rules |
| `POST` | `/api/policies/evaluate` | Evaluates spend against corporate rules |
| `GET` | `/api/forecasts/summary` | Predictive trajectories with scenario multipliers |
| `GET` | `/api/audit` | Append-only cryptographic transaction log |
| `GET` | `/api/audit/verify` | Validates SHA-256 chain integrity against tampering |
| `GET` | `/api/health` | System health check and runtime uptime |

---

## License & Governance

Proprietary enterprise financial control platform developed for fiscal compliance and autonomous corporate spend governance. All rights reserved.
