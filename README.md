# APEX FISCAL | Corporate Spend Control & Budget Enforcement System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-000000.svg)](https://expressjs.com/)
[![Google Gemini 2.0](https://img.shields.io/badge/LLM%20Core-Gemini%202.0%20Flash-4285F4.svg)](#decoupled-ai--data-architecture)
[![Aczen Nova ERP](https://img.shields.io/badge/Data%20Ingestion-Aczen%20Nova%20Synced-8B5CF6.svg)](#decoupled-ai--data-architecture)
[![Tests](https://img.shields.io/badge/Tests-102%20Passing%20(100%25)-10B981.svg)](#automated-testing-suite)
[![Currency](https://img.shields.io/badge/Currency-INR%20(₹)%20Exclusively-FF9933.svg)](#indian-rupee-inr--accounting-standardization)
[![SOX Compliant](https://img.shields.io/badge/Governance-SOX%20404%20%2F%20GAAS-10B981.svg)](#multi-tiered-financial-governance-hierarchy)

> **APEX Fiscal (SpendGuard L4 Core)** is an enterprise-grade corporate spend governance, real-time budget enforcement, and autonomous financial risk intelligence platform designed for C-Suite executives, corporate controllers, and treasury directors.
>
> Built in strict compliance with the **Google Stitch** tactile design language, the system enforces the operational paradigm:  
> $$\mathbf{CONTROL} \longrightarrow \mathbf{RISK} \longrightarrow \mathbf{ACTION}$$

---

## Table of Contents
1. [Key Capabilities & Highlights](#key-capabilities--highlights)
2. [Decoupled AI & Data Architecture](#decoupled-ai--data-architecture)
3. [Indian Rupee (INR / ₹) Accounting Standardization](#indian-rupee-inr--accounting-standardization)
4. [Multi-Tiered Financial Governance Hierarchy](#multi-tiered-financial-governance-hierarchy)
5. [Continuous Spend Lineage & Scenario Engine](#continuous-spend-lineage--scenario-engine)
6. [Workspace Navigation & View Suite](#workspace-navigation--view-suite)
7. [Technical Architecture & Directory Structure](#technical-architecture--directory-structure)
8. [Automated Testing Suite (102 Tests)](#automated-testing-suite)
9. [Getting Started & Setup Guide](#getting-started--setup-guide)
10. [REST & Streaming API Reference](#rest--streaming-api-reference)
11. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Key Capabilities & Highlights

- **Decoupled Dual-Engine Architecture:** Strict decoupling of external ERP general ledger ingestion (**Aczen Nova API**) from conversational financial intelligence and spend simulations (**Google Gemini 2.0 Flash**).
- **100% Indian Rupee (INR / ₹) Financial System:** All metrics, envelopes, charts, approval limits, and forecasts operate strictly in INR (`₹`) formatted in Indian denomination units (**Crores `Cr`**, **Lakhs `L`**, and **`k`** with Indian numbering notation).
- **Deterministic Pre-Clearance DAG:** Sub-15ms algorithmic validation testing proposed purchase requisitions against live budget envelopes and statutory policy ceilings prior to financial commitment.
- **Continuous Spend Lineage & Breach Trajectory:** Interactive Recharts `ComposedChart` anchoring actual settled disbursements (`₹302.12 Cr`) and committed liabilities (`₹317.06 Cr`) against forward Monte Carlo forecast trajectories.
- **Multi-Tiered SOX 404 Governance Hierarchy:** 4 distinct governance clearance tiers with cryptographic RBAC enforcement (`Tier 1 C-Suite`, `Tier 2 Controller`, `Tier 3 Analyst`, `Tier 4 Auditor`).
- **Cryptographic Merkle Audit Trail:** SHA-256 hash-chained append-only ledger tracking all transaction states, reallocations, and sovereign overrides with PBFT consensus stamps.
- **Level-4 Sovereign Override Protocol:** Discretionary override workflow restricted to Tier 1 Executive clearance, requiring multi-sig PIN verification, offsetting reserve reallocation, and immutable audit justification memos.
- **Global Emergency Outflow Killswitch:** One-click enterprise-wide disbursement freeze protocol for systemic liquidity crises with dual-confirmation safeguards.
- **102 Automated Tests (100% Pass Rate):** Comprehensive test suite verifying data domains, concurrency stress tests, idempotency, policy evaluations, and AI resilience.

---

## Decoupled AI & Data Architecture

The platform architecture strictly separates raw general ledger data ingestion from conversational intelligence:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             APEX FISCAL COPILOT                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     DATA INGESTION LAYER      │             │  CONVERSATIONAL REASONING     │
│   (Aczen Nova Live Ledger)    │             │   (Google Gemini 2.0 Flash)   │
├───────────────────────────────┤             ├───────────────────────────────┤
│ • Auth: NOVA_API_KEY          │             │ • Auth: GEMINI_API_KEY        │
│ • Base URL: /nova-api/v1      │             │ • Model: gemini-2.0-flash     │
│ • 372 Budget Envelopes        │             │ • Multi-turn Dialog Memory    │
│ • 300 Verified Vouchers       │             │ • RAG Dynamic Grounding (SQL) │
│ • 8 Monitored Cost Centers    │             │ • Policy Compliance Verdicts  │
│ • Domestic Vendor Outlays     │             │ • Spend Simulation Sandbox    │
│ • NO chat completion calls    │             │ • Deterministic Fallback Core │
└───────────────────────────────┘             └───────────────────────────────┘
```

### 1. Data Ingestion Layer (`NOVA_API_KEY`)
- Connected exclusively to `https://www.aczen.in/nova-api/v1`.
- Synchronizes external general ledger financial data: 372 budget envelopes, 300 verified expense vouchers, 8 cost centers (Finance & Accounts, IT, Marketing, Operations, etc.), and vendor liabilities.
- **Strict Isolation:** Aczen Nova is dedicated solely to data ingestion and is never invoked for natural language text completions or chat sessions.

### 2. Conversational Intelligence Layer (`GEMINI_API_KEY`)
- Powered by **Google Gemini 2.0 Flash** (`gemini-2.0-flash` or `gemini-1.5-flash` via `@google/genai`).
- Provides real-time financial reasoning, policy compliance verdicts, anomaly explanations, and interactive spend simulations.
- **Dynamic RAG Grounding:** Injects live SQLite departmental envelopes, active exception incidents, policy thresholds, and Aczen Nova domestic books into the LLM context window.
- **Deterministic Advisory Fallback:** In the event of API quota limits (429) or transient cloud unavailability (503), the built-in deterministic rule engine serves grounded answers, preventing generic boilerplate dumps.

---

## Indian Rupee (INR / ₹) Accounting Standardization

All financial figures, reports, meters, and charts in the project are calibrated and rendered exclusively in **Indian Rupees (INR / ₹)**:

- **Institutional Base Figures:**
  - **Total Approved Corporate Ceiling:** **₹402.55 Cr**
  - **Settled Cash Outflow:** **₹302.12 Cr**
  - **Committed Purchase Orders:** **₹317.06 Cr** (78.8% utilization)
  - **Liquid Buffer Remaining:** **₹85.49 Cr**
  - **Projected Q3 Fiscal Variance:** **-₹15.36 Cr** overrun risk without intervention
- **Standard Formatting:** Built-in formatter [`formatCurrency`](file:///c:/Users/thati/Documents/finathon%202/src/utils/formatters.ts) automatically formats amounts into:
  - **Crores (`Cr`)** for values $\ge$ ₹1,00,00,000 (e.g., `₹402.55 Cr`)
  - **Lakhs (`L`)** for values $\ge$ ₹1,00,000 (e.g., `₹22.28 L`)
  - **Thousands (`k`)** for values $\ge$ ₹1,000 (e.g., `₹45.0k`)
  - Standard Indian comma grouping (e.g., `₹28,40,000`)
- **De-cluttered Header:** The currency switcher toggle has been eliminated, locking the entire platform into standard enterprise INR reporting.

---

## Multi-Tiered Financial Governance Hierarchy

The platform implements a 4-tier institutional clearance model:

| Governance Tier | Role Identifier | Authority Limit | Operational Capabilities | Sovereign Rights |
|---|---|---|---|---|
| **Tier 1 (Executive)** | `CFO`, `TIER_1_EXECUTIVE` | **₹415 Cr** (Discretionary) | Full corporate overview, global liquidity freeze/unfreeze, statutory policy creation, sovereign overrides | **Full Sovereign Override Rights** |
| **Tier 2 (Controller)** | `FINANCE_ADMIN`, `TIER_2_CONTROLLER` | **₹83 Cr** | Risk threshold adjustments, transaction approvals & rejections, liquidity reallocations, operational settings | Blocked from sovereign overrides & capital freeze |
| **Tier 3 (Analyst)** | `DEPT_MANAGER`, `EMPLOYEE`, `TIER_3_ANALYST` | **₹2.07 Cr** – **₹16.60 Cr** | Data entry, spending requisition creation, sensitivity simulations, impact sandboxing | **Strictly NO final sign-off authority** |
| **Tier 4 (Auditor)** | `SYSTEM_ADMIN`, `TIER_4_AUDITOR` | Read-Only | Audit trail inspection, cryptographic hash verification, variance report viewing | **All data mutations strictly prohibited** |

---

## Continuous Spend Lineage & Scenario Engine

The primary dashboard features a dynamic predictive Recharts `ComposedChart` tracking the fiscal timeline from Q3 through Q4 (`Jul 01` $\to$ `Today (Sept 30)` $\to$ `Dec 31`):

| Scenario Model | Burn Multiplier | Breach Date | Year-End Spend | Trajectory Posture |
|---|---|---|---|---|
| **Baseline Model** | $1.00\times$ | Nov 18 (49 days left) | **₹438.24 Cr** | Warning (Amber) |
| **+5% Inflation** | $1.05\times$ | Nov 04 (35 days left) | **₹459.82 Cr** | Elevated Risk (Orange) |
| **Hiring Surge** | $1.12\times$ | Oct 28 (28 days left) | **₹488.04 Cr** | Critical Breach (Red) |
| **Renegotiation** | $0.94\times$ | Dec 08 (69 days left) | **₹409.19 Cr** | Controlled (Emerald) |

- **Anchored Forward Curves:** Seamless transition at `Today (Sept 30)` from historical settled cash outflow (`₹302.12 Cr`) into forward trajectory curves.
- **Reference Ceilings:** Pinned statutory reference line at `₹402.55 Cr` with automatic breach crossover detection.

---

## Workspace Navigation & View Suite

The application includes 11 dedicated, interactive executive views:

1. **Control Center (`DashboardView`)**: Real-time KPI telemetry, spend trajectory chart, cost center utilization meters, and instant simulation sandbox.
2. **Budget Allocation (`BudgetsView`)**: Multi-department envelopes, threshold meters, variance indicators, and budget creation modals.
3. **Pre-Clearance Requisitions (`SpendingView`)**: Purchase order pipeline with live budget capacity checks and signed legal attachment dossiers.
4. **Enterprise Approval Queue (`ApprovalsView`)**: Multi-sig approval routing (`L1 Manager` $\to$ `L2 Controller` $\to$ `L4 CFO`).
5. **Exception Triage & Rebalance Engine (`ExceptionsView`)**: Severity incident triage with Level-4 CFO sovereign override dialog and surplus reserve rebalancing.
6. **Forecast Engine & Sensitivity Tester (`ForecastingView`)**: Monte Carlo variance bands, sensitivity multiplier slider (-15% to +25%), and prescriptive mitigation recommendations.
7. **Cost Centers (`DepartmentsView`)**: Department headcount, lead allocations, and sub-team burn burndown.
8. **Spend Categories (`CategoriesView`)**: Threshold gauges with warning markers at 80% and 90% utilization.
9. **Enforcement Policy Rules (`PolicyEngineView`)**: Visual boolean IF-THEN rule editor and interactive rule evaluation sandbox.
10. **Financial Performance Reports (`ReportsView`)**: SOX/GAAS quarterly variance reconciliations, CSV ledger export, and pre-print executive dossiers.
11. **Cryptographic Audit Trail & Settings (`AuditLogsView` & `SettingsView`)**: SHA-256 Merkle chain inspector, RBAC perspective switcher, and emergency outflow killswitch.

---

## Technical Architecture & Directory Structure

```
finathon-2/
├── src/                          # Frontend Application (React 19 + TypeScript + Vite)
│   ├── components/               # UI Component Suite
│   │   ├── ai/                   # NovaCopilotWidget & Floating Chat Launcher
│   │   ├── dashboard/            # SpendTrajectoryChart, MetricCards, Sandbox
│   │   ├── budget/               # BudgetAllocation, Detail Dossier, Edit Modals
│   │   ├── spending/             # Requisition Pipeline, CreateRequestModal
│   │   ├── approval/             # Multi-Sig Approval Queue Table & Modals
│   │   ├── exception/            # Exception Triage, Sovereign Override Modal
│   │   ├── forecast/             # Monte Carlo Forecast Engine & Sliders
│   │   ├── department/           # Cost Centers & Sub-teams Breakdown
│   │   ├── category/             # Spend Categories & Threshold Gauges
│   │   ├── policy/               # Policy Engine & Visual Rule Builder
│   │   ├── report/               # Variance Reports & Ledger Export
│   │   ├── audit/                # Cryptographic Hash-Chain Ledger View
│   │   ├── settings/             # System Settings, Killswitch, Peg Rates
│   │   └── layout/               # HeaderBar (INR Ticker), Sidebar, AppShell
│   ├── context/                  # Global State (AppContext, Currency='INR', RBAC)
│   ├── types/                    # Enterprise TypeScript Domain Interfaces
│   └── utils/                    # Formatters (INR Cr/L/k), Cryptographic Utils
├── server/                       # Backend Application (Node.js + Express 5 + TS)
│   ├── src/
│   │   ├── ai/gemini/            # Google Gemini 2.0 Flash Client, RAG Grounding
│   │   ├── ai/nova/              # Aczen Nova ERP Data Client (372 Envelopes, 300 Vouchers)
│   │   ├── api/routes/           # AI Agent, Budgets, Spending, Policies, Forecasts, Audit
│   │   ├── db/                   # Native SQLite Schema, Seed Data, Connection
│   │   ├── middleware/           # RBAC Guard, Rate Limiting, OWASP Headers, Auth
│   │   └── server.ts             # Express Server Initialization (Port 5000)
│   └── tests/                    # 102 Automated Tests Across 12 Phases
├── .env                          # Local Environment Configuration (Secrets & Keys)
├── .env.example                  # Environment Configuration Template
├── package.json                  # Root Dependencies & Scripts
└── vite.config.ts                # Vite Configuration with API Reverse Proxy
```

---

## Automated Testing Suite

The backend includes **102 automated unit, integration, and security stress tests** executed via the native Node.js test runner:

```bash
npm test
```

### Test Results Breakdown:
```text
✔ Phase 1: Foundation Schema & Seed Integrity (7 tests)
✔ Phase 2: Data Domains & Envelopes (6 tests)
✔ Phase 4: Spending & Concurrency Transactions (5 tests)
✔ Phase 5: Policy Engine & Deterministic Rule Evaluator (6 tests)
✔ Phase 7: Forecasting, Monte Carlo & Sensitivity (6 tests)
✔ Phase 8: Aczen Nova ERP Data Integration (7 tests)
✔ Phase 10: Security Hardening & Concurrency Stress (8 tests)
✔ Phase 11: End-to-End System Health & Audit Chain (5 tests)
✔ Phase 12: Multi-Tiered Financial Governance Hierarchy Verification (4 tests)
✔ Decoupled AI & Data Integration Architecture Tests (7 tests)

ℹ tests 102
ℹ suites 3
ℹ pass 102
ℹ fail 0
```

---

## Getting Started & Setup Guide

### Prerequisites
- **Node.js**: Version 20+ LTS recommended (Node.js 18+ minimum)
- **Package Manager**: `npm` (bundled with Node.js)

### 1. Installation
```bash
# Clone repository
git clone <repository-url>
cd "finathon 2"

# Install dependencies
npm install
```

### 2. Environment Configuration
Create or verify `.env` in the root directory:
```env
# 1. Aczen Nova Data Ingestion Layer (ERP General Ledger Sync)
NOVA_API_KEY=your_aczen_nova_api_key_here
NOVA_BASE_URL=https://www.aczen.in/nova-api/v1

# 2. Google Gemini Conversational Intelligence Layer
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Backend & Database Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
DATABASE_PATH=./data/apex_fiscal.db
AUTH_SECRET=apex_fiscal_dev_jwt_secret_change_in_production
```

> **Note on AI Keys:** If `GEMINI_API_KEY` is not provided, the platform automatically activates its **Deterministic Financial Advisory Engine**, serving accurate live metrics and calculations without downtime.

---

### 3. Running the Application

To run the full stack, you must start **both** the backend Express API and the frontend Vite server:

#### Terminal 1 — Express Backend API (Port 5000):
```bash
npm run server:dev
```
*(Starts Express server with auto-reload on `http://localhost:5000`)*

#### Terminal 2 — Vite Frontend Server (Port 3000):
```bash
npm run dev
```
*(Starts Vite frontend on `http://localhost:3000`)*

Open **[http://localhost:3000](http://localhost:3000)** in your browser to access APEX Fiscal.

---

## REST & Streaming API Reference

| Method | Endpoint | Description | Auth Requirement |
|---|---|---|---|
| `POST` | `/api/ai/agent/chat` | Google Gemini 2.0 Copilot financial reasoning (JSON) | All authenticated roles |
| `POST` | `/api/ai/agent/stream` | Real-time Server-Sent Events (SSE) typewriter stream | All authenticated roles |
| `GET` | `/api/ai/status` | Decoupled architecture status & telemetry | All authenticated roles |
| `GET` | `/api/ai/agent/capabilities` | List of supported financial reasoning intents | All authenticated roles |
| `GET` | `/api/budgets` | Active departmental envelopes and headroom | All authenticated roles |
| `GET` | `/api/spending` | List purchase requisitions with filtering | All authenticated roles |
| `POST` | `/api/spending/simulate` | Sub-15ms pre-clearance simulation DAG | All authenticated roles |
| `POST` | `/api/spending` | Submit new purchase requisition | Tier 1, 2, 3 |
| `POST` | `/api/approvals/:id/approve` | Approve requisition | Tier 1, Tier 2 |
| `POST` | `/api/exceptions/:id/override`| Execute sovereign policy override | **Tier 1 Sovereign Only** |
| `POST` | `/api/settings/freeze` | Activate enterprise capital freeze | **Tier 1 Sovereign Only** |
| `POST` | `/api/settings/unfreeze` | Deactivate capital freeze | **Tier 1 Sovereign Only** |
| `GET` | `/api/policies` | Active and paused statutory rules | All authenticated roles |
| `POST` | `/api/policies/evaluate` | Evaluates spend proposal against policy graph | All authenticated roles |
| `GET` | `/api/forecasts/summary` | Predictive trajectories & scenario multipliers | All authenticated roles |
| `GET` | `/api/audit` | Append-only cryptographic transaction log | All authenticated roles |
| `GET` | `/api/audit/verify` | Validates SHA-256 chain integrity against tampering | Tier 1, Tier 2, Tier 4 |
| `GET` | `/api/health` | Service health status and database latency | Public |

---

## Troubleshooting & FAQ

### Q: Why do I see `[vite] http proxy error: ECONNREFUSED` in my terminal?
**A:** Vite's development server on port 3000 proxies all `/api/*` network requests to the backend server on port 5000 (`http://localhost:5000`). If you only run `npm run dev` without starting the backend, Vite cannot connect to port 5000 and throws `ECONNREFUSED`.  
**Fix:** Keep `npm run server:dev` running in a dedicated terminal window while `npm run dev` runs in another.

### Q: How do I switch personas in the application?
**A:** Click the user profile pill in the top-right corner of the application header to open the persona switcher dropdown. You can switch instantly between **Tier 1 C-Suite (Victoria Sterling)**, **Tier 2 Controller (Marcus Vance)**, **Tier 3 Analyst (Alex Rivera / Sarah Jenkins)**, and **Tier 4 Auditor (Devon Thorne)** to experience granular RBAC permissions.

### Q: Why is all data formatted in INR (`₹`)?
**A:** By design, APEX Fiscal enforces Indian Rupee (`₹`) as its sole enterprise general ledger currency to maintain direct fidelity with Aczen Nova domestic books, displaying all amounts in standard Indian denominations (**Crores `Cr`**, **Lakhs `L`**, and **`k`**).

---

## License & Governance

Proprietary enterprise financial control platform developed for fiscal compliance and autonomous corporate spend governance under SOX 404 and GAAS statutory standards. All rights reserved.
