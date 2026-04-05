import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const QUICK_QUESTIONS = [
  'How do I login?',
  'What modules are available?',
  'How to create a sales order?',
  'How to generate GST reports?',
  'What user roles exist?',
  'How to manage inventory?',
];

// ─── Knowledge Base ──────────────────────────────────────────────
const KB: Array<{ patterns: RegExp; answer: string }> = [
  // ── Login & Auth ──
  {
    patterns: /login|sign.?in|credentials|password|username|how.*(get|access)|can.?t.*log/i,
    answer: `**Login Credentials (Demo):**\n\n| Role | Username | Password |\n|------|----------|----------|\n| Admin | admin | admin123 |\n| CEO | ceo | ceo123 |\n| Sales Mgr | sales_mgr | sales123 |\n| Accountant | accountant | acc123 |\n| HR Manager | hr_mgr | hr123 |\n| Viewer | viewer | view123 |\n\nGo to the login page, enter your username and password, then click **Login**. Each role has different permissions — Admin can access everything.`,
  },
  {
    patterns: /logout|sign.?out|session/i,
    answer: `To **logout**, click your profile icon / avatar in the top-right corner of the header, then select **Logout**. This clears your session completely. On your next visit you'll need to login again.`,
  },
  // ── Modules Overview ──
  {
    patterns: /module|feature|what.*(can|does)|overview|available|section/i,
    answer: `**SA ERP has 10 modules with 59 pages:**\n\n📊 **Dashboard** — KPIs, charts, recent activity\n💰 **Finance** (8 pages) — Chart of Accounts, Journal Entries, General Ledger, Trial Balance, P&L, Balance Sheet, Bank Reconciliation, Credit Management\n📦 **Inventory** (7 pages) — Items, Warehouses, Stock Ledger, Stock Moves, Valuation, Low Stock Alerts, Gate Pass\n🛒 **Sales** (6 pages) — Customers, Sales Orders, Invoices, POS Terminal, Receipts, Aging Report\n🏪 **Purchase** (5 pages) — Vendors, Purchase Orders, GRN, Invoices, Payments\n🏭 **Manufacturing** (8 pages) — BOM, Work Centers, Production Orders, MRP, Job Work, Shop Floor, OEE, QC\n👥 **HRM** (5 pages) — Employees, Attendance, Leave, Payroll, Tax Declarations\n🧾 **GST & Tax** (7 pages) — E-Invoice, E-Way Bill, GSTR-1, GSTR-2B, TDS, ITC Recon, HSN Summary\n📈 **Reports** (5 pages) — Financial, Sales, Purchase, Inventory, GST\n⚙️ **Settings** — Company Profile, Users, Roles, Master Data`,
  },
  // ── Dashboard ──
  {
    patterns: /dashboard|home|kpi|overview.*page|main.*page/i,
    answer: `The **Dashboard** is your home page after login. It shows:\n\n• **KPI Cards** — Total revenue, outstanding invoices, inventory value, pending orders\n• **Charts** — Sales trends, expense breakdown, monthly comparison\n• **Recent Activity** — Latest transactions across all modules\n• **Quick Actions** — Shortcuts to create new orders, invoices, etc.\n\nNavigate to it by clicking the **Dashboard** link in the sidebar.`,
  },
  // ── Sales ──
  {
    patterns: /sales.*order|create.*order|new.*order|how.*order/i,
    answer: `**To create a Sales Order:**\n\n1. Go to **Sales → Sales Orders** from the sidebar\n2. Click the **"New Sales Order"** button (top-right)\n3. Fill in customer details, items, quantities, and prices\n4. Click **"Create & Add Items"** to save\n\nOnce created, you can **Approve**, **Create Delivery**, or **Generate Invoice** from the order's action buttons. Draft orders can also be edited or duplicated.`,
  },
  {
    patterns: /customer|client|buyer/i,
    answer: `**Managing Customers:**\n\n1. Go to **Sales → Customers**\n2. Click **"Add Customer"** to create a new one\n3. Fill in name, GSTIN, address, credit limit, etc.\n4. Click **Save**\n\nYou can view, edit, or delete customers from the table. Each customer's outstanding balance and order history is tracked automatically.`,
  },
  {
    patterns: /invoice|bill.*customer|sales.*invoice/i,
    answer: `**Sales Invoices:**\n\n1. Go to **Sales → Invoices**\n2. Click **"New Invoice"** to create one manually, or generate from a Sales Order\n3. The invoice auto-calculates GST based on HSN codes\n4. You can view or print invoices from the action icons in the table\n\nInvoices are also used for **E-Invoice** and **E-Way Bill** generation under GST compliance.`,
  },
  {
    patterns: /pos|point.*sale|retail|billing.*counter/i,
    answer: `**POS Terminal** (Sales → POS):\n\n• Quick billing interface for retail/counter sales\n• Search or scan products to add them to the cart\n• Adjust quantities, apply discounts\n• Select customer or use walk-in\n• Click **"Complete Transaction"** to finalize\n• Supports cash and other payment methods`,
  },
  {
    patterns: /receipt|payment.*receive|collection|customer.*receipt/i,
    answer: `**Customer Receipts** (Sales → Receipts):\n\n1. Click **"New Receipt"**\n2. Select the customer and payment method\n3. Enter the amount and reference number\n4. Click **"Create Receipt"**\n\nReceipts are auto-linked to outstanding invoices. You can expand any receipt row to see which invoices it was applied against.`,
  },
  {
    patterns: /aging|overdue|outstanding|receivable/i,
    answer: `**Aging Report** (Sales → Aging Report):\n\nShows all outstanding receivables grouped by age buckets (0-30, 31-60, 61-90, 90+ days). Helps you:\n• Identify overdue payments\n• Prioritize collections\n• Track customer payment patterns\n\nYou can filter by customer, date range, or amount.`,
  },
  // ── Purchase ──
  {
    patterns: /vendor|supplier/i,
    answer: `**Managing Vendors** (Purchase → Vendors):\n\n1. Click **"Add Vendor"** to create a new supplier\n2. Enter company name, GSTIN, contact details, payment terms\n3. Click **"Save Vendor"**\n\nVendors are linked to Purchase Orders, GRNs, and payment tracking.`,
  },
  {
    patterns: /purchase.*order|po\b|buy.*order/i,
    answer: `**Purchase Orders** (Purchase → Purchase Orders):\n\n1. Click **"New Purchase Order"**\n2. Select vendor, add items with quantities and rates\n3. Submit for approval or save as draft\n4. Once approved, proceed to receive goods via **GRN**\n\nPO status tracks: Draft → Submitted → Approved → Received → Completed`,
  },
  {
    patterns: /grn|goods.*receipt|receive.*goods|inward/i,
    answer: `**Goods Receipt Note (GRN)** (Purchase → GRN):\n\nCreate a GRN when goods arrive from a vendor:\n1. Select the relevant Purchase Order\n2. Enter received quantities (can be partial)\n3. Note any quality issues or shortages\n4. Save to update inventory automatically\n\nGRN links to quality inspection and triggers stock updates.`,
  },
  {
    patterns: /vendor.*payment|pay.*vendor|supplier.*payment/i,
    answer: `**Vendor Payments** (Purchase → Payments):\n\n1. Click **"New Payment"**\n2. Select vendor and payment method\n3. Enter amount and reference\n4. Link to purchase invoices\n\nPayments are tracked against outstanding purchase invoices. You can expand each row to see the linked invoices.`,
  },
  // ── Finance ──
  {
    patterns: /chart.*account|coa|ledger.*account/i,
    answer: `**Chart of Accounts** (Finance → Chart of Accounts):\n\nManages your complete account structure:\n• **Assets** — Bank, Cash, Receivables, Fixed Assets\n• **Liabilities** — Payables, Loans, Provisions\n• **Income** — Revenue accounts\n• **Expenses** — Cost accounts\n\nClick **"Add Account"** to create new accounts. Accounts use a hierarchical numbering system.`,
  },
  {
    patterns: /journal|entry|debit.*credit|accounting.*entry/i,
    answer: `**Journal Entries** (Finance → Journal Entries):\n\n1. Click **"New Entry"**\n2. Add debit and credit lines (must balance)\n3. Enter narration and date\n4. Click **"Post Entry"** to finalize\n\nYou can also Edit or Reverse posted entries. Journal entries automatically update the General Ledger.`,
  },
  {
    patterns: /general.*ledger/i,
    answer: `**General Ledger** (Finance → General Ledger):\n\nShows all transactions for a selected account within a date range. Includes opening balance, each debit/credit transaction, and closing balance. Use it for account-level audit trails.`,
  },
  {
    patterns: /trial.*balance/i,
    answer: `**Trial Balance** (Finance → Trial Balance):\n\nDisplays all account balances at a point in time. Debits must equal credits. Useful for period-end verification before preparing financial statements.`,
  },
  {
    patterns: /profit.*loss|p.*l|income.*statement/i,
    answer: `**Profit & Loss Statement** (Finance → P&L):\n\nShows revenue minus expenses for a selected period. Includes:\n• Gross Profit (Revenue − Cost of Goods)\n• Operating Profit (Gross − Operating Expenses)\n• Net Profit (after tax and other items)\n\nFilter by date range and compare across periods.`,
  },
  {
    patterns: /balance.*sheet/i,
    answer: `**Balance Sheet** (Finance → Balance Sheet):\n\nShows Assets = Liabilities + Equity at a point in time. Auto-generated from your Chart of Accounts data. Includes current/non-current classification.`,
  },
  {
    patterns: /bank.*recon|reconcil.*bank/i,
    answer: `**Bank Reconciliation** (Finance → Bank Reconciliation):\n\n1. Click **"Import Statement"** to upload your bank CSV/XLSX\n2. The system matches bank entries with your books\n3. Review matched, unmatched, and partial matches\n4. Click **"Reconcile"** to confirm matches\n\nSupported formats: CSV, XLSX, OFX, MT940.`,
  },
  {
    patterns: /credit.*limit|credit.*manage/i,
    answer: `**Credit Limit Management** (Finance → Credit Management):\n\nSet and monitor credit limits for customers:\n• Approve or reject credit limit requests\n• View current utilization vs limit\n• Edit limits and save changes\n• Automatic alerts when limits are near exhaustion`,
  },
  // ── Inventory ──
  {
    patterns: /item|product|sku|stock.*item/i,
    answer: `**Items Master** (Inventory → Items):\n\nManage your product catalog:\n1. Click **"Add Item"** to create\n2. Enter name, SKU, HSN code, unit, pricing\n3. Set reorder level and preferred vendor\n4. Save\n\nItems are linked to sales, purchase, and manufacturing modules.`,
  },
  {
    patterns: /warehouse|godown|storage.*location/i,
    answer: `**Warehouses** (Inventory → Warehouses):\n\nManage storage locations:\n1. Click **"Add Warehouse"** to create\n2. Enter name, address, capacity, manager\n3. Save\n\nEach warehouse tracks stock independently. You can transfer stock between warehouses via Stock Moves.`,
  },
  {
    patterns: /stock.*ledger/i,
    answer: `**Stock Ledger** (Inventory → Stock Ledger):\n\nShows every stock movement for each item — purchases in, sales out, transfers, adjustments. Includes opening qty, transaction details, and closing balance. Export data for audit.`,
  },
  {
    patterns: /stock.*mov|transfer|stock.*adjust/i,
    answer: `**Stock Movements** (Inventory → Stock Moves):\n\nTrack all inventory movements:\n• **Transfers** between warehouses\n• **Adjustments** for damaged/lost goods\n• **Returns** from customers or to vendors\n\nEach movement updates the Stock Ledger automatically.`,
  },
  {
    patterns: /valuation|stock.*value|inventory.*value|fifo|weighted/i,
    answer: `**Stock Valuation** (Inventory → Valuation):\n\nCalculates the total value of your inventory using methods like FIFO or Weighted Average. Shows:\n• Item-wise valuation\n• Category-wise summary\n• Total inventory worth\n\nUse Filters to drill down. Export to Excel for reporting.`,
  },
  {
    patterns: /low.*stock|reorder|alert.*stock|out.*stock/i,
    answer: `**Low Stock Alerts** (Inventory → Low Stock Alerts):\n\nMonitors items below reorder levels:\n• Set alert rules per item\n• Select critical items and click **"Generate PO"** to auto-create purchase orders\n• Email reports to suppliers\n• Auto-notification when stock falls below threshold`,
  },
  {
    patterns: /gate.*pass/i,
    answer: `**Gate Pass Management** (Inventory → Gate Pass):\n\nTrack material entering/leaving premises:\n• **RGP** (Returnable Gate Pass) — for items going out and expected back\n• **NRGP** (Non-Returnable Gate Pass) — permanent outward movement\n\nCreate passes, track status, and print for security checkpoints.`,
  },
  // ── Manufacturing ──
  {
    patterns: /bom|bill.*material|recipe|component/i,
    answer: `**Bill of Materials** (Manufacturing → BOM):\n\n1. Click **"Create BOM"**\n2. Select the finished product\n3. Add raw materials with quantities\n4. Set routing/work center\n5. Save\n\nBOMs drive MRP planning and production cost calculation. You can also create Production Orders directly from a BOM.`,
  },
  {
    patterns: /production.*order|work.*order|manufacture.*order/i,
    answer: `**Production Orders** (Manufacturing → Production Orders):\n\n1. Click **"New Production Order"**\n2. Select BOM and quantity to produce\n3. Schedule start/end dates\n4. Submit for production\n\nTrack status: Planned → In Progress → Completed. Linked to Shop Floor for execution tracking.`,
  },
  {
    patterns: /mrp|material.*requirement|planning/i,
    answer: `**MRP Planning** (Manufacturing → MRP):\n\nMaterial Requirements Planning:\n• Analyzes demand from sales orders\n• Checks current stock levels\n• Suggests purchase orders for shortfalls\n• Considers lead times and safety stock\n\nRun MRP to get actionable recommendations.`,
  },
  {
    patterns: /job.*work|challan|outsourc/i,
    answer: `**Job Work Challan** (Manufacturing → Job Work):\n\nManage outsourced manufacturing:\n1. Create challan with items sent to job worker\n2. Track dispatch and return status\n3. Generate **ITC-04** for GST compliance\n4. Print challans for documentation\n\nSupports partial returns and overdue tracking.`,
  },
  {
    patterns: /shop.*floor|kiosk|production.*tracking/i,
    answer: `**Shop Floor Kiosk** (Manufacturing → Shop Floor):\n\nReal-time production tracking interface:\n• **Start/Pause/Resume** production jobs\n• **Record Output** — quantities produced\n• **Record Downtime** — track machine stoppages\n• Live status of all active work orders`,
  },
  {
    patterns: /oee|equipment.*effectiveness|machine.*efficiency/i,
    answer: `**OEE Dashboard** (Manufacturing → OEE):\n\nOverall Equipment Effectiveness tracking:\n• **Availability** — uptime vs planned time\n• **Performance** — actual vs expected output rate\n• **Quality** — good units vs total produced\n• OEE % = Availability × Performance × Quality\n\nHelps identify bottlenecks and improvement areas.`,
  },
  {
    patterns: /qc|quality|inspection/i,
    answer: `**QC Inspection** (Manufacturing → QC):\n\nQuality control for production:\n• Create inspections linked to production orders\n• Record test parameters and results\n• Pass/Fail/Conditional status\n• Capture photos and download reports\n\nEnsures only quality-approved goods enter inventory.`,
  },
  {
    patterns: /work.*center|machine.*center/i,
    answer: `**Work Centers** (Manufacturing → Work Centers):\n\nManage production resources:\n• Define work centers with capacity and rates\n• Track utilization and efficiency\n• Schedule maintenance\n• View analytics on performance\n\nUsed in BOM routing and production scheduling.`,
  },
  // ── HRM ──
  {
    patterns: /employee|staff|personnel|team.*member/i,
    answer: `**Employees** (HRM → Employees):\n\n1. Click **"Add Employee"**\n2. Enter personal details, department, designation\n3. Set salary structure and bank details\n4. Save\n\nEmployee records link to attendance, leave, payroll, and tax declarations.`,
  },
  {
    patterns: /attendance|check.?in|biometric|present|absent/i,
    answer: `**Attendance** (HRM → Attendance):\n\n• Mark daily attendance for employees\n• Import biometric data from devices\n• View monthly attendance calendars\n• Export attendance reports\n• Track late arrivals and early departures`,
  },
  {
    patterns: /leave|vacation|holiday|time.?off/i,
    answer: `**Leave Management** (HRM → Leave):\n\nManage employee leaves:\n• Define leave types (Casual, Sick, Earned, etc.)\n• Employees apply for leave\n• Managers approve/reject\n• Auto-deduct from leave balance\n• View leave calendar and balance reports`,
  },
  {
    patterns: /payroll|salary|pay.*slip|wage/i,
    answer: `**Payroll** (HRM → Payroll):\n\n• Process monthly payroll for all employees\n• Auto-calculates based on attendance, leaves, deductions\n• Includes PF, ESI, TDS, Professional Tax\n• Generate pay slips\n• Track payment status`,
  },
  {
    patterns: /tax.*declaration|investment.*proof|80c|hra/i,
    answer: `**Tax Declarations** (HRM → Tax Declarations):\n\nManage employee tax saving declarations:\n• Employees declare investments under 80C, 80D, HRA, etc.\n• Upload proof documents\n• HR reviews and approves\n• Auto-calculates tax liability for payroll TDS`,
  },
  // ── GST ──
  {
    patterns: /gst|tax.*compliance/i,
    answer: `**GST & Tax Module** (7 pages):\n\n🧾 **E-Invoice** — Generate IRN for B2B invoices via NIC portal\n🚛 **E-Way Bill** — Generate/manage e-way bills for goods transport\n📋 **GSTR-1** — Outward supply return preparation\n📥 **GSTR-2B Reconciliation** — Match purchase data with GSTR-2B\n💳 **TDS Management** — Track TDS deducted/deposited, generate Form 26Q\n🔄 **ITC Reconciliation** — Reconcile Input Tax Credit claims\n📊 **HSN Summary** — HSN/SAC-wise summary for returns`,
  },
  {
    patterns: /e.?invoice|irn|einvoice/i,
    answer: `**E-Invoice** (GST → E-Invoice):\n\n• Auto-generates IRN (Invoice Reference Number) via NIC\n• Required for B2B invoices above threshold\n• QR code auto-generated\n• Cancel/amend within 24 hours\n• Tracks generation status for all invoices`,
  },
  {
    patterns: /e.?way.*bill|transport|eway/i,
    answer: `**E-Way Bill** (GST → E-Way Bill):\n\n1. Click **"Generate E-Way Bill"**\n2. Enter transport details (vehicle, distance)\n3. Submit to generate\n4. **Extend Validity** if transport is delayed\n5. **Update Vehicle** if vehicle changes\n\nRequired for goods movement above ₹50,000. Print for the transporter.`,
  },
  {
    patterns: /gstr.?1|outward.*supply|return.*filing/i,
    answer: `**GSTR-1** (GST → GSTR-1):\n\nPrepare your monthly/quarterly outward supply return:\n• Auto-populated from sales invoices\n• B2B, B2C, Credit/Debit notes, Exports\n• Review and validate data\n• Download JSON for portal upload`,
  },
  {
    patterns: /gstr.?2b|2b.*recon|inward.*supply/i,
    answer: `**GSTR-2B Reconciliation** (GST → GSTR-2B):\n\n1. Upload GSTR-2B JSON from the GST portal\n2. System matches with your purchase records\n3. Review matched, mismatched, and missing entries\n4. Export reconciliation report`,
  },
  {
    patterns: /tds|tax.*deduct|26q|form.*26/i,
    answer: `**TDS Management** (GST → TDS):\n\nTrack Tax Deducted at Source:\n• Record TDS on payments to vendors\n• Track deposit status with government\n• Generate Form 26Q for quarterly filing\n• View section-wise (194C, 194J, etc.) summary`,
  },
  {
    patterns: /itc|input.*tax.*credit/i,
    answer: `**ITC Reconciliation** (GST → ITC Reconciliation):\n\n1. Import GSTR-2A data\n2. Click **"Run Reconciliation"**\n3. System compares claimed ITC with available credit\n4. Review matched, excess, and unavailable ITC\n5. Export report for audit`,
  },
  {
    patterns: /hsn|sac.*code|hsn.*summary/i,
    answer: `**HSN Summary** (GST → HSN Summary):\n\nHSN/SAC-wise summary for GSTR-1:\n• Auto-generated from invoice data\n• Shows taxable value, CGST, SGST, IGST per HSN code\n• Download in GSTR-1 format\n• Analytics for top HSN codes`,
  },
  // ── Reports ──
  {
    patterns: /report|analytics|export.*data/i,
    answer: `**Reports Module** (5 report pages):\n\n📊 **Financial Reports** — P&L, Balance Sheet, Cash Flow\n📈 **Sales Reports** — Revenue trends, top customers, order analysis\n📉 **Purchase Reports** — Vendor analysis, PO tracking, cost trends\n📦 **Inventory Reports** — Stock status, movement analysis, valuation\n🧾 **GST Reports** — GSTR summaries, tax liability, ITC reports\n\nAll reports support **Export to Excel/PDF** and **date range filtering**.`,
  },
  // ── Settings ──
  {
    patterns: /setting|config|company.*profile|preference/i,
    answer: `**Settings** (⚙️ in sidebar):\n\n• **Company Profile** — Name, GSTIN, address, logo\n• **Users** — Create/manage user accounts\n• **Roles** — Define permissions for each role\n• **Master Data** — UOM, tax rates, payment terms, etc.\n\nOnly Admin users can access Settings.`,
  },
  // ── Roles & Permissions ──
  {
    patterns: /role|permission|access|rbac|who.*can/i,
    answer: `**User Roles & Permissions:**\n\n| Role | Access Level |\n|------|-------------|\n| Admin | Full access to everything |\n| CEO | Read all + approve |\n| Finance Manager | Finance + Reports |\n| Sales Manager | Sales + Customers |\n| Purchase Manager | Purchase + Vendors |\n| Inventory Manager | Inventory + Warehouses |\n| HR Manager | HRM module |\n| Production Manager | Manufacturing |\n| Accountant | Finance (limited) |\n| Sales Executive | Sales (limited) |\n| Viewer | Read-only access |\n\nPermissions are role-based. Admins can customize in **Settings → Roles**.`,
  },
  // ── Approvals ──
  {
    patterns: /approv|pending.*approv|queue/i,
    answer: `**Approval Queue** (accessible from sidebar):\n\nCentralized approval workflow:\n• Sales Orders need manager approval before processing\n• Purchase Orders above thresholds require approval\n• Leave requests go through manager\n• Credit limit changes need finance approval\n\nApprovers see pending items and can Approve/Reject with comments.`,
  },
  // ── Notifications ──
  {
    patterns: /notification|alert.*system|bell.*icon/i,
    answer: `**Notification Center** (bell icon in header):\n\n• Real-time notifications for approvals, alerts, and updates\n• Low stock alerts\n• Pending approval reminders\n• Order status changes\n• Click to navigate to the relevant page`,
  },
  // ── Navigation ──
  {
    patterns: /navigate|sidebar|menu|find.*page|where.*is/i,
    answer: `**Navigation:**\n\nUse the **left sidebar** to navigate between modules:\n1. Click a module name (e.g., Sales, Finance) to expand it\n2. Click a sub-page to navigate there\n3. On mobile, tap the **hamburger menu** (☰) to open the sidebar\n4. The sidebar auto-closes on mobile after selecting a page\n\n**Header shortcuts:** Dashboard, Notifications (bell), Profile menu (top-right)`,
  },
  // ── Troubleshooting ──
  {
    patterns: /error|issue|problem|not.*work|bug|fix|trouble|broken|stuck|loading/i,
    answer: `**Common Troubleshooting:**\n\n🔄 **Page not loading?** → Refresh the browser (Ctrl+R)\n🔒 **Access denied?** → You may not have permission. Check with Admin.\n📊 **Data not showing?** → Check your internet connection. The app needs Appwrite backend.\n🔑 **Can't login?** → Verify username/password. Try "admin" / "admin123".\n⏳ **Slow performance?** → Clear browser cache, try a different browser.\n💾 **Changes not saving?** → Ensure all required fields are filled.\n🖨️ **Print not working?** → Use browser's print (Ctrl+P) from the relevant page.\n\nIf issues persist, contact your system administrator.`,
  },
  // ── Tech Stack ──
  {
    patterns: /tech|stack|built.*with|framework|react|appwrite/i,
    answer: `**Tech Stack:**\n\n• **Frontend** — React 18 + TypeScript + Vite\n• **Styling** — Tailwind CSS with Indigo-Sapphire design system\n• **Backend** — Appwrite Cloud (Frankfurt)\n• **Auth** — Appwrite Account API with session management\n• **Database** — Appwrite Databases (25 collections)\n• **Hosting** — Vercel (https://indian-erp.vercel.app)\n• **Desktop** — Electron (optional)`,
  },
  // ── General / Greeting ──
  {
    patterns: /^(hi|hello|hey|help|what.*can.*you|how.*help)/i,
    answer: `👋 **Hello! I'm the SA ERP Help Assistant.**\n\nI can help you with:\n• **Navigation** — Where to find features\n• **How-to guides** — Step-by-step for any task\n• **Login & Access** — Credentials and permissions\n• **Troubleshooting** — Common issues and fixes\n• **Module info** — What each section does\n\nJust ask me anything about the app! Try:\n• "How do I create a sales order?"\n• "What modules are available?"\n• "How to generate GST reports?"`,
  },
  {
    patterns: /thank|thanks|thx/i,
    answer: `You're welcome! 😊 Feel free to ask anything else about SA ERP.`,
  },
];

// ─── Role → Module Access Map ───────────────────────────────────
const ROLE_MODULES: Record<string, { name: string; modules: string[] }> = {
  admin:              { name: 'Administrator',      modules: ['all'] },
  ceo:                { name: 'CEO / Director',     modules: ['all'] },
  finance_manager:    { name: 'Finance Manager',    modules: ['dashboard', 'finance', 'gst', 'reports', 'settings'] },
  sales_manager:      { name: 'Sales Manager',      modules: ['dashboard', 'sales', 'reports', 'settings'] },
  purchase_manager:   { name: 'Purchase Manager',   modules: ['dashboard', 'purchase', 'reports', 'settings'] },
  inventory_manager:  { name: 'Inventory Manager',  modules: ['dashboard', 'inventory', 'reports'] },
  production_manager: { name: 'Production Manager', modules: ['dashboard', 'manufacturing', 'reports'] },
  hr_manager:         { name: 'HR Manager',         modules: ['dashboard', 'hrm', 'reports'] },
  accountant:         { name: 'Accountant',         modules: ['dashboard', 'finance', 'gst', 'reports'] },
  sales_executive:    { name: 'Sales Executive',    modules: ['dashboard', 'sales'] },
  viewer:             { name: 'Viewer',             modules: ['dashboard', 'finance', 'inventory', 'sales', 'purchase', 'manufacturing', 'hrm', 'reports'] },
};

// Which module does a KB answer relate to?
const ANSWER_MODULE_TAGS: Array<{ pattern: RegExp; module: string }> = [
  { pattern: /finance|accounts|journal|ledger|trial.*balance|p.*l|balance.*sheet|bank.*recon|credit.*limit/i, module: 'finance' },
  { pattern: /sales|customer|invoice.*sales|pos|receipt.*customer|aging/i, module: 'sales' },
  { pattern: /purchase|vendor|po\b|grn|goods.*receipt|vendor.*payment/i, module: 'purchase' },
  { pattern: /inventory|item|warehouse|stock|valuation|low.*stock|gate.*pass/i, module: 'inventory' },
  { pattern: /manufactur|bom|production|mrp|job.*work|shop.*floor|oee|qc|quality|work.*center/i, module: 'manufacturing' },
  { pattern: /hrm|employee|attendance|leave|payroll|tax.*declaration/i, module: 'hrm' },
  { pattern: /gst|e.?invoice|e.?way|gstr|tds|itc|hsn/i, module: 'gst' },
  { pattern: /report|analytics/i, module: 'reports' },
  { pattern: /setting|config|company.*profile/i, module: 'settings' },
];

function detectModule(question: string, answer: string): string | null {
  const combined = question + ' ' + answer;
  for (const { pattern, module } of ANSWER_MODULE_TAGS) {
    if (pattern.test(combined)) return module;
  }
  return null;
}

function canAccessModule(roles: string[], module: string | null): boolean {
  if (!module) return true; // Generic answers are always accessible
  for (const role of roles) {
    const rm = ROLE_MODULES[role];
    if (rm && (rm.modules.includes('all') || rm.modules.includes(module))) return true;
  }
  return false;
}

function getRoleName(roles: string[]): string {
  for (const role of roles) {
    if (ROLE_MODULES[role]) return ROLE_MODULES[role].name;
  }
  return 'User';
}

function getAnswer(question: string, roles: string[]): string {
  const q = question.trim();
  for (const entry of KB) {
    if (entry.patterns.test(q)) {
      const module = detectModule(q, entry.answer);
      if (!canAccessModule(roles, module)) {
        const roleName = getRoleName(roles);
        const moduleName = module ? module.charAt(0).toUpperCase() + module.slice(1) : 'this';
        return `⚠️ **Not Available for Your Role**\n\nAs a **${roleName}**, you don't have access to the **${moduleName}** module. This action is not applicable to your role.\n\nContact your **Administrator** to request access, or ask me about features within your permitted modules.\n\n*Your accessible modules: ${roles.map(r => ROLE_MODULES[r]?.modules.join(', ') || 'limited').join('; ')}*`;
      }
      return entry.answer;
    }
  }
  return `I don't have a specific answer for that yet. Here are some things I can help with:\n\n• **"How do I login?"** — Credentials & access\n• **"What modules are available?"** — Full feature list\n• **"How to create a sales order?"** — Step-by-step\n• **"What user roles exist?"** — Permissions info\n• **"Something is not working"** — Troubleshooting tips\n\nTry rephrasing your question or pick one of the suggestions above!`;
}

function renderMarkdown(text: string): React.ReactNode {
  // Simple markdown renderer for bold, tables, bullet points, and line breaks
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const body = tableRows.slice(1);
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-2">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr>
                {header.map((cell, i) => (
                  <th key={i} className="border border-gray-200 px-2 py-1 bg-gray-50 text-left font-semibold">{cell.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-gray-200 px-2 py-1">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // Skip separator rows like |---|---|
      if (/^\|[-\s|:]+\|$/.test(line.trim())) {
        inTable = true;
        continue;
      }
      const cells = line.trim().split('|').filter(c => c.trim() !== '');
      tableRows.push(cells);
      inTable = true;
      continue;
    }

    if (inTable) flushTable();

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={`br-${i}`} className="h-1" />);
      continue;
    }

    // Bold headers like **Title:**
    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>');

    // Bullet points
    if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
      elements.push(
        <div key={`li-${i}`} className="flex gap-1.5 ml-1">
          <span className="text-blue-500 mt-0.5">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^[•\-]\s*/, '') }} />
        </div>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const num = line.trim().match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={`ol-${i}`} className="flex gap-1.5 ml-1">
          <span className="text-blue-500 font-semibold min-w-[1rem]">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s*/, '') }} />
        </div>
      );
      continue;
    }

    elements.push(
      <div key={`p-${i}`} dangerouslySetInnerHTML={{ __html: formatted }} />
    );
  }

  if (inTable) flushTable();

  return <>{elements}</>;
}

export default function HelpChatbot() {
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Parse user roles
  const userRoles: string[] = (() => {
    try {
      const r = state.user?.roles;
      if (Array.isArray(r)) return r;
      if (typeof r === 'string') return JSON.parse(r);
    } catch { /* ignore */ }
    return ['viewer'];
  })();
  const roleName = getRoleName(userRoles);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: `👋 **Hi${state.user?.first_name ? ', ' + state.user.first_name : ''}! I'm the SA ERP Help Assistant.**\n\n🔐 You're logged in as **${roleName}**.\n\nAsk me anything about the app — navigation, features, troubleshooting, or how-to guides. I'll tailor answers to your role!\n\nOr pick a question below to get started!`,
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = (text?: string) => {
    const q = (text || input).trim();
    if (!q) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: q };
    const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'bot', text: getAnswer(q, userRoles) };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <QuestionMarkCircleIcon className="h-6 w-6 text-white" />
              <div>
                <h3 className="text-white font-semibold text-sm">ERP Help Assistant</h3>
                <p className="text-indigo-200 text-xs">Ask anything about SA ERP</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.role === 'bot' ? renderMarkdown(msg.text) : msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-white flex-shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about any feature..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed bottom-4 right-4 z-[9999] p-3.5 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-0'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-110'
        }`}
        title="Help Assistant"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6 text-white" />
        ) : (
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
        )}
      </button>
    </>
  );
}
