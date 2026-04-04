/**
 * SA ERP - Set Collection Permissions
 * Grants read/write access to authenticated users on all collections.
 * 
 * Usage: node --env-file=.env scripts/set-permissions.js
 */
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || '';
const PROJECT  = process.env.APPWRITE_PROJECT_ID || '';
const API_KEY  = process.env.APPWRITE_API_KEY || '';
const DB_ID    = process.env.APPWRITE_DATABASE_ID || 'sa_erp_db';

if (!PROJECT || !API_KEY) {
  console.error('Set APPWRITE_PROJECT_ID and APPWRITE_API_KEY first.');
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT)
  .setKey(API_KEY);

const databases = new sdk.Databases(client);

const COLLECTION_IDS = [
  'tenants', 'customers', 'vendors', 'items', 'accounts',
  'sales_orders', 'sales_invoices', 'purchase_orders', 'purchase_invoices',
  'journal_entries', 'employees', 'attendance', 'leaves', 'payroll',
  'tax_declarations', 'approval_requests', 'notifications',
  'warehouses', 'stock_movements', 'boms', 'production_orders',
  'work_centers', 'qc_inspections', 'job_work_challans', 'gate_passes',
];

async function main() {
  console.log('🔐 Setting collection permissions...\n');

  const permissions = [
    sdk.Permission.read(sdk.Role.users()),
    sdk.Permission.create(sdk.Role.users()),
    sdk.Permission.update(sdk.Role.users()),
    sdk.Permission.delete(sdk.Role.users()),
  ];

  for (const collId of COLLECTION_IDS) {
    try {
      await databases.updateCollection(DB_ID, collId, collId, permissions);
      console.log(`  ✅ ${collId}`);
    } catch (e) {
      console.error(`  ❌ ${collId}: ${e.message}`);
    }
  }

  console.log('\n✅ All collection permissions set for authenticated users.');
}

main().catch(console.error);
