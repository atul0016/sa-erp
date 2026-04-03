/**
 * SA ERP - Appwrite Client Configuration
 * Central Appwrite client instance and project IDs
 */

import { Client, Account, Databases, Storage, Teams } from 'appwrite';

// Environment variables (set via .env or Vercel dashboard)
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

// Database & collection IDs - must match Appwrite console setup
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'sa_erp_db';

export const COLLECTIONS = {
  TENANTS: 'tenants',
  USERS: 'users',
  CUSTOMERS: 'customers',
  VENDORS: 'vendors',
  ITEMS: 'items',
  SALES_ORDERS: 'sales_orders',
  SALES_INVOICES: 'sales_invoices',
  PURCHASE_ORDERS: 'purchase_orders',
  PURCHASE_INVOICES: 'purchase_invoices',
  JOURNAL_ENTRIES: 'journal_entries',
  ACCOUNTS: 'accounts',
  EMPLOYEES: 'employees',
  ATTENDANCE: 'attendance',
  LEAVES: 'leaves',
  PAYROLL: 'payroll',
  TAX_DECLARATIONS: 'tax_declarations',
  APPROVAL_REQUESTS: 'approval_requests',
  NOTIFICATIONS: 'notifications',
  WAREHOUSES: 'warehouses',
  STOCK_MOVEMENTS: 'stock_movements',
  GATE_PASSES: 'gate_passes',
  BOMS: 'boms',
  PRODUCTION_ORDERS: 'production_orders',
  WORK_CENTERS: 'work_centers',
  QC_INSPECTIONS: 'qc_inspections',
  JOB_WORK_CHALLANS: 'job_work_challans',
} as const;

// Singleton client
const client = new Client();

if (APPWRITE_PROJECT_ID) {
  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
}

// Service instances
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

export const appwriteClient = client;

/**
 * Check if Appwrite is configured (env vars present)
 */
export function isAppwriteConfigured(): boolean {
  return Boolean(APPWRITE_PROJECT_ID);
}
