/**
 * SA ERP - Database Initialization
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import SCHEMA from './schema';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  
  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const dbPath = path.join(dbDir, 'indian_erp.db');
  
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Execute schema
  db.exec(SCHEMA);
  
  // Setup audit triggers
  setupAuditTriggers(db);
  
  // Seed default data if needed
  seedDefaultData(db);
  
  console.log(`Database initialized at: ${dbPath}`);
  
  return db;
}

function setupAuditTriggers(db: Database.Database) {
  // Tables that need audit logging (MCA Compliance)
  const auditedTables = [
    'accounts',
    'journal_entries',
    'journal_entry_lines',
    'items',
    'stock_moves',
    'vendors',
    'customers',
    'purchase_orders',
    'purchase_invoices',
    'sales_orders',
    'sales_invoices',
    'customer_receipts',
    'vendor_payments',
    'employees',
    'payslips'
  ];
  
  // Note: SQLite triggers for audit - these are simplified
  // In production, you'd want more sophisticated trigger logic
  
  for (const table of auditedTables) {
    // Update trigger
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS audit_${table}_update
      AFTER UPDATE ON ${table}
      BEGIN
        INSERT INTO audit_logs (
          id, tenant_id, user_id, user_name, timestamp, table_name, 
          record_id, action, old_values, new_values
        )
        SELECT 
          lower(hex(randomblob(16))),
          COALESCE(NEW.tenant_id, ''),
          '',
          'SYSTEM',
          datetime('now'),
          '${table}',
          NEW.id,
          'UPDATE',
          json_object('id', OLD.id),
          json_object('id', NEW.id);
      END;
    `);
    
    // Delete trigger
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS audit_${table}_delete
      AFTER DELETE ON ${table}
      BEGIN
        INSERT INTO audit_logs (
          id, tenant_id, user_id, user_name, timestamp, table_name, 
          record_id, action, old_values
        )
        SELECT 
          lower(hex(randomblob(16))),
          COALESCE(OLD.tenant_id, ''),
          '',
          'SYSTEM',
          datetime('now'),
          '${table}',
          OLD.id,
          'DELETE',
          json_object('id', OLD.id);
      END;
    `);
  }
}

function seedDefaultData(db: Database.Database) {
  // Check if default tenant exists
  const tenant = db.prepare('SELECT id FROM tenants WHERE code = ?').get('DEFAULT');
  
  if (!tenant) {
    const tenantId = generateId();
    
    // Create default tenant
    db.prepare(`
      INSERT INTO tenants (id, code, name, gstin, pan, city, state, state_code, pincode, country, email, settings)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenantId,
      'DEFAULT',
      'My Company',
      '',
      '',
      'Mumbai',
      'Maharashtra',
      '27',
      '400001',
      'India',
      'admin@company.com',
      JSON.stringify({
        fiscal_year_start: '04-01',
        default_currency: 'INR',
        decimal_places: 2,
        date_format: 'DD/MM/YYYY',
        time_zone: 'Asia/Kolkata',
        gst_registration_type: 'regular'
      })
    );
    
    // Seed Chart of Accounts
    seedChartOfAccounts(db, tenantId);
    
    // Seed Units of Measure
    seedUnitsOfMeasure(db, tenantId);
    
    // Seed HSN Codes
    seedHSNCodes(db);
    
    // Seed Default Roles
    seedDefaultRoles(db, tenantId);
    
    // Seed Default User
    seedDefaultUser(db, tenantId);
    
    console.log('Default data seeded successfully');
  }
}

function seedChartOfAccounts(db: Database.Database, tenantId: string) {
  const accounts = [
    // Assets
    { code: '1000', name: 'Assets', type: 'asset', subType: 'other_current_asset', parent: null },
    { code: '1100', name: 'Current Assets', type: 'asset', subType: 'other_current_asset', parent: '1000' },
    { code: '1110', name: 'Cash', type: 'asset', subType: 'cash', parent: '1100' },
    { code: '1120', name: 'Bank Accounts', type: 'asset', subType: 'bank', parent: '1100' },
    { code: '1130', name: 'Accounts Receivable', type: 'asset', subType: 'accounts_receivable', parent: '1100' },
    { code: '1140', name: 'Inventory', type: 'asset', subType: 'inventory', parent: '1100' },
    { code: '1150', name: 'Advances to Suppliers', type: 'asset', subType: 'other_current_asset', parent: '1100' },
    { code: '1160', name: 'TDS Receivable', type: 'asset', subType: 'other_current_asset', parent: '1100' },
    { code: '1170', name: 'GST Input Credit', type: 'asset', subType: 'other_current_asset', parent: '1100' },
    { code: '1200', name: 'Fixed Assets', type: 'asset', subType: 'fixed_asset', parent: '1000' },
    { code: '1210', name: 'Land & Building', type: 'asset', subType: 'fixed_asset', parent: '1200' },
    { code: '1220', name: 'Plant & Machinery', type: 'asset', subType: 'fixed_asset', parent: '1200' },
    { code: '1230', name: 'Furniture & Fixtures', type: 'asset', subType: 'fixed_asset', parent: '1200' },
    { code: '1240', name: 'Vehicles', type: 'asset', subType: 'fixed_asset', parent: '1200' },
    { code: '1250', name: 'Computers & Equipment', type: 'asset', subType: 'fixed_asset', parent: '1200' },
    { code: '1290', name: 'Accumulated Depreciation', type: 'asset', subType: 'accumulated_depreciation', parent: '1200' },
    
    // Liabilities
    { code: '2000', name: 'Liabilities', type: 'liability', subType: 'current_liability', parent: null },
    { code: '2100', name: 'Current Liabilities', type: 'liability', subType: 'current_liability', parent: '2000' },
    { code: '2110', name: 'Accounts Payable', type: 'liability', subType: 'accounts_payable', parent: '2100' },
    { code: '2120', name: 'Advances from Customers', type: 'liability', subType: 'current_liability', parent: '2100' },
    { code: '2130', name: 'GST Output Liability', type: 'liability', subType: 'current_liability', parent: '2100' },
    { code: '2131', name: 'CGST Payable', type: 'liability', subType: 'current_liability', parent: '2130' },
    { code: '2132', name: 'SGST Payable', type: 'liability', subType: 'current_liability', parent: '2130' },
    { code: '2133', name: 'IGST Payable', type: 'liability', subType: 'current_liability', parent: '2130' },
    { code: '2140', name: 'TDS Payable', type: 'liability', subType: 'current_liability', parent: '2100' },
    { code: '2150', name: 'Salaries Payable', type: 'liability', subType: 'current_liability', parent: '2100' },
    { code: '2160', name: 'PF Payable', type: 'liability', subType: 'current_liability', parent: '2100' },
    { code: '2170', name: 'ESI Payable', type: 'liability', subType: 'current_liability', parent: '2100' },
    { code: '2200', name: 'Long Term Liabilities', type: 'liability', subType: 'long_term_liability', parent: '2000' },
    { code: '2210', name: 'Bank Loans', type: 'liability', subType: 'long_term_liability', parent: '2200' },
    
    // Equity
    { code: '3000', name: 'Equity', type: 'equity', subType: 'equity', parent: null },
    { code: '3100', name: 'Share Capital', type: 'equity', subType: 'equity', parent: '3000' },
    { code: '3200', name: 'Reserves & Surplus', type: 'equity', subType: 'retained_earnings', parent: '3000' },
    { code: '3300', name: 'Retained Earnings', type: 'equity', subType: 'retained_earnings', parent: '3000' },
    
    // Income
    { code: '4000', name: 'Income', type: 'income', subType: 'sales_income', parent: null },
    { code: '4100', name: 'Sales Revenue', type: 'income', subType: 'sales_income', parent: '4000' },
    { code: '4110', name: 'Sales - Goods', type: 'income', subType: 'sales_income', parent: '4100' },
    { code: '4120', name: 'Sales - Services', type: 'income', subType: 'sales_income', parent: '4100' },
    { code: '4130', name: 'Sales Returns', type: 'income', subType: 'sales_income', parent: '4100' },
    { code: '4200', name: 'Other Income', type: 'income', subType: 'other_income', parent: '4000' },
    { code: '4210', name: 'Interest Income', type: 'income', subType: 'other_income', parent: '4200' },
    { code: '4220', name: 'Discount Received', type: 'income', subType: 'other_income', parent: '4200' },
    { code: '4230', name: 'Exchange Gain', type: 'income', subType: 'other_income', parent: '4200' },
    
    // Expenses
    { code: '5000', name: 'Expenses', type: 'expense', subType: 'operating_expense', parent: null },
    { code: '5100', name: 'Cost of Goods Sold', type: 'expense', subType: 'cost_of_goods_sold', parent: '5000' },
    { code: '5110', name: 'Material Consumed', type: 'expense', subType: 'cost_of_goods_sold', parent: '5100' },
    { code: '5120', name: 'Direct Labor', type: 'expense', subType: 'cost_of_goods_sold', parent: '5100' },
    { code: '5130', name: 'Manufacturing Overhead', type: 'expense', subType: 'cost_of_goods_sold', parent: '5100' },
    { code: '5200', name: 'Operating Expenses', type: 'expense', subType: 'operating_expense', parent: '5000' },
    { code: '5210', name: 'Salaries & Wages', type: 'expense', subType: 'operating_expense', parent: '5200' },
    { code: '5220', name: 'Rent', type: 'expense', subType: 'operating_expense', parent: '5200' },
    { code: '5230', name: 'Utilities', type: 'expense', subType: 'operating_expense', parent: '5200' },
    { code: '5240', name: 'Office Supplies', type: 'expense', subType: 'operating_expense', parent: '5200' },
    { code: '5250', name: 'Insurance', type: 'expense', subType: 'operating_expense', parent: '5200' },
    { code: '5260', name: 'Depreciation', type: 'expense', subType: 'operating_expense', parent: '5200' },
    { code: '5270', name: 'Repairs & Maintenance', type: 'expense', subType: 'operating_expense', parent: '5200' },
    { code: '5280', name: 'Travel & Conveyance', type: 'expense', subType: 'operating_expense', parent: '5200' },
    { code: '5290', name: 'Professional Fees', type: 'expense', subType: 'operating_expense', parent: '5200' },
    { code: '5300', name: 'Financial Expenses', type: 'expense', subType: 'other_expense', parent: '5000' },
    { code: '5310', name: 'Bank Charges', type: 'expense', subType: 'other_expense', parent: '5300' },
    { code: '5320', name: 'Interest Expense', type: 'expense', subType: 'other_expense', parent: '5300' },
    { code: '5330', name: 'Exchange Loss', type: 'expense', subType: 'other_expense', parent: '5300' }
  ];
  
  // Create lookup for parent codes
  const codeToId: Record<string, string> = {};
  
  // First pass: create all accounts without parent references
  for (const acc of accounts) {
    const id = generateId();
    codeToId[acc.code] = id;
  }
  
  // Second pass: insert with parent references
  const stmt = db.prepare(`
    INSERT INTO accounts (id, tenant_id, code, name, account_type, account_sub_type, parent_id, is_system, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
  `);
  
  for (const acc of accounts) {
    const parentId = acc.parent ? codeToId[acc.parent] : null;
    stmt.run(codeToId[acc.code], tenantId, acc.code, acc.name, acc.type, acc.subType, parentId);
  }
}

function seedUnitsOfMeasure(db: Database.Database, tenantId: string) {
  const uoms = [
    { code: 'NOS', name: 'Numbers', category: 'unit' },
    { code: 'PCS', name: 'Pieces', category: 'unit' },
    { code: 'BOX', name: 'Box', category: 'unit' },
    { code: 'PKT', name: 'Packet', category: 'unit' },
    { code: 'SET', name: 'Set', category: 'unit' },
    { code: 'KG', name: 'Kilogram', category: 'weight' },
    { code: 'GM', name: 'Gram', category: 'weight' },
    { code: 'QTL', name: 'Quintal', category: 'weight' },
    { code: 'TON', name: 'Metric Ton', category: 'weight' },
    { code: 'LTR', name: 'Litre', category: 'volume' },
    { code: 'ML', name: 'Millilitre', category: 'volume' },
    { code: 'MTR', name: 'Metre', category: 'length' },
    { code: 'CM', name: 'Centimetre', category: 'length' },
    { code: 'FT', name: 'Feet', category: 'length' },
    { code: 'SQM', name: 'Square Metre', category: 'length' },
    { code: 'SQFT', name: 'Square Feet', category: 'length' },
    { code: 'HRS', name: 'Hours', category: 'time' },
    { code: 'DAYS', name: 'Days', category: 'time' }
  ];
  
  const stmt = db.prepare(`
    INSERT INTO units_of_measure (id, tenant_id, code, name, category, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  
  for (const uom of uoms) {
    stmt.run(generateId(), tenantId, uom.code, uom.name, uom.category);
  }
}

function seedHSNCodes(db: Database.Database) {
  // Common HSN codes with GST rates
  const hsnCodes = [
    { code: '0101', desc: 'Live horses, asses, mules and hinnies', rate: 0 },
    { code: '0201', desc: 'Meat of bovine animals, fresh or chilled', rate: 0 },
    { code: '0401', desc: 'Milk and cream, not concentrated', rate: 0 },
    { code: '1001', desc: 'Wheat and meslin', rate: 0 },
    { code: '1006', desc: 'Rice', rate: 5 },
    { code: '2201', desc: 'Waters, including natural or artificial mineral waters', rate: 18 },
    { code: '2709', desc: 'Petroleum oils, crude', rate: 5 },
    { code: '3004', desc: 'Medicaments', rate: 12 },
    { code: '3926', desc: 'Other articles of plastics', rate: 18 },
    { code: '6101', desc: 'Men\'s or boys\' overcoats, car coats', rate: 12 },
    { code: '6204', desc: 'Women\'s or girls\' suits, ensembles', rate: 12 },
    { code: '7318', desc: 'Screws, bolts, nuts, washers', rate: 18 },
    { code: '8418', desc: 'Refrigerators, freezers', rate: 18 },
    { code: '8471', desc: 'Automatic data processing machines', rate: 18 },
    { code: '8517', desc: 'Telephone sets, smartphones', rate: 18 },
    { code: '8703', desc: 'Motor cars and vehicles', rate: 28 },
    { code: '9401', desc: 'Seats and chairs', rate: 18 },
    { code: '9403', desc: 'Other furniture', rate: 18 },
    // SAC codes for services
    { code: '9954', desc: 'Construction services', rate: 18, isService: true },
    { code: '9961', desc: 'Transport of goods', rate: 5, isService: true },
    { code: '9962', desc: 'Passenger transport', rate: 5, isService: true },
    { code: '9971', desc: 'Financial services', rate: 18, isService: true },
    { code: '9972', desc: 'Real estate services', rate: 18, isService: true },
    { code: '9973', desc: 'Leasing or rental services', rate: 18, isService: true },
    { code: '9983', desc: 'Other professional services', rate: 18, isService: true },
    { code: '9984', desc: 'Telecommunications services', rate: 18, isService: true },
    { code: '9985', desc: 'Support services', rate: 18, isService: true },
    { code: '9987', desc: 'Maintenance and repair services', rate: 18, isService: true },
    { code: '9988', desc: 'Manufacturing services', rate: 18, isService: true },
    { code: '9991', desc: 'Public administration services', rate: 0, isService: true },
    { code: '9992', desc: 'Education services', rate: 0, isService: true },
    { code: '9993', desc: 'Human health services', rate: 0, isService: true },
    { code: '9995', desc: 'Recreational services', rate: 18, isService: true },
    { code: '9997', desc: 'Other services', rate: 18, isService: true }
  ];
  
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO hsn_codes (id, code, description, chapter, gst_rate, effective_from, is_service)
    VALUES (?, ?, ?, ?, ?, '2017-07-01', ?)
  `);
  
  for (const hsn of hsnCodes) {
    stmt.run(
      generateId(),
      hsn.code,
      hsn.desc,
      hsn.code.substring(0, 2),
      hsn.rate,
      hsn.isService ? 1 : 0
    );
  }
}

function seedDefaultRoles(db: Database.Database, tenantId: string) {
  const roles = [
    {
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['*']
    },
    {
      name: 'Accountant',
      description: 'Financial management access',
      permissions: [
        'accounts.*', 'journal_entries.*', 'bank.*', 
        'purchase_invoices.*', 'sales_invoices.*',
        'customer_receipts.*', 'vendor_payments.*',
        'reports.financial.*'
      ]
    },
    {
      name: 'Sales Manager',
      description: 'Sales and CRM access',
      permissions: [
        'customers.*', 'leads.*', 'opportunities.*',
        'quotations.*', 'sales_orders.*', 'sales_invoices.*',
        'delivery_notes.*', 'customer_receipts.read',
        'reports.sales.*'
      ]
    },
    {
      name: 'Purchase Manager',
      description: 'Purchase management access',
      permissions: [
        'vendors.*', 'purchase_requests.*', 'rfq.*',
        'purchase_orders.*', 'grn.*', 'purchase_invoices.*',
        'vendor_payments.read', 'reports.purchase.*'
      ]
    },
    {
      name: 'Inventory Manager',
      description: 'Inventory and warehouse access',
      permissions: [
        'items.*', 'warehouses.*', 'stock_moves.*',
        'stock_takes.*', 'gate_passes.*',
        'reports.inventory.*'
      ]
    },
    {
      name: 'Production Manager',
      description: 'Manufacturing access',
      permissions: [
        'bom.*', 'work_centers.*', 'production_orders.*',
        'material_issues.*', 'fg_receipts.*', 'qc.*',
        'job_work.*', 'reports.production.*'
      ]
    },
    {
      name: 'HR Manager',
      description: 'HR and payroll access',
      permissions: [
        'employees.*', 'departments.*', 'designations.*',
        'attendance.*', 'leave.*', 'payroll.*',
        'reports.hr.*'
      ]
    }
  ];
  
  const stmt = db.prepare(`
    INSERT INTO roles (id, tenant_id, name, description, permissions, is_system)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  
  for (const role of roles) {
    stmt.run(
      generateId(),
      tenantId,
      role.name,
      role.description,
      JSON.stringify(role.permissions)
    );
  }
}

function seedDefaultUser(db: Database.Database, tenantId: string) {
  // Get admin role
  const adminRole = db.prepare('SELECT id FROM roles WHERE tenant_id = ? AND name = ?').get(tenantId, 'Administrator') as { id: string } | undefined;
  
  if (adminRole) {
    // Create default admin user (password: admin123)
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync('admin123', 10);
    
    db.prepare(`
      INSERT INTO users (id, tenant_id, username, email, password_hash, first_name, last_name, roles, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      generateId(),
      tenantId,
      'admin',
      'admin@company.com',
      passwordHash,
      'System',
      'Administrator',
      JSON.stringify([adminRole.id])
    );
  }
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

