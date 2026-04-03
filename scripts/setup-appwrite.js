/**
 * SA ERP - Appwrite Database Setup Script
 *
 * Run once to create the database + all collections in your Appwrite project.
 *
 * Usage:
 *   1) Copy .env.example → .env and fill in Appwrite credentials
 *   2) npm run setup:appwrite
 *
 * Requires: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY (server key)
 */

const sdk = require('node-appwrite');

// ----------- Config -----------
const ENDPOINT  = process.env.APPWRITE_ENDPOINT  || 'https://cloud.appwrite.io/v1';
const PROJECT   = process.env.APPWRITE_PROJECT_ID || '';
const API_KEY   = process.env.APPWRITE_API_KEY    || '';
const DB_ID     = process.env.APPWRITE_DATABASE_ID || 'sa_erp_db';

if (!PROJECT || !API_KEY) {
  console.error('❌ Set APPWRITE_PROJECT_ID and APPWRITE_API_KEY env vars first.');
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT)
  .setKey(API_KEY);

const databases = new sdk.Databases(client);

// ----------- Schema -----------
// Each collection: { id, name, attrs: [{ key, type, size?, required, default?, array? }] }
const COLLECTIONS = [
  {
    id: 'tenants', name: 'Tenants',
    attrs: [
      { key: 'code',       type: 'string', size: 20,  required: true  },
      { key: 'name',       type: 'string', size: 200, required: true  },
      { key: 'gstin',      type: 'string', size: 15,  required: false },
      { key: 'address',    type: 'string', size: 500, required: false },
      { key: 'is_active',  type: 'boolean',           required: false, default: true },
    ],
  },
  {
    id: 'customers', name: 'Customers',
    attrs: [
      { key: 'tenant_id', type: 'string', size: 36, required: true },
      { key: 'code',      type: 'string', size: 20, required: true },
      { key: 'name',      type: 'string', size: 200, required: true },
      { key: 'gstin',     type: 'string', size: 15, required: false },
      { key: 'contact_person', type: 'string', size: 100, required: false },
      { key: 'phone',     type: 'string', size: 20, required: false },
      { key: 'email',     type: 'string', size: 200, required: false },
      { key: 'address',   type: 'string', size: 500, required: false },
      { key: 'city',      type: 'string', size: 100, required: false },
      { key: 'state',     type: 'string', size: 100, required: false },
      { key: 'pincode',   type: 'string', size: 10, required: false },
      { key: 'credit_limit', type: 'float', required: false, default: 0 },
      { key: 'outstanding',  type: 'float', required: false, default: 0 },
      { key: 'total_orders', type: 'integer', required: false, default: 0 },
      { key: 'is_active', type: 'boolean', required: false, default: true },
    ],
  },
  {
    id: 'vendors', name: 'Vendors',
    attrs: [
      { key: 'tenant_id', type: 'string', size: 36, required: true },
      { key: 'code',      type: 'string', size: 20, required: true },
      { key: 'name',      type: 'string', size: 200, required: true },
      { key: 'gstin',     type: 'string', size: 15, required: false },
      { key: 'contact_person', type: 'string', size: 100, required: false },
      { key: 'phone',     type: 'string', size: 20, required: false },
      { key: 'email',     type: 'string', size: 200, required: false },
      { key: 'address',   type: 'string', size: 500, required: false },
      { key: 'city',      type: 'string', size: 100, required: false },
      { key: 'state',     type: 'string', size: 100, required: false },
      { key: 'pincode',   type: 'string', size: 10, required: false },
      { key: 'vendor_type', type: 'string', size: 30, required: false },
      { key: 'payment_terms', type: 'integer', required: false, default: 30 },
      { key: 'credit_limit', type: 'float', required: false, default: 0 },
      { key: 'outstanding',  type: 'float', required: false, default: 0 },
      { key: 'is_active', type: 'boolean', required: false, default: true },
    ],
  },
  {
    id: 'items', name: 'Items',
    attrs: [
      { key: 'tenant_id',   type: 'string', size: 36, required: true },
      { key: 'item_code',   type: 'string', size: 30, required: true },
      { key: 'item_name',   type: 'string', size: 200, required: true },
      { key: 'item_type',   type: 'string', size: 30, required: false },
      { key: 'hsn_code',    type: 'string', size: 10, required: false },
      { key: 'uom',         type: 'string', size: 10, required: false },
      { key: 'unit_price',  type: 'float', required: false, default: 0 },
      { key: 'gst_rate',    type: 'float', required: false, default: 18 },
      { key: 'reorder_level', type: 'integer', required: false, default: 0 },
      { key: 'current_stock', type: 'float', required: false, default: 0 },
      { key: 'is_active',   type: 'boolean', required: false, default: true },
    ],
  },
  {
    id: 'accounts', name: 'Chart of Accounts',
    attrs: [
      { key: 'tenant_id',    type: 'string', size: 36, required: true },
      { key: 'account_code', type: 'string', size: 20, required: true },
      { key: 'account_name', type: 'string', size: 200, required: true },
      { key: 'account_type', type: 'string', size: 20, required: true },
      { key: 'parent_account', type: 'string', size: 36, required: false },
      { key: 'is_system',   type: 'boolean', required: false, default: false },
      { key: 'balance',     type: 'float', required: false, default: 0 },
      { key: 'is_active',   type: 'boolean', required: false, default: true },
    ],
  },
  {
    id: 'sales_orders', name: 'Sales Orders',
    attrs: [
      { key: 'tenant_id',   type: 'string', size: 36, required: true },
      { key: 'order_number', type: 'string', size: 30, required: true },
      { key: 'customer_id', type: 'string', size: 36, required: true },
      { key: 'customer_name', type: 'string', size: 200, required: false },
      { key: 'order_date',  type: 'string', size: 10, required: true },
      { key: 'delivery_date', type: 'string', size: 10, required: false },
      { key: 'status',      type: 'string', size: 20, required: false, default: 'draft' },
      { key: 'payment_status', type: 'string', size: 20, required: false, default: 'pending' },
      { key: 'subtotal',    type: 'float', required: false, default: 0 },
      { key: 'gst_amount',  type: 'float', required: false, default: 0 },
      { key: 'total_amount', type: 'float', required: false, default: 0 },
      { key: 'notes',       type: 'string', size: 1000, required: false },
    ],
  },
  {
    id: 'sales_invoices', name: 'Sales Invoices',
    attrs: [
      { key: 'tenant_id',   type: 'string', size: 36, required: true },
      { key: 'invoice_number', type: 'string', size: 30, required: true },
      { key: 'customer_id', type: 'string', size: 36, required: true },
      { key: 'customer_name', type: 'string', size: 200, required: false },
      { key: 'invoice_date', type: 'string', size: 10, required: true },
      { key: 'due_date',    type: 'string', size: 10, required: false },
      { key: 'status',      type: 'string', size: 20, required: false, default: 'draft' },
      { key: 'subtotal',    type: 'float', required: false, default: 0 },
      { key: 'gst_amount',  type: 'float', required: false, default: 0 },
      { key: 'total_amount', type: 'float', required: false, default: 0 },
      { key: 'balance_due', type: 'float', required: false, default: 0 },
      { key: 'irn',         type: 'string', size: 100, required: false },
    ],
  },
  {
    id: 'purchase_orders', name: 'Purchase Orders',
    attrs: [
      { key: 'tenant_id',   type: 'string', size: 36, required: true },
      { key: 'po_number',   type: 'string', size: 30, required: true },
      { key: 'vendor_id',   type: 'string', size: 36, required: true },
      { key: 'vendor_name', type: 'string', size: 200, required: false },
      { key: 'order_date',  type: 'string', size: 10, required: true },
      { key: 'delivery_date', type: 'string', size: 10, required: false },
      { key: 'status',      type: 'string', size: 20, required: false, default: 'draft' },
      { key: 'subtotal',    type: 'float', required: false, default: 0 },
      { key: 'gst_amount',  type: 'float', required: false, default: 0 },
      { key: 'total_amount', type: 'float', required: false, default: 0 },
      { key: 'notes',       type: 'string', size: 1000, required: false },
    ],
  },
  {
    id: 'purchase_invoices', name: 'Purchase Invoices',
    attrs: [
      { key: 'tenant_id',   type: 'string', size: 36, required: true },
      { key: 'invoice_number', type: 'string', size: 30, required: true },
      { key: 'vendor_id',   type: 'string', size: 36, required: true },
      { key: 'vendor_name', type: 'string', size: 200, required: false },
      { key: 'invoice_date', type: 'string', size: 10, required: true },
      { key: 'due_date',    type: 'string', size: 10, required: false },
      { key: 'status',      type: 'string', size: 20, required: false, default: 'draft' },
      { key: 'subtotal',    type: 'float', required: false, default: 0 },
      { key: 'gst_amount',  type: 'float', required: false, default: 0 },
      { key: 'total_amount', type: 'float', required: false, default: 0 },
      { key: 'balance_due', type: 'float', required: false, default: 0 },
    ],
  },
  {
    id: 'journal_entries', name: 'Journal Entries',
    attrs: [
      { key: 'tenant_id',    type: 'string', size: 36, required: true },
      { key: 'entry_number', type: 'string', size: 30, required: true },
      { key: 'entry_date',   type: 'string', size: 10, required: true },
      { key: 'narration',    type: 'string', size: 500, required: false },
      { key: 'status',       type: 'string', size: 20, required: false, default: 'draft' },
      { key: 'total_debit',  type: 'float', required: false, default: 0 },
      { key: 'total_credit', type: 'float', required: false, default: 0 },
    ],
  },
  {
    id: 'employees', name: 'Employees',
    attrs: [
      { key: 'tenant_id',     type: 'string', size: 36, required: true },
      { key: 'employee_code', type: 'string', size: 20, required: true },
      { key: 'first_name',    type: 'string', size: 100, required: true },
      { key: 'last_name',     type: 'string', size: 100, required: true },
      { key: 'employee_name', type: 'string', size: 200, required: false },
      { key: 'email',         type: 'string', size: 200, required: false },
      { key: 'phone',         type: 'string', size: 20, required: false },
      { key: 'department',    type: 'string', size: 50, required: false },
      { key: 'designation',   type: 'string', size: 100, required: false },
      { key: 'date_of_joining', type: 'string', size: 10, required: false },
      { key: 'date_of_birth', type: 'string', size: 10, required: false },
      { key: 'gender',        type: 'string', size: 10, required: false },
      { key: 'basic_salary',  type: 'float', required: false, default: 0 },
      { key: 'hra',           type: 'float', required: false, default: 0 },
      { key: 'other_allowances', type: 'float', required: false, default: 0 },
      { key: 'gross_salary',  type: 'float', required: false, default: 0 },
      { key: 'pan',           type: 'string', size: 10, required: false },
      { key: 'uan',           type: 'string', size: 12, required: false },
      { key: 'bank_account',  type: 'string', size: 20, required: false },
      { key: 'bank_ifsc',     type: 'string', size: 11, required: false },
      { key: 'is_active',     type: 'boolean', required: false, default: true },
    ],
  },
  {
    id: 'attendance', name: 'Attendance',
    attrs: [
      { key: 'tenant_id',    type: 'string', size: 36, required: true },
      { key: 'employee_id',  type: 'string', size: 36, required: true },
      { key: 'date',         type: 'string', size: 10, required: true },
      { key: 'status',       type: 'string', size: 20, required: true },
      { key: 'check_in',     type: 'string', size: 8, required: false },
      { key: 'check_out',    type: 'string', size: 8, required: false },
      { key: 'hours_worked', type: 'float', required: false, default: 0 },
    ],
  },
  {
    id: 'leaves', name: 'Leaves',
    attrs: [
      { key: 'tenant_id',   type: 'string', size: 36, required: true },
      { key: 'employee_id', type: 'string', size: 36, required: true },
      { key: 'leave_type',  type: 'string', size: 30, required: true },
      { key: 'from_date',   type: 'string', size: 10, required: true },
      { key: 'to_date',     type: 'string', size: 10, required: true },
      { key: 'days',        type: 'integer', required: false, default: 1 },
      { key: 'reason',      type: 'string', size: 500, required: false },
      { key: 'status',      type: 'string', size: 20, required: false, default: 'pending' },
      { key: 'approved_by', type: 'string', size: 36, required: false },
    ],
  },
  {
    id: 'payroll', name: 'Payroll',
    attrs: [
      { key: 'tenant_id',    type: 'string', size: 36, required: true },
      { key: 'employee_id',  type: 'string', size: 36, required: true },
      { key: 'month',        type: 'string', size: 7, required: true },
      { key: 'basic',        type: 'float', required: false, default: 0 },
      { key: 'hra',          type: 'float', required: false, default: 0 },
      { key: 'allowances',   type: 'float', required: false, default: 0 },
      { key: 'gross',        type: 'float', required: false, default: 0 },
      { key: 'pf',           type: 'float', required: false, default: 0 },
      { key: 'esi',          type: 'float', required: false, default: 0 },
      { key: 'tds',          type: 'float', required: false, default: 0 },
      { key: 'net',          type: 'float', required: false, default: 0 },
      { key: 'status',       type: 'string', size: 20, required: false, default: 'draft' },
    ],
  },
  {
    id: 'tax_declarations', name: 'Tax Declarations',
    attrs: [
      { key: 'tenant_id',    type: 'string', size: 36, required: true },
      { key: 'employee_id',  type: 'string', size: 36, required: true },
      { key: 'financial_year', type: 'string', size: 9, required: true },
      { key: 'regime',       type: 'string', size: 10, required: false },
      { key: 'total_declared', type: 'float', required: false, default: 0 },
      { key: 'total_approved', type: 'float', required: false, default: 0 },
      { key: 'status',       type: 'string', size: 20, required: false, default: 'pending' },
    ],
  },
  {
    id: 'approval_requests', name: 'Approval Requests',
    attrs: [
      { key: 'tenant_id',     type: 'string', size: 36, required: true },
      { key: 'document_type', type: 'string', size: 50, required: true },
      { key: 'document_number', type: 'string', size: 30, required: true },
      { key: 'document_id',   type: 'string', size: 36, required: false },
      { key: 'requested_by',  type: 'string', size: 100, required: true },
      { key: 'requested_at',  type: 'string', size: 30, required: true },
      { key: 'amount',        type: 'float', required: false, default: 0 },
      { key: 'description',   type: 'string', size: 500, required: false },
      { key: 'required_roles', type: 'string', size: 500, required: false },
      { key: 'status',        type: 'string', size: 20, required: false, default: 'pending' },
      { key: 'priority',      type: 'string', size: 10, required: false, default: 'medium' },
      { key: 'module',        type: 'string', size: 30, required: false },
      { key: 'link',          type: 'string', size: 200, required: false },
      { key: 'actioned_by',   type: 'string', size: 100, required: false },
      { key: 'actioned_at',   type: 'string', size: 30, required: false },
      { key: 'comments',      type: 'string', size: 500, required: false },
    ],
  },
  {
    id: 'notifications', name: 'Notifications',
    attrs: [
      { key: 'tenant_id',   type: 'string', size: 36, required: true },
      { key: 'type',        type: 'string', size: 20, required: true },
      { key: 'module',      type: 'string', size: 30, required: true },
      { key: 'title',       type: 'string', size: 200, required: true },
      { key: 'description', type: 'string', size: 500, required: false },
      { key: 'timestamp',   type: 'string', size: 30, required: false },
      { key: 'actor',       type: 'string', size: 100, required: false },
      { key: 'read',        type: 'boolean', required: false, default: false },
    ],
  },
  {
    id: 'warehouses', name: 'Warehouses',
    attrs: [
      { key: 'tenant_id',  type: 'string', size: 36, required: true },
      { key: 'code',       type: 'string', size: 20, required: true },
      { key: 'name',       type: 'string', size: 200, required: true },
      { key: 'address',    type: 'string', size: 500, required: false },
      { key: 'city',       type: 'string', size: 100, required: false },
      { key: 'state',      type: 'string', size: 100, required: false },
      { key: 'type',       type: 'string', size: 30, required: false },
      { key: 'capacity',   type: 'integer', required: false, default: 0 },
      { key: 'is_active',  type: 'boolean', required: false, default: true },
    ],
  },
  {
    id: 'stock_movements', name: 'Stock Movements',
    attrs: [
      { key: 'tenant_id',    type: 'string', size: 36, required: true },
      { key: 'item_id',      type: 'string', size: 36, required: true },
      { key: 'warehouse_id', type: 'string', size: 36, required: true },
      { key: 'movement_type', type: 'string', size: 20, required: true },
      { key: 'quantity',     type: 'float', required: true },
      { key: 'reference',   type: 'string', size: 50, required: false },
      { key: 'date',        type: 'string', size: 10, required: true },
    ],
  },
  {
    id: 'boms', name: 'Bill of Materials',
    attrs: [
      { key: 'tenant_id',  type: 'string', size: 36, required: true },
      { key: 'bom_number', type: 'string', size: 30, required: true },
      { key: 'item_id',    type: 'string', size: 36, required: true },
      { key: 'item_name',  type: 'string', size: 200, required: false },
      { key: 'version',    type: 'integer', required: false, default: 1 },
      { key: 'status',     type: 'string', size: 20, required: false, default: 'draft' },
      { key: 'quantity',   type: 'float', required: false, default: 1 },
    ],
  },
  {
    id: 'production_orders', name: 'Production Orders',
    attrs: [
      { key: 'tenant_id',    type: 'string', size: 36, required: true },
      { key: 'order_number', type: 'string', size: 30, required: true },
      { key: 'bom_id',       type: 'string', size: 36, required: false },
      { key: 'item_name',    type: 'string', size: 200, required: false },
      { key: 'quantity',     type: 'float', required: false, default: 0 },
      { key: 'completed',    type: 'float', required: false, default: 0 },
      { key: 'status',       type: 'string', size: 20, required: false, default: 'planned' },
      { key: 'start_date',   type: 'string', size: 10, required: false },
      { key: 'end_date',     type: 'string', size: 10, required: false },
    ],
  },
  {
    id: 'work_centers', name: 'Work Centers',
    attrs: [
      { key: 'tenant_id',  type: 'string', size: 36, required: true },
      { key: 'code',       type: 'string', size: 20, required: true },
      { key: 'name',       type: 'string', size: 200, required: true },
      { key: 'status',     type: 'string', size: 20, required: false, default: 'active' },
      { key: 'capacity',   type: 'float', required: false, default: 0 },
      { key: 'efficiency', type: 'float', required: false, default: 85 },
    ],
  },
  {
    id: 'qc_inspections', name: 'QC Inspections',
    attrs: [
      { key: 'tenant_id',    type: 'string', size: 36, required: true },
      { key: 'inspection_no', type: 'string', size: 30, required: true },
      { key: 'item_id',      type: 'string', size: 36, required: false },
      { key: 'batch_no',     type: 'string', size: 30, required: false },
      { key: 'inspected_qty', type: 'float', required: false, default: 0 },
      { key: 'rejected_qty', type: 'float', required: false, default: 0 },
      { key: 'status',       type: 'string', size: 20, required: false, default: 'pending' },
      { key: 'inspector',    type: 'string', size: 100, required: false },
    ],
  },
  {
    id: 'job_work_challans', name: 'Job Work Challans',
    attrs: [
      { key: 'tenant_id',    type: 'string', size: 36, required: true },
      { key: 'challan_no',   type: 'string', size: 30, required: true },
      { key: 'vendor_id',    type: 'string', size: 36, required: false },
      { key: 'vendor_name',  type: 'string', size: 200, required: false },
      { key: 'challan_date', type: 'string', size: 10, required: true },
      { key: 'due_date',     type: 'string', size: 10, required: false },
      { key: 'status',       type: 'string', size: 20, required: false, default: 'dispatched' },
    ],
  },
  {
    id: 'gate_passes', name: 'Gate Passes',
    attrs: [
      { key: 'tenant_id',  type: 'string', size: 36, required: true },
      { key: 'pass_number', type: 'string', size: 30, required: true },
      { key: 'pass_type',  type: 'string', size: 10, required: true },
      { key: 'purpose',    type: 'string', size: 200, required: false },
      { key: 'status',     type: 'string', size: 20, required: false },
      { key: 'date',       type: 'string', size: 10, required: true },
    ],
  },
];

// ----------- Runner -----------
async function createAttr(collId, attr) {
  const args = [DB_ID, collId, attr.key];
  try {
    switch (attr.type) {
      case 'string':
        await databases.createStringAttribute(...args, attr.size || 255, attr.required, attr.default ?? null);
        break;
      case 'integer':
        await databases.createIntegerAttribute(...args, attr.required, attr.default ?? null, null, null);
        break;
      case 'float':
        await databases.createFloatAttribute(...args, attr.required, attr.default ?? null, null, null);
        break;
      case 'boolean':
        await databases.createBooleanAttribute(...args, attr.required, attr.default ?? null);
        break;
    }
    console.log(`    ✅ ${attr.key} (${attr.type})`);
  } catch (e) {
    if (e.code === 409) {
      console.log(`    ⏭️  ${attr.key} (already exists)`);
    } else {
      console.error(`    ❌ ${attr.key}:`, e.message);
    }
  }
}

async function main() {
  console.log('🚀 SA ERP - Appwrite Database Setup');
  console.log(`   Endpoint : ${ENDPOINT}`);
  console.log(`   Project  : ${PROJECT}`);
  console.log(`   Database : ${DB_ID}\n`);

  // Create database
  try {
    await databases.create(DB_ID, 'SA ERP Database');
    console.log('📦 Database created\n');
  } catch (e) {
    if (e.code === 409) console.log('📦 Database already exists\n');
    else { console.error('❌ Database creation failed:', e.message); process.exit(1); }
  }

  // Create collections + attributes
  for (const coll of COLLECTIONS) {
    try {
      await databases.createCollection(DB_ID, coll.id, coll.name);
      console.log(`📂 Collection: ${coll.name}`);
    } catch (e) {
      if (e.code === 409) console.log(`📂 Collection: ${coll.name} (exists)`);
      else { console.error(`❌ ${coll.name}:`, e.message); continue; }
    }

    for (const attr of coll.attrs) {
      await createAttr(coll.id, attr);
      // Appwrite needs a short delay between attribute creations
      await new Promise(r => setTimeout(r, 500));
    }

    // Create index on tenant_id for tenant isolation
    try {
      await databases.createIndex(DB_ID, coll.id, 'idx_tenant', 'key', ['tenant_id']);
      console.log(`    🔑 Index: idx_tenant`);
    } catch (e) {
      if (e.code === 409) console.log(`    🔑 Index: idx_tenant (exists)`);
    }

    console.log('');
  }

  console.log('\n✅ Setup complete! Collections are ready.');
  console.log('\n📝 Next steps:');
  console.log('   1. Create API key with databases.read + databases.write permissions');
  console.log('   2. Set collection-level permissions in Appwrite console');
  console.log('   3. Create demo users via Appwrite Auth console');
  console.log('   4. Set VITE_APPWRITE_* env vars in .env or Vercel dashboard');
}

main().catch(console.error);
