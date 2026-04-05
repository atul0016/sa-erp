# SA ERP — Technical Deep Dive

Use this for portfolio pages that allow detailed technical writeups or blog-style project descriptions.

---

## Problem Statement

Indian small and medium businesses need ERP software that handles the unique complexities of Indian taxation (GST with CGST/SGST/IGST, TDS, PF/ESI) while remaining affordable and running on-premise for data sovereignty. Most available solutions are either too expensive (SAP, Oracle) or lack the depth needed for manufacturing workflows and statutory compliance.

## Solution

SA ERP is a full-stack ERP system that covers 10 business modules with complete Indian compliance built-in from the ground up — not bolted on as an afterthought. It runs both as a web app and a native desktop app from a single codebase.

## Technical Decisions

### Why Electron + Web Dual Deployment?
Indian businesses often need on-premise deployment for data sovereignty requirements while also wanting web access for remote teams. By using Vite's build system with conditional compilation, the same React codebase serves both Electron (with SQLite) and web (with Appwrite cloud) deployments.

### Why SQLite?
For on-premise ERP, SQLite provides zero-configuration deployment — no database server to install or maintain. With 80+ tables and better-sqlite3's synchronous API, it delivers excellent performance for single-company deployments while keeping the total cost of ownership at zero.

### Why Context API over Redux?
With well-structured IPC handlers already providing a service layer, the frontend state management needs are modest — auth state, theme, and UI preferences. React Context with useReducer provides adequate state management without the boilerplate overhead.

### MCA-Compliant Audit Trail
Every data mutation creates an insert-only audit record. Records are linked via SHA-256 hash chains (each record's hash includes the previous record's hash), making any retroactive tampering detectable. This satisfies the Ministry of Corporate Affairs mandate for accounting software.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Electron Main Process               │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Handlers  │  │ Services │  │  Repository  │ │
│  │ (9 files) │─▶│(7 modules)│─▶│  (Generic)   │ │
│  └───────────┘  └──────────┘  └──────────────┘ │
│       ▲                              │          │
│       │ IPC                    SQLite (80+ tbl) │
│       ▼                                         │
│  ┌───────────────────────────────┐              │
│  │      Renderer Process         │              │
│  │  React 18 + TypeScript        │              │
│  │  60+ Routes | 12 Components   │              │
│  │  Tailwind CSS + HeadlessUI    │              │
│  └───────────────────────────────┘              │
└─────────────────────────────────────────────────┘
```

**Request flow:** UI Component → IPC invoke → Handler → Service → Repository → SQLite → Response

## Key Implementation Highlights

1. **Repository Pattern** — Generic CRUD with type-safe queries, reused across all 80+ tables
2. **Modular IPC Handlers** — Each business domain (finance, sales, inventory, etc.) has isolated handlers preventing cross-contamination
3. **Zod Validation** — Schema validation at the service boundary ensures data integrity
4. **SHA-256 Audit Chain** — Cryptographic verification of audit log integrity on every application startup
5. **Fuzzy Bank Reconciliation** — Confidence-scored matching algorithm for statement reconciliation
6. **MRP Engine** — Backward scheduling with multi-level BOM explosion for material planning
7. **Offline POS** — IndexedDB-backed offline capability with sync-on-reconnect
8. **OEE Calculation** — Real-time Availability × Performance × Quality metrics with trend analysis

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Dual web/desktop from one codebase | Vite conditional compilation with `VITE_WEBAPP` flag; mock IPC layer for web mode |
| GST complexity (inter/intra-state, cess, reverse charge) | Centralized GST calculation utility with place-of-supply logic |
| Audit trail performance with insert-only pattern | Indexed audit tables with hash chain verification batched to startup |
| MRP with multi-level BOMs | Recursive BOM explosion with cycle detection and backward scheduling algorithm |
| Offline POS reliability | IndexedDB transaction queue with idempotent sync operations |

## What I Learned

- Designing database schemas for regulatory compliance requires understanding the regulations first
- Electron's IPC architecture naturally enforces separation of concerns when you lean into it
- Indian tax calculation has dozens of edge cases (reverse charge, composition scheme, SEZ supplies) that generic tax libraries don't cover
- Building for manufacturing operators (Shop Floor Kiosk) requires completely different UX thinking than back-office screens
