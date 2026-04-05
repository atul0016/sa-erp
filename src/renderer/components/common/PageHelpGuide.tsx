import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/* ─── Types ─────────────────────────────────────────────────── */
interface Workflow { step: string; detail: string }
interface Term { term: string; meaning: string }
interface PageGuide {
  title: string;
  subtitle: string;
  overview: string;
  workflow: Workflow[];
  terms?: Term[];
  tips?: string[];
  related?: { label: string; path: string }[];
}

type Tab = 'overview' | 'workflow' | 'terms' | 'tips';

/* ─── Complete Page Guide Data (all 59+ pages) ─────────────── */
const GUIDES: Record<string, PageGuide> = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Your business command center',
    overview:
      'The Dashboard is the first thing you see after login. It gives you a real-time snapshot of your entire business — revenue, outstanding invoices, inventory value, pending orders, and more. Think of it as the cockpit of your ERP. The KPI cards at the top summarize key numbers; the charts below show trends over time; and the activity feed keeps you informed about recent transactions across all modules.',
    workflow: [
      { step: 'Check KPI Cards', detail: 'The 4 cards at the top show total revenue, pending invoices count, inventory value, and open orders. A green/red arrow shows whether the number improved or declined vs last month.' },
      { step: 'Review Charts', detail: 'The sales trend line chart shows daily/weekly/monthly revenue progression. The expense pie chart shows where money is going. Hover over any point for exact numbers.' },
      { step: 'Check Pending Approvals', detail: 'If you\'re a manager, the approval widget shows items needing your sign-off. Click any to go directly to the Approval Queue.' },
      { step: 'Use Quick Actions', detail: 'The shortcut buttons at the bottom let you jump to common tasks: New Sales Order, New Invoice, New PO, etc. — saving you navigation time.' },
    ],
    tips: [
      'The Dashboard auto-refreshes. No need to manually reload.',
      'KPI cards are clickable — they take you to the detailed page.',
      'All data respects your role. Sales Manager sees sales KPIs; Finance Manager sees finance KPIs.',
    ],
    related: [
      { label: 'Approval Queue', path: '/approvals' },
      { label: 'Notifications', path: '/notifications' },
    ],
  },
  '/approvals': {
    title: 'Approval Queue',
    subtitle: 'Review and act on pending requests',
    overview:
      'The Approval Queue centralizes all items that need your approval — sales orders, purchase orders, leave requests, credit limit changes, journal entries, and expenses. Instead of checking each module separately, everything lands here. Items are sorted by priority and date. You can approve, reject, or add comments before deciding.',
    workflow: [
      { step: 'Open Approval Queue', detail: 'Click the Shield icon in the header or navigate from the sidebar. You\'ll see a table of all pending items with type, submitter, amount, and date.' },
      { step: 'Review Item Details', detail: 'Click any row to expand and see full details — line items, history, justification, and attached documents.' },
      { step: 'Approve or Reject', detail: 'Click the green Approve or red Reject button. Optionally add a comment explaining your decision.' },
      { step: 'Bulk Actions', detail: 'Select multiple items with checkboxes, then use Bulk Approve/Reject at the top to process several at once.' },
    ],
    terms: [
      { term: 'Approval Workflow', meaning: 'A configured chain of approvers that a document must pass through before being finalized.' },
      { term: 'Escalation', meaning: 'If an approver doesn\'t act within a set time, the item automatically escalates to the next approver.' },
    ],
    tips: [
      'The shield badge in the header shows a count of pending approvals.',
      'You can only see approvals relevant to your role and permission level.',
    ],
  },
  '/notifications': {
    title: 'Notification Center',
    subtitle: 'Never miss an important update',
    overview:
      'The Notification Center aggregates all system alerts in one place — approval requests, low stock warnings, order status changes, payment reminders, and more. Each notification links directly to the relevant page so you can take action immediately.',
    workflow: [
      { step: 'View Notifications', detail: 'Click the bell icon in the header or navigate here. Unread notifications appear with a blue dot.' },
      { step: 'Click to Navigate', detail: 'Each notification is linked to its source. Click a "Low Stock" alert and you\'ll land on the Low Stock Alerts page.' },
      { step: 'Mark Read / Clear', detail: 'Click a notification to mark it read. Use "Clear All" to dismiss all at once.' },
    ],
    tips: [
      'The red dot on the bell icon means you have unread notifications.',
      'Notifications are generated automatically — no manual setup needed.',
    ],
  },

  /* ── Finance ──────────────────────────────────────────────── */
  '/finance/accounts': {
    title: 'Chart of Accounts',
    subtitle: 'The foundation of your accounting system',
    overview:
      'Every financial transaction in your business flows through accounts. The Chart of Accounts is a structured list of all accounts organized by type: Assets (what you own), Liabilities (what you owe), Equity (owner\'s stake), Income (what you earn), and Expenses (what you spend). This page lets you create, edit, and organize this structure. Getting this right is crucial because journal entries, ledgers, and financial statements all depend on it.',
    workflow: [
      { step: 'Browse Existing Accounts', detail: 'The table shows account code, name, type, parent account, and current balance. Use the search bar or type filters to narrow down.' },
      { step: 'Add a New Account', detail: 'Click "Add Account" → Enter account name (e.g., "Bank - HDFC Current"), code (e.g., 1100), select type (Asset), optionally set a parent account → Save.' },
      { step: 'Edit an Account', detail: 'Click any account row → Modify name, type, or parent → Save. Note: You cannot change an account type if it already has transactions posted against it.' },
      { step: 'Understand the Hierarchy', detail: 'Accounts can be nested. For example: Assets → Current Assets → Bank Accounts → HDFC Current. This hierarchy drives how the Balance Sheet and P&L are structured.' },
    ],
    terms: [
      { term: 'Account Code', meaning: 'A unique number (e.g., 1000, 2000) that identifies each account. Assets typically start with 1xxx, Liabilities 2xxx, Income 3xxx, Expenses 4xxx.' },
      { term: 'Parent Account', meaning: 'A higher-level account that groups sub-accounts together. E.g., "Bank Accounts" is the parent of "HDFC Current" and "SBI Savings".' },
      { term: 'Ledger Account', meaning: 'An account at the lowest level where actual transactions are posted (not a group/parent).' },
    ],
    tips: [
      'Plan your chart before entering data. Changing structure later is possible but tedious.',
      'Use consistent numbering — 1xxx for Assets, 2xxx for Liabilities, 3xxx for Income, 4xxx for Expenses.',
      'Don\'t delete accounts with transactions. Mark them inactive instead.',
    ],
    related: [
      { label: 'Journal Entries', path: '/finance/journal' },
      { label: 'General Ledger', path: '/finance/ledger' },
      { label: 'Trial Balance', path: '/finance/trial-balance' },
    ],
  },
  '/finance/journal': {
    title: 'Journal Entries',
    subtitle: 'Record every financial transaction',
    overview:
      'A journal entry is the fundamental building block of accounting. Every time money moves in your business — a sale, a purchase, an expense, a bank deposit — it\'s recorded as a journal entry with at least one debit line and one credit line. The golden rule: Total Debits must ALWAYS equal Total Credits. This page lets you create new entries, edit drafts, post them (which updates the General Ledger), and reverse mistakes.',
    workflow: [
      { step: 'Click "New Entry"', detail: 'Opens a form with date, reference number, and narration (description) fields at the top, plus debit/credit line items below.' },
      { step: 'Add Debit & Credit Lines', detail: 'Each line needs: Account (from Chart of Accounts), Amount, and optional notes. Example: Debit "Bank - HDFC" ₹10,000 / Credit "Sales Revenue" ₹10,000.' },
      { step: 'Verify Balance', detail: 'The form shows a running total. If debits ≠ credits, the "Post" button stays disabled. Fix the imbalance before proceeding.' },
      { step: 'Post the Entry', detail: 'Click "Post Entry" to finalize. This updates the General Ledger immediately. Posted entries cannot be edited — only reversed.' },
      { step: 'Reverse if Needed', detail: 'Made a mistake? Click "Reverse Entry" to create an equal and opposite entry that cancels it out.' },
    ],
    terms: [
      { term: 'Debit', meaning: 'An entry on the left side. Increases Assets & Expenses; decreases Liabilities, Equity & Income.' },
      { term: 'Credit', meaning: 'An entry on the right side. Increases Liabilities, Equity & Income; decreases Assets & Expenses.' },
      { term: 'Narration', meaning: 'A text description of what the transaction is about. E.g., "Payment received from customer ABC for Invoice #1234".' },
      { term: 'Reversal', meaning: 'A new journal entry that exactly cancels a previous entry by swapping debits and credits.' },
    ],
    tips: [
      'Many entries are auto-created from other modules (sales invoices, purchase bills, etc.).',
      'Post entries on the same day they occur for accurate reporting.',
      'The narration is searchable — write clear descriptions for easy audit trails.',
    ],
    related: [
      { label: 'Chart of Accounts', path: '/finance/accounts' },
      { label: 'General Ledger', path: '/finance/ledger' },
    ],
  },
  '/finance/ledger': {
    title: 'General Ledger',
    subtitle: 'Transaction history for any account',
    overview:
      'The General Ledger shows every transaction posted to a specific account within a date range. Select an account (e.g., "Bank - HDFC") and a period (e.g., April 2026), and you\'ll see the opening balance, each debit/credit entry, and the running/closing balance. This is the primary tool for verifying account accuracy and creating audit trails.',
    workflow: [
      { step: 'Select an Account', detail: 'Use the dropdown at the top to pick any account from your Chart of Accounts.' },
      { step: 'Set Date Range', detail: 'Choose start and end dates. Common ranges: current month, current quarter, current FY.' },
      { step: 'Read the Ledger', detail: 'Each row shows: Date, Journal Entry ref, Narration, Debit amount, Credit amount, Running Balance. The first row shows Opening Balance; the last shows Closing Balance.' },
      { step: 'Export', detail: 'Click Export to download as Excel for sharing with auditors or management.' },
    ],
    terms: [
      { term: 'Opening Balance', meaning: 'The account balance at the start of the selected period — carried forward from the previous period.' },
      { term: 'Running Balance', meaning: 'The cumulative balance after each transaction. Helps you spot the exact point where something went wrong.' },
    ],
    tips: [
      'Use this page to reconcile bank accounts — compare the ledger closing balance with your bank statement.',
      'Click any journal entry reference to see the full entry details.',
    ],
    related: [
      { label: 'Chart of Accounts', path: '/finance/accounts' },
      { label: 'Trial Balance', path: '/finance/trial-balance' },
    ],
  },
  '/finance/trial-balance': {
    title: 'Trial Balance',
    subtitle: 'Verify your books balance correctly',
    overview:
      'The Trial Balance lists every account in your Chart of Accounts along with its debit or credit balance at a point in time. The total of all debits must equal the total of all credits. If they don\'t, there\'s an error somewhere. This report is typically generated before preparing financial statements (P&L, Balance Sheet) to ensure accuracy.',
    workflow: [
      { step: 'Select Date', detail: 'Set the "as of" date. The Trial Balance will show all account balances up to that date.' },
      { step: 'Review Balances', detail: 'Each row shows: Account Name, Account Code, Debit Balance, Credit Balance. Assets and Expenses typically show debit balances; Liabilities, Equity, and Income show credit balances.' },
      { step: 'Verify Totals', detail: 'The bottom row shows Total Debits and Total Credits. They MUST be equal. If not, investigate journal entries for errors.' },
      { step: 'Export', detail: 'Download as Excel/PDF for auditors.' },
    ],
    terms: [
      { term: 'Trial Balance', meaning: 'A report listing all account balances at a point in time. Debits must equal credits.' },
    ],
    tips: [
      'Run Trial Balance at month-end before closing the period.',
      'If it doesn\'t balance, check recent journal entries for single-sided entries or rounding errors.',
    ],
    related: [
      { label: 'P&L', path: '/finance/pnl' },
      { label: 'Balance Sheet', path: '/finance/balance-sheet' },
    ],
  },
  '/finance/pnl': {
    title: 'Profit & Loss Statement',
    subtitle: 'Are you making or losing money?',
    overview:
      'The Profit & Loss (P&L) statement — also called the Income Statement — shows your revenue minus expenses for a selected period. It answers the fundamental question: "Is the business profitable?" The report is auto-generated from your journal entries. Revenue goes on top, then Cost of Goods Sold, then operating expenses, then tax/other items, arriving at Net Profit or Net Loss at the bottom.',
    workflow: [
      { step: 'Select Period', detail: 'Choose date range (e.g., April 2026 to March 2027 for full FY). You can also compare two periods side-by-side.' },
      { step: 'Read Top-Down', detail: 'Revenue → COGS → Gross Profit → Operating Expenses → Operating Profit → Other Income/Expenses → Net Profit. Each section is expandable for details.' },
      { step: 'Compare Periods', detail: 'Enable comparison mode to see current vs previous period with change % calculated automatically.' },
      { step: 'Export', detail: 'Download as PDF for board meetings or Excel for analysis.' },
    ],
    terms: [
      { term: 'Gross Profit', meaning: 'Revenue minus Cost of Goods Sold. Shows how much you earn from core operations before overhead.' },
      { term: 'COGS', meaning: 'Cost of Goods Sold — direct costs of producing the goods you sell (materials, manufacturing).' },
      { term: 'Operating Profit', meaning: 'Gross Profit minus Operating Expenses (rent, salaries, utilities). Shows operational efficiency.' },
      { term: 'Net Profit', meaning: 'The final bottom line after all income and all expenses including taxes.' },
    ],
    related: [
      { label: 'Balance Sheet', path: '/finance/balance-sheet' },
      { label: 'Financial Reports', path: '/reports/financial' },
    ],
  },
  '/finance/balance-sheet': {
    title: 'Balance Sheet',
    subtitle: 'What you own vs what you owe',
    overview:
      'The Balance Sheet shows your company\'s financial position at a specific point in time. It follows the equation: Assets = Liabilities + Equity. Assets (left side) show what the company owns — cash, inventory, equipment, receivables. Liabilities + Equity (right side) show how those assets were financed — through debt (liabilities) or owner investment (equity).',
    workflow: [
      { step: 'Select Date', detail: 'Choose the "as of" date. The Balance Sheet is a snapshot — not a period report.' },
      { step: 'Review Assets', detail: 'Current Assets (cash, receivables, inventory — convertible within 1 year) and Non-Current Assets (land, equipment — long-term).' },
      { step: 'Review Liabilities', detail: 'Current Liabilities (payables, short-term loans due within 1 year) and Non-Current Liabilities (long-term loans, bonds).' },
      { step: 'Review Equity', detail: 'Share Capital + Retained Earnings (accumulated profits not distributed as dividends).' },
    ],
    terms: [
      { term: 'Current Assets', meaning: 'Assets expected to be converted to cash within one year — cash, receivables, inventory.' },
      { term: 'Retained Earnings', meaning: 'Cumulative net profits that have been reinvested in the business rather than distributed as dividends.' },
    ],
    related: [
      { label: 'P&L', path: '/finance/pnl' },
      { label: 'Trial Balance', path: '/finance/trial-balance' },
    ],
  },
  '/finance/bank-reconciliation': {
    title: 'Bank Reconciliation',
    subtitle: 'Match your books with the bank',
    overview:
      'Bank Reconciliation is the process of comparing your internal records (General Ledger bank account) with your actual bank statement. Differences can arise from timing (cheques not yet cleared), errors, or unauthorized transactions. This tool lets you import your bank statement, auto-match entries, and manually reconcile the rest.',
    workflow: [
      { step: 'Import Bank Statement', detail: 'Click "Import Statement" and upload a CSV or XLSX file from your bank. Supported banks include SBI, HDFC, ICICI, and generic formats.' },
      { step: 'Auto-Match', detail: 'The system compares bank entries with your ledger entries by amount, date, and reference number. Matched entries turn green.' },
      { step: 'Review Unmatched', detail: 'Remaining entries are either: (a) in your books but not in bank (outstanding cheques), or (b) in bank but not in books (bank charges, interest). Handle each case.' },
      { step: 'Reconcile', detail: 'Once all entries are reviewed, click "Reconcile" to finalize. The reconciled balance should match the bank closing balance.' },
    ],
    terms: [
      { term: 'Outstanding Cheque', meaning: 'A cheque you\'ve issued and recorded but the recipient hasn\'t deposited yet. It\'s in your books but not in the bank.' },
      { term: 'Bank Charges', meaning: 'Fees deducted by the bank that you haven\'t recorded yet. They appear in the bank statement but not in your books.' },
    ],
    tips: [
      'Reconcile monthly for best results.',
      'Download your bank statement on the 1st of each month for the previous month.',
    ],
    related: [
      { label: 'General Ledger', path: '/finance/ledger' },
      { label: 'Chart of Accounts', path: '/finance/accounts' },
    ],
  },
  '/finance/credit-management': {
    title: 'Credit Limit Management',
    subtitle: 'Control how much credit you extend to customers',
    overview:
      'Credit Limit Management lets you set maximum outstanding amounts for each customer. When a customer\'s unpaid invoices approach their limit, the system blocks new sales orders until payment is received. This protects your business from overextension. You can also approve or reject credit limit increase requests from the sales team.',
    workflow: [
      { step: 'View Customer Limits', detail: 'The table shows each customer, their credit limit, current utilization, and available credit.' },
      { step: 'Edit a Limit', detail: 'Click "Edit" on any customer row → enter new limit → Save. Higher limits require Finance Manager or Admin approval.' },
      { step: 'Approve Requests', detail: 'When Sales Executives request limit increases, they appear as pending. Approve or reject with comments.' },
      { step: 'Monitor Utilization', detail: 'The bar chart shows top customers by credit utilization %. Red means >90% utilized — potential risk.' },
    ],
    terms: [
      { term: 'Credit Limit', meaning: 'Maximum outstanding invoice amount allowed for a customer before new orders are blocked.' },
      { term: 'Utilization %', meaning: 'Current outstanding divided by credit limit × 100. At 100%, no new credit sales are allowed.' },
    ],
    related: [
      { label: 'Customers', path: '/sales/customers' },
      { label: 'Aging Report', path: '/sales/aging' },
    ],
  },

  /* ── Inventory ────────────────────────────────────────────── */
  '/inventory/items': {
    title: 'Items Master',
    subtitle: 'Your complete product catalog',
    overview:
      'Every product, raw material, and service your company deals with lives here. Each item has a unique SKU, an HSN/SAC code for GST, a unit of measure, pricing, tax rates, and reorder levels. This master is shared across Sales, Purchase, Manufacturing, and Inventory modules — so getting it right is essential. Changes here automatically reflect everywhere.',
    workflow: [
      { step: 'Browse Items', detail: 'The table lists all items with SKU, name, category, stock qty, and price. Use search and column filters to find specific items.' },
      { step: 'Add New Item', detail: 'Click "Add Item" → Fill: Name, SKU (auto-generated or manual), HSN Code (government-assigned code for GST), Unit (pcs, kg, litre), Sale Price, Purchase Price, GST Rate → Save.' },
      { step: 'Set Reorder Point', detail: 'In item details, set "Reorder Level" (e.g., 50 units). When stock falls below this, it appears on the Low Stock Alerts page and can auto-generate POs.' },
      { step: 'Manage Categories', detail: 'Group items into categories (Raw Material, Finished Good, Service) for easier filtering and reporting.' },
    ],
    terms: [
      { term: 'SKU', meaning: 'Stock Keeping Unit — a unique code to identify each item. E.g., "WDG-001" for Widget Type A.' },
      { term: 'HSN Code', meaning: 'Harmonized System of Nomenclature — a 6-8 digit code assigned by the government to classify goods for GST. E.g., 8471 for computers.' },
      { term: 'SAC Code', meaning: 'Services Accounting Code — like HSN but for services. E.g., 9983 for IT services.' },
      { term: 'Reorder Level', meaning: 'Minimum stock quantity. When current stock falls below this, a purchase alert is triggered.' },
      { term: 'UOM', meaning: 'Unit of Measure — pieces, kg, litres, metres, etc.' },
    ],
    tips: [
      'Always set the HSN code — it\'s mandatory for GST invoicing and E-Invoice generation.',
      'Keep SKUs consistent: use a prefix for category + sequential number (e.g., RM-001, FG-001).',
    ],
    related: [
      { label: 'Warehouses', path: '/inventory/warehouses' },
      { label: 'Stock Ledger', path: '/inventory/stock-ledger' },
      { label: 'Low Stock Alerts', path: '/inventory/low-stock' },
    ],
  },
  '/inventory/warehouses': {
    title: 'Warehouses',
    subtitle: 'Manage storage locations',
    overview:
      'If your business stores goods in multiple locations — a main warehouse, a satellite godown, a factory store — this page lets you manage them all. Each warehouse has a name, address, capacity, and assigned manager. Stock is tracked independently per warehouse, so you always know exactly where your inventory is.',
    workflow: [
      { step: 'View Warehouses', detail: 'See all locations with their name, address, capacity, current utilization, and manager.' },
      { step: 'Add Warehouse', detail: 'Click "Add Warehouse" → Enter name, full address, storage capacity (in units or sq ft), assign a manager → Save.' },
      { step: 'View Stock', detail: 'Click any warehouse to see item-wise stock currently stored there.' },
    ],
    terms: [
      { term: 'Capacity', meaning: 'Maximum storage volume of the warehouse — in units, pallets, or square footage.' },
      { term: 'Utilization', meaning: 'How much of the capacity is currently occupied.' },
    ],
    related: [
      { label: 'Items Master', path: '/inventory/items' },
      { label: 'Stock Movements', path: '/inventory/moves' },
    ],
  },
  '/inventory/stock-ledger': {
    title: 'Stock Ledger',
    subtitle: 'Complete audit trail of every item movement',
    overview:
      'The Stock Ledger records every movement of every item — purchases in, sales out, transfers between warehouses, production consumption, adjustments, and returns. Select an item and date range to see the full history with opening qty, each transaction, and closing qty. This is the inventory equivalent of the General Ledger.',
    workflow: [
      { step: 'Select Item', detail: 'Choose an item from the dropdown to view its movement history.' },
      { step: 'Set Date Range', detail: 'Pick start and end date for the period you want to analyze.' },
      { step: 'Read the Ledger', detail: 'Each row: Date, Transaction Type (Purchase/Sale/Transfer/Adjustment), Reference #, Qty In, Qty Out, Balance Qty, Value.' },
      { step: 'Export', detail: 'Download as Excel for audit or analysis.' },
    ],
    terms: [
      { term: 'Stock In', meaning: 'Quantity added — from purchases, production output, returns, or transfers in.' },
      { term: 'Stock Out', meaning: 'Quantity removed — from sales, production consumption, transfers out, or adjustments.' },
    ],
    related: [
      { label: 'Stock Movements', path: '/inventory/moves' },
      { label: 'Stock Valuation', path: '/inventory/valuation' },
    ],
  },
  '/inventory/moves': {
    title: 'Stock Movements',
    subtitle: 'Transfer, adjust, and track inventory changes',
    overview:
      'Use this page to perform stock transfers between warehouses (e.g., move 100 units from Main Warehouse to Branch Store) and stock adjustments (e.g., write off 5 damaged units). Every movement here updates the Stock Ledger automatically.',
    workflow: [
      { step: 'Create Transfer', detail: 'Click "New Transfer" → Select source warehouse, destination warehouse, item, and quantity → Submit. Stock moves instantly.' },
      { step: 'Create Adjustment', detail: 'Click "New Adjustment" → Select item, warehouse, adjustment type (Damage/Loss/Correction), quantity, and reason → Submit.' },
      { step: 'View History', detail: 'The table shows all past movements with type, items, quantities, user, and timestamp.' },
    ],
    terms: [
      { term: 'Stock Transfer', meaning: 'Moving inventory from one warehouse to another. Total stock stays the same; only the location changes.' },
      { term: 'Stock Adjustment', meaning: 'Correcting stock levels for discrepancies — damage, loss, counting errors, gifts, samples.' },
    ],
    related: [
      { label: 'Stock Ledger', path: '/inventory/stock-ledger' },
      { label: 'Warehouses', path: '/inventory/warehouses' },
    ],
  },
  '/inventory/valuation': {
    title: 'Stock Valuation',
    subtitle: 'What is your inventory worth?',
    overview:
      'Stock Valuation calculates the total monetary value of all inventory on hand. It supports FIFO (First In, First Out) and Weighted Average methods. This number appears on your Balance Sheet as a Current Asset and directly impacts profitability calculations. Use this page to see item-wise, category-wise, and warehouse-wise valuation breakdowns.',
    workflow: [
      { step: 'View Summary', detail: 'The top cards show total inventory value, total items, and valuation method being used.' },
      { step: 'Drill Down', detail: 'The table shows each item: Name, Qty on Hand, Rate, Total Value, and % of Total Inventory.' },
      { step: 'Filter', detail: 'Filter by category, warehouse, or value range to analyze specific segments.' },
      { step: 'Export', detail: 'Export to Excel for accounting, insurance, or audit purposes.' },
    ],
    terms: [
      { term: 'FIFO', meaning: 'First In, First Out — oldest purchased items are assumed sold first. Closing stock valued at recent purchase prices.' },
      { term: 'Weighted Average', meaning: 'Average cost = Total cost of purchases ÷ Total units. Each unit valued at this average.' },
    ],
    related: [
      { label: 'Stock Ledger', path: '/inventory/stock-ledger' },
      { label: 'Balance Sheet', path: '/finance/balance-sheet' },
    ],
  },
  '/inventory/low-stock': {
    title: 'Low Stock Alerts',
    subtitle: 'Never run out of critical items',
    overview:
      'This page shows all items whose current stock has fallen below their configured reorder level. Items are color-coded: Red (critical — stock at zero or near zero, production/sales will stop), Orange (warning — below reorder point, order soon). You can select items and auto-generate Purchase Orders to replenish stock with one click.',
    workflow: [
      { step: 'Review Alerts', detail: 'The table shows: Item, Current Stock, Reorder Level, Deficit, Last Ordered Date, Preferred Vendor.' },
      { step: 'Select Items to Reorder', detail: 'Check the boxes next to items you want to reorder.' },
      { step: 'Generate Purchase Orders', detail: 'Click "Generate PO" — the system creates POs grouped by vendor automatically with optimal quantities.' },
      { step: 'Email Suppliers', detail: 'Click "Notify Suppliers" to send email alerts to preferred vendors about your requirements.' },
    ],
    tips: [
      'Set realistic reorder levels based on your typical lead time from suppliers.',
      'Configure preferred vendors in Items Master for auto-PO to work correctly.',
    ],
    related: [
      { label: 'Items Master', path: '/inventory/items' },
      { label: 'Purchase Orders', path: '/purchase/orders' },
    ],
  },
  '/inventory/gate-pass': {
    title: 'Gate Pass Management',
    subtitle: 'Track every item entering or leaving your premises',
    overview:
      'Gate Passes document the physical movement of goods past your security gate. RGP (Returnable Gate Pass) is for items going out temporarily — repairs, testing, exhibitions — that must come back. NRGP (Non-Returnable Gate Pass) is for permanent outward movements — sales deliveries, scrap disposal. This is both a security and tax compliance requirement.',
    workflow: [
      { step: 'Create Gate Pass', detail: 'Click "New Gate Pass" → Select type (RGP/NRGP), enter items, quantities, reason, destination, authorized by → Create.' },
      { step: 'Print for Security', detail: 'Click Print — security verifies items at the gate against this printed pass.' },
      { step: 'Track RGP Returns', detail: 'For RGP, the system tracks the expected return date. Click "Confirm Receipt" when items come back.' },
      { step: 'Handle Overdue', detail: 'RGPs past their return date show as Overdue in red. Follow up with the receiving party.' },
    ],
    terms: [
      { term: 'RGP', meaning: 'Returnable Gate Pass — items sent out temporarily and expected back. E.g., equipment sent for repair.' },
      { term: 'NRGP', meaning: 'Non-Returnable Gate Pass — items leaving permanently. E.g., finished goods shipped to customer.' },
    ],
    related: [
      { label: 'Stock Movements', path: '/inventory/moves' },
      { label: 'Job Work Challan', path: '/manufacturing/job-work' },
    ],
  },

  /* ── Sales ────────────────────────────────────────────────── */
  '/sales/customers': {
    title: 'Customers',
    subtitle: 'Your buyer database',
    overview:
      'Every person or company you sell to is a Customer. This page stores all their details — name, GSTIN, addresses (billing + shipping), contact persons, phone, email, payment terms, and credit limit. Customers are referenced in Sales Orders, Invoices, Receipts, and the Aging Report.',
    workflow: [
      { step: 'Browse Customers', detail: 'The table shows name, GSTIN, city, outstanding balance, and status. Use search to find by name, phone, or GSTIN.' },
      { step: 'Add Customer', detail: 'Click "Add Customer" → Fill: Company name, GSTIN (15-digit), billing address, shipping address, contact person, phone, email, payment terms (e.g., Net 30), credit limit → Save.' },
      { step: 'Edit/Deactivate', detail: 'Click any customer to edit. To stop transacting with a customer, deactivate rather than delete.' },
    ],
    terms: [
      { term: 'GSTIN', meaning: 'Goods and Services Tax Identification Number — a 15-digit alphanumeric ID. Format: 27AAACR5055K1Z5. First 2 digits = state code.' },
      { term: 'Payment Terms', meaning: 'The agreed time within which the customer must pay. "Net 30" means payment due within 30 days of invoice.' },
    ],
    related: [
      { label: 'Sales Orders', path: '/sales/orders' },
      { label: 'Sales Invoices', path: '/sales/invoices' },
      { label: 'Aging Report', path: '/sales/aging' },
    ],
  },
  '/sales/orders': {
    title: 'Sales Orders',
    subtitle: 'From customer request to fulfillment',
    overview:
      'A Sales Order (SO) is a confirmed request from a customer to buy specific products. It\'s the starting point of the sales fulfillment process. Once approved, an SO triggers stock reservation, delivery planning, and invoicing. The lifecycle goes: Draft → Submitted → Approved → Delivered → Invoiced → Completed.',
    workflow: [
      { step: 'Create Sales Order', detail: 'Click "New Sales Order" → Select customer → Add items with quantities and prices → The system auto-calculates GST based on HSN codes → Save as Draft or Submit for approval.' },
      { step: 'Get Approval', detail: 'Submitted SOs go to the manager\'s Approval Queue. Once approved, they\'re locked for editing.' },
      { step: 'Create Delivery', detail: 'From the approved SO, click "Create Delivery" to generate a dispatch document. This triggers stock deduction.' },
      { step: 'Generate Invoice', detail: 'Click "Generate Invoice" to create the sales invoice automatically, pre-filled from the SO.' },
    ],
    terms: [
      { term: 'SO', meaning: 'Sales Order — a customer\'s confirmed purchase commitment. Not an invoice yet.' },
      { term: 'Backorder', meaning: 'When an SO has items that are out of stock. The SO remains open until all items are fulfilled.' },
    ],
    tips: [
      'Draft SOs can be freely edited. Once submitted, changes need a new version or amendment.',
      'You can create a partial delivery — not all items need to be shipped at once.',
    ],
    related: [
      { label: 'Customers', path: '/sales/customers' },
      { label: 'Sales Invoices', path: '/sales/invoices' },
      { label: 'Approval Queue', path: '/approvals' },
    ],
  },
  '/sales/invoices': {
    title: 'Sales Invoices',
    subtitle: 'Bill your customers and track payments',
    overview:
      'A Sales Invoice is the legal document requesting payment from a customer. It lists items sold, prices, GST breakdown (CGST, SGST for intra-state; IGST for inter-state), and total amount due. Invoices can be created manually or auto-generated from Sales Orders. They\'re also the basis for E-Invoice (IRN) generation required for B2B transactions.',
    workflow: [
      { step: 'Create Invoice', detail: 'Click "New Invoice" → select customer, add items (or generate from an SO) → system auto-calculates GST using HSN codes → Save.' },
      { step: 'View & Print', detail: 'Click the eye icon to preview. Click the printer icon to generate a PDF for printing or emailing to the customer.' },
      { step: 'Track Payments', detail: 'The status column shows: Paid (green), Unpaid (red), Partially Paid (orange), Overdue (red with clock icon).' },
      { step: 'Collect Payment', detail: 'When payment arrives, go to Customer Receipts to record it against this invoice.' },
    ],
    terms: [
      { term: 'CGST/SGST', meaning: 'Central GST + State GST — charged on intra-state sales (buyer and seller in same state). Each is half the total GST rate.' },
      { term: 'IGST', meaning: 'Integrated GST — charged on inter-state sales (buyer in different state). Rate = CGST + SGST combined.' },
      { term: 'IRN', meaning: 'Invoice Reference Number — unique ID from NIC portal for E-Invoice compliance.' },
    ],
    related: [
      { label: 'Sales Orders', path: '/sales/orders' },
      { label: 'Customer Receipts', path: '/sales/receipts' },
      { label: 'E-Invoice', path: '/gst/e-invoice' },
    ],
  },
  '/sales/pos': {
    title: 'POS Terminal',
    subtitle: 'Quick retail billing at the counter',
    overview:
      'The POS (Point of Sale) terminal is designed for retail and counter sales where speed matters. Instead of going through the full Sales Order → Invoice flow, POS lets you scan/search products, build a cart, apply discounts, select payment method, and complete the transaction in under a minute. An invoice is auto-generated and stock is deducted immediately.',
    workflow: [
      { step: 'Search or Scan', detail: 'Type a product name in the search bar or scan a barcode. The item is added to the cart instantly.' },
      { step: 'Adjust Cart', detail: 'Change quantities, apply item-level discounts, or remove items from the cart.' },
      { step: 'Select Customer', detail: 'Choose an existing customer from the dropdown or use "Walk-in Customer" for anonymous sales.' },
      { step: 'Complete Sale', detail: 'Click "Complete Transaction" → select payment method (Cash, Card, UPI) → Invoice is generated and printed automatically.' },
    ],
    tips: [
      'POS is optimized for keyboard shortcuts — Tab, Enter, number keys work for fast billing.',
      'Walk-in sales don\'t track customer-level receivables.',
    ],
    related: [
      { label: 'Items Master', path: '/inventory/items' },
      { label: 'Sales Invoices', path: '/sales/invoices' },
    ],
  },
  '/sales/receipts': {
    title: 'Customer Receipts',
    subtitle: 'Record payments received from customers',
    overview:
      'When a customer pays (via bank transfer, cheque, cash, or UPI), you record it here as a Receipt. The system automatically matches the receipt to outstanding invoices using FIFO (oldest invoice first). This updates the customer\'s outstanding balance and the invoice status (paid/partial).',
    workflow: [
      { step: 'Create Receipt', detail: 'Click "New Receipt" → Select customer → Enter amount, payment method (Cash/Bank/Cheque/UPI), reference number, date → Create.' },
      { step: 'Auto-Linking', detail: 'The system links the receipt to the oldest outstanding invoices automatically. You can manually override this allocation.' },
      { step: 'View Allocation', detail: 'Expand any receipt row to see which invoices it was applied to and the remaining balance.' },
      { step: 'Print Voucher', detail: 'Click the printer icon to generate a receipt voucher for the customer.' },
    ],
    terms: [
      { term: 'Receipt', meaning: 'A record of money received from a customer. It reduces their outstanding balance.' },
      { term: 'Advance Receipt', meaning: 'Payment received before an invoice is created. Sits as a credit on the customer account.' },
    ],
    related: [
      { label: 'Sales Invoices', path: '/sales/invoices' },
      { label: 'Aging Report', path: '/sales/aging' },
    ],
  },
  '/sales/aging': {
    title: 'Aging Report',
    subtitle: 'How overdue are your receivables?',
    overview:
      'The Aging Report groups all outstanding customer invoices into time buckets: 0-30 days, 31-60 days, 61-90 days, and 90+ days. The longer an invoice remains unpaid, the harder it is to collect. This report helps your finance/collections team prioritize follow-ups — focus on the oldest, largest debts first.',
    workflow: [
      { step: 'View by Customer', detail: 'Each row shows a customer with their total outstanding broken into aging buckets. Click to expand and see individual invoices.' },
      { step: 'Filter', detail: 'Filter by customer, date range, amount, or aging bucket to narrow your analysis.' },
      { step: 'Prioritize Collections', detail: 'Sort by the 90+ column to find the most overdue customers. These need immediate follow-up.' },
      { step: 'Export', detail: 'Export to Excel for your collections team.' },
    ],
    terms: [
      { term: 'Aging Bucket', meaning: 'A time range grouping. 0-30 days = recent (normal), 31-60 = slightly overdue, 61-90 = at risk, 90+ = seriously overdue.' },
      { term: 'DSO', meaning: 'Days Sales Outstanding — average number of days it takes to collect payment. Lower is better.' },
    ],
    related: [
      { label: 'Customer Receipts', path: '/sales/receipts' },
      { label: 'Credit Management', path: '/finance/credit-management' },
    ],
  },

  /* ── Purchase ─────────────────────────────────────────────── */
  '/purchase/vendors': {
    title: 'Vendors',
    subtitle: 'Your supplier directory',
    overview:
      'Every company or person you buy from is a Vendor (also called Supplier). This page manages their details — company name, GSTIN, bank details (for payment), payment terms, lead time, and performance metrics. Vendors are referenced in Purchase Orders, GRNs, Invoices, and Payments.',
    workflow: [
      { step: 'Browse Vendors', detail: 'Table shows: Vendor name, GSTIN, city, outstanding payable, rating, and status.' },
      { step: 'Add Vendor', detail: 'Click "Add Vendor" → Fill: Name, GSTIN, bank details (IFSC, Account No), payment terms, lead time → Save.' },
      { step: 'Track Performance', detail: 'Each vendor has a rating based on delivery timeliness, quality of goods, and price competitiveness.' },
    ],
    terms: [
      { term: 'Lead Time', meaning: 'Number of days between placing a PO and receiving the goods. Used in MRP planning.' },
      { term: 'Payment Terms', meaning: 'Agreed payment schedule. "Net 45" means you pay 45 days after receiving the invoice.' },
    ],
    related: [
      { label: 'Purchase Orders', path: '/purchase/orders' },
      { label: 'Vendor Payments', path: '/purchase/payments' },
    ],
  },
  '/purchase/orders': {
    title: 'Purchase Orders',
    subtitle: 'Procure what you need, when you need it',
    overview:
      'A Purchase Order (PO) is a formal document sent to a vendor to order goods or services. It specifies items, quantities, prices, delivery date, and payment terms. The PO lifecycle: Draft → Submitted → Approved → Sent to Vendor → Goods Received (GRN) → Invoiced → Paid → Completed. POs above certain thresholds require manager approval.',
    workflow: [
      { step: 'Create PO', detail: 'Click "New Purchase Order" → Select vendor → Add items (from Items Master) with qty and rate → Set delivery date → Submit or save as Draft.' },
      { step: 'Get Approval', detail: 'Submitted POs go to Purchase Manager\'s approval queue. Manager reviews items, quantities, and pricing before approving.' },
      { step: 'Send to Vendor', detail: 'Once approved, print or email the PO to the vendor so they can prepare the shipment.' },
      { step: 'Receive Goods', detail: 'When goods arrive, go to GRN to record received quantities (supports partial receipt).' },
    ],
    terms: [
      { term: 'PO', meaning: 'Purchase Order — your formal commitment to buy from a vendor. It\'s legally binding once accepted by the vendor.' },
      { term: '3-Way Matching', meaning: 'Matching PO ↔ GRN ↔ Vendor Invoice to verify you\'re paying for what you ordered and received.' },
    ],
    related: [
      { label: 'Vendors', path: '/purchase/vendors' },
      { label: 'GRN', path: '/purchase/grn' },
      { label: 'Purchase Invoices', path: '/purchase/invoices' },
    ],
  },
  '/purchase/grn': {
    title: 'Goods Receipt Note',
    subtitle: 'What you actually received from the vendor',
    overview:
      'A GRN is created when goods physically arrive at your warehouse from a vendor. It records the actual quantity received (which may differ from the PO quantity), quality status, and any issues. Creating a GRN automatically updates your inventory. It\'s linked to the PO and later matched with the Vendor Invoice for 3-way verification.',
    workflow: [
      { step: 'Select PO', detail: 'Click "New GRN" → Select the Purchase Order being fulfilled. Items and expected quantities pre-fill from the PO.' },
      { step: 'Enter Received Qty', detail: 'For each item, enter the actual quantity received. Supports partial receipt — you can receive 80 of 100 ordered.' },
      { step: 'Note Issues', detail: 'Flag rejected items (damaged, wrong specs) with reason codes. Rejected qty doesn\'t enter inventory.' },
      { step: 'Save', detail: 'Saving the GRN updates inventory stock immediately. The PO status updates to "Partially Received" or "Fully Received".' },
    ],
    terms: [
      { term: 'GRN', meaning: 'Goods Receipt Note — proof that goods were physically received and inspected at your location.' },
      { term: 'Partial Receipt', meaning: 'Receiving only some of the ordered items. The PO stays open until the balance is received or cancelled.' },
    ],
    related: [
      { label: 'Purchase Orders', path: '/purchase/orders' },
      { label: 'Purchase Invoices', path: '/purchase/invoices' },
      { label: 'Items Master', path: '/inventory/items' },
    ],
  },
  '/purchase/invoices': {
    title: 'Purchase Invoices',
    subtitle: 'Record bills from your vendors',
    overview:
      'A Purchase Invoice represents a bill received from a vendor. It records what they\'re charging you for the goods/services delivered. Ideally, each invoice is matched against a PO and GRN (3-way match) to ensure you only pay for what you ordered and received. The invoice creates a payable liability on your books.',
    workflow: [
      { step: 'Create Invoice', detail: 'Click "New Purchase Invoice" → Select vendor → Link to PO/GRN (optional but recommended) → Enter items, amounts, GST → Save.' },
      { step: '3-Way Match', detail: 'The system highlights mismatches: Did you receive more/less than invoiced? Does the rate differ from PO? Address discrepancies before paying.' },
      { step: 'Approve', detail: 'Verified invoices are approved for payment processing.' },
      { step: 'Pay', detail: 'Go to Vendor Payments to create a payment linked to this invoice.' },
    ],
    terms: [
      { term: 'Purchase Invoice', meaning: 'A vendor\'s bill for goods/services supplied. Creates an Accounts Payable entry in your books.' },
      { term: 'Accounts Payable', meaning: 'Money you owe to vendors. Listed as a Current Liability on the Balance Sheet.' },
    ],
    related: [
      { label: 'Purchase Orders', path: '/purchase/orders' },
      { label: 'GRN', path: '/purchase/grn' },
      { label: 'Vendor Payments', path: '/purchase/payments' },
    ],
  },
  '/purchase/payments': {
    title: 'Vendor Payments',
    subtitle: 'Pay your suppliers on time',
    overview:
      'When you transfer money to a vendor (bank transfer, cheque, UPI), record it here. Payments are linked to outstanding Purchase Invoices, reducing the vendor\'s balance. This ensures accurate tracking of what you owe each vendor and generates payment vouchers for accounting records.',
    workflow: [
      { step: 'Create Payment', detail: 'Click "New Payment" → Select vendor → Enter amount, payment method, bank reference → Create.' },
      { step: 'Link to Invoices', detail: 'The system auto-links to oldest outstanding invoices. You can manually select specific invoices.' },
      { step: 'View Allocation', detail: 'Expand any payment row to see which invoices it was applied against.' },
      { step: 'Print Voucher', detail: 'Print the payment voucher for your accounting records.' },
    ],
    related: [
      { label: 'Purchase Invoices', path: '/purchase/invoices' },
      { label: 'Vendors', path: '/purchase/vendors' },
    ],
  },

  /* ── Manufacturing ────────────────────────────────────────── */
  '/manufacturing/bom': {
    title: 'Bill of Materials',
    subtitle: 'The recipe for your products',
    overview:
      'A BOM defines exactly what raw materials (and how much of each) are needed to produce one unit of a finished product. Think of it as a recipe: to make 1 Widget, you need 2 units of Steel, 0.5 kg of Rubber, and 3 Screws. BOMs drive production planning (MRP), costing, and material requisition. They can be multi-level — a sub-assembly can have its own BOM.',
    workflow: [
      { step: 'Create BOM', detail: 'Click "Create BOM" → Select finished product → Add raw materials with required quantities per unit → Set the work center (production line) → Save.' },
      { step: 'Calculate Cost', detail: 'The system auto-calculates the material cost per unit based on current purchase prices of raw materials.' },
      { step: 'Create Production Order', detail: 'Click "Create Production Order" directly from a BOM to start manufacturing.' },
      { step: 'Version Control', detail: 'If the recipe changes (different material, new quantity), create a new BOM version. Old versions are archived for reference.' },
    ],
    terms: [
      { term: 'BOM', meaning: 'Bill of Materials — the list of raw materials and quantities needed to produce one unit of finished product.' },
      { term: 'Routing', meaning: 'The sequence of work centers/machines the product passes through during production.' },
      { term: 'Sub-Assembly', meaning: 'A component that itself needs manufacturing. E.g., a Circuit Board is a sub-assembly of a Computer.' },
    ],
    related: [
      { label: 'Production Orders', path: '/manufacturing/production' },
      { label: 'MRP Planning', path: '/manufacturing/mrp' },
      { label: 'Items Master', path: '/inventory/items' },
    ],
  },
  '/manufacturing/work-centers': {
    title: 'Work Centers',
    subtitle: 'Your production resources',
    overview:
      'A Work Center represents a production resource — a machine, an assembly line, a workstation, or a group of workers. Each has a capacity (how many units/hour it can produce), operating cost, and availability schedule. Work Centers are used in BOM routing and production scheduling to plan when and where items will be manufactured.',
    workflow: [
      { step: 'View Work Centers', detail: 'See all production resources with capacity, current utilization %, operating cost/hour, and status (Active/Maintenance/Idle).' },
      { step: 'Add Work Center', detail: 'Click "Add Work Center" → Enter name, type, capacity, cost per hour, operating hours → Save.' },
      { step: 'Schedule Maintenance', detail: 'Click "Schedule Maintenance" to block a work center for planned downtime. This is reflected in MRP planning.' },
    ],
    terms: [
      { term: 'Capacity', meaning: 'Maximum output rate of the work center, measured in units per hour or per shift.' },
      { term: 'OEE', meaning: 'Overall Equipment Effectiveness — a metric combining Availability × Performance × Quality to measure work center efficiency.' },
    ],
    related: [
      { label: 'BOM', path: '/manufacturing/bom' },
      { label: 'OEE Dashboard', path: '/manufacturing/oee' },
      { label: 'Shop Floor', path: '/manufacturing/shop-floor' },
    ],
  },
  '/manufacturing/production': {
    title: 'Production Orders',
    subtitle: 'Plan, execute, and track manufacturing',
    overview:
      'A Production Order is an instruction to manufacture a specific quantity of a product using a specific BOM. It triggers raw material reservation, work center scheduling, and shop floor execution. The lifecycle: Planned → Materials Issued → In Progress → Quality Check → Completed. On completion, finished goods are added to inventory.',
    workflow: [
      { step: 'Create Order', detail: 'Click "New Production Order" → Select BOM (or finished product) → Enter quantity, start date, expected end date → Submit.' },
      { step: 'Issue Materials', detail: 'Raw materials listed in the BOM are reserved and then issued to the shop floor. Stock is deducted from inventory.' },
      { step: 'Track Progress', detail: 'The shop floor records production progress in real-time. Monitor completion % from this page.' },
      { step: 'Complete & QC', detail: 'Once production is done, QC inspection occurs. On pass, finished goods are added to inventory.' },
    ],
    terms: [
      { term: 'Material Requisition', meaning: 'The process of withdrawing raw materials from the warehouse for production use.' },
      { term: 'WIP', meaning: 'Work in Progress — items currently being manufactured. They\'re no longer raw materials but not yet finished goods.' },
    ],
    related: [
      { label: 'BOM', path: '/manufacturing/bom' },
      { label: 'Shop Floor', path: '/manufacturing/shop-floor' },
      { label: 'QC Inspection', path: '/manufacturing/qc' },
    ],
  },
  '/manufacturing/mrp': {
    title: 'MRP Planning',
    subtitle: 'What to buy and when to produce',
    overview:
      'MRP (Material Requirements Planning) analyzes your sales orders, production plans, and current stock to answer: "What raw materials do I need, how much, and when?" It considers lead times, safety stock, and existing POs to generate a recommended action plan — which purchase orders to create and which production orders to schedule.',
    workflow: [
      { step: 'Run MRP', detail: 'Click "Run MRP" → The system aggregates demand (from sales orders, forecasts), subtracts current stock and pending POs, and calculates net requirements.' },
      { step: 'Review Recommendations', detail: 'The results show: Items needed, Qty required, Current Stock, Deficit, Suggested Action (Create PO or Production Order), and Timing.' },
      { step: 'Accept Suggestions', detail: 'Select recommendations and click "Create POs" or "Create Production Orders" to act on them.' },
    ],
    terms: [
      { term: 'MRP', meaning: 'Material Requirements Planning — a system that calculates what materials to buy and what to produce, based on demand and current inventory.' },
      { term: 'Safety Stock', meaning: 'Extra buffer stock kept to handle unexpected demand spikes or supplier delays.' },
      { term: 'Lead Time', meaning: 'Time between placing an order and receiving it. MRP offsets purchase timing by lead time to ensure materials arrive on time.' },
    ],
    related: [
      { label: 'Production Orders', path: '/manufacturing/production' },
      { label: 'Purchase Orders', path: '/purchase/orders' },
      { label: 'Low Stock', path: '/inventory/low-stock' },
    ],
  },
  '/manufacturing/job-work': {
    title: 'Job Work Challan',
    subtitle: 'Outsourced manufacturing with GST compliance',
    overview:
      'Job Work is when you send raw materials to an external party (job worker) for processing — e.g., sending fabric to a tailor, or metal to a machinist. A Challan documents what was sent, to whom, and when it should return. Under GST law, goods sent for job work must be tracked via ITC-04 for compliance. This page manages the entire cycle.',
    workflow: [
      { step: 'Create Challan', detail: 'Click "New Challan" → Select job worker → Add items being sent with quantities → Set expected return date → Create.' },
      { step: 'Track Dispatch', detail: 'The challan goes with the goods. Print it for the transporter. Track dispatched items with status updates.' },
      { step: 'Record Return', detail: 'When processed items come back, click "Confirm Receipt" → Enter returned quantities (can be partial) → Accepted items enter inventory.' },
      { step: 'Generate ITC-04', detail: 'Periodically, generate the ITC-04 return for GST filing which lists all goods sent to and received from job workers.' },
    ],
    terms: [
      { term: 'Challan', meaning: 'A document accompanying goods sent for job work. Required under GST law for tracking.' },
      { term: 'ITC-04', meaning: 'A GST return that reports details of goods sent to/received from job workers. Filed quarterly or annually.' },
    ],
    related: [
      { label: 'Gate Pass', path: '/inventory/gate-pass' },
      { label: 'GST Module', path: '/gst/e-invoice' },
    ],
  },
  '/manufacturing/shop-floor': {
    title: 'Shop Floor Kiosk',
    subtitle: 'Real-time production tracking on the factory floor',
    overview:
      'The Shop Floor Kiosk is a simplified interface designed to run on a tablet or screen at the production area. Workers use it to start/stop/pause jobs, record quantities produced, log downtime reasons, and signal quality issues. It feeds real-time data to the Production Orders and OEE Dashboard without requiring workers to navigate the full ERP.',
    workflow: [
      { step: 'Start a Job', detail: 'Select a production order from the list and click "Start". A timer begins tracking how long the job runs.' },
      { step: 'Record Output', detail: 'Periodically enter quantities produced. The system calculates production rate automatically.' },
      { step: 'Pause / Log Downtime', detail: 'If the machine stops, click "Pause" and select a reason code (Breakdown, Material Unavailable, Changeover, Break, etc.).' },
      { step: 'Complete Job', detail: 'When the order quantity is produced, mark the job complete. Items move to QC if configured.' },
    ],
    terms: [
      { term: 'Downtime', meaning: 'Time when production is stopped — machine breakdowns, changeovers, material shortages, etc.' },
      { term: 'Cycle Time', meaning: 'Time to produce one unit. Used to calculate performance efficiency.' },
    ],
    related: [
      { label: 'Production Orders', path: '/manufacturing/production' },
      { label: 'OEE Dashboard', path: '/manufacturing/oee' },
    ],
  },
  '/manufacturing/oee': {
    title: 'OEE Dashboard',
    subtitle: 'How efficient are your machines really?',
    overview:
      'OEE (Overall Equipment Effectiveness) is the gold standard metric for manufacturing efficiency. It combines three factors: Availability (were machines running?), Performance (at what speed?), and Quality (how many good units?). World-class OEE is 85%+. Most plants run at 60-70%. This dashboard helps you identify and eliminate the biggest losses.',
    workflow: [
      { step: 'Select Work Center', detail: 'Choose a work center or view the plant-wide aggregate. Select a time period (day/week/month).' },
      { step: 'Read the Score', detail: 'OEE = Availability × Performance × Quality. Each factor is shown as a percentage with a gauge chart.' },
      { step: 'Analyze Losses', detail: 'The breakdown shows the top reasons for each loss: downtime causes (availability), speed losses (performance), and defect types (quality).' },
      { step: 'Track Trends', detail: 'The trend chart shows OEE over time — are things improving or degrading?' },
    ],
    terms: [
      { term: 'Availability', meaning: 'Actual run time ÷ Planned production time. Reduced by breakdowns and changeovers.' },
      { term: 'Performance', meaning: 'Actual output ÷ Expected output (at standard speed). Reduced by slow running and minor stops.' },
      { term: 'Quality', meaning: 'Good units ÷ Total units produced. Reduced by defects and rework.' },
    ],
    related: [
      { label: 'Work Centers', path: '/manufacturing/work-centers' },
      { label: 'Shop Floor', path: '/manufacturing/shop-floor' },
    ],
  },
  '/manufacturing/qc': {
    title: 'QC Inspection',
    subtitle: 'Only quality-approved goods enter inventory',
    overview:
      'Quality Control inspections are performed on production output before the finished goods enter inventory. Each inspection is linked to a production order and tests specific parameters (dimensions, weight, visual, functional). Items that fail are either reworked or scrapped. This ensures customers receive only quality-approved products.',
    workflow: [
      { step: 'Create Inspection', detail: 'Click "New Inspection" → Link to production order → Select inspection template → Enter test parameters and results.' },
      { step: 'Record Results', detail: 'For each parameter: enter measured value, compare against specification range, mark Pass/Fail.' },
      { step: 'Upload Evidence', detail: 'Capture photos of samples or test results for documentation.' },
      { step: 'Verdict', detail: 'Mark the batch as Approved (enters finished goods inventory), Rework (sent back for correction), or Rejected (scrapped).' },
    ],
    terms: [
      { term: 'Inspection Template', meaning: 'A predefined set of test parameters and their acceptable ranges. E.g., "Steel Rod QC" checks diameter (10mm ±0.1), length, hardness.' },
      { term: 'Rework', meaning: 'Sending a defective item back to production for correction rather than scrapping it.' },
    ],
    related: [
      { label: 'Production Orders', path: '/manufacturing/production' },
      { label: 'Items Master', path: '/inventory/items' },
    ],
  },

  /* ── HRM ──────────────────────────────────────────────────── */
  '/hrm/employees': {
    title: 'Employees',
    subtitle: 'Your complete workforce directory',
    overview:
      'Every person who works in your company has a record here. It stores personal details, employment details (department, designation, joining date), salary structure (basic, HRA, allowances, deductions), bank information (for salary disbursement), and document uploads (ID proofs, offer letter). This master feeds into Attendance, Leave, Payroll, and Tax modules.',
    workflow: [
      { step: 'Add Employee', detail: 'Click "Add Employee" → Fill: Name, Employee ID, Department, Designation, Joining Date, Salary (Basic + HRA + DA + Allowances), Bank (IFSC, Account No), PAN, Aadhar → Save.' },
      { step: 'View Directory', detail: 'Browse all employees in a searchable table with department, designation, and contact info.' },
      { step: 'Edit Profile', detail: 'Click any employee to update details, salary revision, department transfer, or promotion.' },
      { step: 'Offboarding', detail: 'For employees leaving, mark as Inactive with last working date and full & final settlement.' },
    ],
    terms: [
      { term: 'Basic', meaning: 'Base salary component. Other components (HRA, PF, Gratuity) are calculated as percentages of Basic.' },
      { term: 'HRA', meaning: 'House Rent Allowance — a component to cover housing costs. Tax-exempt under certain conditions (Section 10-13A).' },
      { term: 'CTC', meaning: 'Cost to Company — total annual expense including salary, employer PF contribution, insurance, bonuses.' },
    ],
    related: [
      { label: 'Attendance', path: '/hrm/attendance' },
      { label: 'Payroll', path: '/hrm/payroll' },
      { label: 'Leave', path: '/hrm/leave' },
    ],
  },
  '/hrm/attendance': {
    title: 'Attendance',
    subtitle: 'Track who shows up and when',
    overview:
      'Daily attendance tracking for all employees. You can mark attendance manually (Present, Absent, Half-day, On Leave) or import data from biometric/swipe card machines. The monthly calendar view shows each employee\'s attendance pattern at a glance. This data feeds directly into Payroll for calculating working days and leave deductions.',
    workflow: [
      { step: 'Mark Attendance', detail: 'Click "Mark Attendance" → Select date → For each employee, choose status: Present, Absent, Half-day, WFH, On Leave → Save.' },
      { step: 'Import from Device', detail: 'Click "Import Biometric" → Upload CSV/Excel from your biometric device → System auto-maps employee IDs and marks attendance.' },
      { step: 'View Calendar', detail: 'Switch to calendar view to see a monthly grid per employee — green (present), red (absent), yellow (half-day), blue (leave).' },
      { step: 'Export for Payroll', detail: 'Click "Export" to generate the attendance summary that Payroll uses to calculate working days.' },
    ],
    terms: [
      { term: 'Half-day', meaning: 'Employee was present for only half the working hours. Counted as 0.5 days for payroll.' },
      { term: 'WFH', meaning: 'Work From Home — counted as present but marked separately for tracking purposes.' },
    ],
    related: [
      { label: 'Payroll', path: '/hrm/payroll' },
      { label: 'Leave Management', path: '/hrm/leave' },
    ],
  },
  '/hrm/leave': {
    title: 'Leave Management',
    subtitle: 'Apply, approve, and track time off',
    overview:
      'Manages the complete leave lifecycle. Employees apply for leave → Managers approve/reject → Balances auto-update → Attendance reflects the leave → Payroll adjusts accordingly. Leave types include Casual Leave (CL), Sick Leave (SL), Earned Leave (EL), Compensatory Off, and more. Each type has an annual quota configured by HR.',
    workflow: [
      { step: 'Apply for Leave', detail: 'Employee clicks "Apply Leave" → Selects type (CL/SL/EL), start date, end date, reason → Submits. The request goes to their reporting manager.' },
      { step: 'Manager Approval', detail: 'Manager sees the request in their queue. They can view the team calendar to check coverage before approving.' },
      { step: 'Balance Updates', detail: 'On approval, leave balance for that type is automatically reduced. If insufficient balance, request is flagged as LOP (Loss of Pay).' },
      { step: 'View Balances', detail: 'Each employee and manager can see remaining balances by leave type on this page.' },
    ],
    terms: [
      { term: 'CL', meaning: 'Casual Leave — for personal/unforeseen needs. Usually 7-12 days/year. Cannot be accumulated.' },
      { term: 'SL', meaning: 'Sick Leave — for health issues. Usually 7-12 days/year. May need medical proof for >2 days.' },
      { term: 'EL', meaning: 'Earned Leave / Privilege Leave — accrued based on working days. Can be carried forward or encashed.' },
      { term: 'LOP', meaning: 'Loss of Pay — leave taken when no paid balance remains. Salary is deducted proportionally.' },
    ],
    related: [
      { label: 'Attendance', path: '/hrm/attendance' },
      { label: 'Payroll', path: '/hrm/payroll' },
    ],
  },
  '/hrm/payroll': {
    title: 'Payroll',
    subtitle: 'Process salaries accurately and on time',
    overview:
      'Monthly payroll processing for all employees. The system takes each employee\'s salary structure, adjusts for attendance (LOP deductions), adds overtime if applicable, calculates statutory deductions (PF, ESI, Professional Tax, TDS), and produces a Net Pay figure. Pay slips are auto-generated for distribution.',
    workflow: [
      { step: 'Run Payroll', detail: 'Click "Run Payroll" → Select month → System pulls attendance data and salary structures → Calculates everything automatically.' },
      { step: 'Review Calculations', detail: 'Check each employee: Gross Salary, Attendance Days, LOP Deduction, PF (12%), ESI (if applicable), TDS, Professional Tax → Net Salary.' },
      { step: 'Generate Pay Slips', detail: 'Click "Generate Pay Slips" to create individual salary statements for email distribution.' },
      { step: 'Mark as Paid', detail: 'After bank transfer, click "Mark as Paid" to finalize payroll and create the journal entry in Finance.' },
    ],
    terms: [
      { term: 'PF (EPF)', meaning: 'Employees\' Provident Fund — 12% of Basic deducted from employee + 12% contributed by employer. Retirement savings.' },
      { term: 'ESI', meaning: 'Employees\' State Insurance — applicable if gross salary ≤ ₹21,000/month. Employee: 0.75%, Employer: 3.25%.' },
      { term: 'TDS', meaning: 'Tax Deducted at Source — income tax deducted from salary based on estimated annual tax liability.' },
      { term: 'Professional Tax', meaning: 'State-level tax on employment. Amount varies by state (e.g., ₹200/month in Maharashtra).' },
    ],
    related: [
      { label: 'Attendance', path: '/hrm/attendance' },
      { label: 'Tax Declarations', path: '/hrm/tax' },
      { label: 'Employees', path: '/hrm/employees' },
    ],
  },
  '/hrm/tax': {
    title: 'Tax Declarations',
    subtitle: 'Employee investment proofs for TDS optimization',
    overview:
      'At the start of each financial year, employees declare their planned investments and expenses (under sections 80C, 80D, HRA, etc.) to reduce TDS deductions. HR reviews these declarations and adjusts TDS calculations in payroll. Towards year-end, employees submit actual proofs. This page manages the entire declaration-verification-adjustment cycle.',
    workflow: [
      { step: 'Employee Declares', detail: 'Employees fill in: 80C investments (PPF, ELSS, LIC), 80D (health insurance), HRA (rent paid), home loan interest, etc.' },
      { step: 'Provisional TDS', detail: 'Based on declarations, monthly TDS is reduced. A ₹1.5L declaration under 80C can save ~₹3,000/month in TDS.' },
      { step: 'Submit Proofs', detail: 'Before March or as configured, employees upload actual investment proofs (receipts, certificates).' },
      { step: 'HR Verification', detail: 'HR reviews proofs. Accepted amounts are finalized. Rejected amounts trigger TDS recalculation in the last few months.' },
    ],
    terms: [
      { term: '80C', meaning: 'Tax deduction up to ₹1.5 lakh for investments in PPF, ELSS, LIC premium, NSC, tax-saving FD, children tuition.' },
      { term: '80D', meaning: 'Tax deduction for health insurance premium: ₹25,000 (self) + ₹25,000 (parents, ₹50,000 if senior citizen).' },
      { term: 'HRA Exemption', meaning: 'Tax relief on house rent paid. Calculated as minimum of: actual HRA, rent − 10% of salary, or 50%/40% of salary (metro/non-metro).' },
    ],
    related: [
      { label: 'Payroll', path: '/hrm/payroll' },
      { label: 'Employees', path: '/hrm/employees' },
    ],
  },

  /* ── GST & Tax ────────────────────────────────────────────── */
  '/gst/e-invoice': {
    title: 'E-Invoice',
    subtitle: 'Government-validated electronic invoices',
    overview:
      'E-Invoicing is mandatory for B2B transactions above the threshold (currently ₹5 crore+ turnover). Every sales invoice is submitted to the NIC (National Informatics Centre) portal which validates it and returns an IRN (Invoice Reference Number) and a signed QR code. This makes the invoice legally valid and auto-populates GSTR-1 and E-Way Bill data.',
    workflow: [
      { step: 'Select Invoices', detail: 'The table shows all sales invoices eligible for E-Invoice. Checkboxes let you select which ones to process.' },
      { step: 'Generate IRN', detail: 'Click "Generate IRN" → System sends invoice JSON to NIC portal → NIC validates and returns IRN + signed QR code.' },
      { step: 'Verify Status', detail: 'Successful ones turn green (IRN generated). Failed ones show error details — fix and retry.' },
      { step: 'Cancel if Needed', detail: 'Cancel an E-Invoice within 24 hours by clicking "Cancel". After 24 hours, you must issue a Credit Note instead.' },
    ],
    terms: [
      { term: 'IRN', meaning: 'Invoice Reference Number — a unique 64-character hash generated by NIC for each E-Invoice.' },
      { term: 'NIC', meaning: 'National Informatics Centre — the government portal that validates and registers E-Invoices.' },
      { term: 'QR Code', meaning: 'A signed QR code returned by NIC containing invoice summary. Must be printed on the invoice.' },
    ],
    related: [
      { label: 'Sales Invoices', path: '/sales/invoices' },
      { label: 'E-Way Bill', path: '/gst/e-way-bill' },
      { label: 'GSTR-1', path: '/gst/gstr1' },
    ],
  },
  '/gst/e-way-bill': {
    title: 'E-Way Bill',
    subtitle: 'Mandatory document for goods transport',
    overview:
      'An E-Way Bill is required when goods worth more than ₹50,000 are transported. It contains details of the goods, supplier, recipient, and transporter. Generated via the government portal, it has a validity period based on distance. The transporter must carry it during transit. Goods transported without a valid E-Way Bill can be detained.',
    workflow: [
      { step: 'Generate E-Way Bill', detail: 'Click "Generate" → Enter: Invoice details, transport mode (Road/Rail/Air/Ship), vehicle number, distance → Submit to portal.' },
      { step: 'Print for Transporter', detail: 'Print the E-Way Bill — the transporter must carry this during transit for verification at checkpoints.' },
      { step: 'Extend Validity', detail: 'If goods don\'t reach within the validity period (1 day per 200 km), click "Extend" with updated details.' },
      { step: 'Update Vehicle', detail: 'If the vehicle changes mid-transit, update the vehicle number on the portal through this page.' },
    ],
    terms: [
      { term: 'E-Way Bill Validity', meaning: 'Valid for 1 day per 200 km (regular) or per 20 km (over-dimensional cargo). Starts from generation time.' },
      { term: 'Part B', meaning: 'The transport details section of the E-Way Bill — vehicle number, transport mode, and transporter details.' },
    ],
    related: [
      { label: 'E-Invoice', path: '/gst/e-invoice' },
      { label: 'Sales Invoices', path: '/sales/invoices' },
    ],
  },
  '/gst/gstr1': {
    title: 'GSTR-1',
    subtitle: 'Report your outward supplies to the government',
    overview:
      'GSTR-1 is a monthly/quarterly return reporting all outward supplies (sales). It\'s auto-populated from your sales invoices and categorized into B2B (large invoices with buyer GSTIN), B2C large (>₹2.5L to non-registered), B2C small (all others), Credit/Debit Notes, and Exports. You review, make corrections, and download the JSON file for upload to the GST portal.',
    workflow: [
      { step: 'Review Data', detail: 'The system auto-populates from your sales invoices. Tables show B2B invoices, B2C sales, Credit Notes, Debit Notes, and Exports.' },
      { step: 'Validate', detail: 'Check for errors: missing GSTINs, incorrect HSN codes, tax mismatches. The system highlights issues in red.' },
      { step: 'Download JSON', detail: 'Click "Download JSON" to get the file formatted for upload to the GST portal (gst.gov.in).' },
    ],
    terms: [
      { term: 'B2B', meaning: 'Business-to-Business — sales to GSTIN-registered buyers. Each invoice is listed individually in GSTR-1.' },
      { term: 'B2C', meaning: 'Business-to-Consumer — sales to unregistered buyers. Aggregated by rate and state in GSTR-1.' },
    ],
    related: [
      { label: 'Sales Invoices', path: '/sales/invoices' },
      { label: 'HSN Summary', path: '/gst/hsn' },
      { label: 'GST Reports', path: '/reports/gst' },
    ],
  },
  '/gst/gstr2b': {
    title: 'GSTR-2B Reconciliation',
    subtitle: 'Match vendor data with your purchase records',
    overview:
      'GSTR-2B is an auto-drafted statement from the government showing all inward supplies (purchases) as reported by your vendors in their GSTR-1. Reconciliation means comparing this government data with your own purchase records to find: Matched entries, Mismatched entries (amount/tax differences), Missing entries (in their data or yours). This is critical for claiming correct ITC.',
    workflow: [
      { step: 'Upload GSTR-2B', detail: 'Download the JSON from the GST portal → Upload it here → System parses and lists all vendor invoices.' },
      { step: 'Auto-Match', detail: 'Click "Run Reconciliation" → System matches by vendor GSTIN + Invoice No + Amount. Green = matched, Orange = mismatch, Red = missing.' },
      { step: 'Review Mismatches', detail: 'For each mismatch: see your recorded value vs government value. Decide if you need to correct your records or follow up with the vendor.' },
      { step: 'Export Report', detail: 'Download the reconciliation report as Excel for detailed analysis and vendor follow-up.' },
    ],
    terms: [
      { term: 'ITC', meaning: 'Input Tax Credit — the GST you paid on purchases that you can claim back against GST collected on sales.' },
      { term: 'GSTR-2B', meaning: 'An auto-generated statement by the government showing ITC available to you based on your vendors\' filings.' },
    ],
    related: [
      { label: 'ITC Reconciliation', path: '/gst/itc' },
      { label: 'Purchase Invoices', path: '/purchase/invoices' },
    ],
  },
  '/gst/tds': {
    title: 'TDS Management',
    subtitle: 'Tax Deducted at Source on vendor payments',
    overview:
      'When you pay certain vendors (contractors, professionals, rent), you\'re legally required to deduct TDS (Tax Deducted at Source) at prescribed rates and deposit it with the government. This page tracks all TDS deductions, their deposit status, and generates Form 26Q for quarterly filing. Non-compliance leads to penalties and disallowance of expenses.',
    workflow: [
      { step: 'View Deductions', detail: 'See all TDS deductions: Vendor, Section (194C/194J/194I, etc.), Amount Paid, TDS Rate, TDS Amount, Deposit Status.' },
      { step: 'Track Deposits', detail: 'After depositing TDS via challan (form 281), mark the entries as deposited with challan details.' },
      { step: 'Generate Form 26Q', detail: 'Click "Generate Form 26Q" → System compiles all deductions for the quarter into the prescribed format for filing on TRACES portal.' },
    ],
    terms: [
      { term: '194C', meaning: 'TDS on payments to contractors — 1% (individual/HUF) or 2% (others) on payments above ₹30,000 per transaction.' },
      { term: '194J', meaning: 'TDS on professional/technical fees — 10% on amounts above ₹30,000 per year.' },
      { term: 'Form 26Q', meaning: 'Quarterly TDS return filed with TRACES showing all deductions on non-salary payments.' },
      { term: 'TRACES', meaning: 'TDS Reconciliation Analysis and Correction Enabling System — the government portal for TDS compliance.' },
    ],
    related: [
      { label: 'Vendor Payments', path: '/purchase/payments' },
      { label: 'GST Reports', path: '/reports/gst' },
    ],
  },
  '/gst/itc': {
    title: 'ITC Reconciliation',
    subtitle: 'Maximize your Input Tax Credit claim',
    overview:
      'ITC (Input Tax Credit) is the GST you paid on purchases that you can offset against GST you collected on sales. But you can only claim ITC if your vendor has reported the invoice in their GSTR-1 and it appears in your GSTR-2A/2B. This page reconciles your claimed ITC with the government\'s available ITC data to ensure you\'re neither under-claiming nor over-claiming.',
    workflow: [
      { step: 'Import GSTR-2A', detail: 'Download GSTR-2A from the GST portal and upload it here. This shows all ITC available to you per the government.' },
      { step: 'Run Reconciliation', detail: 'System compares your purchase invoices (ITC claimed) with GSTR-2A (ITC available). Shows matched, excess, and unavailable credit.' },
      { step: 'Review & Adjust', detail: 'For excess claims: reduce ITC in next return. For unavailable: follow up with vendors to file their GSTR-1.' },
      { step: 'Export', detail: 'Export the detailed reconciliation for audit trail and CA review.' },
    ],
    terms: [
      { term: 'ITC Claimed', meaning: 'The GST credit you\'ve taken in your books based on purchase invoices you\'ve received.' },
      { term: 'ITC Available', meaning: 'The credit the government says you\'re eligible for based on your vendors\' GSTR-1 filings.' },
      { term: 'GSTR-2A', meaning: 'A dynamic view of ITC available, updated as your vendors file their returns.' },
    ],
    related: [
      { label: 'GSTR-2B Reconciliation', path: '/gst/gstr2b' },
      { label: 'Purchase Invoices', path: '/purchase/invoices' },
    ],
  },
  '/gst/hsn': {
    title: 'HSN Summary',
    subtitle: 'Product-wise tax summary for GST returns',
    overview:
      'The HSN Summary groups all your sales by HSN code and shows the total quantity, taxable value, and tax breakup (CGST, SGST, IGST) for each code. This is a mandatory table in GSTR-1 and GSTR-9 (annual return). The system auto-generates it from your invoice data.',
    workflow: [
      { step: 'View Summary', detail: 'The table shows: HSN Code, Description, UOM, Total Quantity, Taxable Value, IGST, CGST, SGST, Total Tax.' },
      { step: 'Select Period', detail: 'Choose the filing period (month/quarter) to see only that period\'s data.' },
      { step: 'Download', detail: 'Download in the GST portal format for direct upload or for copy-paste into the GSTR-1 filing utility.' },
    ],
    terms: [
      { term: 'HSN', meaning: 'Harmonized System of Nomenclature — a standardized 6-8 digit code classifying every physical product for taxation.' },
    ],
    related: [
      { label: 'GSTR-1', path: '/gst/gstr1' },
      { label: 'Items Master', path: '/inventory/items' },
    ],
  },

  /* ── Reports ──────────────────────────────────────────────── */
  '/reports/financial': {
    title: 'Financial Reports',
    subtitle: 'P&L, Balance Sheet, and Cash Flow at your fingertips',
    overview:
      'Auto-generated financial statements from your accounting data. Select a period and instantly view your Profit & Loss, Balance Sheet, or Cash Flow statement. Compare periods, drill down into accounts, and export for board meetings, auditors, or bank submissions.',
    workflow: [
      { step: 'Select Report Type', detail: 'Choose: Profit & Loss, Balance Sheet, or Cash Flow Statement from the tabs.' },
      { step: 'Set Period', detail: 'Choose date range. Enable comparison to see two periods side-by-side.' },
      { step: 'Drill Down', detail: 'Click any number to see the underlying transactions that make up that total.' },
      { step: 'Export', detail: 'Download as PDF (formatted) or Excel (data) for sharing.' },
    ],
    related: [
      { label: 'P&L', path: '/finance/pnl' },
      { label: 'Balance Sheet', path: '/finance/balance-sheet' },
    ],
  },
  '/reports/sales': {
    title: 'Sales Reports',
    subtitle: 'Revenue insights and customer analytics',
    overview:
      'Comprehensive sales analytics: revenue trends over time, top customers by revenue, product-wise sales breakdown, regional analysis, and salesperson performance. Use filters to slice data by period, customer, product, or salesperson.',
    workflow: [
      { step: 'View Dashboard', detail: 'Top cards show total revenue, order count, average order value, and growth rate.' },
      { step: 'Analyze Trends', detail: 'Line charts show daily/weekly/monthly revenue with comparison to previous period.' },
      { step: 'Top Customers/Products', detail: 'Tables rank your customers and products by revenue contribution.' },
      { step: 'Export', detail: 'Export any chart or table as PDF or Excel.' },
    ],
    related: [
      { label: 'Sales Orders', path: '/sales/orders' },
      { label: 'Sales Invoices', path: '/sales/invoices' },
    ],
  },
  '/reports/purchase': {
    title: 'Purchase Reports',
    subtitle: 'Procurement cost analysis and vendor tracking',
    overview:
      'Analyze your purchasing: total spend over time, vendor-wise breakdown, PO fulfillment rates, price trends for key materials, and payment aging. Helps negotiate better terms and identify cost-saving opportunities.',
    workflow: [
      { step: 'View Spend Analysis', detail: 'Top cards show total purchases, PO count, average PO value, and top vendor.' },
      { step: 'Vendor Comparison', detail: 'Compare vendors by total spend, delivery reliability, and price competitiveness.' },
      { step: 'Price Trends', detail: 'Track how material prices have changed over time to optimize purchasing timing.' },
      { step: 'Export', detail: 'Export as PDF or Excel for management review.' },
    ],
    related: [
      { label: 'Purchase Orders', path: '/purchase/orders' },
      { label: 'Vendors', path: '/purchase/vendors' },
    ],
  },
  '/reports/inventory': {
    title: 'Inventory Reports',
    subtitle: 'Stock status and movement insights',
    overview:
      'Real-time inventory analytics: current stock levels across all warehouses, fast-moving vs slow-moving items, stock aging (how long items have been sitting), warehouse utilization, and movement trends. Critical for inventory planning and working capital optimization.',
    workflow: [
      { step: 'View Stock Summary', detail: 'Current stock levels across warehouses with total value.' },
      { step: 'Movement Analysis', detail: 'Inward/outward trends showing seasonal patterns and anomalies.' },
      { step: 'Slow-Moving Items', detail: 'Items that haven\'t moved in X days — candidates for clearance sales or write-offs.' },
      { step: 'Export', detail: 'Download as PDF or Excel for warehouse planning.' },
    ],
    related: [
      { label: 'Items Master', path: '/inventory/items' },
      { label: 'Stock Valuation', path: '/inventory/valuation' },
    ],
  },
  '/reports/gst': {
    title: 'GST Reports',
    subtitle: 'Tax compliance summaries',
    overview:
      'Consolidated GST compliance reports: GSTR-3B summary (monthly tax liability vs ITC claim), tax payment tracking, HSN summary, and filing status. Use this to prepare for monthly GST filing and verify your tax position before submitting returns.',
    workflow: [
      { step: 'View GSTR-3B Summary', detail: 'Auto-calculated tax liability: Output tax (from sales) minus Input tax (from purchases) = Tax payable / Refund due.' },
      { step: 'Check Filing Status', detail: 'Track which months have been filed and which are pending.' },
      { step: 'Download', detail: 'Download GSTR-3B in the portal format for filing.' },
      { step: 'Export', detail: 'Export detailed tax workings as Excel for your CA.' },
    ],
    terms: [
      { term: 'GSTR-3B', meaning: 'Monthly summary return showing total tax liability, ITC claimed, and net tax payable. Must be filed by the 20th of the following month.' },
    ],
    related: [
      { label: 'GSTR-1', path: '/gst/gstr1' },
      { label: 'ITC Reconciliation', path: '/gst/itc' },
    ],
  },

  /* ── Settings ─────────────────────────────────────────────── */
  '/settings': {
    title: 'Settings',
    subtitle: 'Configure your ERP system',
    overview:
      'System configuration divided into four areas: Company Profile (business identity), Users (who can log in), Roles (what each user type can do), and Master Data (reusable data used across the system like tax rates, payment terms, and units of measure). Only Admin users have full access to Settings.',
    workflow: [
      { step: 'Company Profile', detail: 'Set your company name, GSTIN, address, state code, phone, email, and logo. This info appears on all invoices and reports.' },
      { step: 'Manage Users', detail: 'Create user accounts. Each user needs: username, email, temporary password, and assigned role(s).' },
      { step: 'Configure Roles', detail: 'View and customize what each role can access. The system has 11 built-in roles with 70+ permissions you can toggle.' },
      { step: 'Master Data', detail: 'Set up: Units of Measure (pcs, kg, litre), Tax Rates (GST slabs: 5%, 12%, 18%, 28%), Payment Terms (Net 30, Net 60, COD), Item Categories, etc.' },
    ],
    tips: [
      'Set up Company Profile and Master Data before creating transactions.',
      'Create user accounts and assign roles before employees start using the system.',
      'Roles can be customized — you can create a role that combines Sales + Inventory access.',
    ],
    related: [
      { label: 'Dashboard', path: '/' },
    ],
  },
};

/* ─── Route Aliases ─────────────────────────────────────────── */
const ALIASES: Record<string, string> = {
  '/finance': '/finance/accounts',
  '/inventory': '/inventory/items',
  '/sales': '/sales/customers',
  '/purchase': '/purchase/vendors',
  '/manufacturing': '/manufacturing/bom',
  '/hrm': '/hrm/employees',
  '/gst': '/gst/e-invoice',
  '/reports': '/reports/financial',
  '/settings/company': '/settings',
  '/settings/users': '/settings',
  '/settings/roles': '/settings',
  '/settings/master': '/settings',
};

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📖' },
  { key: 'workflow', label: 'How-To', icon: '🔄' },
  { key: 'terms', label: 'Key Terms', icon: '📚' },
  { key: 'tips', label: 'Tips & Links', icon: '💡' },
];

/* ─── Component ─────────────────────────────────────────────── */
export default function PageHelpGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const location = useLocation();

  const route = location.pathname;
  const canonical = ALIASES[route] || route;
  const guide = GUIDES[canonical];

  useEffect(() => {
    setIsOpen(false);
    setTab('overview');
  }, [route]);

  if (!guide) return null;

  const hasTabs = {
    overview: true,
    workflow: guide.workflow.length > 0,
    terms: (guide.terms?.length || 0) > 0,
    tips: (guide.tips?.length || 0) > 0 || (guide.related?.length || 0) > 0,
  };

  return (
    <>
      {/* "?" Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9998] w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-base font-bold lg:left-[17rem]"
        title="Page Guide — Learn about this page"
      >
        ?
      </button>

      {/* Full Guide Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px] flex items-start justify-center pt-12 sm:pt-16 px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'guideSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{guide.title}</h3>
                  <p className="text-indigo-200 text-xs mt-0.5">{guide.subtitle}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-3">
                {TABS.filter(t => hasTabs[t.key]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      tab === t.key
                        ? 'bg-white/25 text-white shadow-sm'
                        : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <span className="mr-1">{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
              {/* Overview Tab */}
              {tab === 'overview' && (
                <div className="animate-fadeIn">
                  <p className="text-sm text-gray-700 leading-relaxed">{guide.overview}</p>
                </div>
              )}

              {/* Workflow Tab */}
              {tab === 'workflow' && (
                <div className="space-y-3 animate-fadeIn">
                  {guide.workflow.map((w, i) => (
                    <div key={i} className="relative pl-8">
                      {/* Step number */}
                      <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </div>
                      {/* Connector line */}
                      {i < guide.workflow.length - 1 && (
                        <div className="absolute left-[11px] top-6 w-0.5 h-[calc(100%+4px)] bg-indigo-100" />
                      )}
                      <h4 className="text-sm font-semibold text-gray-900">{w.step}</h4>
                      <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{w.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Terms Tab */}
              {tab === 'terms' && guide.terms && (
                <div className="space-y-2.5 animate-fadeIn">
                  {guide.terms.map((t, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="text-sm font-bold text-indigo-700">{t.term}</h4>
                      <p className="text-sm text-gray-600 mt-0.5">{t.meaning}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips & Related Tab */}
              {tab === 'tips' && (
                <div className="animate-fadeIn space-y-4">
                  {guide.tips && guide.tips.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">💡 Pro Tips</h4>
                      <div className="space-y-2">
                        {guide.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                            <span className="text-amber-500 mt-0.5 text-xs">●</span>
                            <p className="text-sm text-amber-800">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {guide.related && guide.related.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🔗 Related Pages</h4>
                      <div className="flex flex-wrap gap-2">
                        {guide.related.map((r, i) => (
                          <a
                            key={i}
                            href={`#${r.path}`}
                            onClick={e => {
                              e.preventDefault();
                              setIsOpen(false);
                              window.location.hash = r.path;
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-100 transition-colors"
                          >
                            {r.label} →
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes guideSlideIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
