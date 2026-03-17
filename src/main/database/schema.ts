/**
 * SA ERP - Database Schema
 * SQLite schema with double-entry accounting
 * MCA Audit Trail Compliant
 */

export const SCHEMA = `
-- ============================================
-- CORE SYSTEM TABLES
-- ============================================

-- Tenants (Multi-tenant support)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  cin TEXT,
  tan TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  mobile TEXT,
  email TEXT,
  website TEXT,
  logo TEXT,
  settings TEXT, -- JSON
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  roles TEXT, -- JSON array of role IDs
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, username),
  UNIQUE(tenant_id, email)
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  permissions TEXT, -- JSON array of permissions
  is_system INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, name)
);

-- Audit Log (MCA Compliant - Immutable, Cryptographically Chained)
-- Per Companies Act 2013: Audit trail must be tamper-proof and non-editable
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sequence_number INTEGER NOT NULL, -- For ordering and gap detection
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  -- Cryptographic chaining for tamper detection
  previous_hash TEXT, -- Hash of previous audit record
  current_hash TEXT NOT NULL, -- SHA-256 hash for chain integrity
  -- Compliance metadata
  fiscal_year_id TEXT,
  module TEXT, -- finance, inventory, sales, etc.
  criticality TEXT DEFAULT 'normal' CHECK(criticality IN ('low', 'normal', 'high', 'critical')),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  UNIQUE(tenant_id, sequence_number)
);

-- Audit Chain Verification (for periodic integrity checks)
CREATE TABLE IF NOT EXISTS audit_chain_verifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  from_sequence INTEGER NOT NULL,
  to_sequence INTEGER NOT NULL,
  records_verified INTEGER NOT NULL,
  is_valid INTEGER NOT NULL,
  first_invalid_sequence INTEGER,
  verification_hash TEXT,
  verified_by TEXT
);

-- Auto Number Series
CREATE TABLE IF NOT EXISTS auto_number_series (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  series_type TEXT NOT NULL,
  prefix TEXT,
  suffix TEXT,
  current_number INTEGER DEFAULT 0,
  padding INTEGER DEFAULT 5,
  fiscal_year TEXT,
  UNIQUE(tenant_id, series_type, fiscal_year)
);

-- ============================================
-- FINANCIAL MANAGEMENT
-- ============================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  account_sub_type TEXT NOT NULL,
  parent_id TEXT REFERENCES accounts(id),
  description TEXT,
  currency TEXT DEFAULT 'INR',
  is_system INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  is_reconcilable INTEGER DEFAULT 0,
  opening_balance REAL DEFAULT 0,
  opening_balance_date TEXT,
  cost_center_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, code)
);

-- Cost Centers
CREATE TABLE IF NOT EXISTS cost_centers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES cost_centers(id),
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, code)
);

-- Fiscal Years
CREATE TABLE IF NOT EXISTS fiscal_years (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_closed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Fiscal Periods
CREATE TABLE IF NOT EXISTS fiscal_periods (
  id TEXT PRIMARY KEY,
  fiscal_year_id TEXT NOT NULL REFERENCES fiscal_years(id),
  name TEXT NOT NULL,
  period_number INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_closed INTEGER DEFAULT 0,
  is_adjustment INTEGER DEFAULT 0
);

-- Journal Entries (Double-Entry Core)
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  voucher_number TEXT NOT NULL,
  journal_type TEXT NOT NULL,
  date TEXT NOT NULL,
  reference TEXT,
  narration TEXT,
  source_document_type TEXT,
  source_document_id TEXT,
  source_document_number TEXT,
  total_debit REAL NOT NULL DEFAULT 0,
  total_credit REAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  exchange_rate REAL DEFAULT 1,
  is_posted INTEGER DEFAULT 0,
  is_reversed INTEGER DEFAULT 0,
  reversed_by TEXT,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, voucher_number)
);

-- Journal Entry Lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id),
  line_number INTEGER NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  description TEXT,
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  base_debit REAL DEFAULT 0,
  base_credit REAL DEFAULT 0,
  cost_center_id TEXT,
  party_type TEXT CHECK(party_type IN ('customer', 'vendor')),
  party_id TEXT,
  tax_code TEXT,
  reconciled INTEGER DEFAULT 0,
  reconciliation_id TEXT
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  branch TEXT,
  account_type TEXT DEFAULT 'current',
  currency TEXT DEFAULT 'INR',
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, account_number)
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Item Categories
CREATE TABLE IF NOT EXISTS item_categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES item_categories(id),
  default_valuation_method TEXT DEFAULT 'weighted_average',
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, code)
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, name)
);

-- Units of Measure
CREATE TABLE IF NOT EXISTS units_of_measure (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'unit',
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, code)
);

-- Items (Products/Services)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'goods' CHECK(item_type IN ('goods', 'service', 'consumable', 'asset')),
  category_id TEXT REFERENCES item_categories(id),
  brand_id TEXT REFERENCES brands(id),
  uom_id TEXT NOT NULL REFERENCES units_of_measure(id),
  secondary_uom_id TEXT REFERENCES units_of_measure(id),
  conversion_factor REAL,
  is_stock_item INTEGER DEFAULT 1,
  valuation_method TEXT DEFAULT 'weighted_average',
  standard_cost REAL,
  min_stock_level REAL,
  max_stock_level REAL,
  reorder_level REAL,
  reorder_qty REAL,
  lead_time_days INTEGER,
  has_batch INTEGER DEFAULT 0,
  has_serial INTEGER DEFAULT 0,
  has_expiry INTEGER DEFAULT 0,
  shelf_life_days INTEGER,
  hsn_code TEXT,
  sac_code TEXT,
  gst_rate REAL DEFAULT 0,
  cess_rate REAL DEFAULT 0,
  purchase_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  mrp REAL,
  weight REAL,
  weight_uom TEXT,
  length REAL,
  width REAL,
  height REAL,
  dimension_uom TEXT,
  image_url TEXT,
  attachments TEXT, -- JSON
  attributes TEXT, -- JSON
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, code)
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pincode TEXT,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, code)
);

-- Warehouse Locations (Bins/Racks)
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id TEXT PRIMARY KEY,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  location_type TEXT DEFAULT 'internal',
  parent_id TEXT REFERENCES warehouse_locations(id),
  is_active INTEGER DEFAULT 1,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  bin TEXT,
  UNIQUE(warehouse_id, code)
);

-- Batches
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  batch_number TEXT NOT NULL,
  manufacturing_date TEXT,
  expiry_date TEXT,
  supplier_batch TEXT,
  status TEXT DEFAULT 'active',
  attributes TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, item_id, batch_number)
);

-- Serial Numbers
CREATE TABLE IF NOT EXISTS serial_numbers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  serial_number TEXT NOT NULL,
  batch_id TEXT REFERENCES batches(id),
  status TEXT DEFAULT 'available',
  warranty_start TEXT,
  warranty_end TEXT,
  current_location_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, item_id, serial_number)
);

-- Stock Moves (Double-Entry Inventory)
CREATE TABLE IF NOT EXISTS stock_moves (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  move_number TEXT NOT NULL,
  move_type TEXT NOT NULL,
  date TEXT NOT NULL,
  source_location_id TEXT NOT NULL REFERENCES warehouse_locations(id),
  destination_location_id TEXT NOT NULL REFERENCES warehouse_locations(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  uom_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  batch_id TEXT REFERENCES batches(id),
  serial_numbers TEXT, -- JSON array
  unit_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  reference_type TEXT,
  reference_id TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'draft',
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, move_number)
);

-- Stock Valuation (Computed/Cached)
CREATE TABLE IF NOT EXISTS stock_valuations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  location_id TEXT NOT NULL REFERENCES warehouse_locations(id),
  batch_id TEXT REFERENCES batches(id),
  quantity_on_hand REAL DEFAULT 0,
  quantity_reserved REAL DEFAULT 0,
  quantity_available REAL DEFAULT 0,
  unit_cost REAL DEFAULT 0,
  total_value REAL DEFAULT 0,
  valuation_date TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, item_id, location_id, batch_id)
);

-- ============================================
-- PURCHASE MANAGEMENT
-- ============================================

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  trade_name TEXT,
  vendor_type TEXT DEFAULT 'regular',
  gstin TEXT,
  gst_registration_type TEXT DEFAULT 'regular',
  pan TEXT,
  billing_address TEXT, -- JSON
  shipping_addresses TEXT, -- JSON array
  contact_person TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  website TEXT,
  payment_terms_days INTEGER DEFAULT 30,
  credit_limit REAL,
  currency TEXT DEFAULT 'INR',
  price_list_id TEXT,
  bank_accounts TEXT, -- JSON array
  payable_account_id TEXT REFERENCES accounts(id),
  expense_account_id TEXT REFERENCES accounts(id),
  advance_account_id TEXT REFERENCES accounts(id),
  rating REAL,
  tds_applicable INTEGER DEFAULT 0,
  tds_section TEXT,
  tds_rate REAL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, code)
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  order_number TEXT NOT NULL,
  date TEXT NOT NULL,
  expected_date TEXT,
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  vendor_name TEXT NOT NULL,
  vendor_gstin TEXT,
  billing_address TEXT, -- JSON
  shipping_address TEXT, -- JSON
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  tcs_amount REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  exchange_rate REAL DEFAULT 1,
  payment_terms TEXT,
  delivery_terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  status TEXT DEFAULT 'draft',
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, order_number)
);

-- Purchase Order Lines
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES purchase_orders(id),
  line_number INTEGER NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  hsn_code TEXT,
  quantity REAL NOT NULL,
  uom_id TEXT NOT NULL,
  unit_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  gst_rate REAL DEFAULT 0,
  cgst_rate REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_rate REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_rate REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  received_qty REAL DEFAULT 0,
  pending_qty REAL DEFAULT 0,
  billed_qty REAL DEFAULT 0,
  warehouse_id TEXT,
  expected_date TEXT,
  status TEXT DEFAULT 'pending'
);

-- Goods Receipt Notes
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  grn_number TEXT NOT NULL,
  date TEXT NOT NULL,
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  vendor_name TEXT NOT NULL,
  purchase_order_id TEXT REFERENCES purchase_orders(id),
  purchase_order_number TEXT,
  vendor_invoice_number TEXT,
  vendor_invoice_date TEXT,
  delivery_note_number TEXT,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  status TEXT DEFAULT 'draft',
  remarks TEXT,
  received_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, grn_number)
);

-- GRN Lines
CREATE TABLE IF NOT EXISTS grn_lines (
  id TEXT PRIMARY KEY,
  grn_id TEXT NOT NULL REFERENCES goods_receipt_notes(id),
  line_number INTEGER NOT NULL,
  po_line_id TEXT,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  ordered_qty REAL DEFAULT 0,
  received_qty REAL NOT NULL,
  accepted_qty REAL DEFAULT 0,
  rejected_qty REAL DEFAULT 0,
  uom_id TEXT NOT NULL,
  batch_number TEXT,
  serial_numbers TEXT, -- JSON
  manufacturing_date TEXT,
  expiry_date TEXT,
  unit_cost REAL DEFAULT 0,
  landing_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  location_id TEXT REFERENCES warehouse_locations(id),
  qc_status TEXT,
  qc_remarks TEXT,
  qc_by TEXT,
  qc_at TEXT,
  stock_move_id TEXT REFERENCES stock_moves(id)
);

-- Purchase Invoices
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  invoice_number TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  vendor_name TEXT NOT NULL,
  vendor_gstin TEXT,
  vendor_address TEXT, -- JSON
  purchase_order_id TEXT REFERENCES purchase_orders(id),
  grn_id TEXT REFERENCES goods_receipt_notes(id),
  vendor_invoice_number TEXT NOT NULL,
  vendor_invoice_date TEXT NOT NULL,
  supply_type TEXT DEFAULT 'b2b',
  reverse_charge INTEGER DEFAULT 0,
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  tds_applicable INTEGER DEFAULT 0,
  tds_section TEXT,
  tds_rate REAL,
  tds_amount REAL DEFAULT 0,
  tcs_applicable INTEGER DEFAULT 0,
  tcs_rate REAL,
  tcs_amount REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  exchange_rate REAL DEFAULT 1,
  base_total_amount REAL DEFAULT 0,
  payment_terms_days INTEGER DEFAULT 30,
  paid_amount REAL DEFAULT 0,
  balance_amount REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',
  itc_eligible INTEGER DEFAULT 1,
  itc_claimed INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  three_way_match_status TEXT,
  journal_entry_id TEXT REFERENCES journal_entries(id),
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, invoice_number)
);

-- Purchase Invoice Lines
CREATE TABLE IF NOT EXISTS purchase_invoice_lines (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES purchase_invoices(id),
  line_number INTEGER NOT NULL,
  grn_line_id TEXT,
  po_line_id TEXT,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  hsn_code TEXT,
  quantity REAL NOT NULL,
  uom_id TEXT NOT NULL,
  unit_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  gst_rate REAL DEFAULT 0,
  cgst_rate REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_rate REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_rate REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  expense_account_id TEXT REFERENCES accounts(id),
  cost_center_id TEXT,
  itc_eligible INTEGER DEFAULT 1,
  itc_category TEXT
);

-- Vendor Payments
CREATE TABLE IF NOT EXISTS vendor_payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  payment_number TEXT NOT NULL,
  date TEXT NOT NULL,
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  vendor_name TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  bank_account_id TEXT REFERENCES bank_accounts(id),
  cheque_number TEXT,
  cheque_date TEXT,
  transaction_reference TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  exchange_rate REAL DEFAULT 1,
  base_amount REAL NOT NULL,
  tds_amount REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  allocations TEXT, -- JSON array
  unallocated_amount REAL DEFAULT 0,
  narration TEXT,
  status TEXT DEFAULT 'draft',
  journal_entry_id TEXT REFERENCES journal_entries(id),
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, payment_number)
);

-- ============================================
-- SALES MANAGEMENT
-- ============================================

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  trade_name TEXT,
  customer_type TEXT DEFAULT 'retail',
  customer_group_id TEXT,
  gstin TEXT,
  gst_registration_type TEXT DEFAULT 'regular',
  pan TEXT,
  billing_address TEXT, -- JSON
  shipping_addresses TEXT, -- JSON array
  contact_person TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  website TEXT,
  payment_terms_days INTEGER DEFAULT 30,
  credit_limit REAL DEFAULT 0,
  credit_days INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'INR',
  price_list_id TEXT,
  receivable_account_id TEXT REFERENCES accounts(id),
  revenue_account_id TEXT REFERENCES accounts(id),
  advance_account_id TEXT REFERENCES accounts(id),
  tcs_applicable INTEGER DEFAULT 0,
  tcs_category TEXT,
  sales_person_id TEXT,
  territory_id TEXT,
  loyalty_points REAL DEFAULT 0,
  loyalty_tier TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, code)
);

-- Sales Orders
CREATE TABLE IF NOT EXISTS sales_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  order_number TEXT NOT NULL,
  date TEXT NOT NULL,
  delivery_date TEXT,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_gstin TEXT,
  quotation_id TEXT,
  customer_po_number TEXT,
  customer_po_date TEXT,
  billing_address TEXT, -- JSON
  shipping_address TEXT, -- JSON
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  tcs_amount REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  exchange_rate REAL DEFAULT 1,
  credit_limit_check_passed INTEGER DEFAULT 1,
  credit_override_by TEXT,
  payment_terms TEXT,
  delivery_terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'normal',
  warehouse_id TEXT,
  sales_person_id TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, order_number)
);

-- Sales Order Lines
CREATE TABLE IF NOT EXISTS sales_order_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES sales_orders(id),
  line_number INTEGER NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  hsn_code TEXT,
  quantity REAL NOT NULL,
  uom_id TEXT NOT NULL,
  unit_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  gst_rate REAL DEFAULT 0,
  cgst_rate REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_rate REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_rate REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  delivered_qty REAL DEFAULT 0,
  pending_qty REAL DEFAULT 0,
  invoiced_qty REAL DEFAULT 0,
  warehouse_id TEXT,
  promised_date TEXT,
  status TEXT DEFAULT 'pending'
);

-- Delivery Notes
CREATE TABLE IF NOT EXISTS delivery_notes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  delivery_number TEXT NOT NULL,
  date TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  sales_order_id TEXT REFERENCES sales_orders(id),
  sales_order_number TEXT,
  shipping_address TEXT, -- JSON
  transporter_id TEXT,
  transporter_name TEXT,
  vehicle_number TEXT,
  lr_number TEXT,
  lr_date TEXT,
  eway_bill_number TEXT,
  eway_bill_date TEXT,
  eway_bill_valid_until TEXT,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  status TEXT DEFAULT 'draft',
  delivered_at TEXT,
  received_by TEXT,
  remarks TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, delivery_number)
);

-- Delivery Note Lines
CREATE TABLE IF NOT EXISTS delivery_note_lines (
  id TEXT PRIMARY KEY,
  delivery_id TEXT NOT NULL REFERENCES delivery_notes(id),
  line_number INTEGER NOT NULL,
  so_line_id TEXT,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  ordered_qty REAL DEFAULT 0,
  delivered_qty REAL NOT NULL,
  uom_id TEXT NOT NULL,
  batch_number TEXT,
  serial_numbers TEXT, -- JSON
  location_id TEXT,
  stock_move_id TEXT REFERENCES stock_moves(id)
);

-- Sales Invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  invoice_number TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_gstin TEXT,
  customer_address TEXT, -- JSON
  shipping_address TEXT, -- JSON
  sales_order_id TEXT REFERENCES sales_orders(id),
  delivery_note_id TEXT REFERENCES delivery_notes(id),
  customer_po_number TEXT,
  supply_type TEXT DEFAULT 'b2b',
  place_of_supply TEXT,
  reverse_charge INTEGER DEFAULT 0,
  irn TEXT,
  irn_date TEXT,
  ack_number TEXT,
  ack_date TEXT,
  signed_invoice TEXT,
  signed_qr_code TEXT,
  e_invoice_status TEXT DEFAULT 'pending',
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  tcs_applicable INTEGER DEFAULT 0,
  tcs_rate REAL,
  tcs_amount REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  total_in_words TEXT,
  currency TEXT DEFAULT 'INR',
  exchange_rate REAL DEFAULT 1,
  base_total_amount REAL DEFAULT 0,
  payment_terms_days INTEGER DEFAULT 30,
  received_amount REAL DEFAULT 0,
  balance_amount REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',
  bank_details TEXT, -- JSON
  notes TEXT,
  terms_and_conditions TEXT,
  status TEXT DEFAULT 'draft',
  journal_entry_id TEXT REFERENCES journal_entries(id),
  sales_person_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, invoice_number)
);

-- Sales Invoice Lines
CREATE TABLE IF NOT EXISTS sales_invoice_lines (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES sales_invoices(id),
  line_number INTEGER NOT NULL,
  dn_line_id TEXT,
  so_line_id TEXT,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  hsn_code TEXT,
  quantity REAL NOT NULL,
  uom_id TEXT NOT NULL,
  unit_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  gst_rate REAL DEFAULT 0,
  cgst_rate REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_rate REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_rate REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  revenue_account_id TEXT REFERENCES accounts(id),
  cost_center_id TEXT
);

-- Customer Receipts
CREATE TABLE IF NOT EXISTS customer_receipts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  receipt_number TEXT NOT NULL,
  date TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  bank_account_id TEXT REFERENCES bank_accounts(id),
  cheque_number TEXT,
  cheque_date TEXT,
  transaction_reference TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  exchange_rate REAL DEFAULT 1,
  base_amount REAL NOT NULL,
  allocations TEXT, -- JSON array
  unallocated_amount REAL DEFAULT 0,
  tds_deducted REAL DEFAULT 0,
  tds_certificate_number TEXT,
  narration TEXT,
  status TEXT DEFAULT 'draft',
  journal_entry_id TEXT REFERENCES journal_entries(id),
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, receipt_number)
);

-- ============================================
-- MANUFACTURING
-- ============================================

-- Work Centers
CREATE TABLE IF NOT EXISTS work_centers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  work_center_type TEXT DEFAULT 'machine',
  warehouse_id TEXT REFERENCES warehouses(id),
  department TEXT,
  capacity REAL DEFAULT 0,
  capacity_uom TEXT DEFAULT 'units_per_hour',
  available_hours_per_day REAL DEFAULT 8,
  efficiency_percent REAL DEFAULT 100,
  hourly_rate REAL DEFAULT 0,
  setup_rate REAL,
  overhead_rate REAL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, code)
);

-- Bills of Materials
CREATE TABLE IF NOT EXISTS bills_of_materials (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  bom_number TEXT NOT NULL,
  name TEXT NOT NULL,
  bom_type TEXT DEFAULT 'standard',
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  uom_id TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  version INTEGER DEFAULT 1,
  effective_from TEXT,
  effective_to TEXT,
  material_cost REAL DEFAULT 0,
  operation_cost REAL DEFAULT 0,
  overhead_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  scrap_percent REAL DEFAULT 0,
  remarks TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, bom_number)
);

-- BOM Components
CREATE TABLE IF NOT EXISTS bom_components (
  id TEXT PRIMARY KEY,
  bom_id TEXT NOT NULL REFERENCES bills_of_materials(id),
  line_number INTEGER NOT NULL,
  component_item_id TEXT NOT NULL REFERENCES items(id),
  component_item_code TEXT NOT NULL,
  component_item_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  uom_id TEXT NOT NULL,
  qty_per_unit REAL NOT NULL,
  scrap_percent REAL DEFAULT 0,
  is_substitute INTEGER DEFAULT 0,
  substitute_for TEXT,
  warehouse_id TEXT REFERENCES warehouses(id),
  unit_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  has_sub_bom INTEGER DEFAULT 0,
  sub_bom_id TEXT REFERENCES bills_of_materials(id),
  remarks TEXT
);

-- BOM Operations
CREATE TABLE IF NOT EXISTS bom_operations (
  id TEXT PRIMARY KEY,
  bom_id TEXT NOT NULL REFERENCES bills_of_materials(id),
  operation_number INTEGER NOT NULL,
  work_center_id TEXT NOT NULL REFERENCES work_centers(id),
  work_center_name TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  description TEXT,
  setup_time REAL DEFAULT 0,
  run_time REAL DEFAULT 0,
  batch_size REAL,
  is_subcontracted INTEGER DEFAULT 0,
  subcontractor_id TEXT REFERENCES vendors(id),
  operation_cost REAL DEFAULT 0,
  qc_required INTEGER DEFAULT 0,
  qc_parameters TEXT -- JSON
);

-- Production Orders
CREATE TABLE IF NOT EXISTS production_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  order_number TEXT NOT NULL,
  source_type TEXT,
  source_id TEXT,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  bom_id TEXT NOT NULL REFERENCES bills_of_materials(id),
  bom_version INTEGER NOT NULL,
  planned_qty REAL NOT NULL,
  completed_qty REAL DEFAULT 0,
  scrapped_qty REAL DEFAULT 0,
  uom_id TEXT NOT NULL,
  planned_start_date TEXT NOT NULL,
  planned_end_date TEXT NOT NULL,
  actual_start_date TEXT,
  actual_end_date TEXT,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  wip_location_id TEXT REFERENCES warehouse_locations(id),
  fg_location_id TEXT REFERENCES warehouse_locations(id),
  planned_material_cost REAL DEFAULT 0,
  planned_operation_cost REAL DEFAULT 0,
  planned_overhead_cost REAL DEFAULT 0,
  planned_total_cost REAL DEFAULT 0,
  actual_material_cost REAL DEFAULT 0,
  actual_operation_cost REAL DEFAULT 0,
  actual_overhead_cost REAL DEFAULT 0,
  actual_total_cost REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'draft',
  qc_status TEXT,
  remarks TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, order_number)
);

-- Production Order Components
CREATE TABLE IF NOT EXISTS production_order_components (
  id TEXT PRIMARY KEY,
  production_order_id TEXT NOT NULL REFERENCES production_orders(id),
  line_number INTEGER NOT NULL,
  bom_component_id TEXT,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  required_qty REAL NOT NULL,
  issued_qty REAL DEFAULT 0,
  consumed_qty REAL DEFAULT 0,
  returned_qty REAL DEFAULT 0,
  uom_id TEXT NOT NULL,
  warehouse_id TEXT REFERENCES warehouses(id),
  batch_id TEXT REFERENCES batches(id),
  serial_numbers TEXT, -- JSON
  unit_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  status TEXT DEFAULT 'pending'
);

-- Production Order Operations
CREATE TABLE IF NOT EXISTS production_order_operations (
  id TEXT PRIMARY KEY,
  production_order_id TEXT NOT NULL REFERENCES production_orders(id),
  operation_number INTEGER NOT NULL,
  bom_operation_id TEXT,
  work_center_id TEXT NOT NULL REFERENCES work_centers(id),
  work_center_name TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  planned_setup_time REAL DEFAULT 0,
  planned_run_time REAL DEFAULT 0,
  actual_setup_time REAL DEFAULT 0,
  actual_run_time REAL DEFAULT 0,
  planned_qty REAL NOT NULL,
  completed_qty REAL DEFAULT 0,
  rejected_qty REAL DEFAULT 0,
  operators TEXT, -- JSON array
  planned_cost REAL DEFAULT 0,
  actual_cost REAL DEFAULT 0,
  is_subcontracted INTEGER DEFAULT 0,
  subcontractor_id TEXT REFERENCES vendors(id),
  job_work_challan_id TEXT,
  planned_start TEXT NOT NULL,
  planned_end TEXT NOT NULL,
  actual_start TEXT,
  actual_end TEXT,
  qc_required INTEGER DEFAULT 0,
  qc_status TEXT,
  qc_remarks TEXT,
  status TEXT DEFAULT 'pending'
);

-- ============================================
-- HRM & PAYROLL
-- ============================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES departments(id),
  head_id TEXT,
  cost_center_id TEXT,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, code)
);

-- Designations
CREATE TABLE IF NOT EXISTS designations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  level INTEGER,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, code)
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  employee_code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT,
  display_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  gender TEXT NOT NULL,
  blood_group TEXT,
  marital_status TEXT DEFAULT 'single',
  nationality TEXT DEFAULT 'Indian',
  personal_email TEXT,
  work_email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  alternate_mobile TEXT,
  current_address TEXT, -- JSON
  permanent_address TEXT, -- JSON
  pan TEXT NOT NULL,
  aadhaar TEXT,
  passport_number TEXT,
  passport_expiry TEXT,
  bank_account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  bank_branch TEXT,
  employment_type TEXT DEFAULT 'permanent',
  date_of_joining TEXT NOT NULL,
  probation_end_date TEXT,
  confirmation_date TEXT,
  date_of_exit TEXT,
  exit_reason TEXT,
  department_id TEXT NOT NULL REFERENCES departments(id),
  designation_id TEXT NOT NULL REFERENCES designations(id),
  reporting_to TEXT REFERENCES employees(id),
  location_id TEXT,
  cost_center_id TEXT,
  pf_number TEXT,
  uan TEXT,
  esi_number TEXT,
  is_pf_applicable INTEGER DEFAULT 1,
  is_esi_applicable INTEGER DEFAULT 0,
  pf_contribution_type TEXT DEFAULT 'basic',
  tax_regime TEXT DEFAULT 'new',
  leave_policy_id TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'active',
  attributes TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, employee_code)
);

-- Salary Structures
CREATE TABLE IF NOT EXISTS salary_structures (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  employment_types TEXT, -- JSON array
  department_ids TEXT, -- JSON array
  is_ctc_based INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  effective_from TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, name)
);

-- Salary Components
CREATE TABLE IF NOT EXISTS salary_components (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  component_type TEXT NOT NULL CHECK(component_type IN ('earning', 'deduction')),
  calculation_type TEXT NOT NULL,
  percent REAL,
  base_component TEXT,
  formula TEXT,
  default_amount REAL,
  min_amount REAL,
  max_amount REAL,
  is_statutory INTEGER DEFAULT 0,
  statutory_type TEXT,
  is_taxable INTEGER DEFAULT 1,
  tax_exemption_limit REAL,
  tax_exemption_type TEXT,
  is_prorated INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  show_in_payslip INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, code)
);

-- Employee Salaries
CREATE TABLE IF NOT EXISTS employee_salaries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  salary_structure_id TEXT NOT NULL REFERENCES salary_structures(id),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  ctc_annual REAL,
  ctc_monthly REAL,
  components TEXT, -- JSON array
  gross_monthly REAL NOT NULL,
  net_monthly REAL NOT NULL,
  is_current INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  date TEXT NOT NULL,
  punches TEXT, -- JSON array
  first_in TEXT,
  last_out TEXT,
  total_hours REAL DEFAULT 0,
  status TEXT DEFAULT 'present',
  leave_application_id TEXT,
  is_regularized INTEGER DEFAULT 0,
  regularization_reason TEXT,
  regularized_by TEXT,
  overtime_hours REAL DEFAULT 0,
  overtime_approved INTEGER DEFAULT 0,
  shift_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, employee_id, date)
);

-- Payroll Periods
CREATE TABLE IF NOT EXISTS payroll_periods (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  processed_at TEXT,
  processed_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Payslips
CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  payroll_run_id TEXT,
  payroll_period_id TEXT NOT NULL REFERENCES payroll_periods(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT,
  designation TEXT,
  total_days INTEGER NOT NULL,
  working_days INTEGER NOT NULL,
  days_present REAL DEFAULT 0,
  days_absent REAL DEFAULT 0,
  days_leave REAL DEFAULT 0,
  days_holiday REAL DEFAULT 0,
  lop_days REAL DEFAULT 0,
  earnings TEXT, -- JSON array
  total_earnings REAL DEFAULT 0,
  deductions TEXT, -- JSON array
  total_deductions REAL DEFAULT 0,
  pf_employee REAL DEFAULT 0,
  pf_employer REAL DEFAULT 0,
  esi_employee REAL DEFAULT 0,
  esi_employer REAL DEFAULT 0,
  professional_tax REAL DEFAULT 0,
  lwf_employee REAL DEFAULT 0,
  lwf_employer REAL DEFAULT 0,
  tds REAL DEFAULT 0,
  gross_salary REAL DEFAULT 0,
  net_salary REAL DEFAULT 0,
  arrears_amount REAL DEFAULT 0,
  arrears_details TEXT,
  reimbursements_amount REAL DEFAULT 0,
  payment_mode TEXT DEFAULT 'bank_transfer',
  bank_account TEXT,
  transaction_reference TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- GST & COMPLIANCE
-- ============================================

-- HSN/SAC Codes
CREATE TABLE IF NOT EXISTS hsn_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  chapter TEXT,
  gst_rate REAL NOT NULL,
  cess_rate REAL DEFAULT 0,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  is_service INTEGER DEFAULT 0
);

-- E-Invoices
CREATE TABLE IF NOT EXISTS e_invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  invoice_type TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  seller_gstin TEXT NOT NULL,
  seller_legal_name TEXT NOT NULL,
  seller_address TEXT, -- JSON
  buyer_gstin TEXT,
  buyer_legal_name TEXT NOT NULL,
  buyer_pos TEXT NOT NULL,
  buyer_address TEXT, -- JSON
  document_type TEXT NOT NULL,
  supply_type TEXT NOT NULL,
  reverse_charge INTEGER DEFAULT 0,
  total_assessable_value REAL NOT NULL,
  total_cgst REAL DEFAULT 0,
  total_sgst REAL DEFAULT 0,
  total_igst REAL DEFAULT 0,
  total_cess REAL DEFAULT 0,
  total_invoice_value REAL NOT NULL,
  items TEXT, -- JSON array
  irn TEXT,
  irn_date TEXT,
  ack_number TEXT,
  ack_date TEXT,
  signed_invoice TEXT,
  signed_qr_code TEXT,
  cancel_reason TEXT,
  cancel_remark TEXT,
  cancelled_at TEXT,
  error_code TEXT,
  error_message TEXT,
  status TEXT DEFAULT 'pending',
  request_payload TEXT,
  response_payload TEXT,
  generated_by TEXT,
  generated_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- E-Way Bills
CREATE TABLE IF NOT EXISTS eway_bills (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  document_date TEXT NOT NULL,
  supply_type TEXT NOT NULL,
  sub_supply_type TEXT NOT NULL,
  from_gstin TEXT NOT NULL,
  from_trade_name TEXT NOT NULL,
  from_address TEXT,
  from_place TEXT,
  from_pincode TEXT,
  from_state_code TEXT,
  to_gstin TEXT,
  to_trade_name TEXT NOT NULL,
  to_address TEXT,
  to_place TEXT,
  to_pincode TEXT,
  to_state_code TEXT,
  transporter_id TEXT,
  transporter_name TEXT,
  transport_mode TEXT DEFAULT 'road',
  transport_doc_number TEXT,
  transport_doc_date TEXT,
  vehicle_number TEXT,
  vehicle_type TEXT,
  distance_km REAL DEFAULT 0,
  total_value REAL NOT NULL,
  hsn_code TEXT,
  cgst_value REAL DEFAULT 0,
  sgst_value REAL DEFAULT 0,
  igst_value REAL DEFAULT 0,
  cess_value REAL DEFAULT 0,
  total_invoice_value REAL NOT NULL,
  items TEXT, -- JSON array
  eway_bill_number TEXT,
  eway_bill_date TEXT,
  valid_from TEXT,
  valid_until TEXT,
  extensions TEXT, -- JSON array
  vehicle_updates TEXT, -- JSON array
  cancel_reason TEXT,
  cancel_remark TEXT,
  cancelled_at TEXT,
  error_code TEXT,
  error_message TEXT,
  status TEXT DEFAULT 'pending',
  generated_by TEXT,
  generated_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- GSTR-2B RECONCILIATION (Handbook Requirement)
-- ============================================

-- GSTR-2B Vendor Filed Data (Downloaded from GSTN)
CREATE TABLE IF NOT EXISTS gstr2b_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  return_period TEXT NOT NULL, -- MMYYYY
  supplier_gstin TEXT NOT NULL,
  supplier_name TEXT,
  invoice_number TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  invoice_type TEXT NOT NULL, -- B2B, CDNR, etc.
  place_of_supply TEXT,
  reverse_charge INTEGER DEFAULT 0,
  taxable_value REAL NOT NULL,
  igst REAL DEFAULT 0,
  cgst REAL DEFAULT 0,
  sgst REAL DEFAULT 0,
  cess REAL DEFAULT 0,
  itc_availability TEXT DEFAULT 'Y', -- Y, N, T (Temp)
  reason TEXT,
  -- Reconciliation
  matched_invoice_id TEXT REFERENCES purchase_invoices(id),
  reconciliation_status TEXT DEFAULT 'pending', -- pending, matched, mismatch, missing_in_books
  mismatch_type TEXT, -- value, gstin, date, missing
  mismatch_details TEXT, -- JSON
  reconciled_at TEXT,
  reconciled_by TEXT,
  file_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- GSTR-2B Reconciliation Summary
CREATE TABLE IF NOT EXISTS gstr2b_reconciliation_summary (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  return_period TEXT NOT NULL,
  total_gstr2b_records INTEGER DEFAULT 0,
  total_gstr2b_value REAL DEFAULT 0,
  total_gstr2b_itc REAL DEFAULT 0,
  total_books_records INTEGER DEFAULT 0,
  total_books_value REAL DEFAULT 0,
  total_books_itc REAL DEFAULT 0,
  matched_records INTEGER DEFAULT 0,
  matched_value REAL DEFAULT 0,
  mismatched_records INTEGER DEFAULT 0,
  mismatched_value REAL DEFAULT 0,
  missing_in_books INTEGER DEFAULT 0,
  missing_in_books_value REAL DEFAULT 0,
  missing_in_gstr2b INTEGER DEFAULT 0,
  missing_in_gstr2b_value REAL DEFAULT 0,
  itc_difference REAL DEFAULT 0,
  reconciliation_status TEXT DEFAULT 'pending',
  reconciled_at TEXT,
  reconciled_by TEXT,
  UNIQUE(tenant_id, return_period)
);

-- ============================================
-- TDS MANAGEMENT (Handbook Requirement)
-- ============================================

-- TDS Sections & Rates
CREATE TABLE IF NOT EXISTS tds_sections (
  id TEXT PRIMARY KEY,
  section_code TEXT NOT NULL UNIQUE, -- 194C, 194J, etc.
  description TEXT NOT NULL,
  payment_nature TEXT NOT NULL,
  individual_rate REAL NOT NULL,
  company_rate REAL NOT NULL,
  threshold_single REAL DEFAULT 0,
  threshold_annual REAL DEFAULT 0,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  is_active INTEGER DEFAULT 1
);

-- TDS Deductee Categories
CREATE TABLE IF NOT EXISTS tds_deductee_categories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  rate_factor REAL DEFAULT 1.0 -- For higher/lower rates
);

-- Party TDS Configuration
CREATE TABLE IF NOT EXISTS party_tds_config (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  party_type TEXT NOT NULL, -- vendor, customer
  party_id TEXT NOT NULL,
  pan TEXT NOT NULL,
  deductee_category_id TEXT REFERENCES tds_deductee_categories(id),
  lower_deduction_cert_no TEXT,
  lower_deduction_rate REAL,
  lower_deduction_from TEXT,
  lower_deduction_to TEXT,
  no_deduction_cert_no TEXT,
  no_deduction_from TEXT,
  no_deduction_to TEXT,
  default_section_id TEXT REFERENCES tds_sections(id),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- TDS Transactions
CREATE TABLE IF NOT EXISTS tds_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  transaction_type TEXT NOT NULL, -- deduction, payment, reversal
  reference_type TEXT NOT NULL, -- purchase_invoice, expense
  reference_id TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  transaction_date TEXT NOT NULL,
  party_type TEXT NOT NULL,
  party_id TEXT NOT NULL,
  party_name TEXT NOT NULL,
  pan TEXT NOT NULL,
  section_id TEXT NOT NULL REFERENCES tds_sections(id),
  section_code TEXT NOT NULL,
  base_amount REAL NOT NULL,
  tds_rate REAL NOT NULL,
  tds_amount REAL NOT NULL,
  surcharge REAL DEFAULT 0,
  education_cess REAL DEFAULT 0,
  total_tds REAL NOT NULL,
  is_lower_rate INTEGER DEFAULT 0,
  certificate_number TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, paid
  challan_id TEXT,
  fiscal_year TEXT NOT NULL,
  quarter TEXT NOT NULL, -- Q1, Q2, Q3, Q4
  created_at TEXT DEFAULT (datetime('now'))
);

-- TDS Challans
CREATE TABLE IF NOT EXISTS tds_challans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  challan_number TEXT NOT NULL,
  challan_date TEXT NOT NULL,
  section_code TEXT NOT NULL,
  assessment_year TEXT NOT NULL,
  quarter TEXT NOT NULL,
  deductee_count INTEGER NOT NULL,
  total_tds_amount REAL NOT NULL,
  surcharge_amount REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  interest_amount REAL DEFAULT 0,
  fee_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  bank_name TEXT NOT NULL,
  bsr_code TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, filed
  payment_date TEXT,
  acknowledgement_number TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, challan_number)
);

-- Form 26Q Data
CREATE TABLE IF NOT EXISTS tds_form_26q (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  assessment_year TEXT NOT NULL,
  quarter TEXT NOT NULL,
  form_type TEXT DEFAULT '26Q',
  tan TEXT NOT NULL,
  deductor_name TEXT NOT NULL,
  deductor_address TEXT,
  deductor_state TEXT,
  deductor_pincode TEXT,
  responsible_person_name TEXT NOT NULL,
  responsible_person_designation TEXT,
  total_deductees INTEGER NOT NULL,
  total_amount_paid REAL NOT NULL,
  total_tds_deducted REAL NOT NULL,
  total_tds_deposited REAL NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, generated, filed
  generated_at TEXT,
  filed_at TEXT,
  acknowledgement_number TEXT,
  deductee_details TEXT, -- JSON array of deductee records
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, assessment_year, quarter, form_type)
);

-- ============================================
-- WAREHOUSE MANAGEMENT SYSTEM (Handbook)
-- ============================================

-- Gate Pass (RGP & NRGP)
CREATE TABLE IF NOT EXISTS gate_passes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  pass_number TEXT NOT NULL,
  pass_type TEXT NOT NULL CHECK(pass_type IN ('RGP', 'NRGP')), -- Returnable / Non-Returnable
  pass_date TEXT NOT NULL,
  reference_type TEXT, -- sales_order, purchase_return, job_work, etc.
  reference_id TEXT,
  reference_number TEXT,
  party_type TEXT NOT NULL, -- vendor, customer, subcontractor, transporter
  party_id TEXT NOT NULL,
  party_name TEXT NOT NULL,
  party_gstin TEXT,
  party_address TEXT,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  vehicle_number TEXT,
  driver_name TEXT,
  driver_contact TEXT,
  purpose TEXT NOT NULL,
  expected_return_date TEXT, -- For RGP
  actual_return_date TEXT, -- For RGP
  eway_bill_number TEXT,
  eway_bill_id TEXT REFERENCES eway_bills(id),
  total_qty REAL NOT NULL,
  total_value REAL NOT NULL,
  security_guard_out TEXT,
  security_guard_in TEXT,
  out_time TEXT,
  in_time TEXT,
  remarks TEXT,
  status TEXT DEFAULT 'draft', -- draft, issued, partial_return, returned, closed
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, pass_number)
);

-- Gate Pass Lines
CREATE TABLE IF NOT EXISTS gate_pass_lines (
  id TEXT PRIMARY KEY,
  gate_pass_id TEXT NOT NULL REFERENCES gate_passes(id),
  line_number INTEGER NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  hsn_code TEXT,
  sent_qty REAL NOT NULL,
  returned_qty REAL DEFAULT 0,
  pending_qty REAL DEFAULT 0,
  uom_id TEXT NOT NULL,
  uom_name TEXT,
  batch_id TEXT REFERENCES batches(id),
  serial_numbers TEXT, -- JSON array
  unit_value REAL DEFAULT 0,
  total_value REAL DEFAULT 0,
  reason TEXT,
  status TEXT DEFAULT 'sent' -- sent, partial, returned
);

-- Bin/Rack Locations (Enhanced)
CREATE TABLE IF NOT EXISTS bin_locations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  zone_id TEXT,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  bin TEXT,
  location_code TEXT NOT NULL,
  location_type TEXT DEFAULT 'storage', -- storage, picking, receiving, staging, quality
  storage_class TEXT, -- ambient, cold, hazmat, etc.
  max_weight REAL,
  max_volume REAL,
  max_items INTEGER,
  is_pickable INTEGER DEFAULT 1,
  is_receivable INTEGER DEFAULT 1,
  pick_priority INTEGER DEFAULT 0, -- Higher = pick first
  current_items TEXT, -- JSON array of item_ids
  current_weight REAL DEFAULT 0,
  current_volume REAL DEFAULT 0,
  current_item_count INTEGER DEFAULT 0,
  utilization_percent REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, warehouse_id, location_code)
);

-- Picking Strategies
CREATE TABLE IF NOT EXISTS picking_strategies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  strategy_type TEXT NOT NULL, -- FIFO, FEFO, LIFO, PRIORITY
  description TEXT,
  rules TEXT, -- JSON
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, name)
);

-- Picking Waves
CREATE TABLE IF NOT EXISTS picking_waves (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  wave_number TEXT NOT NULL,
  wave_date TEXT NOT NULL,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  strategy_id TEXT REFERENCES picking_strategies(id),
  order_count INTEGER DEFAULT 0,
  total_lines INTEGER DEFAULT 0,
  total_qty REAL DEFAULT 0,
  picked_qty REAL DEFAULT 0,
  assigned_to TEXT, -- JSON array of picker IDs
  started_at TEXT,
  completed_at TEXT,
  status TEXT DEFAULT 'draft', -- draft, released, in_progress, completed
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, wave_number)
);

-- Pick List Headers
CREATE TABLE IF NOT EXISTS pick_lists (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  pick_list_number TEXT NOT NULL,
  wave_id TEXT REFERENCES picking_waves(id),
  reference_type TEXT NOT NULL, -- sales_order, delivery_note
  reference_id TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  picker_id TEXT,
  picker_name TEXT,
  strategy_id TEXT REFERENCES picking_strategies(id),
  total_lines INTEGER DEFAULT 0,
  picked_lines INTEGER DEFAULT 0,
  total_qty REAL DEFAULT 0,
  picked_qty REAL DEFAULT 0,
  started_at TEXT,
  completed_at TEXT,
  status TEXT DEFAULT 'pending', -- pending, assigned, in_progress, completed, partial
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, pick_list_number)
);

-- Pick List Lines
CREATE TABLE IF NOT EXISTS pick_list_lines (
  id TEXT PRIMARY KEY,
  pick_list_id TEXT NOT NULL REFERENCES pick_lists(id),
  line_number INTEGER NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  required_qty REAL NOT NULL,
  picked_qty REAL DEFAULT 0,
  uom_id TEXT NOT NULL,
  suggested_bin_id TEXT REFERENCES bin_locations(id),
  actual_bin_id TEXT REFERENCES bin_locations(id),
  batch_id TEXT REFERENCES batches(id),
  serial_numbers TEXT, -- JSON array
  expiry_date TEXT,
  pick_sequence INTEGER,
  picked_at TEXT,
  status TEXT DEFAULT 'pending' -- pending, picked, partial, skipped
);

-- ============================================
-- MRP - MATERIAL REQUIREMENTS PLANNING (Handbook)
-- ============================================

-- MRP Runs
CREATE TABLE IF NOT EXISTS mrp_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  run_number TEXT NOT NULL,
  run_date TEXT NOT NULL,
  planning_horizon_days INTEGER NOT NULL DEFAULT 30,
  include_safety_stock INTEGER DEFAULT 1,
  include_reorder_level INTEGER DEFAULT 1,
  consider_lead_time INTEGER DEFAULT 1,
  source_documents TEXT, -- JSON: sales_orders, production_orders, forecasts
  warehouses TEXT, -- JSON array of warehouse_ids
  item_filter TEXT, -- JSON: categories, items
  total_items_processed INTEGER DEFAULT 0,
  total_planned_orders INTEGER DEFAULT 0,
  total_planned_value REAL DEFAULT 0,
  run_by TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  status TEXT DEFAULT 'draft', -- draft, running, completed, cancelled
  UNIQUE(tenant_id, run_number)
);

-- MRP Demand (Gross Requirements)
CREATE TABLE IF NOT EXISTS mrp_demands (
  id TEXT PRIMARY KEY,
  mrp_run_id TEXT NOT NULL REFERENCES mrp_runs(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  demand_date TEXT NOT NULL,
  demand_type TEXT NOT NULL, -- sales_order, production_order, forecast, safety_stock
  source_document_type TEXT,
  source_document_id TEXT,
  source_document_number TEXT,
  warehouse_id TEXT REFERENCES warehouses(id),
  required_qty REAL NOT NULL,
  uom_id TEXT NOT NULL,
  priority INTEGER DEFAULT 0
);

-- MRP Supply (Scheduled Receipts)
CREATE TABLE IF NOT EXISTS mrp_supplies (
  id TEXT PRIMARY KEY,
  mrp_run_id TEXT NOT NULL REFERENCES mrp_runs(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  supply_date TEXT NOT NULL,
  supply_type TEXT NOT NULL, -- on_hand, purchase_order, production_order, planned
  source_document_type TEXT,
  source_document_id TEXT,
  source_document_number TEXT,
  warehouse_id TEXT REFERENCES warehouses(id),
  available_qty REAL NOT NULL,
  uom_id TEXT NOT NULL
);

-- MRP Planned Orders
CREATE TABLE IF NOT EXISTS mrp_planned_orders (
  id TEXT PRIMARY KEY,
  mrp_run_id TEXT NOT NULL REFERENCES mrp_runs(id),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  order_type TEXT NOT NULL, -- purchase, production
  warehouse_id TEXT REFERENCES warehouses(id),
  required_date TEXT NOT NULL,
  order_date TEXT NOT NULL, -- Backward scheduled
  quantity REAL NOT NULL,
  uom_id TEXT NOT NULL,
  unit_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  lead_time_days INTEGER,
  preferred_vendor_id TEXT REFERENCES vendors(id),
  preferred_vendor_name TEXT,
  bom_id TEXT REFERENCES bills_of_materials(id),
  exploded_components TEXT, -- JSON
  is_converted INTEGER DEFAULT 0,
  converted_to_type TEXT, -- purchase_order, production_order
  converted_to_id TEXT,
  converted_at TEXT,
  status TEXT DEFAULT 'planned' -- planned, firmed, converted, cancelled
);

-- ============================================
-- MES - SHOP FLOOR CONTROL (Handbook)
-- ============================================

-- Shift Masters
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL, -- HH:MM
  end_time TEXT NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  working_hours REAL NOT NULL,
  is_night_shift INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, code)
);

-- Shop Floor Operators
CREATE TABLE IF NOT EXISTS shop_floor_operators (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  operator_code TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  work_centers TEXT, -- JSON array of work_center_ids
  skills TEXT, -- JSON array of skill codes
  certification_expiry TEXT,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, operator_code)
);

-- Job Cards (Shop Floor Work Orders)
CREATE TABLE IF NOT EXISTS job_cards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  job_card_number TEXT NOT NULL,
  production_order_id TEXT NOT NULL REFERENCES production_orders(id),
  production_order_number TEXT NOT NULL,
  operation_id TEXT NOT NULL REFERENCES production_order_operations(id),
  work_center_id TEXT NOT NULL REFERENCES work_centers(id),
  work_center_name TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  shift_id TEXT REFERENCES shifts(id),
  job_date TEXT NOT NULL,
  planned_qty REAL NOT NULL,
  completed_qty REAL DEFAULT 0,
  rejected_qty REAL DEFAULT 0,
  rework_qty REAL DEFAULT 0,
  planned_start TEXT,
  planned_end TEXT,
  actual_start TEXT,
  actual_end TEXT,
  setup_start TEXT,
  setup_end TEXT,
  setup_time_minutes INTEGER DEFAULT 0,
  run_time_minutes INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  operators TEXT, -- JSON array
  primary_operator_id TEXT REFERENCES shop_floor_operators(id),
  remarks TEXT,
  qc_status TEXT,
  qc_remarks TEXT,
  status TEXT DEFAULT 'pending', -- pending, started, paused, completed, cancelled
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, job_card_number)
);

-- Time Tracking (Clock-in/Job-on)
CREATE TABLE IF NOT EXISTS time_tracking (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  job_card_id TEXT NOT NULL REFERENCES job_cards(id),
  operator_id TEXT NOT NULL REFERENCES shop_floor_operators(id),
  tracking_type TEXT NOT NULL, -- clock_in, clock_out, job_start, job_pause, job_resume, job_end
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT,
  remarks TEXT
);

-- Downtime Tracking
CREATE TABLE IF NOT EXISTS downtime_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  work_center_id TEXT NOT NULL REFERENCES work_centers(id),
  job_card_id TEXT REFERENCES job_cards(id),
  downtime_type TEXT NOT NULL, -- planned, unplanned
  downtime_category TEXT NOT NULL, -- breakdown, changeover, material_shortage, operator_absence, power_outage, maintenance
  downtime_code TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER,
  description TEXT,
  root_cause TEXT,
  corrective_action TEXT,
  reported_by TEXT NOT NULL,
  resolved_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- OEE (Overall Equipment Effectiveness) Daily Records
CREATE TABLE IF NOT EXISTS oee_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  work_center_id TEXT NOT NULL REFERENCES work_centers(id),
  record_date TEXT NOT NULL,
  shift_id TEXT REFERENCES shifts(id),
  -- Availability
  planned_production_time REAL NOT NULL, -- minutes
  actual_production_time REAL NOT NULL, -- minutes
  downtime_minutes REAL DEFAULT 0,
  availability_percent REAL NOT NULL,
  -- Performance
  ideal_cycle_time REAL NOT NULL, -- minutes per unit
  total_count INTEGER NOT NULL, -- Total pieces produced
  performance_percent REAL NOT NULL,
  -- Quality
  good_count INTEGER NOT NULL,
  reject_count INTEGER DEFAULT 0,
  rework_count INTEGER DEFAULT 0,
  quality_percent REAL NOT NULL,
  -- OEE
  oee_percent REAL NOT NULL,
  -- Details
  breakdown_minutes REAL DEFAULT 0,
  changeover_minutes REAL DEFAULT 0,
  speed_loss_units INTEGER DEFAULT 0,
  remarks TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, work_center_id, record_date, shift_id)
);

-- ============================================
-- JOB WORK / SUBCONTRACTING (GST Sec 143)
-- ============================================

-- Job Work Challans (DC for Job Work)
CREATE TABLE IF NOT EXISTS job_work_challans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  challan_number TEXT NOT NULL,
  challan_date TEXT NOT NULL,
  challan_type TEXT NOT NULL, -- outward, inward
  job_worker_id TEXT NOT NULL REFERENCES vendors(id),
  job_worker_gstin TEXT,
  job_worker_name TEXT NOT NULL,
  job_worker_address TEXT,
  production_order_id TEXT REFERENCES production_orders(id),
  operation_id TEXT REFERENCES production_order_operations(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  expected_return_date TEXT,
  actual_return_date TEXT,
  eway_bill_number TEXT,
  eway_bill_id TEXT REFERENCES eway_bills(id),
  vehicle_number TEXT,
  transporter_name TEXT,
  lr_number TEXT,
  lr_date TEXT,
  total_qty REAL NOT NULL,
  total_value REAL NOT NULL,
  -- GST Compliance
  itc_04_quarter TEXT, -- For ITC-04 filing
  itc_04_filed INTEGER DEFAULT 0,
  days_with_job_worker INTEGER DEFAULT 0, -- Track 1 year limit
  remarks TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, partial_received, received, cancelled
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, challan_number)
);

-- Job Work Challan Lines
CREATE TABLE IF NOT EXISTS job_work_challan_lines (
  id TEXT PRIMARY KEY,
  challan_id TEXT NOT NULL REFERENCES job_work_challans(id),
  line_number INTEGER NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  hsn_code TEXT,
  sent_qty REAL NOT NULL,
  received_qty REAL DEFAULT 0,
  rejected_qty REAL DEFAULT 0,
  shortage_qty REAL DEFAULT 0,
  uom_id TEXT NOT NULL,
  batch_id TEXT REFERENCES batches(id),
  serial_numbers TEXT, -- JSON
  unit_value REAL DEFAULT 0,
  total_value REAL DEFAULT 0,
  scrap_qty REAL DEFAULT 0,
  byproduct_qty REAL DEFAULT 0,
  status TEXT DEFAULT 'sent'
);

-- Job Work Reconciliation
CREATE TABLE IF NOT EXISTS job_work_reconciliation (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  reconciliation_date TEXT NOT NULL,
  job_worker_id TEXT NOT NULL REFERENCES vendors(id),
  job_worker_name TEXT NOT NULL,
  period_from TEXT NOT NULL,
  period_to TEXT NOT NULL,
  opening_balance_qty REAL DEFAULT 0,
  opening_balance_value REAL DEFAULT 0,
  sent_qty REAL DEFAULT 0,
  sent_value REAL DEFAULT 0,
  received_qty REAL DEFAULT 0,
  received_value REAL DEFAULT 0,
  rejected_qty REAL DEFAULT 0,
  rejected_value REAL DEFAULT 0,
  closing_balance_qty REAL DEFAULT 0,
  closing_balance_value REAL DEFAULT 0,
  discrepancy_qty REAL DEFAULT 0,
  discrepancy_value REAL DEFAULT 0,
  remarks TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ITC-04 (Job Work Return)
CREATE TABLE IF NOT EXISTS itc_04_returns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  financial_year TEXT NOT NULL,
  quarter TEXT NOT NULL, -- Q1, Q2, Q3, Q4
  gstin TEXT NOT NULL,
  -- Summary
  total_challans_outward INTEGER DEFAULT 0,
  total_challans_inward INTEGER DEFAULT 0,
  total_value_sent REAL DEFAULT 0,
  total_value_received REAL DEFAULT 0,
  goods_not_received_count INTEGER DEFAULT 0, -- Exceeding 1 year
  goods_not_received_value REAL DEFAULT 0,
  -- Filing
  status TEXT DEFAULT 'draft', -- draft, generated, filed
  generated_at TEXT,
  filed_at TEXT,
  arn TEXT, -- Application Reference Number
  acknowledgement TEXT,
  challan_details TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, financial_year, quarter)
);

-- ============================================
-- POS MODULE (Handbook)
-- ============================================

-- POS Terminals
CREATE TABLE IF NOT EXISTS pos_terminals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  terminal_code TEXT NOT NULL,
  terminal_name TEXT NOT NULL,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  location TEXT,
  ip_address TEXT,
  mac_address TEXT,
  -- Hardware config
  receipt_printer TEXT, -- JSON
  barcode_scanner TEXT, -- JSON
  weighing_scale TEXT, -- JSON
  pole_display TEXT, -- JSON
  cash_drawer TEXT, -- JSON
  card_terminal TEXT, -- JSON
  upi_terminal TEXT, -- JSON
  -- Settings
  default_customer_id TEXT REFERENCES customers(id),
  default_price_list_id TEXT,
  allow_credit_sale INTEGER DEFAULT 0,
  allow_discount INTEGER DEFAULT 1,
  max_discount_percent REAL DEFAULT 10,
  require_customer_for_credit INTEGER DEFAULT 1,
  auto_print_receipt INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  last_sync_at TEXT,
  UNIQUE(tenant_id, terminal_code)
);

-- POS Sessions
CREATE TABLE IF NOT EXISTS pos_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  terminal_id TEXT NOT NULL REFERENCES pos_terminals(id),
  session_number TEXT NOT NULL,
  opened_by TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  opening_cash REAL NOT NULL,
  closed_by TEXT,
  closed_at TEXT,
  closing_cash REAL,
  expected_cash REAL,
  cash_difference REAL,
  -- Counters
  total_transactions INTEGER DEFAULT 0,
  total_sales REAL DEFAULT 0,
  total_returns REAL DEFAULT 0,
  net_sales REAL DEFAULT 0,
  total_discounts REAL DEFAULT 0,
  -- Payment breakdown
  cash_sales REAL DEFAULT 0,
  card_sales REAL DEFAULT 0,
  upi_sales REAL DEFAULT 0,
  credit_sales REAL DEFAULT 0,
  other_sales REAL DEFAULT 0,
  -- Status
  status TEXT DEFAULT 'open', -- open, closing, closed
  remarks TEXT,
  UNIQUE(tenant_id, session_number)
);

-- POS Transactions
CREATE TABLE IF NOT EXISTS pos_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  transaction_number TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES pos_sessions(id),
  terminal_id TEXT NOT NULL REFERENCES pos_terminals(id),
  transaction_type TEXT NOT NULL, -- sale, return, exchange
  transaction_date TEXT NOT NULL,
  transaction_time TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id),
  customer_name TEXT,
  customer_mobile TEXT,
  customer_gstin TEXT,
  -- Amounts
  gross_amount REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  taxable_amount REAL NOT NULL,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  -- Payments
  payments TEXT, -- JSON array of payment methods and amounts
  change_amount REAL DEFAULT 0,
  -- Loyalty
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_points_redeemed INTEGER DEFAULT 0,
  loyalty_discount REAL DEFAULT 0,
  -- References
  sales_invoice_id TEXT REFERENCES sales_invoices(id),
  original_transaction_id TEXT REFERENCES pos_transactions(id), -- For returns
  -- Offline support
  is_offline INTEGER DEFAULT 0,
  offline_id TEXT, -- Local ID for offline transactions
  synced_at TEXT,
  -- Status
  operator_id TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  status TEXT DEFAULT 'completed', -- completed, voided, returned
  void_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, transaction_number)
);

-- POS Transaction Lines
CREATE TABLE IF NOT EXISTS pos_transaction_lines (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES pos_transactions(id),
  line_number INTEGER NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  barcode TEXT,
  hsn_code TEXT,
  quantity REAL NOT NULL,
  uom_id TEXT NOT NULL,
  mrp REAL NOT NULL,
  selling_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL NOT NULL,
  gst_rate REAL NOT NULL,
  cgst_rate REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_rate REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_rate REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  line_total REAL NOT NULL,
  batch_id TEXT REFERENCES batches(id),
  serial_number TEXT,
  is_weighing_item INTEGER DEFAULT 0
);

-- Loyalty Programs
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  points_per_amount REAL NOT NULL, -- Points earned per Rs spent
  redemption_rate REAL NOT NULL, -- Rs value per point redeemed
  min_points_redemption INTEGER DEFAULT 100,
  max_redemption_percent REAL DEFAULT 50, -- Max % of bill redeemable
  validity_days INTEGER, -- Points expiry
  tier_rules TEXT, -- JSON: tier definitions
  bonus_rules TEXT, -- JSON: bonus point rules
  is_active INTEGER DEFAULT 1,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, name)
);

-- Customer Loyalty
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  program_id TEXT NOT NULL REFERENCES loyalty_programs(id),
  membership_number TEXT NOT NULL,
  tier TEXT DEFAULT 'standard',
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  current_points INTEGER DEFAULT 0,
  points_expiring_soon INTEGER DEFAULT 0,
  points_expiry_date TEXT,
  lifetime_value REAL DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visit_date TEXT,
  joined_date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  UNIQUE(tenant_id, membership_number)
);

-- Loyalty Transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  customer_loyalty_id TEXT NOT NULL REFERENCES customer_loyalty(id),
  transaction_type TEXT NOT NULL, -- earn, redeem, expire, adjust, bonus
  pos_transaction_id TEXT REFERENCES pos_transactions(id),
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  amount_equivalent REAL,
  description TEXT,
  expiry_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- BANK RECONCILIATION (Handbook)
-- ============================================

-- Bank Statement Imports
CREATE TABLE IF NOT EXISTS bank_statement_imports (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  bank_account_id TEXT NOT NULL REFERENCES bank_accounts(id),
  import_date TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL, -- csv, ofx, xlsx, mt940
  statement_from TEXT NOT NULL,
  statement_to TEXT NOT NULL,
  opening_balance REAL NOT NULL,
  closing_balance REAL NOT NULL,
  total_entries INTEGER NOT NULL,
  total_debits REAL DEFAULT 0,
  total_credits REAL DEFAULT 0,
  imported_by TEXT NOT NULL,
  status TEXT DEFAULT 'imported', -- imported, processing, completed
  created_at TEXT DEFAULT (datetime('now'))
);

-- Bank Statement Entries
CREATE TABLE IF NOT EXISTS bank_statement_entries (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL REFERENCES bank_statement_imports(id),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  bank_account_id TEXT NOT NULL REFERENCES bank_accounts(id),
  transaction_date TEXT NOT NULL,
  value_date TEXT,
  reference_number TEXT,
  description TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- debit, credit
  amount REAL NOT NULL,
  balance REAL,
  cheque_number TEXT,
  party_name TEXT,
  utr_number TEXT,
  -- Auto-match fields
  match_confidence REAL DEFAULT 0, -- 0 to 1
  matched_type TEXT, -- customer_receipt, vendor_payment, journal_entry, expense
  matched_id TEXT,
  matched_at TEXT,
  matched_by TEXT,
  is_manually_matched INTEGER DEFAULT 0,
  -- Reconciliation
  reconciliation_status TEXT DEFAULT 'unmatched', -- unmatched, matched, reconciled, excluded
  reconciled_at TEXT,
  reconciled_by TEXT,
  exclude_reason TEXT
);

-- Auto-Match Rules
CREATE TABLE IF NOT EXISTS bank_match_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher = check first
  -- Conditions (all must match)
  amount_match TEXT DEFAULT 'exact', -- exact, range, any
  amount_tolerance REAL DEFAULT 0,
  description_contains TEXT, -- Comma-separated keywords
  description_regex TEXT,
  party_name_contains TEXT,
  reference_pattern TEXT,
  min_amount REAL,
  max_amount REAL,
  -- Actions
  match_to_type TEXT NOT NULL, -- customer, vendor, account, expense_category
  match_to_id TEXT,
  match_to_name TEXT,
  auto_reconcile INTEGER DEFAULT 0, -- Auto-reconcile if confidence > threshold
  confidence_boost REAL DEFAULT 0.2, -- Additional confidence for rule match
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, name)
);

-- Reconciliation Sessions
CREATE TABLE IF NOT EXISTS bank_reconciliation_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  bank_account_id TEXT NOT NULL REFERENCES bank_accounts(id),
  session_date TEXT NOT NULL,
  statement_import_id TEXT REFERENCES bank_statement_imports(id),
  statement_from TEXT NOT NULL,
  statement_to TEXT NOT NULL,
  -- Balances
  opening_balance_book REAL NOT NULL,
  opening_balance_bank REAL NOT NULL,
  closing_balance_book REAL NOT NULL,
  closing_balance_bank REAL NOT NULL,
  -- Reconciliation summary
  total_book_entries INTEGER DEFAULT 0,
  total_bank_entries INTEGER DEFAULT 0,
  matched_entries INTEGER DEFAULT 0,
  unmatched_book INTEGER DEFAULT 0,
  unmatched_bank INTEGER DEFAULT 0,
  -- Adjusted balance
  adjusted_book_balance REAL,
  adjusted_bank_balance REAL,
  difference REAL DEFAULT 0,
  is_reconciled INTEGER DEFAULT 0,
  -- Workflow
  reconciled_by TEXT,
  reconciled_at TEXT,
  approved_by TEXT,
  approved_at TEXT,
  status TEXT DEFAULT 'draft', -- draft, in_progress, pending_approval, reconciled
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CREDIT LIMIT CONTROL (Handbook)
-- ============================================

-- Credit Policy
CREATE TABLE IF NOT EXISTS credit_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  -- Limits
  default_credit_limit REAL DEFAULT 0,
  default_credit_days INTEGER DEFAULT 30,
  -- Blocking rules
  block_type TEXT DEFAULT 'soft', -- soft, hard
  block_on_overdue INTEGER DEFAULT 1,
  overdue_days_threshold INTEGER DEFAULT 0,
  block_on_credit_exceed INTEGER DEFAULT 1,
  credit_exceed_percent REAL DEFAULT 100, -- Block when exceeds X%
  -- Alerts
  alert_at_percent REAL DEFAULT 80, -- Alert when reaches X%
  alert_before_due_days INTEGER DEFAULT 7,
  -- Approval workflow
  require_approval_over REAL, -- Require approval for orders over this amount
  approval_levels TEXT, -- JSON: approval hierarchy
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  UNIQUE(tenant_id, name)
);

-- Customer Credit Limits (Extended from customers table)
CREATE TABLE IF NOT EXISTS customer_credit_config (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  credit_policy_id TEXT REFERENCES credit_policies(id),
  credit_limit REAL DEFAULT 0,
  credit_days INTEGER DEFAULT 30,
  -- Current status
  current_outstanding REAL DEFAULT 0,
  current_overdue REAL DEFAULT 0,
  oldest_overdue_date TEXT,
  oldest_overdue_days INTEGER DEFAULT 0,
  available_credit REAL DEFAULT 0,
  utilization_percent REAL DEFAULT 0,
  -- Blocking
  is_blocked INTEGER DEFAULT 0,
  block_reason TEXT,
  blocked_at TEXT,
  blocked_by TEXT,
  unblock_approval_id TEXT,
  -- Temporary limit
  temp_credit_limit REAL,
  temp_limit_from TEXT,
  temp_limit_to TEXT,
  temp_limit_approved_by TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, customer_id)
);

-- Credit Block Overrides (For approval workflow)
CREATE TABLE IF NOT EXISTS credit_block_overrides (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  reference_type TEXT NOT NULL, -- sales_order, sales_invoice
  reference_id TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  override_type TEXT NOT NULL, -- credit_limit, overdue, both
  requested_by TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  request_reason TEXT NOT NULL,
  customer_outstanding REAL NOT NULL,
  customer_overdue REAL NOT NULL,
  order_amount REAL NOT NULL,
  -- Approval
  approved_by TEXT,
  approved_at TEXT,
  approval_remarks TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, expired
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- INDEXES
-- ============================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_date ON journal_entries(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON journal_entries(source_document_type, source_document_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_party ON journal_entry_lines(party_type, party_id);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_stock_moves_tenant_date ON stock_moves(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_stock_moves_item ON stock_moves(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_reference ON stock_moves(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_valuations_item ON stock_valuations(item_id, warehouse_id);

-- Purchase indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_vendor ON purchase_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(tenant_id, date);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_irn ON sales_invoices(irn);

-- Manufacturing indexes
CREATE INDEX IF NOT EXISTS idx_production_orders_item ON production_orders(item_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);

-- HRM indexes
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(payroll_period_id);

-- GSTR-2B Reconciliation indexes
CREATE INDEX IF NOT EXISTS idx_gstr2b_tenant_period ON gstr2b_entries(tenant_id, return_period);
CREATE INDEX IF NOT EXISTS idx_gstr2b_supplier ON gstr2b_entries(supplier_gstin);
CREATE INDEX IF NOT EXISTS idx_gstr2b_status ON gstr2b_entries(reconciliation_status);

-- TDS indexes
CREATE INDEX IF NOT EXISTS idx_tds_transactions_party ON tds_transactions(party_type, party_id);
CREATE INDEX IF NOT EXISTS idx_tds_transactions_section ON tds_transactions(section_id);
CREATE INDEX IF NOT EXISTS idx_tds_transactions_quarter ON tds_transactions(fiscal_year, quarter);
CREATE INDEX IF NOT EXISTS idx_tds_challans_quarter ON tds_challans(tenant_id, assessment_year, quarter);

-- WMS indexes
CREATE INDEX IF NOT EXISTS idx_gate_passes_party ON gate_passes(party_type, party_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_status ON gate_passes(status);
CREATE INDEX IF NOT EXISTS idx_bin_locations_warehouse ON bin_locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_pick_lists_wave ON pick_lists(wave_id);
CREATE INDEX IF NOT EXISTS idx_pick_lists_reference ON pick_lists(reference_type, reference_id);

-- MRP indexes
CREATE INDEX IF NOT EXISTS idx_mrp_demands_item ON mrp_demands(item_id);
CREATE INDEX IF NOT EXISTS idx_mrp_demands_date ON mrp_demands(demand_date);
CREATE INDEX IF NOT EXISTS idx_mrp_planned_orders_status ON mrp_planned_orders(status);
CREATE INDEX IF NOT EXISTS idx_mrp_planned_orders_item ON mrp_planned_orders(item_id);

-- MES indexes
CREATE INDEX IF NOT EXISTS idx_job_cards_production ON job_cards(production_order_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_work_center ON job_cards(work_center_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_date ON job_cards(job_date);
CREATE INDEX IF NOT EXISTS idx_time_tracking_job ON time_tracking(job_card_id);
CREATE INDEX IF NOT EXISTS idx_downtime_work_center ON downtime_records(work_center_id);
CREATE INDEX IF NOT EXISTS idx_oee_work_center_date ON oee_records(work_center_id, record_date);

-- Job Work indexes
CREATE INDEX IF NOT EXISTS idx_job_work_challans_worker ON job_work_challans(job_worker_id);
CREATE INDEX IF NOT EXISTS idx_job_work_challans_status ON job_work_challans(status);
CREATE INDEX IF NOT EXISTS idx_job_work_reconciliation_worker ON job_work_reconciliation(job_worker_id);

-- POS indexes
CREATE INDEX IF NOT EXISTS idx_pos_sessions_terminal ON pos_sessions(terminal_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_session ON pos_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_customer ON pos_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_date ON pos_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_loyalty_id);

-- Bank Reconciliation indexes
CREATE INDEX IF NOT EXISTS idx_bank_statement_entries_account ON bank_statement_entries(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_statement_entries_date ON bank_statement_entries(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_statement_entries_status ON bank_statement_entries(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_bank_recon_sessions_account ON bank_reconciliation_sessions(bank_account_id);

-- Credit Control indexes
CREATE INDEX IF NOT EXISTS idx_customer_credit_blocked ON customer_credit_config(is_blocked);
CREATE INDEX IF NOT EXISTS idx_credit_overrides_customer ON credit_block_overrides(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_overrides_status ON credit_block_overrides(status);
`;

export default SCHEMA;

