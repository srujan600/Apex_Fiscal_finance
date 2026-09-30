# APEX FISCAL | Corporate Spend Control & Budget Enforcement System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![SOX Compliant](https://img.shields.io/badge/Governance-SOX%20404%20%2F%20GAAS-10B981.svg)](#)

> **Apex Fiscal (SpendGuard L4 Core)** is an enterprise-grade corporate spend governance, real-time budget enforcement, and autonomous risk mitigation frontend designed for CFOs, treasury leaders, and department managers.
>
> Built in strict fidelity to the **Google Stitch** dark tactile design language (`projects/4688298120369650092`), the system enforces the operational paradigm:  
> $\mathbf{CONTROL} \longrightarrow \mathbf{RISK} \longrightarrow \mathbf{ACTION}$.

---

## Visual & Interaction Highlights

- **Stitch Deep Dark Palette:** Precision canvas void (`#090D16`), Tier 1 card elevations (`#0D1526`), Tier 2 active surfaces (`#131E36`), and sharp architectural borders (`#1E293B` / `#1E2D4A`).
- **Tactile Depth & Physics:** Custom 3D button press gradients with highlight insets, double-bezel card borders, and sub-surface grid patterns.
- **Editorial Typography:** High-readability `Inter` paired with tabular numerical data in `JetBrains Mono` with fixed-width figures (`tnum`).
- **Dual Currency Engine:** Dynamic real-time switching between USD ($) institutional units and INR (₹ Lakhs/Crores) across all ledgers, meters, and charts.
- **Responsive Architecture:** Fully responsive desktop, tablet, and mobile layouts with slide-out navigation drawers and adaptive padding.

---

## Workspace Navigation & View Suite

The application features 11 dedicated, fully interactive executive views:

### 1. Control Center (`DashboardView`)
- **Executive KPI Telemetry:** Approved Corporate Ceiling ($48.5M / ₹402.55 Cr), Burn Velocity ($142.4k/day), Projected Fiscal Variance (-$1.85M deficit risk with breach horizon), and Active Critical Exceptions.
- **Spend Trajectory Recharts:** Continuous cumulative spend curve with actual settled expenditures, committed purchase orders, projected run-rate, and a pinned $48.5M annual ceiling line.
- **Department Risk Matrix:** Multi-segment utilization gauges and triage shortcuts for Engineering, Marketing, Cloud Ops, and Sales.
- **Pre-Clearance Sandbox:** Real-time simulation testing synthetic amounts against live budgets with sub-20ms latency.
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
- Direct tactile action buttons: `Approve`, `Reject`, `Escalate to CFO Multi-Sig`, and `Request Justification`.

### 5. Exception Triage & Rebalance Engine (`ExceptionsView`)
- Dedicated incident cards categorized by severity (`CRITICAL`, `WARNING`, `ADVISORY`).
- **Level-4 CFO Sovereign Override Modal:** Discretionary override workflow requiring strategic reserve offset selection and audit memo.
- **Cross-Department Budget Rebalance Modal:** Real-time capital reallocation from surplus cost centers to clear blocked pipelines without increasing aggregate corporate ceilings.

### 6. Forecast Engine & Sensitivity Tester (`ForecastingView`)
- Multi-curve predictive trajectory with Monte Carlo variance envelope.
- Calendar breach horizon estimation (e.g. *November 18, 2026*).
- **Interactive Sensitivity Slider:** Real-time burn multiplier adjustment from -15% (aggressive spending freeze) to +25% (runaway cost).
- Macro scenario suite: Baseline, Cloud & SaaS Inflation (+5%), Engineering Surge (+8%), LLM Inference Spike (+12%), and Vendor Optimization (-6%).

### 7. Cost Centers (`DepartmentsView`)
- Department hierarchy cards, headcount tracking, and primary vendor lists.
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
- **Cryptographic Audit Trail:** Append-only blockchain ledger with SHA-256 transaction hashes, PBFT 12-node consensus stamps, and side-by-side state diff inspector.
- **5-Persona RBAC Governance:** Interactive permission matrix and instant perspective switcher across `CFO`, `FINANCE_ADMIN`, `DEPT_MANAGER`, `EMPLOYEE`, and `SYSTEM_ADMIN`.
- **Global Capital Outflow Killswitch:** Discretionary emergency freeze protocol with safety confirmation modal.

---

## Technical Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript (Strict Mode) |
| **Build Tooling** | Vite 6 |
| **Styling** | Tailwind CSS v4 + Custom Stitch CSS Tokens |
| **Data Visualization** | Recharts (Responsive Composed Charts & Areas) |
| **Typography** | Google Fonts (`Inter` & `JetBrains Mono`) |
| **Iconography** | Material Symbols Outlined |

---

## Getting Started

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Finathon

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
```
Compiles TypeScript with `tsc -b` and produces optimized bundles in `dist/`.

---

## Design System Tokens

```css
/* Stitch Core Palette */
--canvas-void: #090D16;
--surface-tier-1: #0D1526;
--surface-tier-2: #131E36;
--border-architectural: #1E293B;
--border-highlight: #1E2D4A;

/* Semantic Accents */
--brand-primary: #3B82F6;
--accent-cyan: #00E5FF;
--status-emerald: #10B981;
--status-amber: #F59E0B;
--status-ruby: #EF4444;
```
