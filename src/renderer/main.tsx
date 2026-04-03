import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';
import { isAppwriteConfigured } from './services/appwrite';
import { appwriteLogin, appwriteLogout, appwriteGetCurrentUser } from './services/auth';
import {
  customersCrud, vendorsCrud, itemsCrud, accountsCrud, employeesCrud, warehousesCrud,
  getDashboardData, getApprovals, updateApprovalStatus, getActivityFeed,
} from './services/database';
import { initFirebase, isFirebaseConfigured, requestNotificationPermission, onForegroundMessage } from './services/firebase';

// ──────────────────────────────────────────────────────────────────
// APPWRITE-BACKED API (used when VITE_APPWRITE_PROJECT_ID is set)
// ──────────────────────────────────────────────────────────────────
if (isAppwriteConfigured() && !window.electronAPI) {
  console.info('🔗 Running with Appwrite backend');

  // Initialize Firebase push if configured
  if (isFirebaseConfigured()) {
    initFirebase();
    requestNotificationPermission().then(token => {
      if (token) console.info('[FCM] Token acquired');
    });
  }

  const tenantId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.tenant_id || '';
    } catch { return ''; }
  };

  const proxyFallback = new Proxy({}, {
    get: () => async () => ({ success: true, data: [] }),
  });

  (window as any).electronAPI = {
    auth: {
      login: async (username: string, password: string) => appwriteLogin(username, password),
      logout: async () => { await appwriteLogout(); return { success: true }; },
      getCurrentUser: async () => {
        const user = await appwriteGetCurrentUser();
        return user ? { success: true, data: user } : { success: false, error: 'No session' };
      },
    },
    dashboard: {
      getData: async () => getDashboardData(tenantId()),
    },
    sales: {
      getCustomers: async () => customersCrud.getAll(tenantId()),
      getCustomerById: async (id: string) => customersCrud.getById(id),
      createCustomer: async (data: any) => customersCrud.create({ ...data, tenant_id: tenantId() }),
      updateCustomer: async (id: string, data: any) => customersCrud.update(id, data),
      deleteCustomer: async (id: string) => customersCrud.delete(id),
      ...proxyFallback,
    },
    purchase: {
      getVendors: async () => vendorsCrud.getAll(tenantId()),
      getVendorById: async (id: string) => vendorsCrud.getById(id),
      createVendor: async (data: any) => vendorsCrud.create({ ...data, tenant_id: tenantId() }),
      updateVendor: async (id: string, data: any) => vendorsCrud.update(id, data),
      deleteVendor: async (id: string) => vendorsCrud.delete(id),
      ...proxyFallback,
    },
    inventory: {
      getItems: async () => itemsCrud.getAll(tenantId()),
      getItemById: async (id: string) => itemsCrud.getById(id),
      createItem: async (data: any) => itemsCrud.create({ ...data, tenant_id: tenantId() }),
      updateItem: async (id: string, data: any) => itemsCrud.update(id, data),
      deleteItem: async (id: string) => itemsCrud.delete(id),
      getWarehouses: async () => warehousesCrud.getAll(tenantId()),
      ...proxyFallback,
    },
    finance: {
      getAccounts: async () => accountsCrud.getAll(tenantId()),
      ...proxyFallback,
    },
    hrm: {
      getEmployees: async () => employeesCrud.getAll(tenantId()),
      ...proxyFallback,
    },
    approvals: {
      getPendingApprovals: async () => getApprovals(tenantId(), 'pending'),
      getApprovalHistory: async () => getApprovals(tenantId(), undefined),
      getAllApprovals: async () => getApprovals(tenantId()),
      approveRequest: async (id: string, userId: string, comments: string) =>
        updateApprovalStatus(id, 'approved', userId, comments),
      rejectRequest: async (id: string, userId: string, comments: string) =>
        updateApprovalStatus(id, 'rejected', userId, comments),
      getPendingCount: async () => {
        const res = await getApprovals(tenantId(), 'pending');
        return { success: true, data: res.success ? (res.data as any[]).length : 0 };
      },
    },
    notifications: {
      getActivityFeed: async () => getActivityFeed(tenantId()),
    },
    manufacturing: proxyFallback,
    gst: proxyFallback,
    master: proxyFallback,
    report: proxyFallback,
    platform: 'web-appwrite',
    versions: { node: 'N/A', chrome: 'N/A', electron: 'N/A' },
  };
}

// ──────────────────────────────────────────────────────────────────
// MOCK API FALLBACK (used when Appwrite is NOT configured)
// ──────────────────────────────────────────────────────────────────
if (!window.electronAPI) {
  console.warn('Running in browser mode - electronAPI mocked for development');
  
  const mockUsers: Record<string, any> = {
    admin: {
      id: 'mock-user-id',
      tenant_id: 'mock-tenant-id',
      tenant_name: 'Demo Company',
      tenant_code: 'DEMO',
      username: 'admin',
      email: 'admin@demo.com',
      first_name: 'Admin',
      last_name: 'User',
      roles: '["admin"]',
      password: 'admin123',
    },
    ceo: {
      id: 'mock-ceo-id',
      tenant_id: 'mock-tenant-id',
      tenant_name: 'Demo Company',
      tenant_code: 'DEMO',
      username: 'ceo',
      email: 'ceo@demo.com',
      first_name: 'Rajesh',
      last_name: 'Sharma',
      roles: '["ceo"]',
      password: 'ceo123',
    },
    sales_mgr: {
      id: 'mock-sales-id',
      tenant_id: 'mock-tenant-id',
      tenant_name: 'Demo Company',
      tenant_code: 'DEMO',
      username: 'sales_mgr',
      email: 'sales@demo.com',
      first_name: 'Priya',
      last_name: 'Iyer',
      roles: '["sales_manager"]',
      password: 'sales123',
    },
    accountant: {
      id: 'mock-acc-id',
      tenant_id: 'mock-tenant-id',
      tenant_name: 'Demo Company',
      tenant_code: 'DEMO',
      username: 'accountant',
      email: 'accounts@demo.com',
      first_name: 'Vikram',
      last_name: 'Patel',
      roles: '["accountant"]',
      password: 'acc123',
    },
    viewer: {
      id: 'mock-viewer-id',
      tenant_id: 'mock-tenant-id',
      tenant_name: 'Demo Company',
      tenant_code: 'DEMO',
      username: 'viewer',
      email: 'viewer@demo.com',
      first_name: 'Amit',
      last_name: 'Singh',
      roles: '["viewer"]',
      password: 'view123',
    },
    hr_mgr: {
      id: 'mock-hr-id',
      tenant_id: 'mock-tenant-id',
      tenant_name: 'Demo Company',
      tenant_code: 'DEMO',
      username: 'hr_mgr',
      email: 'hr@demo.com',
      first_name: 'Kavita',
      last_name: 'Desai',
      roles: '["hr_manager"]',
      password: 'hr123',
    },
  };

  // In-memory storage for mock data with seed data
  const mockStorage: Record<string, any[]> = {
    customers: [
      { id: 1001, tenant_id: 'mock-tenant-id', code: 'CUST-001', name: 'Acme Corporation Ltd', gstin: '27AABCT1234F1Z5', contact_person: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@acmecorp.com', address: '123 Business Park, Andheri East', city: 'Mumbai', state: 'Maharashtra', pincode: '400069', credit_limit: 500000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-15' },
      { id: 1002, tenant_id: 'mock-tenant-id', code: 'CUST-002', name: 'Tech Solutions India Pvt Ltd', gstin: '29AAXYZ5678P1ZW', contact_person: 'Priya Sharma', phone: '9123456789', email: 'priya@techsolutions.in', address: '45 Electronic City Phase 1', city: 'Bangalore', state: 'Karnataka', pincode: '560100', credit_limit: 750000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-18' },
      { id: 1003, tenant_id: 'mock-tenant-id', code: 'CUST-003', name: 'Gujarat Industries Ltd', gstin: '24BBCDE9012Q1ZX', contact_person: 'Amit Patel', phone: '9988776655', email: 'amit@gujaratind.com', address: '78 GIDC Industrial Estate', city: 'Ahmedabad', state: 'Gujarat', pincode: '382445', credit_limit: 1000000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-20' },
      { id: 1004, tenant_id: 'mock-tenant-id', code: 'CUST-004', name: 'Tamil Nadu Trading Co', gstin: '33CDEFG3456R1ZY', contact_person: 'Lakshmi Iyer', phone: '9445566778', email: 'lakshmi@tntrading.com', address: '156 Anna Salai, T Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017', credit_limit: 300000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-22' },
      { id: 1005, tenant_id: 'mock-tenant-id', code: 'CUST-005', name: 'Delhi Enterprises', gstin: '07DEFGH7890S1ZZ', contact_person: 'Vikram Singh', phone: '9811223344', email: 'vikram@delhient.co.in', address: '89 Nehru Place Commercial Complex', city: 'New Delhi', state: 'Delhi', pincode: '110019', credit_limit: 600000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-25' },
    ],
    vendors: [
      { id: 2001, tenant_id: 'mock-tenant-id', code: 'VEND-001', name: 'Steel Suppliers India', gstin: '27STLSU8901A1ZA', contact_person: 'Ramesh Gupta', phone: '9876512345', email: 'ramesh@steelsuppliers.com', address: '12 Industrial Area, Mahape', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400710', vendor_type: 'supplier', payment_terms: 30, credit_limit: 800000, outstanding: 0, is_active: true, created_at: '2026-01-10' },
      { id: 2002, tenant_id: 'mock-tenant-id', code: 'VEND-002', name: 'Electronic Components Co', gstin: '29ELECO5432B1ZB', contact_person: 'Sunita Reddy', phone: '9880123456', email: 'sunita@electrocomp.in', address: '67 Peenya Industrial Area', city: 'Bangalore', state: 'Karnataka', pincode: '560058', vendor_type: 'supplier', payment_terms: 45, credit_limit: 1200000, outstanding: 0, is_active: true, created_at: '2026-01-12' },
      { id: 2003, tenant_id: 'mock-tenant-id', code: 'VEND-003', name: 'Packaging Solutions Ltd', gstin: '24PAKSO7654C1ZC', contact_person: 'Kiran Shah', phone: '9898765432', email: 'kiran@packagingsol.com', address: '34 Vatva GIDC', city: 'Ahmedabad', state: 'Gujarat', pincode: '382445', vendor_type: 'supplier', payment_terms: 30, credit_limit: 500000, outstanding: 0, is_active: true, created_at: '2026-01-14' },
      { id: 2004, tenant_id: 'mock-tenant-id', code: 'VEND-004', name: 'Logistics Partners India', gstin: '33LOGPA4321D1ZD', contact_person: 'Murugan S', phone: '9444332211', email: 'murugan@logisticspi.com', address: '78 Ambattur Industrial Estate', city: 'Chennai', state: 'Tamil Nadu', pincode: '600058', vendor_type: 'service_provider', payment_terms: 15, credit_limit: 300000, outstanding: 0, is_active: true, created_at: '2026-01-16' },
      { id: 2005, tenant_id: 'mock-tenant-id', code: 'VEND-005', name: 'Chemical Traders Delhi', gstin: '07CHEMT6789E1ZE', contact_person: 'Anjali Verma', phone: '9811445566', email: 'anjali@chemtraders.co.in', address: '45 Okhla Industrial Phase 2', city: 'New Delhi', state: 'Delhi', pincode: '110020', vendor_type: 'supplier', payment_terms: 30, credit_limit: 700000, outstanding: 0, is_active: true, created_at: '2026-01-19' },
    ],
    items: [
      { id: 3001, tenant_id: 'mock-tenant-id', item_code: 'RM-STL-001', item_name: 'MS Steel Plate 10mm', item_type: 'raw_material', hsn_code: '7208', uom: 'KG', unit_price: 65, gst_rate: 18, reorder_level: 1000, current_stock: 5000, is_active: true, created_at: '2026-01-05' },
      { id: 3002, tenant_id: 'mock-tenant-id', item_code: 'RM-STL-002', item_name: 'SS Sheet 304 Grade', item_type: 'raw_material', hsn_code: '7219', uom: 'KG', unit_price: 280, gst_rate: 18, reorder_level: 500, current_stock: 2500, is_active: true, created_at: '2026-01-05' },
      { id: 3003, tenant_id: 'mock-tenant-id', item_code: 'RM-ELC-001', item_name: 'PCB Board FR4', item_type: 'raw_material', hsn_code: '8534', uom: 'PCS', unit_price: 450, gst_rate: 18, reorder_level: 100, current_stock: 800, is_active: true, created_at: '2026-01-06' },
      { id: 3004, tenant_id: 'mock-tenant-id', item_code: 'RM-ELC-002', item_name: 'Resistor 10K Ohm', item_type: 'raw_material', hsn_code: '8533', uom: 'PCS', unit_price: 2, gst_rate: 12, reorder_level: 5000, current_stock: 50000, is_active: true, created_at: '2026-01-06' },
      { id: 3005, tenant_id: 'mock-tenant-id', item_code: 'FG-MECH-001', item_name: 'Gear Assembly Type A', item_type: 'finished_goods', hsn_code: '8483', uom: 'PCS', unit_price: 1200, gst_rate: 18, reorder_level: 50, current_stock: 250, is_active: true, created_at: '2026-01-08' },
      { id: 3006, tenant_id: 'mock-tenant-id', item_code: 'FG-MECH-002', item_name: 'Ball Bearing 6205', item_type: 'finished_goods', hsn_code: '8482', uom: 'PCS', unit_price: 450, gst_rate: 18, reorder_level: 100, current_stock: 500, is_active: true, created_at: '2026-01-08' },
      { id: 3007, tenant_id: 'mock-tenant-id', item_code: 'FG-ELEC-001', item_name: 'Power Supply 12V 5A', item_type: 'finished_goods', hsn_code: '8504', uom: 'PCS', unit_price: 850, gst_rate: 18, reorder_level: 50, current_stock: 300, is_active: true, created_at: '2026-01-10' },
      { id: 3008, tenant_id: 'mock-tenant-id', item_code: 'PKG-001', item_name: 'Corrugated Box Medium', item_type: 'consumable', hsn_code: '4819', uom: 'PCS', unit_price: 45, gst_rate: 12, reorder_level: 200, current_stock: 1500, is_active: true, created_at: '2026-01-12' },
      { id: 3009, tenant_id: 'mock-tenant-id', item_code: 'SRV-001', item_name: 'Installation Service', item_type: 'service', hsn_code: '998599', uom: 'HRS', unit_price: 800, gst_rate: 18, reorder_level: 0, current_stock: 0, is_active: true, created_at: '2026-01-15' },
      { id: 3010, tenant_id: 'mock-tenant-id', item_code: 'SRV-002', item_name: 'Maintenance AMC', item_type: 'service', hsn_code: '998599', uom: 'MTH', unit_price: 5000, gst_rate: 18, reorder_level: 0, current_stock: 0, is_active: true, created_at: '2026-01-15' },
    ],
    salesOrders: [],
    salesInvoices: [],
    purchaseOrders: [],
    purchaseInvoices: [],
    approvalRequests: [
      { id: 'APR-001', document_type: 'Purchase Order', document_number: 'PO/2026/001', document_id: 1, requested_by: 'Arjun Mehta', requested_at: '2026-03-15T09:30:00', amount: 245000, description: 'Steel Plates 10mm - 500 KG from Steel Suppliers India', required_roles: ['purchase_manager', 'admin', 'ceo'], status: 'pending', priority: 'high', module: 'purchase', link: '/purchase/orders' },
      { id: 'APR-002', document_type: 'Sales Order', document_number: 'SO/2026/089', document_id: 2, requested_by: 'Sneha Rao', requested_at: '2026-03-15T10:15:00', amount: 1850000, description: 'Gear Assembly bulk order - Acme Corporation (credit limit exceeded ₹3.5L)', required_roles: ['sales_manager', 'ceo', 'admin'], status: 'pending', priority: 'urgent', module: 'sales', link: '/sales/orders' },
      { id: 'APR-003', document_type: 'Leave Request', document_number: 'LV/2026/034', document_id: 3, requested_by: 'Rahul Sharma', requested_at: '2026-03-14T14:00:00', amount: 0, description: 'Casual Leave - 18 Mar to 20 Mar (3 days) - Family function', required_roles: ['hr_manager', 'admin', 'ceo'], status: 'pending', priority: 'medium', module: 'hrm', link: '/hrm/leave' },
      { id: 'APR-004', document_type: 'Journal Entry', document_number: 'JV/2026/045', document_id: 4, requested_by: 'Sneha Rao', requested_at: '2026-03-14T11:00:00', amount: 520000, description: 'Depreciation entry - Fixed Assets Q4 FY2025-26', required_roles: ['finance_manager', 'admin', 'ceo'], status: 'pending', priority: 'medium', module: 'finance', link: '/finance/journal' },
      { id: 'APR-005', document_type: 'Purchase Order', document_number: 'PO/2026/002', document_id: 5, requested_by: 'Vikram Patel', requested_at: '2026-03-13T16:30:00', amount: 78000, description: 'IT Equipment - 5 Laptops from Dell India', required_roles: ['purchase_manager', 'admin', 'ceo'], status: 'pending', priority: 'low', module: 'purchase', link: '/purchase/orders' },
      { id: 'APR-006', document_type: 'Credit Limit Override', document_number: 'CLO/2026/012', document_id: 6, requested_by: 'Arjun Mehta', requested_at: '2026-03-13T15:00:00', amount: 350000, description: 'Increase credit limit for Gujarat Industries from ₹10L to ₹13.5L', required_roles: ['finance_manager', 'ceo', 'admin'], status: 'pending', priority: 'high', module: 'finance', link: '/finance/credit-management' },
      { id: 'APR-007', document_type: 'Payroll', document_number: 'PAY/2026/03', document_id: 7, requested_by: 'Kavita Desai', requested_at: '2026-03-12T09:00:00', amount: 1245000, description: 'March 2026 payroll for 25 employees - includes overtime adjustments', required_roles: ['hr_manager', 'finance_manager', 'ceo', 'admin'], status: 'pending', priority: 'high', module: 'hrm', link: '/hrm/payroll' },
      { id: 'APR-008', document_type: 'Purchase Order', document_number: 'PO/2026/098', document_id: 8, requested_by: 'Arjun Mehta', requested_at: '2026-03-10T10:00:00', amount: 189000, description: 'Chemical raw materials - Q1 stock replenishment', required_roles: ['purchase_manager', 'admin', 'ceo'], status: 'approved', actioned_by: 'Admin User', actioned_at: '2026-03-11T09:00:00', comments: 'Approved. Ensure quality certificates.', priority: 'medium', module: 'purchase', link: '/purchase/orders' },
      { id: 'APR-009', document_type: 'Leave Request', document_number: 'LV/2026/031', document_id: 9, requested_by: 'Kavita Desai', requested_at: '2026-03-08T16:00:00', amount: 0, description: 'Sick Leave - 9 Mar (1 day)', required_roles: ['hr_manager', 'admin', 'ceo'], status: 'approved', actioned_by: 'Admin User', actioned_at: '2026-03-09T08:30:00', comments: 'Approved', priority: 'medium', module: 'hrm', link: '/hrm/leave' },
      { id: 'APR-010', document_type: 'Sales Order', document_number: 'SO/2026/082', document_id: 10, requested_by: 'Arjun Mehta', requested_at: '2026-03-07T14:00:00', amount: 650000, description: 'PCB Board order - rejected due to insufficient margin', required_roles: ['sales_manager', 'ceo', 'admin'], status: 'rejected', actioned_by: 'CEO User', actioned_at: '2026-03-08T11:00:00', comments: 'Margin below 15% threshold. Renegotiate pricing.', priority: 'medium', module: 'sales', link: '/sales/orders' },
    ],
    employees: [
      { id: 4001, tenant_id: 'mock-tenant-id', employee_code: 'EMP-001', first_name: 'Arjun', last_name: 'Mehta', employee_name: 'Arjun Mehta', email: 'arjun.mehta@company.com', phone: '9876543210', department: 'Sales', designation: 'Sales Manager', date_of_joining: '2024-06-01', date_of_birth: '1990-03-15', gender: 'male', basic_salary: 60000, hra: 24000, other_allowances: 12000, gross_salary: 96000, pan: 'ABCPM1234A', uan: '100100100100', esic_no: '', bank_account: '50100012345678', bank_ifsc: 'HDFC0001234', reporting_manager: 'Rajesh Sharma', is_active: true, created_at: '2024-06-01' },
      { id: 4002, tenant_id: 'mock-tenant-id', employee_code: 'EMP-002', first_name: 'Sneha', last_name: 'Rao', employee_name: 'Sneha Rao', email: 'sneha.rao@company.com', phone: '9123456789', department: 'Finance', designation: 'Accountant', date_of_joining: '2024-07-15', date_of_birth: '1992-08-22', gender: 'female', basic_salary: 45000, hra: 18000, other_allowances: 9000, gross_salary: 72000, pan: 'BCDPN2345B', uan: '100200200200', esic_no: '', bank_account: '60200023456789', bank_ifsc: 'ICIC0005678', reporting_manager: 'Vikram Patel', is_active: true, created_at: '2024-07-15' },
      { id: 4003, tenant_id: 'mock-tenant-id', employee_code: 'EMP-003', first_name: 'Rahul', last_name: 'Sharma', employee_name: 'Rahul Sharma', email: 'rahul.sharma@company.com', phone: '9988776655', department: 'Production', designation: 'Production Supervisor', date_of_joining: '2024-05-10', date_of_birth: '1988-11-30', gender: 'male', basic_salary: 50000, hra: 20000, other_allowances: 10000, gross_salary: 80000, pan: 'CDEPO3456C', uan: '100300300300', esic_no: 'ESI1234567890', bank_account: '70300034567890', bank_ifsc: 'SBIN0009012', reporting_manager: 'Rajesh Sharma', is_active: true, created_at: '2024-05-10' },
      { id: 4004, tenant_id: 'mock-tenant-id', employee_code: 'EMP-004', first_name: 'Kavita', last_name: 'Desai', employee_name: 'Kavita Desai', email: 'kavita.desai@company.com', phone: '9445566778', department: 'HR', designation: 'HR Executive', date_of_joining: '2024-08-01', date_of_birth: '1993-05-18', gender: 'female', basic_salary: 40000, hra: 16000, other_allowances: 8000, gross_salary: 64000, pan: 'DEFPQ4567D', uan: '100400400400', esic_no: 'ESI2345678901', bank_account: '80400045678901', bank_ifsc: 'UTIB0003456', reporting_manager: 'Admin User', is_active: true, created_at: '2024-08-01' },
      { id: 4005, tenant_id: 'mock-tenant-id', employee_code: 'EMP-005', first_name: 'Vikram', last_name: 'Patel', employee_name: 'Vikram Patel', email: 'vikram.patel@company.com', phone: '9811223344', department: 'IT', designation: 'IT Support Engineer', date_of_joining: '2024-09-15', date_of_birth: '1995-02-10', gender: 'male', basic_salary: 38000, hra: 15200, other_allowances: 7600, gross_salary: 60800, pan: 'EFGQR5678E', uan: '100500500500', esic_no: 'ESI3456789012', bank_account: '90500056789012', bank_ifsc: 'PUNB0007890', reporting_manager: 'Admin User', is_active: true, created_at: '2024-09-15' },
    ],
    accounts: [
      { id: 5001, tenant_id: 'mock-tenant-id', account_code: 'A-1001', account_name: 'Cash in Hand', account_type: 'asset', parent_account: null, is_system: true, balance: 50000, is_active: true, created_at: '2024-04-01' },
      { id: 5002, tenant_id: 'mock-tenant-id', account_code: 'A-1002', account_name: 'HDFC Bank Current Account', account_type: 'asset', parent_account: null, is_system: false, balance: 2500000, is_active: true, created_at: '2024-04-01' },
      { id: 5003, tenant_id: 'mock-tenant-id', account_code: 'A-2001', account_name: 'Sundry Debtors', account_type: 'asset', parent_account: null, is_system: true, balance: 1500000, is_active: true, created_at: '2024-04-01' },
      { id: 5004, tenant_id: 'mock-tenant-id', account_code: 'A-3001', account_name: 'Sundry Creditors', account_type: 'liability', parent_account: null, is_system: true, balance: 800000, is_active: true, created_at: '2024-04-01' },
      { id: 5005, tenant_id: 'mock-tenant-id', account_code: 'A-3002', account_name: 'GST Payable', account_type: 'liability', parent_account: null, is_system: true, balance: 150000, is_active: true, created_at: '2024-04-01' },
      { id: 5006, tenant_id: 'mock-tenant-id', account_code: 'A-4001', account_name: 'Sales Revenue', account_type: 'income', parent_account: null, is_system: true, balance: 5000000, is_active: true, created_at: '2024-04-01' },
      { id: 5007, tenant_id: 'mock-tenant-id', account_code: 'A-5001', account_name: 'Purchase Expense', account_type: 'expense', parent_account: null, is_system: true, balance: 2500000, is_active: true, created_at: '2024-04-01' },
      { id: 5008, tenant_id: 'mock-tenant-id', account_code: 'A-5002', account_name: 'Salary Expense', account_type: 'expense', parent_account: null, is_system: true, balance: 800000, is_active: true, created_at: '2024-04-01' },
      { id: 5009, tenant_id: 'mock-tenant-id', account_code: 'A-5003', account_name: 'Rent Expense', account_type: 'expense', parent_account: null, is_system: true, balance: 180000, is_active: true, created_at: '2024-04-01' },
      { id: 5010, tenant_id: 'mock-tenant-id', account_code: 'A-6001', account_name: 'Share Capital', account_type: 'equity', parent_account: null, is_system: true, balance: 5000000, is_active: true, created_at: '2024-04-01' },
    ]
  };

  let idCounter = 5100;
  const generateId = () => (idCounter++).toString();

  const createMockCRUDApi = (storageKey: string) => ({
    getAll: async () => ({ success: true, data: mockStorage[storageKey] || [] }),
    getById: async (id: string) => ({ 
      success: true, 
      data: mockStorage[storageKey]?.find((item: any) => item.id === id) 
    }),
    create: async (data: any) => {
      const newItem = { ...data, id: generateId(), created_at: new Date().toISOString() };
      mockStorage[storageKey] = [...(mockStorage[storageKey] || []), newItem];
      return { success: true, data: newItem };
    },
    update: async (id: string, data: any) => {
      const index = mockStorage[storageKey]?.findIndex((item: any) => item.id === id);
      if (index >= 0) {
        mockStorage[storageKey][index] = { ...mockStorage[storageKey][index], ...data };
        return { success: true, data: mockStorage[storageKey][index] };
      }
      return { success: false, error: 'Not found' };
    },
    delete: async (id: string) => {
      mockStorage[storageKey] = mockStorage[storageKey]?.filter((item: any) => item.id !== id) || [];
      return { success: true };
    }
  });

  const mockApiResponse = async () => ({ success: true, data: [] });
  const mockApiMethod = () => mockApiResponse;

  window.electronAPI = {
    auth: {
      login: async (username: string, password: string) => {
        const user = mockUsers[username];
        if (user && user.password === password) {
          const { password: _pw, ...safeUser } = user;
          return { success: true, data: safeUser };
        }
        return { success: false, error: 'Invalid credentials' };
      },
      logout: async () => ({ success: true }),
      getCurrentUser: async () => {
        const { password: _pw, ...safeUser } = mockUsers.admin;
        return { success: true, data: safeUser };
      },
      changePassword: async () => ({ success: true })
    },
    dashboard: {
      getStats: async () => ({ 
        success: true, 
        data: {
          salesThisMonth: 1847500,
          purchaseThisMonth: 923400,
          receivablesTotal: 1500000,
          payablesTotal: 800000,
          lowStockItems: 3,
          pendingSalesOrders: 12,
          pendingPurchaseOrders: 7,
          pendingGRNs: 4,
          netProfit: 924100,
          cashBalance: 2550000,
          totalCustomers: mockStorage.customers.length,
          totalVendors: mockStorage.vendors.length,
          totalItems: mockStorage.items.length,
          totalEmployees: mockStorage.employees.length,
          salesGrowth: 12.4,
          purchaseGrowth: -5.2,
          gstPayable: 150000,
          tdsPayable: 42300,
          pendingApprovals: 5,
          monthlyTrend: [
            { month: 'Oct', sales: 1420000, purchase: 810000 },
            { month: 'Nov', sales: 1580000, purchase: 870000 },
            { month: 'Dec', sales: 1690000, purchase: 920000 },
            { month: 'Jan', sales: 1540000, purchase: 780000 },
            { month: 'Feb', sales: 1710000, purchase: 860000 },
            { month: 'Mar', sales: 1847500, purchase: 923400 },
          ],
          topCustomers: [
            { name: 'Acme Corporation Ltd', amount: 542000 },
            { name: 'Tech Solutions India', amount: 385000 },
            { name: 'Gujarat Industries Ltd', amount: 312000 },
            { name: 'Delhi Enterprises', amount: 278500 },
            { name: 'Tamil Nadu Trading Co', amount: 230000 },
          ],
        }
      }),
      getRecentTransactions: async () => ({ 
        success: true, 
        data: [
          { id: 't1', type: 'Sales Invoice', number: 'SI-2026-0145', party: 'Acme Corporation Ltd', amount: 128500, date: '2026-03-28', status: 'paid' },
          { id: 't2', type: 'Purchase Order', number: 'PO-2026-0089', party: 'Steel Suppliers India', amount: 245000, date: '2026-03-27', status: 'pending' },
          { id: 't3', type: 'Receipt', number: 'RCT-2026-0078', party: 'Tech Solutions India', amount: 175000, date: '2026-03-26', status: 'completed' },
          { id: 't4', type: 'Sales Invoice', number: 'SI-2026-0144', party: 'Gujarat Industries Ltd', amount: 92300, date: '2026-03-25', status: 'overdue' },
          { id: 't5', type: 'Payment', number: 'PAY-2026-0056', party: 'Electronic Components Co', amount: 186400, date: '2026-03-24', status: 'completed' },
          { id: 't6', type: 'Sales Order', number: 'SO-2026-0167', party: 'Delhi Enterprises', amount: 315000, date: '2026-03-23', status: 'confirmed' },
          { id: 't7', type: 'GRN', number: 'GRN-2026-0034', party: 'Packaging Solutions Ltd', amount: 78500, date: '2026-03-22', status: 'completed' },
        ]
      })
    },
    finance: {
      getAccounts: async () => ({ success: true, data: mockStorage.accounts }),
      getChartOfAccounts: async (tenantId: string) => ({ 
        success: true, 
        data: mockStorage.accounts.map(a => ({
          ...a,
          code: a.account_code,
          name: a.account_name,
          type: a.account_type,
          parent_id: a.parent_account,
          is_active: a.is_active
        }))
      }),
      createAccount: async (tenantId: string, data: any) => {
        const account = { ...data, id: generateId(), tenant_id: tenantId };
        mockStorage.accounts.push(account);
        return { success: true, data: account };
      },
      updateAccount: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.accounts.findIndex(a => a.id === id);
        if (index >= 0) {
          mockStorage.accounts[index] = { ...mockStorage.accounts[index], ...data };
          return { success: true, data: mockStorage.accounts[index] };
        }
        return { success: false, error: 'Not found' };
      },
      getJournalEntries: async () => ({
        success: true,
        data: [
          { id: 1, entry_number: 'JV-2026-0001', date: '2026-01-15', reference: 'SI-2026-0089', narration: 'Sales invoice to Acme Corporation Ltd', total_debit: 118000, total_credit: 118000, status: 'posted', lines: [
            { account_code: '1120', account_name: 'Accounts Receivable', debit: 118000, credit: 0 },
            { account_code: '4100', account_name: 'Sales Revenue', debit: 0, credit: 100000 },
            { account_code: '2121', account_name: 'CGST Payable', debit: 0, credit: 9000 },
            { account_code: '2122', account_name: 'SGST Payable', debit: 0, credit: 9000 },
          ]},
          { id: 2, entry_number: 'JV-2026-0002', date: '2026-01-16', reference: 'PO-2026-0034', narration: 'Purchase from Steel Suppliers India', total_debit: 59000, total_credit: 59000, status: 'posted', lines: [
            { account_code: '5100', account_name: 'Purchases', debit: 50000, credit: 0 },
            { account_code: '1141', account_name: 'CGST Receivable', debit: 4500, credit: 0 },
            { account_code: '1142', account_name: 'SGST Receivable', debit: 4500, credit: 0 },
            { account_code: '2110', account_name: 'Accounts Payable', debit: 0, credit: 59000 },
          ]},
          { id: 3, entry_number: 'JV-2026-0003', date: '2026-01-17', reference: 'SAL-JAN', narration: 'Salary payment for January 2026', total_debit: 233000, total_credit: 233000, status: 'posted', lines: [
            { account_code: '5200', account_name: 'Salary Expense', debit: 233000, credit: 0 },
            { account_code: '1110', account_name: 'Bank Account', debit: 0, credit: 233000 },
          ]},
          { id: 4, entry_number: 'JV-2026-0004', date: '2026-02-01', reference: 'RENT-FEB', narration: 'Office rent for February', total_debit: 45000, total_credit: 45000, status: 'posted', lines: [
            { account_code: '5300', account_name: 'Rent Expense', debit: 45000, credit: 0 },
            { account_code: '1110', account_name: 'Bank Account', debit: 0, credit: 45000 },
          ]},
          { id: 5, entry_number: 'JV-2026-0005', date: '2026-03-10', reference: 'ADJ-001', narration: 'Depreciation adjustment Q4', total_debit: 87500, total_credit: 87500, status: 'draft', lines: [
            { account_code: '5400', account_name: 'Depreciation', debit: 87500, credit: 0 },
            { account_code: '1300', account_name: 'Accumulated Depreciation', debit: 0, credit: 87500 },
          ]},
        ],
      }),
      createJournalEntry: async (_tid: string, data: any) => {
        const entry = { ...data, id: generateId(), entry_number: `JV-2026-${String(Date.now()).slice(-4)}`, status: 'draft' };
        return { success: true, data: entry };
      },
      getTrialBalance: async () => ({
        success: true,
        data: [
          { id: 1, account_code: 'A-1001', account_name: 'Cash in Hand', account_type: 'Asset', opening_debit: 100000, opening_credit: 0, period_debit: 370000, period_credit: 420000, closing_debit: 50000, closing_credit: 0 },
          { id: 2, account_code: 'A-1002', account_name: 'HDFC Bank Current A/c', account_type: 'Asset', opening_debit: 2000000, opening_credit: 0, period_debit: 1850000, period_credit: 1300000, closing_debit: 2550000, closing_credit: 0 },
          { id: 3, account_code: 'A-2001', account_name: 'Sundry Debtors', account_type: 'Asset', opening_debit: 1200000, opening_credit: 0, period_debit: 1847500, period_credit: 1547500, closing_debit: 1500000, closing_credit: 0 },
          { id: 4, account_code: 'A-3001', account_name: 'Sundry Creditors', account_type: 'Liability', opening_debit: 0, opening_credit: 600000, period_debit: 723400, period_credit: 923400, closing_debit: 0, closing_credit: 800000 },
          { id: 5, account_code: 'A-3002', account_name: 'GST Payable', account_type: 'Liability', opening_debit: 0, opening_credit: 120000, period_debit: 87500, period_credit: 117500, closing_debit: 0, closing_credit: 150000 },
          { id: 6, account_code: 'A-4001', account_name: 'Sales Revenue', account_type: 'Revenue', opening_debit: 0, opening_credit: 3500000, period_debit: 0, period_credit: 1500000, closing_debit: 0, closing_credit: 5000000 },
          { id: 7, account_code: 'A-5001', account_name: 'Purchase Expense', account_type: 'Expense', opening_debit: 1800000, opening_credit: 0, period_debit: 700000, period_credit: 0, closing_debit: 2500000, closing_credit: 0 },
          { id: 8, account_code: 'A-5002', account_name: 'Salary Expense', account_type: 'Expense', opening_debit: 560000, opening_credit: 0, period_debit: 240000, period_credit: 0, closing_debit: 800000, closing_credit: 0 },
          { id: 9, account_code: 'A-5003', account_name: 'Rent Expense', account_type: 'Expense', opening_debit: 135000, opening_credit: 0, period_debit: 45000, period_credit: 0, closing_debit: 180000, closing_credit: 0 },
          { id: 10, account_code: 'A-6001', account_name: 'Share Capital', account_type: 'Equity', opening_debit: 0, opening_credit: 5000000, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 5000000 },
        ],
      }),
      getBankReconciliation: async () => ({
        success: true,
        data: {
          bankEntries: [
            { id: 'B1', date: '2026-03-01', description: 'NEFT-Acme Corp', reference: 'UTR123456', debit: 0, credit: 128500, balance: 2678500, matched: true, matched_to: 'L1', confidence: 98 },
            { id: 'B2', date: '2026-03-05', description: 'CHQ DEP-456789', reference: 'CHQ456789', debit: 175000, credit: 0, balance: 2503500, matched: false },
            { id: 'B3', date: '2026-03-08', description: 'RTGS-Steel Suppliers', reference: 'UTR789012', debit: 245000, credit: 0, balance: 2258500, matched: true, matched_to: 'L3', confidence: 95 },
            { id: 'B4', date: '2026-03-12', description: 'NEFT-Tech Solutions', reference: 'UTR345678', debit: 0, credit: 92300, balance: 2350800, matched: true, matched_to: 'L4', confidence: 92 },
            { id: 'B5', date: '2026-03-15', description: 'DD-RENT MAR 2026', reference: 'DD112233', debit: 45000, credit: 0, balance: 2305800, matched: false },
            { id: 'B6', date: '2026-03-20', description: 'IMPS-Gujarat Ind', reference: 'UTR901234', debit: 0, credit: 312000, balance: 2617800, matched: false },
          ],
          ledgerEntries: [
            { id: 'L1', date: '2026-03-01', voucher_number: 'RCT-078', narration: 'Receipt from Acme Corporation', debit: 128500, credit: 0, party_name: 'Acme Corporation Ltd', matched: true, matched_to: 'B1' },
            { id: 'L2', date: '2026-03-04', voucher_number: 'JV-045', narration: 'Bank charges for Feb', debit: 0, credit: 1250, party_name: null, matched: false },
            { id: 'L3', date: '2026-03-08', voucher_number: 'PAY-056', narration: 'Payment to Steel Suppliers', debit: 0, credit: 245000, party_name: 'Steel Suppliers India', matched: true, matched_to: 'B3' },
            { id: 'L4', date: '2026-03-12', voucher_number: 'RCT-079', narration: 'Receipt from Tech Solutions', debit: 92300, credit: 0, party_name: 'Tech Solutions India', matched: true, matched_to: 'B4' },
            { id: 'L5', date: '2026-03-18', voucher_number: 'PAY-057', narration: 'Salary advance to Rahul', debit: 0, credit: 15000, party_name: 'Rahul Sharma', matched: false },
          ],
          summary: { bank_balance: 2617800, book_balance: 2576350, unmatched_bank: 3, unmatched_book: 2, matched_count: 3, total_entries: 11 },
        },
      }),
      getCreditLimits: async () => ({
        success: true,
        data: {
          customers: mockStorage.customers.map((c: any, i: number) => ({
            id: c.id, customer_code: c.code, customer_name: c.name, gstin: c.gstin,
            credit_limit: c.credit_limit, current_outstanding: [125000, 380000, 95000, 210000, 45000][i] || 0,
            overdue_amount: [0, 42000, 0, 85000, 0][i] || 0,
            utilization_percent: Math.round(([125000, 380000, 95000, 210000, 45000][i] || 0) / c.credit_limit * 100),
            days_overdue: [0, 12, 0, 25, 0][i] || 0, payment_terms: 30,
            last_payment_date: ['2026-03-15', '2026-02-28', '2026-03-20', '2026-02-10', '2026-03-18'][i],
            average_days_to_pay: [18, 32, 22, 38, 15][i] || 20,
            credit_rating: (['A', 'B', 'A', 'C', 'A'] as const)[i] || 'B',
            risk_status: (['low', 'medium', 'low', 'high', 'low'] as const)[i] || 'medium',
            hold_status: i === 3,
          })),
          requests: [
            { id: 'REQ-001', customer_name: 'Tech Solutions India Pvt Ltd', current_limit: 750000, requested_limit: 1200000, requested_by: 'Priya Iyer', requested_date: '2026-03-15', status: 'pending' },
            { id: 'REQ-002', customer_name: 'Tamil Nadu Trading Co', current_limit: 300000, requested_limit: 500000, requested_by: 'Arjun Mehta', requested_date: '2026-03-10', status: 'pending' },
            { id: 'REQ-003', customer_name: 'Acme Corporation Ltd', current_limit: 500000, requested_limit: 800000, requested_by: 'Arjun Mehta', requested_date: '2026-02-28', status: 'approved', remarks: 'Good payment history' },
          ],
        },
      }),
      getBalanceSheet: async () => ({ success: true, data: {
        assets: {
          current: [
            { name: 'Cash in Hand', amount: 50000 },
            { name: 'HDFC Bank Current A/c', amount: 2550000 },
            { name: 'Sundry Debtors', amount: 1500000 },
            { name: 'GST Input Credit', amount: 87500 },
          ],
          fixed: [
            { name: 'Plant & Machinery', amount: 3500000 },
            { name: 'Office Equipment', amount: 450000 },
            { name: 'Less: Depreciation', amount: -875000 },
          ],
        },
        liabilities: {
          current: [
            { name: 'Sundry Creditors', amount: 800000 },
            { name: 'GST Payable', amount: 150000 },
            { name: 'TDS Payable', amount: 42300 },
            { name: 'Salary Payable', amount: 233000 },
          ],
          longTerm: [
            { name: 'Term Loan - HDFC', amount: 1500000 },
          ],
        },
        equity: [
          { name: 'Share Capital', amount: 5000000 },
          { name: 'Retained Earnings', amount: 537200 },
        ],
      }}),
      getProfitAndLoss: async () => ({ success: true, data: {
        revenue: [
          { name: 'Sales Revenue', amount: 5000000 },
          { name: 'Other Income', amount: 125000 },
        ],
        expenses: [
          { name: 'Cost of Goods Sold', amount: 2500000 },
          { name: 'Salary Expense', amount: 800000 },
          { name: 'Rent Expense', amount: 180000 },
          { name: 'Depreciation', amount: 175000 },
          { name: 'Utilities', amount: 85000 },
          { name: 'Office Supplies', amount: 42000 },
          { name: 'Professional Fees', amount: 65000 },
          { name: 'Bank Charges', amount: 12500 },
        ],
        totalRevenue: 5125000,
        totalExpenses: 3859500,
        netProfit: 1265500,
      }}),
      getAccountLedger: async () => ({ success: true, data: [] }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    inventory: {
      getItems: async () => ({ success: true, data: mockStorage.items }),
      createItem: async (tenantId: string, data: any) => {
        const item = { ...data, id: generateId(), tenant_id: tenantId, item_code: `ITEM-${Date.now()}` };
        mockStorage.items.push(item);
        return { success: true, data: item };
      },
      updateItem: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.items.findIndex(item => item.id === id);
        if (index >= 0) {
          mockStorage.items[index] = { ...mockStorage.items[index], ...data };
          return { success: true, data: mockStorage.items[index] };
        }
        return { success: false, error: 'Not found' };
      },
      deleteItem: async (tenantId: string, id: string) => {
        mockStorage.items = mockStorage.items.filter(item => item.id !== id);
        return { success: true };
      },
      getLowStockAlerts: async () => ({ success: true, data: [] }),
      getWarehouses: async () => ({ success: true, data: [
        { id: 1, code: 'WH-MAIN', name: 'Main Warehouse', type: 'Main', address: '123 Industrial Area', city: 'Mumbai', state: 'Maharashtra', manager: 'Rajesh Kumar', total_items: 156, total_value: 4500000, is_active: true },
        { id: 2, code: 'WH-PUNE', name: 'Pune Branch', type: 'Branch', address: '45 MIDC Chakan', city: 'Pune', state: 'Maharashtra', manager: 'Amit Patil', total_items: 78, total_value: 1800000, is_active: true },
        { id: 3, code: 'WH-DEL', name: 'Delhi Warehouse', type: 'Branch', address: '67 Okhla Industrial', city: 'Delhi', state: 'Delhi', manager: 'Suresh Singh', total_items: 45, total_value: 950000, is_active: true },
        { id: 4, code: 'WH-TRANS', name: 'Transit Warehouse', type: 'Transit', address: 'Logistics Hub', city: 'Mumbai', state: 'Maharashtra', manager: 'Vijay More', total_items: 23, total_value: 320000, is_active: true },
        { id: 5, code: 'WH-SCRAP', name: 'Scrap Yard', type: 'Scrap', address: '12 Industrial Area', city: 'Mumbai', state: 'Maharashtra', manager: 'Mahesh Jadhav', total_items: 12, total_value: 45000, is_active: true },
      ]}),
      getStockMovements: async () => ({ success: true, data: [
        { id: 1, date: '2026-01-02', voucher_type: 'Purchase', voucher_number: 'GRN-2026-0001', item_code: 'RM-001', item_name: 'Mild Steel Sheets 2mm', hsn_code: '72085100', from_warehouse: '-', to_warehouse: 'Main Warehouse', quantity_in: 500, quantity_out: 0, uom: 'KG', rate: 75, value: 37500, batch_number: 'BTH-2026-001', remarks: 'PO-2026-0001' },
        { id: 2, date: '2026-01-05', voucher_type: 'Production', voucher_number: 'PRD-2026-0001', item_code: 'FG-001', item_name: 'Steel Brackets Type-A', hsn_code: '73269099', from_warehouse: '-', to_warehouse: 'Finished Goods', quantity_in: 100, quantity_out: 0, uom: 'PCS', rate: 250, value: 25000, batch_number: 'FG-BTH-001', remarks: 'Production completed' },
        { id: 3, date: '2026-01-08', voucher_type: 'Sale', voucher_number: 'DN-2026-0001', item_code: 'FG-001', item_name: 'Steel Brackets Type-A', hsn_code: '73269099', from_warehouse: 'Finished Goods', to_warehouse: '-', quantity_in: 0, quantity_out: 50, uom: 'PCS', rate: 350, value: 17500, batch_number: 'FG-BTH-001', remarks: 'INV-2026-0001' },
        { id: 4, date: '2026-01-12', voucher_type: 'Transfer', voucher_number: 'STN-2026-0001', item_code: 'RM-001', item_name: 'Mild Steel Sheets 2mm', hsn_code: '72085100', from_warehouse: 'Main Warehouse', to_warehouse: 'Production Floor', quantity_in: 0, quantity_out: 200, uom: 'KG', rate: 75, value: 15000, batch_number: 'BTH-2026-001', remarks: 'Transfer for Production' },
        { id: 5, date: '2026-01-15', voucher_type: 'Adjustment', voucher_number: 'ADJ-2026-0001', item_code: 'RM-002', item_name: 'Fasteners Assorted Box', hsn_code: '73181500', from_warehouse: 'Main Warehouse', to_warehouse: '-', quantity_in: 0, quantity_out: 2, uom: 'BOX', rate: 1200, value: 2400, remarks: 'Damaged goods - written off' },
      ]}),
      getStockValuation: async () => ({ success: true, data: [] }),
      getGatePasses: async () => ({ success: true, data: [
        { id: 'GP-001', gate_pass_number: 'GP-2026-0001', date: '2026-03-15', type: 'RGP', party_name: 'ABC Machine Works', purpose: 'Repair - Motor rewinding', status: 'open', expected_return: '2026-03-25', vehicle_no: 'MH-04-AB-1234', authorized_by: 'Rajesh Kumar', items: [
          { description: 'Electric Motor 5HP', quantity: 2, uom: 'Nos', value: 57000, hsn_code: '8501' }
        ]},
        { id: 'GP-002', gate_pass_number: 'GP-2026-0002', date: '2026-03-10', type: 'NRGP', party_name: 'XYZ Traders', purpose: 'Sale - as per Invoice SI-2026-045', status: 'closed', vehicle_no: 'MH-12-CD-5678', authorized_by: 'Priya Iyer', items: [
          { description: 'Steel Brackets Type-A', quantity: 50, uom: 'PCS', value: 17500, hsn_code: '73269099' },
          { description: 'Steel Mounting Plates', quantity: 30, uom: 'PCS', value: 8400, hsn_code: '73269099' }
        ]},
        { id: 'GP-003', gate_pass_number: 'GP-2026-0003', date: '2026-03-18', type: 'RGP', party_name: 'Pune Calibration Lab', purpose: 'Calibration - Pressure Gauges', status: 'open', expected_return: '2026-03-28', vehicle_no: 'MH-14-EF-9012', authorized_by: 'Amit Patil', items: [
          { description: 'Pressure Gauge 0-10 Bar', quantity: 5, uom: 'Nos', value: 12500, hsn_code: '9026' }
        ]},
        { id: 'GP-004', gate_pass_number: 'GP-2026-0004', date: '2026-03-05', type: 'RGP', party_name: 'DEF Paint Works', purpose: 'Powder coating', status: 'returned', returned_date: '2026-03-12', vehicle_no: 'MH-02-GH-3456', authorized_by: 'Rajesh Kumar', items: [
          { description: 'Control Panel Enclosure', quantity: 10, uom: 'Nos', value: 45000, hsn_code: '7326' }
        ]},
      ]}),
      createGatePass: async (_tid: string, data: any) => ({ success: true, data: { ...data, id: generateId(), gate_pass_number: `GP-2026-${String(Date.now()).slice(-4)}` } }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    sales: {
      getCustomers: async () => ({ success: true, data: mockStorage.customers }),
      createCustomer: async (tenantId: string, data: any) => {
        const customer = { ...data, id: generateId(), tenant_id: tenantId };
        mockStorage.customers.push(customer);
        return { success: true, data: customer };
      },
      updateCustomer: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.customers.findIndex(c => c.id === id);
        if (index >= 0) {
          mockStorage.customers[index] = { ...mockStorage.customers[index], ...data };
          return { success: true, data: mockStorage.customers[index] };
        }
        return { success: false, error: 'Not found' };
      },
      deleteCustomer: async (tenantId: string, id: string) => {
        mockStorage.customers = mockStorage.customers.filter(c => c.id !== id);
        return { success: true };
      },
      getSalesOrders: async () => ({ success: true, data: mockStorage.salesOrders }),
      getSalesInvoices: async () => ({ success: true, data: mockStorage.salesInvoices }),
      createSalesInvoice: async (tenantId: string, data: any) => {
        const invoice = { ...data, id: generateId(), invoice_number: `SI-${Date.now()}`, tenant_id: tenantId };
        mockStorage.salesInvoices.push(invoice);
        return { success: true, data: invoice };
      },
      getCustomerReceipts: async () => ({ success: true, data: [] }),
      getAgingReport: async () => ({ success: true, data: [] }),
      getPOSProducts: async () => ({ success: true, data: [
        { id: 'P1', sku: 'FG-PUMP-001', name: 'Centrifugal Pump 2HP', barcode: '8901234567890', price: 15500, gst_rate: 18, hsn_code: '8413', stock: 45, category: 'Finished Goods' },
        { id: 'P2', sku: 'FG-MOTOR-002', name: 'Electric Motor 5HP', barcode: '8901234567891', price: 28500, gst_rate: 18, hsn_code: '8501', stock: 12, category: 'Finished Goods' },
        { id: 'P3', sku: 'COMP-BEARING-003', name: 'Ball Bearing 6205', barcode: '8901234567892', price: 450, gst_rate: 18, hsn_code: '8482', stock: 85, category: 'Components' },
        { id: 'P4', sku: 'FG-VALVE-004', name: 'Butterfly Valve 4inch', barcode: '8901234567893', price: 3200, gst_rate: 18, hsn_code: '8481', stock: 30, category: 'Finished Goods' },
        { id: 'P5', sku: 'COMP-SEAL-005', name: 'Mechanical Seal Kit', barcode: '8901234567894', price: 1800, gst_rate: 18, hsn_code: '8484', stock: 55, category: 'Components' },
        { id: 'P6', sku: 'FG-PANEL-006', name: 'Control Panel Assembly', barcode: '8901234567895', price: 42000, gst_rate: 18, hsn_code: '8537', stock: 8, category: 'Finished Goods' },
      ]}),
      createPOSTransaction: async (_tid: string, data: any) => {
        return { success: true, data: { ...data, id: generateId(), receipt_number: `POS-${Date.now()}` } };
      },
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    purchase: {
      getVendors: async () => ({ success: true, data: mockStorage.vendors }),
      createVendor: async (tenantId: string, data: any) => {
        const vendor = { ...data, id: generateId(), tenant_id: tenantId };
        mockStorage.vendors.push(vendor);
        return { success: true, data: vendor };
      },
      updateVendor: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.vendors.findIndex(v => v.id === id);
        if (index >= 0) {
          mockStorage.vendors[index] = { ...mockStorage.vendors[index], ...data };
          return { success: true, data: mockStorage.vendors[index] };
        }
        return { success: false, error: 'Not found' };
      },
      deleteVendor: async (tenantId: string, id: string) => {
        mockStorage.vendors = mockStorage.vendors.filter(v => v.id !== id);
        return { success: true };
      },
      getPurchaseOrders: async () => ({ success: true, data: mockStorage.purchaseOrders }),
      getPurchaseOrderItems: async (_tid: string, poId: number) => ({ success: true, data: [
        { id: 1, item_name: 'MS Angle 50x50x6mm', hsn_code: '7216', quantity: 100, uom: 'Kg', rate: 75, discount_percent: 5, taxable_amount: 7125, gst_rate: 18, cgst_amount: 641.25, sgst_amount: 641.25, igst_amount: 0, total_amount: 8407.5, received_quantity: 0, pending_quantity: 100 },
        { id: 2, item_name: 'MS Flat 50x6mm', hsn_code: '7216', quantity: 50, uom: 'Kg', rate: 80, discount_percent: 0, taxable_amount: 4000, gst_rate: 18, cgst_amount: 360, sgst_amount: 360, igst_amount: 0, total_amount: 4720, received_quantity: 50, pending_quantity: 0 },
        { id: 3, item_name: 'Welding Rod E6013', hsn_code: '8311', quantity: 20, uom: 'Kg', rate: 180, discount_percent: 2, taxable_amount: 3528, gst_rate: 18, cgst_amount: 317.52, sgst_amount: 317.52, igst_amount: 0, total_amount: 4163.04, received_quantity: 20, pending_quantity: 0 },
      ]}),
      getPurchaseInvoices: async () => ({ success: true, data: mockStorage.purchaseInvoices }),
      getGoodsReceiptNotes: async () => ({ success: true, data: [] }),
      getVendorPayments: async () => ({ success: true, data: [] }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    gst: {
      getEInvoices: async () => ({ success: true, data: [
        { id: 'EI-1', invoice_number: 'SI-2026-0089', invoice_date: '2026-03-15', customer_name: 'Acme Corporation Ltd', customer_gstin: '27AABCA1234M1Z5', total_amount: 118000, irn: 'a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3', ack_number: '132026789012345', ack_date: '2026-03-15T10:30:00', status: 'active', qr_code: 'QR_DATA_HERE' },
        { id: 'EI-2', invoice_number: 'SI-2026-0090', invoice_date: '2026-03-16', customer_name: 'Tech Solutions India Pvt Ltd', customer_gstin: '29AABCT5678N1Z8', total_amount: 245000, irn: 'b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4', ack_number: '132026789012346', ack_date: '2026-03-16T11:15:00', status: 'active', qr_code: 'QR_DATA_HERE' },
        { id: 'EI-3', invoice_number: 'SI-2026-0085', invoice_date: '2026-03-10', customer_name: 'Gujarat Industries Ltd', customer_gstin: '24AABCG9012K1Z2', total_amount: 312000, irn: null, ack_number: null, ack_date: null, status: 'pending', qr_code: null },
        { id: 'EI-4', invoice_number: 'SI-2026-0078', invoice_date: '2026-03-05', customer_name: 'Tamil Nadu Trading Co', customer_gstin: '33AABCT3456L1Z9', total_amount: 89000, irn: 'c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5', ack_number: '132026789012340', ack_date: '2026-03-05T09:45:00', status: 'cancelled', cancel_reason: 'Duplicate invoice', qr_code: null },
      ]}),
      generateIRN: async (_tid: string, invoiceId: string) => ({ success: true, data: { irn: `irn_${Date.now()}`, ack_number: `13${Date.now()}`, ack_date: new Date().toISOString() } }),
      cancelIRN: async (_tid: string, irn: string, reason: string) => ({ success: true }),
      getEWayBills: async () => ({ success: true, data: {
        bills: [
          { id: 'EWB-1', ewb_number: '3210789012345', invoice_number: 'SI-2026-0089', invoice_date: '2026-03-15', customer_name: 'Acme Corporation Ltd', customer_gstin: '27AABCA1234M1Z5', transporter_name: 'Blue Dart Express', transporter_id: 'T001', vehicle_number: 'MH-04-AB-1234', mode: 'Road', distance_km: 250, from_state: 'Maharashtra', to_state: 'Maharashtra', total_value: 118000, generated_date: '2026-03-15', valid_until: '2026-03-16', status: 'active' },
          { id: 'EWB-2', ewb_number: '3210789012346', invoice_number: 'SI-2026-0090', invoice_date: '2026-03-16', customer_name: 'Tech Solutions India Pvt Ltd', customer_gstin: '29AABCT5678N1Z8', transporter_name: 'DTDC Logistics', transporter_id: 'T002', vehicle_number: 'KA-01-CD-5678', mode: 'Road', distance_km: 980, from_state: 'Maharashtra', to_state: 'Karnataka', total_value: 245000, generated_date: '2026-03-16', valid_until: '2026-03-20', status: 'active' },
          { id: 'EWB-3', ewb_number: '3210789012340', invoice_number: 'SI-2026-0078', invoice_date: '2026-03-05', customer_name: 'Tamil Nadu Trading Co', customer_gstin: '33AABCT3456L1Z9', transporter_name: 'Safexpress', transporter_id: 'T003', vehicle_number: 'TN-09-EF-9012', mode: 'Road', distance_km: 1200, from_state: 'Maharashtra', to_state: 'Tamil Nadu', total_value: 89000, generated_date: '2026-03-05', valid_until: '2026-03-10', status: 'expired' },
        ],
        consolidated: [
          { id: 'CEWB-1', cewb_number: 'C3210789012345', vehicle_number: 'MH-04-AB-1234', transporter_name: 'Blue Dart Express', ewb_count: 3, total_value: 452000, generated_date: '2026-03-15', from_place: 'Mumbai', to_place: 'Pune', status: 'active' }
        ],
      }}),
      generateEWayBill: async (_tid: string, data: any) => ({ success: true, data: { ewb_number: `321${Date.now()}` } }),
      cancelEWayBill: async (_tid: string, ewbNumber: string, reason: string) => ({ success: true }),
      extendEWayBill: async (_tid: string, ewbNumber: string, data: any) => ({ success: true }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    manufacturing: {
      getBOMs: async () => ({ success: true, data: [] }),
      getBOMComponents: async (_tid: string, bomId: number) => ({ success: true, data: [
        { id: 1, item_name: 'MS Angle 50x50x6mm', item_code: 'RM-ANGLE-001', quantity: 4, uom: 'Kg', rate: 75, amount: 300, wastage_percent: 5, source_warehouse: 'Main Warehouse' },
        { id: 2, item_name: 'MS Flat 50x6mm', item_code: 'RM-FLAT-001', quantity: 2, uom: 'Kg', rate: 80, amount: 160, wastage_percent: 3, source_warehouse: 'Main Warehouse' },
        { id: 3, item_name: 'Wood Screws M6x25', item_code: 'HW-SCREW-001', quantity: 16, uom: 'Nos', rate: 5, amount: 80, wastage_percent: 10, source_warehouse: 'Main Warehouse' },
        { id: 4, item_name: 'Rubber Feet 25mm', item_code: 'HW-FEET-001', quantity: 4, uom: 'Nos', rate: 15, amount: 60, wastage_percent: 0, source_warehouse: 'Main Warehouse' },
      ]}),
      getBOMOperations: async (_tid: string, bomId: number) => ({ success: true, data: [
        { id: 1, operation_name: 'Cutting', work_center: 'Cutting Machine 1', time_in_mins: 15, hour_rate: 500, operating_cost: 125, description: 'Cut raw materials to size' },
        { id: 2, operation_name: 'Welding', work_center: 'Welding Station 1', time_in_mins: 30, hour_rate: 600, operating_cost: 300, description: 'Weld frame components' },
        { id: 3, operation_name: 'Grinding', work_center: 'Grinding Station 1', time_in_mins: 10, hour_rate: 400, operating_cost: 66.67, description: 'Smooth weld joints and edges' },
      ]}),
      getProductionOrders: async () => ({ success: true, data: [] }),
      getProductionOrderMaterials: async (_tid: string, orderId: number) => ({ success: true, data: [
        { id: 1, item_name: 'MS Angle 50x50x6mm', item_code: 'RM-ANGLE-001', required_qty: 200, transferred_qty: 200, consumed_qty: 120, uom: 'Kg', source_warehouse: 'Main Warehouse', rate: 75, amount: 15000 },
        { id: 2, item_name: 'MS Flat 50x6mm', item_code: 'RM-FLAT-001', required_qty: 100, transferred_qty: 100, consumed_qty: 60, uom: 'Kg', source_warehouse: 'Main Warehouse', rate: 80, amount: 8000 },
        { id: 3, item_name: 'Welding Rod E6013', item_code: 'RM-WELD-001', required_qty: 10, transferred_qty: 10, consumed_qty: 7, uom: 'Kg', source_warehouse: 'Main Warehouse', rate: 180, amount: 1800 },
      ]}),
      getWorkCenters: async () => ({ success: true, data: [] }),
      getOEEMetrics: async () => ({ success: true, data: {
        overall: { availability: 87.5, performance: 92.3, quality: 98.1, oee: 79.2 },
        machines: [
          { id: 'M1', name: 'CNC Lathe #1', status: 'running', availability: 92, performance: 95, quality: 99, oee: 86.6, current_job: 'PO-2026-0034', operator: 'Amit Patel', shift: 'Day', output_target: 100, output_actual: 88, downtime_mins: 48 },
          { id: 'M2', name: 'Milling Machine #2', status: 'running', availability: 88, performance: 90, quality: 97, oee: 76.8, current_job: 'PO-2026-0035', operator: 'Vijay Kumar', shift: 'Day', output_target: 80, output_actual: 72, downtime_mins: 58 },
          { id: 'M3', name: 'Hydraulic Press #1', status: 'idle', availability: 78, performance: 85, quality: 99, oee: 65.6, current_job: null, operator: null, shift: 'Day', output_target: 60, output_actual: 0, downtime_mins: 132 },
          { id: 'M4', name: 'Welding Station #3', status: 'maintenance', availability: 0, performance: 0, quality: 0, oee: 0, current_job: null, operator: null, shift: 'Day', output_target: 50, output_actual: 0, downtime_mins: 480 },
          { id: 'M5', name: 'CNC Lathe #2', status: 'running', availability: 95, performance: 93, quality: 98, oee: 86.5, current_job: 'PO-2026-0036', operator: 'Rahul Singh', shift: 'Day', output_target: 120, output_actual: 108, downtime_mins: 24 },
        ],
        downtimeReasons: [
          { reason: 'Tool Change', minutes: 85, percentage: 28 },
          { reason: 'Setup/Changeover', minutes: 72, percentage: 24 },
          { reason: 'Material Shortage', minutes: 55, percentage: 18 },
          { reason: 'Breakdown', minutes: 48, percentage: 16 },
          { reason: 'Other', minutes: 42, percentage: 14 },
        ],
        trends: { dates: ['Mar 1', 'Mar 5', 'Mar 10', 'Mar 15', 'Mar 20', 'Mar 25'], oee: [76, 78, 82, 79, 84, 79] },
      }}),
      getQCInspections: async () => ({ success: true, data: [
        { id: 'QC-001', inspection_number: 'QCI-2026-0045', date: '2026-03-15', production_order: 'PO-2026-0034', item_name: 'Steel Brackets Type-A', batch_number: 'FG-BTH-001', inspector: 'Anita Das', status: 'passed', total_checked: 100, passed: 98, failed: 2, defect_rate: 2, parameters: [
          { name: 'Dimension A', specification: '50 ± 0.5mm', actual: '50.2mm', result: 'pass' },
          { name: 'Dimension B', specification: '30 ± 0.3mm', actual: '30.1mm', result: 'pass' },
          { name: 'Surface Finish', specification: 'Ra 1.6', actual: 'Ra 1.4', result: 'pass' },
          { name: 'Hardness', specification: '45-50 HRC', actual: '47 HRC', result: 'pass' },
        ]},
        { id: 'QC-002', inspection_number: 'QCI-2026-0046', date: '2026-03-16', production_order: 'PO-2026-0035', item_name: 'Steel Mounting Plates', batch_number: 'FG-BTH-002', inspector: 'Rahul Gupta', status: 'failed', total_checked: 75, passed: 68, failed: 7, defect_rate: 9.3, parameters: [
          { name: 'Thickness', specification: '5 ± 0.2mm', actual: '5.4mm', result: 'fail' },
          { name: 'Flatness', specification: '0.1mm', actual: '0.3mm', result: 'fail' },
          { name: 'Weight', specification: '2.5 ± 0.1 kg', actual: '2.55 kg', result: 'pass' },
        ]},
        { id: 'QC-003', inspection_number: 'QCI-2026-0044', date: '2026-03-14', production_order: 'PO-2026-0033', item_name: 'Centrifugal Pump Assembly', batch_number: 'FG-BTH-003', inspector: 'Anita Das', status: 'passed', total_checked: 20, passed: 20, failed: 0, defect_rate: 0, parameters: [
          { name: 'Pressure Test', specification: '10 Bar', actual: '10.2 Bar', result: 'pass' },
          { name: 'Flow Rate', specification: '100 ± 5 LPM', actual: '102 LPM', result: 'pass' },
          { name: 'Vibration', specification: '<2mm/s', actual: '1.2mm/s', result: 'pass' },
        ]},
      ]}),
      createQCInspection: async (_tid: string, data: any) => ({ success: true, data: { ...data, id: generateId(), inspection_number: `QCI-2026-${String(Date.now()).slice(-4)}` } }),
      getJobWorkChallans: async () => ({ success: true, data: {
        challans: [
          { id: 'JW-001', challan_number: 'JWC-2026-0012', date: '2026-03-10', job_worker: 'ABC Machine Works', job_worker_gstin: '27AABCA5678M1Z5', type: 'Outward', status: 'sent', expected_receipt: '2026-03-25', items: [
            { description: 'Motor Shaft - Machining', quantity: 50, uom: 'Nos', hsn_code: '8483', value: 75000 }
          ]},
          { id: 'JW-002', challan_number: 'JWC-2026-0013', date: '2026-03-12', job_worker: 'DEF Paint Works', job_worker_gstin: '27AABCD9012K1Z2', type: 'Outward', status: 'sent', expected_receipt: '2026-03-22', items: [
            { description: 'Control Panel Enclosure - Powder Coating', quantity: 10, uom: 'Nos', hsn_code: '7326', value: 45000 },
            { description: 'Bracket Cover - Painting', quantity: 100, uom: 'Nos', hsn_code: '7326', value: 15000 }
          ]},
          { id: 'JW-003', challan_number: 'JWC-2026-0008', date: '2026-02-28', job_worker: 'GHI Plating Co', job_worker_gstin: '27AABCG3456L1Z9', type: 'Inward', status: 'received', received_date: '2026-03-08', items: [
            { description: 'Fasteners - Chrome Plating', quantity: 500, uom: 'Nos', hsn_code: '7318', value: 25000 }
          ]},
        ],
        itc04Summary: { quarter: 'Q4 2025-26', total_outward: 5, total_inward: 3, pending_return: 2, total_value_outward: 185000, total_value_inward: 125000, filing_status: 'not_filed', due_date: '2026-04-25' },
      }}),
      getMRPRuns: async () => ({ success: true, data: {
        runs: [
          { id: 'MRP-001', run_date: '2026-03-15', run_by: 'Rajesh Kumar', status: 'completed', horizon_days: 30, items_planned: 12, orders_created: 8, total_requirement: 2450000 },
          { id: 'MRP-002', run_date: '2026-03-08', run_by: 'Rajesh Kumar', status: 'completed', horizon_days: 30, items_planned: 10, orders_created: 6, total_requirement: 1890000 },
        ],
        plannedOrders: [
          { id: 'PLN-001', item_code: 'RM-001', item_name: 'Mild Steel Sheets 2mm', type: 'Purchase', required_date: '2026-03-25', quantity: 500, uom: 'KG', supplier: 'Steel Suppliers India', estimated_cost: 37500, priority: 'high', status: 'firm' },
          { id: 'PLN-002', item_code: 'RM-002', item_name: 'Fasteners Assorted Box', type: 'Purchase', required_date: '2026-03-28', quantity: 100, uom: 'BOX', supplier: 'Hardware Hub', estimated_cost: 120000, priority: 'medium', status: 'firm' },
          { id: 'PLN-003', item_code: 'FG-001', item_name: 'Steel Brackets Type-A', type: 'Production', required_date: '2026-04-01', quantity: 200, uom: 'PCS', estimated_cost: 50000, priority: 'high', status: 'planned' },
          { id: 'PLN-004', item_code: 'COMP-SEAL-005', item_name: 'Mechanical Seal Kit', type: 'Purchase', required_date: '2026-04-05', quantity: 50, uom: 'Nos', supplier: 'Seal India Pvt Ltd', estimated_cost: 90000, priority: 'low', status: 'planned' },
        ],
      }}),
      runMRP: async (_tid: string, params: any) => ({ success: true, data: { run_id: generateId(), items_planned: 12, orders_created: 8 } }),
      getShopFloorData: async () => ({ success: true, data: {
        operator: { id: 'E003', name: 'Amit Patel', empCode: 'EMP-003', department: 'Production', shift: 'Day Shift (6:00-14:00)' },
        activeJobs: [
          { id: 'JOB-001', production_order: 'PO-2026-0034', item_name: 'Steel Brackets Type-A', operation: 'CNC Machining', work_center: 'CNC Lathe #1', target_qty: 100, completed_qty: 72, rejected_qty: 2, status: 'in_progress', start_time: '2026-03-15T06:15:00' },
          { id: 'JOB-002', production_order: 'PO-2026-0035', item_name: 'Steel Mounting Plates', operation: 'Milling', work_center: 'Milling Machine #2', target_qty: 80, completed_qty: 0, rejected_qty: 0, status: 'queued', expected_start: '2026-03-15T10:00:00' },
        ],
        machineStatus: [
          { id: 'M1', name: 'CNC Lathe #1', status: 'running', current_job: 'JOB-001', efficiency: 92 },
          { id: 'M2', name: 'Milling Machine #2', status: 'idle', current_job: null, efficiency: 0 },
          { id: 'M3', name: 'Hydraulic Press #1', status: 'maintenance', current_job: null, efficiency: 0 },
        ],
        shiftMetrics: { target: 250, actual: 186, efficiency: 74, rejects: 4, downtime_mins: 45 },
      }}),
      recordOutput: async (_tid: string, data: any) => ({ success: true }),
      recordDowntime: async (_tid: string, data: any) => ({ success: true }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    hrm: {
      getEmployees: async () => ({ success: true, data: mockStorage.employees }),
      createEmployee: async (tenantId: string, data: any) => {
        const employee = { ...data, id: generateId(), employee_code: `EMP-${Date.now()}`, tenant_id: tenantId };
        mockStorage.employees.push(employee);
        return { success: true, data: employee };
      },
      updateEmployee: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.employees.findIndex(e => e.id === id);
        if (index >= 0) {
          mockStorage.employees[index] = { ...mockStorage.employees[index], ...data };
          return { success: true, data: mockStorage.employees[index] };
        }
        return { success: false, error: 'Not found' };
      },
      getAttendanceReport: async () => ({ success: true, data: [] }),
      getLeaves: async () => ({ success: true, data: [] }),
      getPayrolls: async () => ({ success: true, data: [] }),
      getTaxDeclarations: async () => {
        const raw = [
          { id: 'TD-001', employee_id: 'E001', employee_name: 'Rajesh Kumar', employee_code: 'EMP-001', pan: 'AABPK1234F', department: 'Production', fy: '2025-26', regime: 'old', status: 'submitted', submitted_date: '2026-02-15',
            section_80C: { ppf: 50000, elss: 100000, life_insurance: 25000, total: 175000 },
            section_80D: { self_health: 25000, parent_health: 50000, total: 75000 },
            hra: { rent_paid: 180000, hra_received: 120000, exemption: 120000 },
            section_24: { home_loan_interest: 200000 },
            other_income: 15000, total_investment: 570000, estimated_tax: 45000 },
          { id: 'TD-002', employee_id: 'E002', employee_name: 'Priya Sharma', employee_code: 'EMP-002', pan: 'AABPS5678G', department: 'Accounts', fy: '2025-26', regime: 'new', status: 'submitted', submitted_date: '2026-02-10',
            section_80C: { nps: 50000, total: 50000 },
            section_80D: { self_health: 25000, total: 25000 },
            hra: { rent_paid: 0, hra_received: 0, exemption: 0 },
            section_24: { home_loan_interest: 0 },
            other_income: 0, total_investment: 75000, estimated_tax: 62000 },
          { id: 'TD-003', employee_id: 'E003', employee_name: 'Amit Patel', employee_code: 'EMP-003', pan: 'AABPA9012H', department: 'Production', fy: '2025-26', regime: 'old', status: 'draft', submitted_date: null,
            section_80C: { ppf: 30000, elss: 50000, total: 80000 },
            section_80D: { self_health: 25000, total: 25000 },
            hra: { rent_paid: 120000, hra_received: 60000, exemption: 60000 },
            section_24: { home_loan_interest: 0 },
            other_income: 0, total_investment: 165000, estimated_tax: 28000 },
        ];
        return { success: true, data: raw.map((d: any) => ({
          id: d.id, employeeId: d.employee_id, employeeName: d.employee_name, department: d.department,
          financialYear: d.fy, regime: d.regime === 'old' ? 'Old' : 'New',
          submittedOn: d.submitted_date || '', status: d.status === 'submitted' ? 'Submitted' : d.status === 'draft' ? 'Draft' : d.status,
          totalDeclared: d.total_investment || 0, totalApproved: Math.round((d.total_investment || 0) * 0.85),
          totalTaxSavings: d.estimated_tax || 0,
          components: [
            { component: 'Section 80C', declared: d.section_80C?.total || 0, proofSubmitted: d.status === 'submitted', proofAmount: d.section_80C?.total || 0, approved: Math.round((d.section_80C?.total || 0) * 0.9), status: d.status === 'submitted' ? 'Approved' : 'Pending', icon: null, color: 'blue' },
            { component: 'Section 80D', declared: d.section_80D?.total || 0, proofSubmitted: d.status === 'submitted', proofAmount: d.section_80D?.total || 0, approved: Math.round((d.section_80D?.total || 0) * 0.9), status: d.status === 'submitted' ? 'Approved' : 'Pending', icon: null, color: 'green' },
            { component: 'HRA Exemption', declared: d.hra?.exemption || 0, proofSubmitted: d.status === 'submitted', proofAmount: d.hra?.exemption || 0, approved: d.hra?.exemption || 0, status: d.status === 'submitted' ? 'Approved' : 'Pending', icon: null, color: 'purple' },
            { component: 'Section 24 (Home Loan)', declared: d.section_24?.home_loan_interest || 0, proofSubmitted: d.status === 'submitted', proofAmount: d.section_24?.home_loan_interest || 0, approved: d.section_24?.home_loan_interest || 0, status: d.status === 'submitted' ? 'Approved' : 'Pending', icon: null, color: 'orange' },
          ].filter((c: any) => c.declared > 0),
        }))};
      },
      createTaxDeclaration: async (_tid: string, data: any) => ({ success: true, data: { ...data, id: generateId(), status: 'draft' } }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    approvals: {
      getPendingApprovals: async (_tid: string, role: string) => {
        const allApprovals = mockStorage.approvalRequests || [];
        const pending = allApprovals.filter((a: any) => a.status === 'pending' && a.required_roles.includes(role));
        return { success: true, data: pending };
      },
      getApprovalHistory: async (_tid: string) => {
        const all = mockStorage.approvalRequests || [];
        return { success: true, data: all.filter((a: any) => a.status !== 'pending') };
      },
      getAllApprovals: async () => {
        return { success: true, data: mockStorage.approvalRequests || [] };
      },
      approveRequest: async (_tid: string, requestId: string, approverName: string, comments: string) => {
        const reqs = mockStorage.approvalRequests || [];
        const idx = reqs.findIndex((r: any) => r.id === requestId);
        if (idx >= 0) {
          reqs[idx].status = 'approved';
          reqs[idx].actioned_by = approverName;
          reqs[idx].actioned_at = new Date().toISOString();
          reqs[idx].comments = comments;
        }
        return { success: true };
      },
      rejectRequest: async (_tid: string, requestId: string, approverName: string, comments: string) => {
        const reqs = mockStorage.approvalRequests || [];
        const idx = reqs.findIndex((r: any) => r.id === requestId);
        if (idx >= 0) {
          reqs[idx].status = 'rejected';
          reqs[idx].actioned_by = approverName;
          reqs[idx].actioned_at = new Date().toISOString();
          reqs[idx].comments = comments;
        }
        return { success: true };
      },
      getPendingCount: async (_tid: string, role: string) => {
        const all = mockStorage.approvalRequests || [];
        const count = all.filter((a: any) => a.status === 'pending' && a.required_roles.includes(role)).length;
        return { success: true, data: { count } };
      },
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    notifications: {
      getActivityFeed: async () => ({ success: true, data: [
        { id: 'ACT-001', type: 'success', module: 'sales', title: 'Sales Invoice Created', description: 'Invoice SI-2026-0115 created for Acme Corporation - ₹1,18,000', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), actor: 'Arjun Mehta', read: false },
        { id: 'ACT-002', type: 'warning', module: 'approvals', title: 'Approval Pending', description: 'Purchase Order PO/2026/001 (₹2,45,000) awaiting your approval', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), actor: 'System', read: false },
        { id: 'ACT-003', type: 'info', module: 'purchase', title: 'GRN Received', description: 'GRN-2026-0042 received from Steel Suppliers India - 500 KG MS Steel Plate', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), actor: 'Vikram Patel', read: false },
        { id: 'ACT-004', type: 'success', module: 'hrm', title: 'Leave Approved', description: 'Casual leave for Rahul Sharma (18-20 Mar) approved by HR Manager', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), actor: 'Kavita Desai', read: false },
        { id: 'ACT-005', type: 'error', module: 'manufacturing', title: 'QC Inspection Failed', description: 'QCI-2026-0046: Steel Mounting Plates - 9.3% defect rate (threshold: 5%)', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), actor: 'Rahul Gupta', read: false },
        { id: 'ACT-006', type: 'info', module: 'finance', title: 'Bank Reconciliation', description: 'HDFC Bank statement imported - 45 transactions matched, 3 pending', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), actor: 'Sneha Rao', read: true },
        { id: 'ACT-007', type: 'warning', module: 'sales', title: 'Credit Limit Warning', description: 'Gujarat Industries approaching credit limit (₹9.2L of ₹10L utilized)', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), actor: 'System', read: true },
        { id: 'ACT-008', type: 'success', module: 'manufacturing', title: 'Production Completed', description: 'PRO/2025-26/002: 100 Plastic Chairs completed ahead of schedule', timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), actor: 'Amit Patel', read: true },
        { id: 'ACT-009', type: 'info', module: 'purchase', title: 'Purchase Order Submitted', description: 'PO/2026/003 for Electronic Components - ₹3,45,000 sent to vendor', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), actor: 'Sunita Rao', read: true },
        { id: 'ACT-010', type: 'success', module: 'approvals', title: 'Approval Completed', description: 'PO/2026/098 approved by Admin User - Chemical raw materials', timestamp: new Date(Date.now() - 26 * 3600000).toISOString(), actor: 'Admin User', read: true },
        { id: 'ACT-011', type: 'warning', module: 'hrm', title: 'Payroll Due', description: 'March 2026 payroll processing deadline in 3 days - 25 employees pending', timestamp: new Date(Date.now() - 28 * 3600000).toISOString(), actor: 'System', read: true },
        { id: 'ACT-012', type: 'info', module: 'finance', title: 'GST Return Filed', description: 'GSTR-1 for February 2026 filed successfully - 142 invoices reported', timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), actor: 'Sneha Rao', read: true },
        { id: 'ACT-013', type: 'error', module: 'sales', title: 'Payment Overdue', description: 'Delhi Enterprises - ₹4,50,000 overdue by 15 days on INV-2026-0078', timestamp: new Date(Date.now() - 50 * 3600000).toISOString(), actor: 'System', read: true },
        { id: 'ACT-014', type: 'success', module: 'manufacturing', title: 'Job Work Received', description: 'JWC-2026-0008: Chrome plating of 500 fasteners received from GHI Plating Co', timestamp: new Date(Date.now() - 72 * 3600000).toISOString(), actor: 'Warehouse Team', read: true },
      ]}),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    master: {
      getTenant: async () => ({ success: true, data: { id: 'mock-tenant-id', name: 'Demo Company' } }),
      updateTenant: async () => ({ success: true }),
      getUsers: async () => ({ success: true, data: [] }),
      createUser: async () => ({ success: true }),
      updateUser: async () => ({ success: true }),
      getRoles: async () => ({ success: true, data: [] }),
      getUnitsOfMeasure: async () => ({ success: true, data: [
        { id: '1', code: 'PCS', name: 'Pieces' },
        { id: '2', code: 'KG', name: 'Kilograms' },
        { id: '3', code: 'LTR', name: 'Liters' },
        { id: '4', code: 'MTR', name: 'Meters' }
      ] }),
      getHSNCodes: async () => ({ success: true, data: [] }),
      getCategories: async () => ({ success: true, data: [] }),
      createCategory: async () => ({ success: true }),
      getCustomers: async () => ({ success: true, data: mockStorage.customers }),
      getVendors: async () => ({ success: true, data: mockStorage.vendors })
    },
    report: new Proxy({}, { get: () => mockApiMethod() }),
    platform: 'browser',
    versions: { node: 'N/A', chrome: 'N/A', electron: 'N/A' }
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
