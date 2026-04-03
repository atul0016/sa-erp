/**
 * SA ERP - Role-Based Access Control System
 * Defines permissions, roles, and access checking utilities
 */

// All granular permissions in the system
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_EXECUTIVE: 'dashboard.executive',
  
  // Finance
  ACCOUNTS_READ: 'accounts.read',
  ACCOUNTS_WRITE: 'accounts.write',
  JOURNAL_READ: 'journal_entries.read',
  JOURNAL_WRITE: 'journal_entries.write',
  JOURNAL_POST: 'journal_entries.post',
  BANK_RECONCILIATION: 'bank.reconciliation',
  CREDIT_MANAGEMENT: 'credit.management',
  FINANCIAL_REPORTS: 'reports.financial.read',
  
  // Inventory
  ITEMS_READ: 'items.read',
  ITEMS_WRITE: 'items.write',
  WAREHOUSE_READ: 'warehouses.read',
  WAREHOUSE_WRITE: 'warehouses.write',
  STOCK_MOVE: 'stock_moves.write',
  STOCK_VIEW: 'stock_moves.read',
  GATE_PASS: 'gate_passes.write',
  
  // Sales
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_WRITE: 'customers.write',
  SALES_ORDERS_READ: 'sales_orders.read',
  SALES_ORDERS_WRITE: 'sales_orders.write',
  SALES_INVOICES_READ: 'sales_invoices.read',
  SALES_INVOICES_WRITE: 'sales_invoices.write',
  CUSTOMER_RECEIPTS: 'customer_receipts.write',
  POS_ACCESS: 'pos.access',
  SALES_REPORTS: 'reports.sales.read',
  
  // Purchase
  VENDORS_READ: 'vendors.read',
  VENDORS_WRITE: 'vendors.write',
  PO_READ: 'purchase_orders.read',
  PO_WRITE: 'purchase_orders.write',
  GRN_WRITE: 'grn.write',
  PURCHASE_INVOICES_READ: 'purchase_invoices.read',
  PURCHASE_INVOICES_WRITE: 'purchase_invoices.write',
  VENDOR_PAYMENTS: 'vendor_payments.write',
  PURCHASE_REPORTS: 'reports.purchase.read',
  
  // Manufacturing
  BOM_READ: 'bom.read',
  BOM_WRITE: 'bom.write',
  PRODUCTION_READ: 'production_orders.read',
  PRODUCTION_WRITE: 'production_orders.write',
  MRP_ACCESS: 'mrp.access',
  SHOP_FLOOR: 'shop_floor.access',
  QC_ACCESS: 'qc.access',
  JOB_WORK: 'job_work.write',
  
  // HRM
  EMPLOYEES_READ: 'employees.read',
  EMPLOYEES_WRITE: 'employees.write',
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_WRITE: 'attendance.write',
  LEAVE_READ: 'leave.read',
  LEAVE_WRITE: 'leave.write',
  LEAVE_APPROVE: 'leave.approve',
  PAYROLL_READ: 'payroll.read',
  PAYROLL_PROCESS: 'payroll.process',
  TAX_DECLARATIONS: 'tax_declarations.read',
  HR_REPORTS: 'reports.hr.read',
  
  // GST
  EINVOICE_ACCESS: 'gst.einvoice',
  EWAY_BILL: 'gst.eway_bill',
  GST_RETURNS: 'gst.returns',
  TDS_MANAGEMENT: 'gst.tds',
  ITC_RECONCILIATION: 'gst.itc',
  GST_REPORTS: 'reports.gst.read',
  
  // Reports
  REPORTS_READ: 'reports.read',
  REPORTS_EXPORT: 'reports.export',
  
  // Approvals
  APPROVE_PO: 'approvals.purchase_order',
  APPROVE_SO: 'approvals.sales_order',
  APPROVE_EXPENSE: 'approvals.expense',
  APPROVE_LEAVE: 'approvals.leave',
  APPROVE_PAYROLL: 'approvals.payroll',
  APPROVE_JOURNAL: 'approvals.journal',
  APPROVE_CREDIT_LIMIT: 'approvals.credit_limit',
  
  // Settings & Admin
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_COMPANY: 'settings.company',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  AUDIT_VIEW: 'audit.view',
  SYSTEM_ADMIN: 'system.admin',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role definitions with their permissions
export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  level: number; // 1=CEO/Admin, 2=Manager, 3=Executive, 4=Viewer
}

export const SYSTEM_ROLES: Record<string, RoleDefinition> = {
  ADMIN: {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['*'],
    isSystem: true,
    level: 1,
  },
  CEO: {
    id: 'ceo',
    name: 'CEO / Director',
    description: 'Executive oversight with all approvals and executive dashboard',
    permissions: [
      '*', // All permissions (CEO sees everything)
    ],
    isSystem: true,
    level: 1,
  },
  FINANCE_MANAGER: {
    id: 'finance_manager',
    name: 'Finance Manager',
    description: 'Full finance module access with approval rights',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.ACCOUNTS_WRITE,
      PERMISSIONS.JOURNAL_READ, PERMISSIONS.JOURNAL_WRITE, PERMISSIONS.JOURNAL_POST,
      PERMISSIONS.BANK_RECONCILIATION, PERMISSIONS.CREDIT_MANAGEMENT,
      PERMISSIONS.FINANCIAL_REPORTS,
      PERMISSIONS.SALES_INVOICES_READ, PERMISSIONS.PURCHASE_INVOICES_READ,
      PERMISSIONS.CUSTOMER_RECEIPTS, PERMISSIONS.VENDOR_PAYMENTS,
      PERMISSIONS.EINVOICE_ACCESS, PERMISSIONS.GST_RETURNS, PERMISSIONS.TDS_MANAGEMENT,
      PERMISSIONS.ITC_RECONCILIATION, PERMISSIONS.GST_REPORTS,
      PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.APPROVE_JOURNAL, PERMISSIONS.APPROVE_EXPENSE,
      PERMISSIONS.APPROVE_CREDIT_LIMIT,
      PERMISSIONS.SETTINGS_VIEW,
    ],
    isSystem: true,
    level: 2,
  },
  SALES_MANAGER: {
    id: 'sales_manager',
    name: 'Sales Manager',
    description: 'Sales module with order approval rights',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_WRITE,
      PERMISSIONS.SALES_ORDERS_READ, PERMISSIONS.SALES_ORDERS_WRITE,
      PERMISSIONS.SALES_INVOICES_READ, PERMISSIONS.SALES_INVOICES_WRITE,
      PERMISSIONS.CUSTOMER_RECEIPTS, PERMISSIONS.POS_ACCESS,
      PERMISSIONS.SALES_REPORTS, PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.ITEMS_READ, PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.APPROVE_SO,
      PERMISSIONS.SETTINGS_VIEW,
    ],
    isSystem: true,
    level: 2,
  },
  PURCHASE_MANAGER: {
    id: 'purchase_manager',
    name: 'Purchase Manager',
    description: 'Purchase module with PO approval rights',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.VENDORS_READ, PERMISSIONS.VENDORS_WRITE,
      PERMISSIONS.PO_READ, PERMISSIONS.PO_WRITE,
      PERMISSIONS.GRN_WRITE,
      PERMISSIONS.PURCHASE_INVOICES_READ, PERMISSIONS.PURCHASE_INVOICES_WRITE,
      PERMISSIONS.VENDOR_PAYMENTS,
      PERMISSIONS.PURCHASE_REPORTS, PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.ITEMS_READ, PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.APPROVE_PO,
      PERMISSIONS.SETTINGS_VIEW,
    ],
    isSystem: true,
    level: 2,
  },
  INVENTORY_MANAGER: {
    id: 'inventory_manager',
    name: 'Inventory Manager',
    description: 'Full inventory and warehouse management access',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ITEMS_READ, PERMISSIONS.ITEMS_WRITE,
      PERMISSIONS.WAREHOUSE_READ, PERMISSIONS.WAREHOUSE_WRITE,
      PERMISSIONS.STOCK_MOVE, PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.GATE_PASS,
      PERMISSIONS.REPORTS_READ,
    ],
    isSystem: true,
    level: 2,
  },
  PRODUCTION_MANAGER: {
    id: 'production_manager',
    name: 'Production Manager',
    description: 'Manufacturing and production management',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.BOM_READ, PERMISSIONS.BOM_WRITE,
      PERMISSIONS.PRODUCTION_READ, PERMISSIONS.PRODUCTION_WRITE,
      PERMISSIONS.MRP_ACCESS, PERMISSIONS.SHOP_FLOOR, PERMISSIONS.QC_ACCESS,
      PERMISSIONS.JOB_WORK,
      PERMISSIONS.ITEMS_READ, PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.REPORTS_READ,
    ],
    isSystem: true,
    level: 2,
  },
  HR_MANAGER: {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'Human Resources and payroll management',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.EMPLOYEES_READ, PERMISSIONS.EMPLOYEES_WRITE,
      PERMISSIONS.ATTENDANCE_READ, PERMISSIONS.ATTENDANCE_WRITE,
      PERMISSIONS.LEAVE_READ, PERMISSIONS.LEAVE_WRITE, PERMISSIONS.LEAVE_APPROVE,
      PERMISSIONS.PAYROLL_READ, PERMISSIONS.PAYROLL_PROCESS,
      PERMISSIONS.TAX_DECLARATIONS, PERMISSIONS.HR_REPORTS,
      PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.APPROVE_PAYROLL,
      PERMISSIONS.REPORTS_READ,
    ],
    isSystem: true,
    level: 2,
  },
  ACCOUNTANT: {
    id: 'accountant',
    name: 'Accountant',
    description: 'Day-to-day accounting operations',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ACCOUNTS_READ,
      PERMISSIONS.JOURNAL_READ, PERMISSIONS.JOURNAL_WRITE,
      PERMISSIONS.BANK_RECONCILIATION,
      PERMISSIONS.FINANCIAL_REPORTS,
      PERMISSIONS.SALES_INVOICES_READ, PERMISSIONS.PURCHASE_INVOICES_READ,
      PERMISSIONS.CUSTOMER_RECEIPTS, PERMISSIONS.VENDOR_PAYMENTS,
      PERMISSIONS.EINVOICE_ACCESS, PERMISSIONS.EWAY_BILL,
      PERMISSIONS.GST_RETURNS, PERMISSIONS.TDS_MANAGEMENT,
      PERMISSIONS.ITC_RECONCILIATION, PERMISSIONS.GST_REPORTS,
      PERMISSIONS.REPORTS_READ,
    ],
    isSystem: true,
    level: 3,
  },
  SALES_EXECUTIVE: {
    id: 'sales_executive',
    name: 'Sales Executive',
    description: 'Create sales orders and invoices',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_WRITE,
      PERMISSIONS.SALES_ORDERS_READ, PERMISSIONS.SALES_ORDERS_WRITE,
      PERMISSIONS.SALES_INVOICES_READ, PERMISSIONS.SALES_INVOICES_WRITE,
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.ITEMS_READ, PERMISSIONS.STOCK_VIEW,
    ],
    isSystem: true,
    level: 3,
  },
  VIEWER: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access across all modules',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.JOURNAL_READ,
      PERMISSIONS.ITEMS_READ, PERMISSIONS.WAREHOUSE_READ, PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.SALES_ORDERS_READ, PERMISSIONS.SALES_INVOICES_READ,
      PERMISSIONS.VENDORS_READ, PERMISSIONS.PO_READ, PERMISSIONS.PURCHASE_INVOICES_READ,
      PERMISSIONS.BOM_READ, PERMISSIONS.PRODUCTION_READ,
      PERMISSIONS.EMPLOYEES_READ, PERMISSIONS.ATTENDANCE_READ, PERMISSIONS.LEAVE_READ,
      PERMISSIONS.PAYROLL_READ, PERMISSIONS.REPORTS_READ,
    ],
    isSystem: true,
    level: 4,
  },
};

// Route-to-permission mapping
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/': [PERMISSIONS.DASHBOARD_VIEW],
  '/approvals': [
    PERMISSIONS.APPROVE_PO, PERMISSIONS.APPROVE_SO, PERMISSIONS.APPROVE_EXPENSE,
    PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.APPROVE_PAYROLL, PERMISSIONS.APPROVE_JOURNAL,
    PERMISSIONS.APPROVE_CREDIT_LIMIT,
  ],
  '/notifications': [PERMISSIONS.DASHBOARD_VIEW],
  '/finance/accounts': [PERMISSIONS.ACCOUNTS_READ],
  '/finance/journal': [PERMISSIONS.JOURNAL_READ],
  '/finance/ledger': [PERMISSIONS.ACCOUNTS_READ],
  '/finance/trial-balance': [PERMISSIONS.FINANCIAL_REPORTS],
  '/finance/pnl': [PERMISSIONS.FINANCIAL_REPORTS],
  '/finance/balance-sheet': [PERMISSIONS.FINANCIAL_REPORTS],
  '/finance/bank-reconciliation': [PERMISSIONS.BANK_RECONCILIATION],
  '/finance/credit-management': [PERMISSIONS.CREDIT_MANAGEMENT],
  '/inventory/items': [PERMISSIONS.ITEMS_READ],
  '/inventory/warehouses': [PERMISSIONS.WAREHOUSE_READ],
  '/inventory/stock-ledger': [PERMISSIONS.STOCK_VIEW],
  '/inventory/moves': [PERMISSIONS.STOCK_VIEW],
  '/inventory/valuation': [PERMISSIONS.STOCK_VIEW],
  '/inventory/low-stock': [PERMISSIONS.ITEMS_READ],
  '/inventory/gate-pass': [PERMISSIONS.GATE_PASS],
  '/sales/customers': [PERMISSIONS.CUSTOMERS_READ],
  '/sales/orders': [PERMISSIONS.SALES_ORDERS_READ],
  '/sales/invoices': [PERMISSIONS.SALES_INVOICES_READ],
  '/sales/pos': [PERMISSIONS.POS_ACCESS],
  '/sales/receipts': [PERMISSIONS.CUSTOMER_RECEIPTS],
  '/sales/aging': [PERMISSIONS.SALES_REPORTS],
  '/purchase/vendors': [PERMISSIONS.VENDORS_READ],
  '/purchase/orders': [PERMISSIONS.PO_READ],
  '/purchase/grn': [PERMISSIONS.GRN_WRITE],
  '/purchase/invoices': [PERMISSIONS.PURCHASE_INVOICES_READ],
  '/purchase/payments': [PERMISSIONS.VENDOR_PAYMENTS],
  '/manufacturing/bom': [PERMISSIONS.BOM_READ],
  '/manufacturing/work-centers': [PERMISSIONS.PRODUCTION_READ],
  '/manufacturing/production': [PERMISSIONS.PRODUCTION_READ],
  '/manufacturing/mrp': [PERMISSIONS.MRP_ACCESS],
  '/manufacturing/job-work': [PERMISSIONS.JOB_WORK],
  '/manufacturing/shop-floor': [PERMISSIONS.SHOP_FLOOR],
  '/manufacturing/oee': [PERMISSIONS.PRODUCTION_READ],
  '/manufacturing/qc': [PERMISSIONS.QC_ACCESS],
  '/hrm/employees': [PERMISSIONS.EMPLOYEES_READ],
  '/hrm/attendance': [PERMISSIONS.ATTENDANCE_READ],
  '/hrm/leave': [PERMISSIONS.LEAVE_READ],
  '/hrm/payroll': [PERMISSIONS.PAYROLL_READ],
  '/hrm/tax': [PERMISSIONS.TAX_DECLARATIONS],
  '/gst/e-invoice': [PERMISSIONS.EINVOICE_ACCESS],
  '/gst/e-way-bill': [PERMISSIONS.EWAY_BILL],
  '/gst/gstr1': [PERMISSIONS.GST_RETURNS],
  '/gst/gstr2b': [PERMISSIONS.GST_RETURNS],
  '/gst/tds': [PERMISSIONS.TDS_MANAGEMENT],
  '/gst/itc': [PERMISSIONS.ITC_RECONCILIATION],
  '/gst/hsn': [PERMISSIONS.GST_REPORTS],
  '/reports/financial': [PERMISSIONS.FINANCIAL_REPORTS],
  '/reports/sales': [PERMISSIONS.SALES_REPORTS],
  '/reports/purchase': [PERMISSIONS.PURCHASE_REPORTS],
  '/reports/inventory': [PERMISSIONS.REPORTS_READ],
  '/reports/gst': [PERMISSIONS.GST_REPORTS],
  '/settings': [PERMISSIONS.SETTINGS_VIEW],
  '/settings/company': [PERMISSIONS.SETTINGS_COMPANY],
  '/settings/users': [PERMISSIONS.USERS_MANAGE],
  '/settings/roles': [PERMISSIONS.ROLES_MANAGE],
};

/**
 * Check if a user's permissions include the required permission
 */
export function hasPermission(userPermissions: string[], required: string): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  
  // Check exact match
  if (userPermissions.includes(required)) return true;
  
  // Check wildcard patterns: 'accounts.*' matches 'accounts.read'
  const parts = required.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const wildcard = parts.slice(0, i).join('.') + '.*';
    if (userPermissions.includes(wildcard)) return true;
  }
  
  return false;
}

/**
 * Check if user has ANY of the required permissions
 */
export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some(p => hasPermission(userPermissions, p));
}

/**
 * Check if user has ALL of the required permissions
 */
export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  return required.every(p => hasPermission(userPermissions, p));
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(userPermissions: string[], route: string): boolean {
  const required = ROUTE_PERMISSIONS[route];
  if (!required) return true; // No permission defined = public
  return hasAnyPermission(userPermissions, required);
}

/**
 * Get role level (1=highest/CEO, 4=lowest/viewer)
 */
export function getUserLevel(roles: string[]): number {
  let minLevel = 4;
  for (const roleId of roles) {
    const role = Object.values(SYSTEM_ROLES).find(r => r.id === roleId);
    if (role && role.level < minLevel) {
      minLevel = role.level;
    }
  }
  return minLevel;
}

/**
 * Resolve all permissions for a set of role IDs
 */
export function resolvePermissions(roleIds: string[]): string[] {
  const permissions = new Set<string>();
  for (const roleId of roleIds) {
    const role = Object.values(SYSTEM_ROLES).find(r => r.id === roleId);
    if (role) {
      role.permissions.forEach(p => permissions.add(p));
    }
  }
  return Array.from(permissions);
}
