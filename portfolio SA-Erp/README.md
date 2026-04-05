# SA ERP — Portfolio Project

## One-Liner
A full-stack, production-grade Enterprise Resource Planning system built for Indian manufacturing, trading, and services businesses — with GST compliance, MCA audit trails, and 10 integrated modules.

## Live Demo & Source

| | Link |
|--|------|
| **Live Web Demo** | [https://indian-erp.vercel.app](https://indian-erp.vercel.app) |
| **GitHub Repository** | [https://github.com/atul0016/sa-erp](https://github.com/atul0016/sa-erp) |
| **Demo Credentials** | Username: `admin` / Password: `admin123` |

---

## Project Overview

SA ERP is a **next-generation on-premise ERP system** purpose-built for Indian businesses. It runs as both a **desktop application** (Electron) and a **web application** (Vercel), featuring 59+ pages across 10 modules with 80+ database tables.

The system follows specifications from *The ERP Architect's Handbook (India Edition)* and implements full Indian tax compliance including GST (CGST/SGST/IGST), TDS, PF/ESI, and MCA-compliant cryptographic audit trails.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5.4, Tailwind CSS 3.4 |
| **UI Components** | HeadlessUI, HeroIcons, Lucide React, Recharts |
| **Desktop Shell** | Electron 30 |
| **Database** | SQLite (better-sqlite3) — on-premise |
| **Auth** | Appwrite (cloud), bcrypt + JWT (local) |
| **Notifications** | Firebase Cloud Messaging |
| **Build Tools** | Vite 5, esbuild, electron-builder |
| **Validation** | Zod |
| **PDF/Excel** | PDFKit, ExcelJS |
| **State Management** | React Context API |
| **Deployment** | Vercel (web), Electron Builder (desktop — Windows/macOS/Linux) |

---

## Modules & Features

### 1. Finance & Accounting
- Hierarchical Chart of Accounts
- Double-entry Journal Entries
- General Ledger, Trial Balance, P&L, Balance Sheet
- Bank Reconciliation with fuzzy auto-matching and confidence scoring
- Multi-currency support with exchange rate management

### 2. Inventory & Warehouse
- Items Master with HSN/SAC code mapping
- Multi-warehouse management
- Stock Moves (receipts, issues, transfers)
- FIFO & Weighted Average valuation
- Batch/Serial tracking, Low stock alerts
- Gate Pass Management (RGP/NRGP) with return tracking
- Bin/Rack management, Wave Picking, FEFO support

### 3. Sales
- Customer Master with credit limit enforcement (hard/soft block)
- Sales Orders → GST-compliant Invoices → Receipts
- Aging Analysis, Sales Returns (Credit Notes)
- **POS Terminal** — touch-optimized, offline-capable, barcode scanner, multi-payment (Cash/Card/UPI/Wallet), loyalty programs

### 4. Purchase
- Vendor Master with GSTIN/PAN tracking, MSME status, rating system
- Purchase Orders → GRN → Invoices → Payments
- Purchase Returns (Debit Notes)
- Approval workflow (Draft → Submitted → Approved)

### 5. Manufacturing
- Multi-level Bill of Materials (BOM)
- Work Center Management
- Production Orders with material issue/receipt
- MRP (Backward scheduling with multi-level BOM explosion)
- **Shop Floor Kiosk** — touch-friendly operator interface, job card tracking (start/pause/resume), real-time output recording
- **OEE Dashboard** — Availability × Performance × Quality, work center comparison, downtime analysis, 7-day trends
- Job Work (GST Sec 143) with Challan management

### 6. HRM & Payroll
- Employee Master with department/designation hierarchy
- Salary Structure (Basic + HRA + Allowances)
- Attendance & Leave Management
- **Payroll Processing** — PF (12%+12%), ESIC (0.75%+3.25%), Professional Tax, TDS
- Tax Declarations (80C, 80D), Form 16 generation

### 7. GST Compliance
- E-Invoice Generation (IRN/QR code)
- E-Way Bill integration
- GSTR-1 (Outward Supplies), GSTR-3B Summary
- GSTR-2B Reconciliation (auto-flag vendor discrepancies)
- ITC Reconciliation, HSN Summary

### 8. TDS Management
- Section-wise tracking (194C, 194J, 194Q, 194A, 194H, 194I)
- Auto-deduction with threshold monitoring
- Challan generation, Form 26Q quarterly return
- PAN-wise deductee management

### 9. Reports
- 16 pre-built report templates across all modules
- Finance: Balance Sheet, P&L, Trial Balance, Cash Flow, Ledger, Day Book
- Inventory: Stock Summary, Stock Movement Register
- Sales/Purchase: Receivables/Payables Aging, Sales/Purchase Register
- GST: GSTR-1, GSTR-3B
- Export to PDF, Excel, CSV

### 10. Settings & Administration
- Company profile, GST settings, Invoice configuration
- User management with Role-Based Access Control (RBAC)
- Multi-tenant support with tenant isolation
- Security settings

---

## Architecture Highlights

```
┌─────────────────────────────────────────────────────┐
│                   Electron Shell                     │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │   Renderer Process   │  │    Main Process       │ │
│  │                      │  │                       │ │
│  │  React 18 + TS       │◄─►  IPC Bridge          │ │
│  │  Tailwind CSS        │  │  SQLite Database      │ │
│  │  60+ Routes          │  │  80+ Tables           │ │
│  │  Context API State   │  │  9 Handler Modules    │ │
│  │  12 UI Components    │  │  7 Service Layers     │ │
│  └──────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
   Vercel (Web)               Desktop (Win/Mac/Linux)
```

- **Dual Deployment** — same codebase runs as web app (Vercel) and desktop app (Electron)
- **IPC Architecture** — clean separation between UI and business logic via Electron IPC
- **Repository Pattern** — generic, reusable data access layer
- **MCA Audit Trail** — SHA-256 chained audit logs, sequence-numbered, insert-only
- **Modular Services** — each business domain has isolated service, handler, and type layers

---

## Database Design

- **80+ tables** covering core, finance, inventory, sales, purchase, manufacturing, HRM, and GST
- **Multi-tenant** with row-level tenant isolation
- **Cryptographic audit chain** — every mutation creates an insert-only audit log entry linked via SHA-256 hash chain
- **Referential integrity** with foreign keys across all modules

---

## Security

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (RBAC) — CEO, Admin, Manager, User roles
- Content Security Policy (CSP)
- Multi-tenant data isolation
- MCA-compliant immutable audit trail

---

## Indian Compliance Coverage

| Compliance Area | Status |
|----------------|--------|
| GST (CGST, SGST, IGST, Cess) | ✅ |
| E-Invoice with IRN | ✅ |
| E-Way Bill | ✅ |
| TDS (Old & New Regime) | ✅ |
| PF/ESI Statutory Deductions | ✅ |
| Professional Tax | ✅ |
| Form 16 | ✅ |
| Form 26Q | ✅ |
| HSN/SAC Validation | ✅ |
| GSTIN Validation | ✅ |
| MCA Audit Trail (SHA-256 chained) | ✅ |
| ITC-04 (Job Work) | ✅ |

---

## Key Metrics

| Metric | Count |
|--------|-------|
| Modules | 10 |
| Pages/Views | 59+ |
| Database Tables | 80+ |
| Routes | 60+ |
| Reusable UI Components | 12 |
| Report Templates | 16 |
| TypeScript Type Files | 8 shared + renderer types |

---

## Screenshots

> **To capture screenshots:** Open the live demo at https://indian-erp.vercel.app, login with `admin`/`admin123`, and take screenshots of:
>
> 1. **Dashboard** — KPI cards, revenue trends, recent transactions
> 2. **Sales Invoice** — GST-compliant invoice with tax breakdown
> 3. **POS Terminal** — Touch-optimized retail interface
> 4. **Manufacturing / Shop Floor Kiosk** — Operator interface
> 5. **OEE Dashboard** — Real-time performance metrics
> 6. **GST / E-Invoice** — IRN generation view
> 7. **HRM / Payroll** — Payslip with PF/ESI/TDS breakdown
> 8. **Bank Reconciliation** — Auto-matching with confidence scores
> 9. **Reports** — Financial report with export options
> 10. **Settings** — User management / RBAC view
>
> Save screenshots as `screenshots/01-dashboard.png`, `screenshots/02-sales-invoice.png`, etc.

---

## How to Run Locally

```bash
# Clone
git clone https://github.com/atul0016/sa-erp.git
cd sa-erp

# Install dependencies
npm install

# Web mode (development)
npm run web:dev

# Desktop mode (Electron)
npm run dev

# Build for web
npm run web:build

# Build desktop installer
npm run build
```
