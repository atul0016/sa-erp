# SA ERP

Next-Generation On-Premise ERP System for Indian Manufacturing, Trading & Services

## 🏗️ Architecture

```
indian-erp/
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── main.ts             # Entry point
│   │   ├── preload.ts          # Preload script with IPC bridge
│   │   ├── database/           # Database layer
│   │   │   ├── index.ts        # Database connection
│   │   │   ├── init.ts         # Schema & seed data
│   │   │   ├── repository.ts   # Generic repository pattern
│   │   │   └── schema.ts       # 50+ table definitions
│   │   ├── handlers/           # IPC Handlers
│   │   │   ├── financeHandlers.ts
│   │   │   ├── inventoryHandlers.ts
│   │   │   ├── salesHandlers.ts
│   │   │   ├── purchaseHandlers.ts
│   │   │   ├── gstHandlers.ts
│   │   │   ├── masterHandlers.ts
│   │   │   ├── reportHandlers.ts
│   │   │   ├── manufacturingHandlers.ts
│   │   │   └── hrmHandlers.ts
│   │   ├── services/           # Business Logic
│   │   │   ├── finance/        # Accounting, Journal, Reports
│   │   │   ├── inventory/      # Items, Warehouses, Stock
│   │   │   ├── sales/          # Customers, Orders, Invoices
│   │   │   ├── purchase/       # Vendors, PO, GRN
│   │   │   ├── gst/            # E-Invoice, E-Way Bill, Returns
│   │   │   ├── manufacturing/  # BOM, Production, MRP, QC
│   │   │   └── hrm/            # Employees, Payroll, Tax
│   │   └── utils/              # Helper functions
│   │       └── helpers.ts      # GST, TDS, validation, formatting
│   ├── renderer/               # React Frontend
│   │   ├── App.tsx             # Root component with routing
│   │   ├── main.tsx            # Entry point
│   │   ├── index.html          # HTML template
│   │   ├── components/
│   │   │   ├── common/         # Reusable UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── FormField.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Notifications.tsx
│   │   │   └── layout/         # Layout components
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Header.tsx
│   │   │       └── MainLayout.tsx
│   │   ├── context/            # React Context
│   │   │   └── AppContext.tsx  # Global state management
│   │   ├── pages/              # Route pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── finance/        # Chart of Accounts, Journal Entries
│   │   │   ├── inventory/      # Items, Warehouses
│   │   │   ├── sales/          # Customers, Sales Invoices
│   │   │   ├── purchase/       # Vendors, Purchase Orders
│   │   │   ├── manufacturing/  # BOM, Production Orders
│   │   │   ├── hrm/            # Employees, Payroll
│   │   │   ├── gst/            # E-Invoice, GSTR-1
│   │   │   ├── reports/        # Financial Reports
│   │   │   └── settings/       # Settings
│   │   ├── styles/
│   │   │   └── globals.css     # Tailwind CSS
│   │   └── types/
│   │       └── api.ts          # API type definitions
│   └── shared/
│       └── types/              # Shared TypeScript types
│           ├── core.ts
│           ├── finance.ts
│           ├── gst.ts
│           ├── hrm.ts
│           ├── inventory.ts
│           ├── manufacturing.ts
│           ├── purchase.ts
│           └── sales.ts
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── tsconfig.renderer.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── electron-builder.config.js
```

## 🚀 Features

### Finance Module
- Chart of Accounts (hierarchical)
- Journal Entries (double-entry)
- General Ledger
- Trial Balance
- Profit & Loss Statement
- Balance Sheet

### Inventory Module
- Items Master (Goods & Services)
- HSN/SAC Code mapping
- Multi-warehouse support
- Stock Moves (receipts, issues, transfers)
- Valuation Methods (FIFO, Weighted Average)
- Low Stock Alerts
- Batch/Serial tracking

### Sales Module
- Customer Master with Credit Limits
- Sales Orders
- GST-compliant Sales Invoices
- Customer Receipts
- Aging Analysis
- Sales Returns (Credit Notes)

### Purchase Module
- Vendor Master
- Purchase Orders
- GRN (Goods Receipt Note)
- Purchase Invoices
- Vendor Payments
- Purchase Returns (Debit Notes)

### Manufacturing Module
- Bill of Materials (BOM)
- Work Center Management
- Production Orders
- Material Issue & Receipt
- MRP (Material Requirement Planning)
- Job Work Orders
- QC Inspection

### HRM & Payroll Module
- Employee Master
- Salary Structure
- Attendance Management
- Leave Management
- Payroll Processing
- Tax Declarations (80C, 80D, etc.)
- Form 16 Generation
- PF/ESI Compliance

### GST Module
- E-Invoice Generation (IRN)
- E-Way Bill
- GSTR-1 (Outward Supplies)
- GSTR-3B Summary
- ITC Reconciliation
- HSN Summary

## 🛠️ Tech Stack

- **Framework:** Electron 30 + React 18
- **Language:** TypeScript 5.4
- **Database:** better-sqlite3 (on-premise)
- **Styling:** Tailwind CSS 3.4
- **UI Components:** HeadlessUI + HeroIcons
- **Build:** Vite 5 + esbuild
- **State:** React Context API

## 🇮🇳 Indian Compliance

- GST (CGST, SGST, IGST, Cess)
- E-Invoice with IRN
- E-Way Bill integration
- TDS calculation (old & new regime)
- PF/ESI statutory deductions
- Professional Tax
- Form 16 generation
- HSN/SAC code validation
- GSTIN validation

## 📦 Installation

```bash
# Clone the repository
git clone <repo-url>
cd indian-erp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package for distribution
npm run start
```

## 🗂️ Database Schema

The application uses SQLite with 50+ tables covering:

- **Core:** tenants, users, roles, permissions
- **Finance:** accounts, journal_entries, journal_lines
- **Inventory:** items, warehouses, stock_moves, stock_ledger
- **Sales:** customers, sales_orders, sales_invoices
- **Purchase:** vendors, purchase_orders, grn, purchase_invoices
- **Manufacturing:** bom, work_centers, production_orders, qc_inspections
- **HRM:** employees, salary_structures, attendance, leave, payroll
- **GST:** e_invoices, e_way_bills, gst_returns

## 🔐 Security

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (RBAC)
- Tenant isolation (multi-tenant support)
- Content Security Policy (CSP)

## 📄 License

MIT License

## 👥 Authors

Enterprise Solutions Team

