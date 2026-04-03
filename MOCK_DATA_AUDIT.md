# Mock Data Audit Report — indian-erp

> **Generated**: Full audit of all 55 `.tsx` page files across 10 modules.
> **Classification** legend:
> - **PURE_MOCK** — No `electronAPI` calls; 100% inline/hardcoded data. Needs full API wiring.
> - **HYBRID** — Has `electronAPI` call(s) AND residual mock data (fallback, dead code, or overwrite). Needs cleanup.
> - **API_ONLY** — Fully wired to `electronAPI`; no mock data remains.
> - **STATIC** — Configuration/UI-only page; no dynamic data loading required.

---

## Summary

| Classification | Count | Files |
|---|---|---|
| **PURE_MOCK** | **13** | Highest priority — no backend connection at all |
| **HYBRID** | **14** | Mock data coexists with API calls — needs cleanup |
| **API_ONLY** | **24** | Already wired — no action needed |
| **STATIC** | **3** | UI-only — no data loading required |
| **TOTAL** | **54** | |

### Critical Bugs (mock OVERWRITES API data)

| File | Issue |
|---|---|
| `sales/SalesOrders.tsx` | `loadSalesOrders()` sets mock unconditionally in same `useEffect` as API call |
| `purchase/Vendors.tsx` | `loadMockVendors()` called AFTER `loadVendors()` in same `useEffect`, overwrites API data |
| `inventory/Warehouses.tsx` | Separate `useEffect` calls `loadMockWarehouses()` that overwrites API results |
| `inventory/StockMovements.tsx` | Mock array applied at end of `try` block AFTER API call — always overwrites |
| `hrm/Attendance.tsx` | Separate `useEffect` sets `mockEmployees` + `mockAttendance` with `setTimeout`, always overwrites API |

---

## Module: Sales (6 files)

### `sales/AgingReport.tsx` — HYBRID (758 lines)
- **API**: `window.electronAPI.sales.getAgingReport(tenant_id)`
- **Mock Pattern**: `loadMockData()` in `catch` block as error fallback. `const mockData: CustomerAging[]` — 5 customer entries with aging bucket data (current/30/60/90/180+ days, invoice arrays).
- **Fix**: Remove `loadMockData()` fallback; show proper error state instead.

### `sales/CustomerReceipts.tsx` — HYBRID (670 lines)
- **API**: `window.electronAPI.sales.getCustomerReceipts(tenant_id)`
- **Mock Pattern**: Unused `loadMockReceipts()` function containing 6 mock receipt entries (receiptNo, customerName, invoiceRefs, paymentMode, tdsAmount, status). Never called from `useEffect`.
- **Fix**: Delete dead `loadMockReceipts()` function.

### `sales/Customers.tsx` — API_ONLY (418 lines)
- **API**: `window.electronAPI.master.getCustomers()`, `window.electronAPI.sales.createCustomer()`
- No mock data. ✅

### `sales/POSTerminal.tsx` — PURE_MOCK (500 lines)
- **API**: None
- **Mock Pattern**: `const products = [...]` — 6 product entries with id, sku, name, barcode, price, gst_rate, hsn_code. Also inline customer list in modal.
- **Suggested API**: `window.electronAPI.inventory.getItems()` for products, `window.electronAPI.master.getCustomers()` for customers, new `window.electronAPI.sales.createPOSTransaction()` for checkout.

### `sales/SalesInvoices.tsx` — API_ONLY (240 lines)
- **API**: `window.electronAPI.sales.getSalesInvoices(tenant_id)`
- No mock data. ✅

### `sales/SalesOrders.tsx` — HYBRID ⚠️ CRITICAL (676 lines)
- **API**: `window.electronAPI.sales.getSalesOrders(tenant_id)` in `loadOrders()`
- **Mock Pattern**: `loadSalesOrders()` sets `mockOrders` (5 entries) + `mockOrderItems` (3 entries) unconditionally. Both `loadOrders()` and `loadSalesOrders()` called in same `useEffect` — **mock overwrites API result**.
- **Fix**: Remove `loadSalesOrders()` entirely and its call from `useEffect`.

---

## Module: Purchase (5 files)

### `purchase/GoodsReceiptNote.tsx` — API_ONLY (490 lines)
- **API**: `window.electronAPI.purchase.getGoodsReceiptNotes(tenant_id)`
- No mock data. ✅

### `purchase/PurchaseInvoices.tsx` — HYBRID (375 lines)
- **API**: `window.electronAPI.purchase.getPurchaseInvoices(tenant_id)`
- **Mock Pattern**: Unused `loadMockInvoices()` — 5 entries (invoice_number, vendor_name, vendor_gstin, subtotal, cgst/sgst/igst, tds_applicable). Never called.
- **Fix**: Delete dead `loadMockInvoices()` function.

### `purchase/PurchaseOrders.tsx` — HYBRID (423 lines)
- **API**: `window.electronAPI.purchase.getPurchaseOrders(tenant_id)`
- **Mock Pattern**: `const mockPOItems: POItem[]` (1 entry) — always rendered in the detail modal view regardless of API data.
- **Fix**: Fetch PO line items from API in detail view. Suggested: `window.electronAPI.purchase.getPurchaseOrderItems(tenant_id, po_id)`.

### `purchase/VendorPayments.tsx` — HYBRID (765 lines)
- **API**: `window.electronAPI.purchase.getVendorPayments(tenant_id)`
- **Mock Pattern**: Unused `loadMockPayments()` — 6 entries (paymentNo, vendorName, tdsSection, paymentMode, invoiceRefs). Never called.
- **Fix**: Delete dead `loadMockPayments()` function.

### `purchase/Vendors.tsx` — HYBRID ⚠️ CRITICAL (413 lines)
- **API**: `window.electronAPI.master.getVendors(tenant_id)` in `loadVendors()`
- **Mock Pattern**: `loadMockVendors()` called in `useEffect` immediately after `loadVendors()` — **overwrites API data** with 5 hardcoded vendors.
- **Fix**: Remove `loadMockVendors()` call and function entirely.

---

## Module: Inventory (7 files)

### `inventory/GatePassManagement.tsx` — PURE_MOCK (487 lines)
- **API**: None
- **Mock Pattern**: `setGatePasses([...])` in `useEffect` — 4 gate pass entries (gate_pass_number, type RGP/NRGP, party_name, items array, vehicle_no, purpose).
- **Suggested API**: `window.electronAPI.inventory.getGatePasses(tenant_id)`, `window.electronAPI.inventory.createGatePass()`.

### `inventory/Items.tsx` — API_ONLY (430 lines)
- **API**: `window.electronAPI.inventory.getItems()`, `window.electronAPI.inventory.createItem()`
- No mock data. ✅

### `inventory/LowStockAlerts.tsx` — HYBRID (638 lines)
- **API**: `window.electronAPI.inventory.getLowStockAlerts(tenant_id)`
- **Mock Pattern**: Unused `loadLowStockItems()` — 6 entries (itemCode, currentStock, reorderLevel, daysUntilStockout, preferredSupplier). Never called from `useEffect`.
- **Fix**: Delete dead `loadLowStockItems()` function.

### `inventory/StockLedger.tsx` — HYBRID (632 lines)
- **API**: `window.electronAPI.inventory.getStockMovements(tenant_id)`
- **Mock Pattern**: `loadMockData()` defined with mockMovements (5 entries), mockItemSummary (5 entries), mockWarehouseBreakdown (3 entries). Not called from `useEffect` — dead code.
- **Fix**: Delete dead `loadMockData()` function.

### `inventory/StockMovements.tsx` — HYBRID ⚠️ CRITICAL (517 lines)
- **API**: `window.electronAPI.inventory.getStockMovements(tenant_id)`
- **Mock Pattern**: `const mockMovements` (10 entries) declared inside `try` block AFTER API call. `setMovements(filtered)` at end of block always applies mock data — **always overwrites API result**.
- **Fix**: Remove the mock array from the `try` block; use API response directly.

### `inventory/StockValuation.tsx` — API_ONLY (513 lines)
- **API**: `window.electronAPI.inventory.getStockValuation(tenant_id)`
- No mock data. ✅

### `inventory/Warehouses.tsx` — HYBRID ⚠️ CRITICAL (312 lines)
- **API**: `window.electronAPI.inventory.getWarehouses(tenant_id)` in `loadWarehouses()`
- **Mock Pattern**: Separate `useEffect(() => { loadMockWarehouses(); }, [])` — **overwrites API data** with 5 hardcoded warehouses.
- **Fix**: Remove `loadMockWarehouses()` and its separate `useEffect`.

---

## Module: Manufacturing (8 files)

### `manufacturing/BillOfMaterials.tsx` — HYBRID (533 lines)
- **API**: `window.electronAPI.manufacturing.getBOMs(tenant_id)` for list
- **Mock Pattern**: (1) Dead `loadMockBOMs()` function — defined but never called. (2) `const mockComponents: BOMComponent[]` (3 entries) + `const mockOperations: BOMOperation[]` (2 entries) — **always used** in detail modal JSX.
- **Fix**: Delete `loadMockBOMs()`. Add API call for BOM details: `window.electronAPI.manufacturing.getBOMComponents(tenant_id, bom_id)` and `window.electronAPI.manufacturing.getBOMOperations(tenant_id, bom_id)`.

### `manufacturing/ProductionOrders.tsx` — HYBRID (595 lines)
- **API**: `window.electronAPI.manufacturing.getProductionOrders(tenant_id)` in `loadOrders()`
- **Mock Pattern**: (1) Dead `loadMockOrders()` — defined but never called. (2) `const mockMaterials: MaterialRequirement[]` (5+ entries) — **always used** in detail view JSX.
- **Fix**: Delete `loadMockOrders()`. Add API: `window.electronAPI.manufacturing.getProductionOrderMaterials(tenant_id, po_id)`.

### `manufacturing/WorkCenters.tsx` — API_ONLY (407 lines)
- **API**: `window.electronAPI.manufacturing.getWorkCenters(tenant_id)`
- No mock data. ✅ (Note: `useEffect` calls `loadWorkCenters()` twice — minor bug, not mock-related.)

### `manufacturing/OEEDashboard.tsx` — PURE_MOCK (417 lines)
- **API**: None
- **Mock Pattern**: `useEffect` with comments "Mock data for demo" / "Set mock OEE data". Sets inline OEE metrics (availability, performance, quality percentages), machine data arrays, downtime reasons.
- **Suggested API**: `window.electronAPI.manufacturing.getOEEDashboard(tenant_id)` or `getOEEMetrics()`.

### `manufacturing/QCInspection.tsx` — PURE_MOCK (519 lines)
- **API**: None
- **Mock Pattern**: `const mockData: QCInspection[]` (multiple entries) in `useEffect`. `setInspections(mockData)` — hardcoded inspection records with inspector names, test results, dimensions, temperatures.
- **Suggested API**: `window.electronAPI.manufacturing.getQCInspections(tenant_id)`, `createQCInspection()`.

### `manufacturing/JobWorkChallan.tsx` — PURE_MOCK (588 lines)
- **API**: None
- **Mock Pattern**: `useEffect` with "Mock challans data" (multiple entries) + "Mock ITC-04 summary" — hardcoded challans (challan_number, job_worker, items, hsn_codes) and ITC-04 return data.
- **Suggested API**: `window.electronAPI.manufacturing.getJobWorkChallans(tenant_id)`, `getITC04Summary(tenant_id, period)`.

### `manufacturing/MRPPlanning.tsx` — PURE_MOCK (534 lines)
- **API**: None
- **Mock Pattern**: `useEffect` with "Mock MRP runs" (schedule data) + "Mock planned orders" (procurement suggestions). Inline arrays set into state.
- **Suggested API**: `window.electronAPI.manufacturing.getMRPRuns(tenant_id)`, `getPlannedOrders(tenant_id)`, `runMRP(tenant_id, params)`.

### `manufacturing/ShopFloorKiosk.tsx` — PURE_MOCK (562 lines)
- **API**: None
- **Mock Pattern**: `useEffect` with "Mock data for demo" — sets operator data, active jobs, machine status, shift targets. Timer `useEffect` updates `currentTime`.
- **Suggested API**: `window.electronAPI.manufacturing.getShopFloorData(tenant_id, work_center_id)`, `recordOutput()`, `recordDowntime()`.

---

## Module: HRM (5 files)

### `hrm/Employees.tsx` — HYBRID (419 lines)
- **API**: `window.electronAPI.hrm.getEmployees(tenant_id)`
- **Mock Pattern**: Dead `loadMockEmployees()` function — defined but never called. Contains 5+ mock employee records.
- **Fix**: Delete dead `loadMockEmployees()` function.

### `hrm/Attendance.tsx` — HYBRID ⚠️ CRITICAL (615 lines)
- **API**: `window.electronAPI.hrm.getEmployees(tenant_id)`, `window.electronAPI.hrm.getAttendanceReport(tenant_id, emp_id, month)`
- **Mock Pattern**: Separate `useEffect` at line 151 creates `mockEmployees` (8 entries) + `mockAttendance` array, then calls `setEmployees(mockEmployees)` and `setAttendance(mockAttendance)` with `setTimeout(500ms)` — **always overwrites API data**.
- **Fix**: Remove the mock `useEffect` entirely.

### `hrm/LeaveManagement.tsx` — API_ONLY (462 lines)
- **API**: `window.electronAPI.hrm.getLeaves(tenant_id, filters)`
- No mock data. ✅

### `hrm/Payroll.tsx` — HYBRID (567 lines)
- **API**: `window.electronAPI.hrm.getPayrolls(tenant_id)`
- **Mock Pattern**: Dead `loadMockPayrolls()` function — defined but never called. Contains 5+ mock payroll entries.
- **Fix**: Delete dead `loadMockPayrolls()` function.

### `hrm/TaxDeclarations.tsx` — PURE_MOCK (500 lines)
- **API**: None
- **Mock Pattern**: `const mockData: TaxDeclaration[]` in `useEffect` — multiple employee tax declaration entries (employee_name, pan, regime, sections 80C/80D/HRA, investments array). `setDeclarations(mockData)`.
- **Suggested API**: `window.electronAPI.hrm.getTaxDeclarations(tenant_id, fy)`, `createTaxDeclaration()`.

---

## Module: GST (7 files)

### `gst/GSTR1.tsx` — API_ONLY (261 lines)
- **API**: `window.electronAPI.gst.getGSTR1Data(tenant_id, month)`
- No mock data. ✅

### `gst/GSTR2BReconciliation.tsx` — API_ONLY (365 lines)
- **API**: `window.electronAPI.gst.getGSTR1B2BDetails(tenant_id, period)`
- No mock data. ✅

### `gst/HSNSummary.tsx` — API_ONLY (335 lines)
- **API**: `window.electronAPI.gst.getHSNWiseSummary(tenant_id, fromDate, toDate)`
- No mock data. ✅

### `gst/ITCReconciliation.tsx` — API_ONLY (460 lines)
- **API**: `window.electronAPI.gst.performITCReconciliation(tenant_id, period)`
- No mock data. ✅

### `gst/TdsManagement.tsx` — API_ONLY (384 lines)
- **API**: `window.electronAPI.gst.getTdsSections()`, `getTdsTransactions(tenant_id, filters)`, `getTdsSummary(tenant_id, quarter)`
- No mock data. ✅

### `gst/EInvoice.tsx` — PURE_MOCK (260 lines)
- **API**: None
- **Mock Pattern**: `useEffect` with "Mock data" comment — inline e-invoice entries (invoice_number, customer_gstin, irn, ack_number, status).
- **Suggested API**: `window.electronAPI.gst.getEInvoices(tenant_id)`, `generateIRN(tenant_id, invoice_id)`, `cancelIRN()`.

### `gst/EWayBill.tsx` — PURE_MOCK (733 lines)
- **API**: None
- **Mock Pattern**: `useEffect` with "Mock e-way bills data" — inline e-way bill entries (ewb_number, invoice_number, transporter, vehicle_number, distance, validity, status) + consolidated bills.
- **Suggested API**: `window.electronAPI.gst.getEWayBills(tenant_id)`, `generateEWayBill()`, `cancelEWayBill()`, `extendEWayBill()`.

---

## Module: Reports (5 files)

### `reports/SalesReports.tsx` — API_ONLY (344 lines)
- **API**: `window.electronAPI.sales.getSalesReport(tenant_id, dateFrom, dateTo)`
- No mock data. ✅

### `reports/PurchaseReports.tsx` — API_ONLY (363 lines)
- **API**: `window.electronAPI.purchase.getPurchaseReport(tenant_id, dateFrom, dateTo)`
- No mock data. ✅

### `reports/InventoryReports.tsx` — API_ONLY (375 lines)
- **API**: `window.electronAPI.inventory.getStockValuation(tenant_id)`, `getLowStockAlerts(tenant_id)`
- Mock removed — comment "OLD Mock data - REMOVED" at line 99. ✅

### `reports/GSTReports.tsx` — API_ONLY (414 lines)
- **API**: `window.electronAPI.gst.getGSTLiabilitySummary(tenant_id, from, to)`
- No mock data. ✅

### `reports/FinancialReports.tsx` — STATIC (344 lines)
- **API**: None
- No mock data. This is a report template selector/launcher page with static report definitions. No dynamic data loading. ✅

---

## Module: Finance (9 files)

### `finance/BalanceSheet.tsx` — API_ONLY (300 lines)
- **API**: `window.electronAPI.finance.getBalanceSheet(tenant_id, asOnDate)`
- No mock data. ✅

### `finance/ChartOfAccounts.tsx` — API_ONLY (234 lines)
- **API**: `window.electronAPI.finance.getChartOfAccounts(tenant_id)`
- No mock data. ✅

### `finance/GeneralLedger.tsx` — API_ONLY (306 lines)
- **API**: `window.electronAPI.finance.getChartOfAccounts(tenant_id)`, `getAccountLedger(tenant_id, account, from, to)`
- No mock data. ✅

### `finance/JournalEntries.tsx` — API_ONLY (231 lines)
- **API**: `window.electronAPI.finance.getJournalEntries(tenant_id)`
- No mock data. ✅

### `finance/TrialBalance.tsx` — API_ONLY (277 lines)
- **API**: `window.electronAPI.finance.getTrialBalance(tenant_id, asOnDate)`
- No mock data. ✅

### `finance/ProfitAndLoss.tsx` — API_ONLY (326 lines)
- **API**: `window.electronAPI.finance.getProfitAndLoss(tenant_id, from, to)`
- No mock data. ✅

### `finance/BankReconciliation.tsx` — API_ONLY (417 lines)
- **API**: `(window as any).electronAPI.finance.getBankReconciliation(bank, date)`
- No mock data. ✅ (Note: uses `(window as any)` cast — missing type declaration.)

### `finance/CreditLimitManagement.tsx` — API_ONLY (552 lines)
- **API**: `(window as any).electronAPI.finance.getCreditLimits()`
- No mock data. ✅ (Note: uses `(window as any)` cast — missing type declaration.)

### `finance/CashFlowStatement.tsx` — *(if exists)*
- Not found in file listing. May need to be created.

---

## Module: Settings (1 file)

### `settings/Settings.tsx` — STATIC (472 lines)
- **API**: None
- Static configuration page. Company info, GST settings, etc. are initialized with placeholder values in `useState` but these are form defaults, not mock data. Should eventually persist via `window.electronAPI.settings.getCompanyInfo()` / `saveCompanyInfo()`.

---

## Root Pages (2 files)

### `Dashboard.tsx` — API_ONLY (348 lines)
- **API**: `window.electronAPI.dashboard.getStats(tenant_id)`, `getRecentTransactions(tenant_id)`
- No mock data. ✅

### `Login.tsx` — STATIC (163 lines)
- Authentication page. No data loading. ✅

---

## Priority Action Plan

### P0 — Fix Critical Bugs (5 files, mock overwrites API data)
These files have mock data that **silently replaces** real API responses:

1. **`sales/SalesOrders.tsx`** — Remove `loadSalesOrders()` mock function and its call
2. **`purchase/Vendors.tsx`** — Remove `loadMockVendors()` and its call from `useEffect`
3. **`inventory/Warehouses.tsx`** — Remove `loadMockWarehouses()` and its separate `useEffect`
4. **`inventory/StockMovements.tsx`** — Remove mock array from inside `try` block
5. **`hrm/Attendance.tsx`** — Remove mock `useEffect` at line 151

### P1 — Wire PURE_MOCK Pages (13 files, 0% API coverage)
These pages show only hardcoded data:

| # | File | Lines | New API Methods Needed |
|---|---|---|---|
| 1 | `sales/POSTerminal.tsx` | 500 | `inventory.getItems()`, `sales.createPOSTransaction()` |
| 2 | `inventory/GatePassManagement.tsx` | 487 | `inventory.getGatePasses()`, `createGatePass()` |
| 3 | `manufacturing/OEEDashboard.tsx` | 417 | `manufacturing.getOEEMetrics()` |
| 4 | `manufacturing/QCInspection.tsx` | 519 | `manufacturing.getQCInspections()`, `createQCInspection()` |
| 5 | `manufacturing/JobWorkChallan.tsx` | 588 | `manufacturing.getJobWorkChallans()`, `getITC04Summary()` |
| 6 | `manufacturing/MRPPlanning.tsx` | 534 | `manufacturing.getMRPRuns()`, `getPlannedOrders()`, `runMRP()` |
| 7 | `manufacturing/ShopFloorKiosk.tsx` | 562 | `manufacturing.getShopFloorData()`, `recordOutput()` |
| 8 | `hrm/TaxDeclarations.tsx` | 500 | `hrm.getTaxDeclarations()`, `createTaxDeclaration()` |
| 9 | `gst/EInvoice.tsx` | 260 | `gst.getEInvoices()`, `generateIRN()`, `cancelIRN()` |
| 10 | `gst/EWayBill.tsx` | 733 | `gst.getEWayBills()`, `generateEWayBill()`, `cancelEWayBill()` |

### P2 — Clean Up Dead Mock Code (9 files)
These have unused mock functions that should be deleted:

| File | Dead Function |
|---|---|
| `sales/CustomerReceipts.tsx` | `loadMockReceipts()` |
| `sales/AgingReport.tsx` | `loadMockData()` fallback in catch |
| `purchase/PurchaseInvoices.tsx` | `loadMockInvoices()` |
| `purchase/VendorPayments.tsx` | `loadMockPayments()` |
| `inventory/LowStockAlerts.tsx` | `loadLowStockItems()` |
| `inventory/StockLedger.tsx` | `loadMockData()` |
| `manufacturing/BillOfMaterials.tsx` | `loadMockBOMs()` |
| `manufacturing/ProductionOrders.tsx` | `loadMockOrders()` |
| `hrm/Employees.tsx` | `loadMockEmployees()` |
| `hrm/Payroll.tsx` | `loadMockPayrolls()` |

### P3 — Wire Mock Detail Views (3 files)
These have API-driven list views but mock data in detail/modal views:

| File | Mock in Detail View | API Needed |
|---|---|---|
| `purchase/PurchaseOrders.tsx` | `mockPOItems` in detail modal | `purchase.getPurchaseOrderItems()` |
| `manufacturing/BillOfMaterials.tsx` | `mockComponents` + `mockOperations` | `manufacturing.getBOMComponents()`, `getBOMOperations()` |
| `manufacturing/ProductionOrders.tsx` | `mockMaterials` | `manufacturing.getProductionOrderMaterials()` |

### P4 — Type Safety Fixes (2 files)
| File | Issue |
|---|---|
| `finance/BankReconciliation.tsx` | Uses `(window as any).electronAPI` — add proper type declaration |
| `finance/CreditLimitManagement.tsx` | Uses `(window as any).electronAPI` — add proper type declaration |
