/**
 * SA ERP - Preload Script
 * Exposes safe APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Finance API
const financeAPI = {
  // Chart of Accounts
  getChartOfAccounts: (tenantId: string) => ipcRenderer.invoke('finance:getChartOfAccounts', tenantId),
  createAccount: (tenantId: string, data: unknown) => ipcRenderer.invoke('finance:createAccount', tenantId, data),
  updateAccount: (id: string, tenantId: string, data: unknown) => ipcRenderer.invoke('finance:updateAccount', id, tenantId, data),
  getAccountBalance: (tenantId: string, accountId: string, asOfDate?: string) => 
    ipcRenderer.invoke('finance:getAccountBalance', tenantId, accountId, asOfDate),
  getTrialBalance: (tenantId: string, asOfDate?: string) => 
    ipcRenderer.invoke('finance:getTrialBalance', tenantId, asOfDate),
  
  // Journal Entries
  createJournalEntry: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('finance:createJournalEntry', tenantId, data, userId),
  getJournalEntry: (id: string, tenantId: string) => ipcRenderer.invoke('finance:getJournalEntry', id, tenantId),
  postJournalEntry: (id: string, tenantId: string) => ipcRenderer.invoke('finance:postJournalEntry', id, tenantId),
  getAccountLedger: (tenantId: string, accountId: string, fromDate: string, toDate: string) => 
    ipcRenderer.invoke('finance:getAccountLedger', tenantId, accountId, fromDate, toDate),
  
  // Reports
  getProfitAndLoss: (tenantId: string, fromDate: string, toDate: string) => 
    ipcRenderer.invoke('finance:getProfitAndLoss', tenantId, fromDate, toDate),
  getBalanceSheet: (tenantId: string, asOfDate: string) => 
    ipcRenderer.invoke('finance:getBalanceSheet', tenantId, asOfDate)
};

// Inventory API
const inventoryAPI = {
  // Items
  createItem: (tenantId: string, data: unknown) => ipcRenderer.invoke('inventory:createItem', tenantId, data),
  updateItem: (id: string, tenantId: string, data: unknown) => ipcRenderer.invoke('inventory:updateItem', id, tenantId, data),
  getItem: (id: string, tenantId: string) => ipcRenderer.invoke('inventory:getItem', id, tenantId),
  searchItems: (tenantId: string, query: string, limit?: number) => 
    ipcRenderer.invoke('inventory:searchItems', tenantId, query, limit),
  getLowStockItems: (tenantId: string) => ipcRenderer.invoke('inventory:getLowStockItems', tenantId),
  getItems: (tenantId: string) => ipcRenderer.invoke('inventory:getItems', tenantId),
  getLowStockAlerts: (tenantId: string) => ipcRenderer.invoke('inventory:getLowStockAlerts', tenantId),
  
  // Warehouses
  createWarehouse: (tenantId: string, data: unknown) => ipcRenderer.invoke('inventory:createWarehouse', tenantId, data),
  getWarehouse: (id: string, tenantId: string) => ipcRenderer.invoke('inventory:getWarehouse', id, tenantId),
  getWarehouses: (tenantId: string) => ipcRenderer.invoke('inventory:getWarehouses', tenantId),
  
  // Stock Operations
  receiveStock: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('inventory:receiveStock', tenantId, data, userId),
  issueStock: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('inventory:issueStock', tenantId, data, userId),
  transferStock: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('inventory:transferStock', tenantId, data, userId),
  adjustStock: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('inventory:adjustStock', tenantId, data, userId),
  
  // Stock Queries
  getItemStock: (tenantId: string, itemId: string) => ipcRenderer.invoke('inventory:getItemStock', tenantId, itemId),
  getStockMovements: (tenantId: string, itemId: string, fromDate?: string, toDate?: string) => 
    ipcRenderer.invoke('inventory:getStockMovements', tenantId, itemId, fromDate, toDate),
  getStockValuation: (tenantId: string) => ipcRenderer.invoke('inventory:getStockValuation', tenantId)
};

// Sales API
const salesAPI = {
  // Customers
  createCustomer: (tenantId: string, data: unknown) => ipcRenderer.invoke('sales:createCustomer', tenantId, data),
  updateCustomer: (id: string, tenantId: string, data: unknown) => 
    ipcRenderer.invoke('sales:updateCustomer', id, tenantId, data),
  getCustomer: (id: string, tenantId: string) => ipcRenderer.invoke('sales:getCustomer', id, tenantId),
  searchCustomers: (tenantId: string, query: string) => ipcRenderer.invoke('sales:searchCustomers', tenantId, query),
  getCustomerBalance: (tenantId: string, customerId: string) => 
    ipcRenderer.invoke('sales:getCustomerBalance', tenantId, customerId),
  
  // Sales Orders
  createSalesOrder: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('sales:createSalesOrder', tenantId, data, userId),
  getSalesOrder: (id: string, tenantId: string) => ipcRenderer.invoke('sales:getSalesOrder', id, tenantId),
  confirmSalesOrder: (id: string, tenantId: string) => ipcRenderer.invoke('sales:confirmSalesOrder', id, tenantId),
  
  // Sales Invoices
  createSalesInvoice: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('sales:createSalesInvoice', tenantId, data, userId),
  getSalesInvoice: (id: string, tenantId: string) => ipcRenderer.invoke('sales:getSalesInvoice', id, tenantId),
  getOutstandingInvoices: (tenantId: string, customerId?: string) => 
    ipcRenderer.invoke('sales:getOutstandingInvoices', tenantId, customerId),
  
  // Customer Receipts
  createCustomerReceipt: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('sales:createCustomerReceipt', tenantId, data, userId),
  getCustomerReceipts: (tenantId: string) => ipcRenderer.invoke('sales:getCustomerReceipts', tenantId),
  
  // List methods
  getSalesOrders: (tenantId: string) => ipcRenderer.invoke('sales:getSalesOrders', tenantId),
  getSalesInvoices: (tenantId: string) => ipcRenderer.invoke('sales:getSalesInvoices', tenantId),
  
  // Reports
  getSalesReport: (tenantId: string, fromDate: string, toDate: string) => 
    ipcRenderer.invoke('sales:getSalesReport', tenantId, fromDate, toDate),
  getAgingReport: (tenantId: string) => ipcRenderer.invoke('sales:getAgingReport', tenantId)
};

// Purchase API
const purchaseAPI = {
  // Vendors
  createVendor: (tenantId: string, data: unknown) => ipcRenderer.invoke('purchase:createVendor', tenantId, data),
  updateVendor: (id: string, tenantId: string, data: unknown) => 
    ipcRenderer.invoke('purchase:updateVendor', id, tenantId, data),
  getVendor: (id: string, tenantId: string) => ipcRenderer.invoke('purchase:getVendor', id, tenantId),
  searchVendors: (tenantId: string, query: string) => ipcRenderer.invoke('purchase:searchVendors', tenantId, query),
  getVendorBalance: (tenantId: string, vendorId: string) => 
    ipcRenderer.invoke('purchase:getVendorBalance', tenantId, vendorId),
  
  // Purchase Orders
  createPurchaseOrder: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('purchase:createPurchaseOrder', tenantId, data, userId),
  getPurchaseOrder: (id: string, tenantId: string) => ipcRenderer.invoke('purchase:getPurchaseOrder', id, tenantId),
  approvePurchaseOrder: (id: string, tenantId: string) => ipcRenderer.invoke('purchase:approvePurchaseOrder', id, tenantId),
  getPendingPurchaseOrders: (tenantId: string, vendorId?: string) => 
    ipcRenderer.invoke('purchase:getPendingPurchaseOrders', tenantId, vendorId),
  
  // GRN
  createGRN: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('purchase:createGRN', tenantId, data, userId),
  
  // Purchase Invoices
  createPurchaseInvoice: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('purchase:createPurchaseInvoice', tenantId, data, userId),
  getOutstandingInvoices: (tenantId: string, vendorId?: string) => 
    ipcRenderer.invoke('purchase:getOutstandingInvoices', tenantId, vendorId),
  getPurchaseInvoices: (tenantId: string) => ipcRenderer.invoke('purchase:getPurchaseInvoices', tenantId),
  getPurchaseOrders: (tenantId: string) => ipcRenderer.invoke('purchase:getPurchaseOrders', tenantId),
  
  // GRN
  getGoodsReceiptNotes: (tenantId: string) => ipcRenderer.invoke('purchase:getGoodsReceiptNotes', tenantId),
  
  // Vendor Payments
  createVendorPayment: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('purchase:createVendorPayment', tenantId, data, userId),
  getVendorPayments: (tenantId: string) => ipcRenderer.invoke('purchase:getVendorPayments', tenantId),
  
  // Reports
  getPurchaseReport: (tenantId: string, fromDate: string, toDate: string) => 
    ipcRenderer.invoke('purchase:getPurchaseReport', tenantId, fromDate, toDate),
  getAgingReport: (tenantId: string) => ipcRenderer.invoke('purchase:getAgingReport', tenantId)
};

// GST API
const gstAPI = {
  // E-Invoice
  generateEInvoiceJson: (tenantId: string, invoiceId: string) => 
    ipcRenderer.invoke('gst:generateEInvoiceJson', tenantId, invoiceId),
  submitEInvoice: (tenantId: string, invoiceId: string, userId: string) => 
    ipcRenderer.invoke('gst:submitEInvoice', tenantId, invoiceId, userId),
  cancelEInvoice: (tenantId: string, einvoiceId: string, reason: string) => 
    ipcRenderer.invoke('gst:cancelEInvoice', tenantId, einvoiceId, reason),
  
  // E-Way Bill
  generateEwayBill: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('gst:generateEwayBill', tenantId, data, userId),
  updateEwayBillVehicle: (tenantId: string, ewayBillId: string, vehicleNumber: string, reason: string) => 
    ipcRenderer.invoke('gst:updateEwayBillVehicle', tenantId, ewayBillId, vehicleNumber, reason),
  getExpiringEwayBills: (tenantId: string, daysAhead?: number) => 
    ipcRenderer.invoke('gst:getExpiringEwayBills', tenantId, daysAhead),
  
  // GSTR Returns
  prepareGSTR1: (tenantId: string, returnPeriod: string) => 
    ipcRenderer.invoke('gst:prepareGSTR1', tenantId, returnPeriod),
  getGSTR1B2BDetails: (tenantId: string, returnPeriod: string) => 
    ipcRenderer.invoke('gst:getGSTR1B2BDetails', tenantId, returnPeriod),
  
  // ITC Reconciliation
  performITCReconciliation: (tenantId: string, returnPeriod: string) => 
    ipcRenderer.invoke('gst:performITCReconciliation', tenantId, returnPeriod),
  
  // Reports
  getGSTLiabilitySummary: (tenantId: string, fromDate: string, toDate: string) => 
    ipcRenderer.invoke('gst:getGSTLiabilitySummary', tenantId, fromDate, toDate),
  getHSNWiseSummary: (tenantId: string, fromDate: string, toDate: string) => 
    ipcRenderer.invoke('gst:getHSNWiseSummary', tenantId, fromDate, toDate),
  
  // TDS Management
  getTdsSections: () => ipcRenderer.invoke('gst:getTdsSections'),
  getTdsTransactions: (tenantId: string, filters?: unknown) => 
    ipcRenderer.invoke('gst:getTdsTransactions', tenantId, filters),
  getTdsSummary: (tenantId: string, quarter?: string) => 
    ipcRenderer.invoke('gst:getTdsSummary', tenantId, quarter)
};

// Master Data API
const masterAPI = {
  // Tenants
  getTenant: (tenantId: string) => ipcRenderer.invoke('master:getTenant', tenantId),
  updateTenant: (tenantId: string, data: unknown) => ipcRenderer.invoke('master:updateTenant', tenantId, data),
  
  // Users
  getUsers: (tenantId: string) => ipcRenderer.invoke('master:getUsers', tenantId),
  createUser: (tenantId: string, data: unknown) => ipcRenderer.invoke('master:createUser', tenantId, data),
  updateUser: (id: string, tenantId: string, data: unknown) => ipcRenderer.invoke('master:updateUser', id, tenantId, data),
  
  // Roles
  getRoles: (tenantId: string) => ipcRenderer.invoke('master:getRoles', tenantId),
  
  // Units of Measure
  getUnitsOfMeasure: (tenantId: string) => ipcRenderer.invoke('master:getUnitsOfMeasure', tenantId),
  
  // HSN Codes
  getHSNCodes: (query?: string) => ipcRenderer.invoke('master:getHSNCodes', query),
  
  // Categories
  getCategories: (tenantId: string) => ipcRenderer.invoke('master:getCategories', tenantId),
  createCategory: (tenantId: string, data: unknown) => ipcRenderer.invoke('master:createCategory', tenantId, data)
};

// HRM API
const hrmAPI = {
  // Employees
  createEmployee: (tenantId: string, data: unknown) => ipcRenderer.invoke('hrm:createEmployee', tenantId, data),
  getEmployee: (id: string, tenantId: string) => ipcRenderer.invoke('hrm:getEmployee', id, tenantId),
  getEmployees: (tenantId: string, filters?: { departmentId?: string; status?: string }) => 
    ipcRenderer.invoke('hrm:getEmployees', tenantId, filters),
  updateEmployee: (id: string, tenantId: string, data: unknown) => 
    ipcRenderer.invoke('hrm:updateEmployee', id, tenantId, data),
  
  // Salary
  createSalaryStructure: (tenantId: string, data: unknown) => 
    ipcRenderer.invoke('hrm:createSalaryStructure', tenantId, data),
  getSalaryStructure: (employeeId: string, tenantId: string) => 
    ipcRenderer.invoke('hrm:getSalaryStructure', employeeId, tenantId),
  
  // Attendance
  recordAttendance: (tenantId: string, data: unknown) => 
    ipcRenderer.invoke('hrm:recordAttendance', tenantId, data),
  getAttendanceReport: (tenantId: string, employeeId: string, month: string) => 
    ipcRenderer.invoke('hrm:getAttendanceReport', tenantId, employeeId, month),
  
  // Leave Management
  applyLeave: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('hrm:applyLeave', tenantId, data, userId),
  approveLeave: (id: string, tenantId: string, approverId: string, approved: boolean, remarks?: string) => 
    ipcRenderer.invoke('hrm:approveLeave', id, tenantId, approverId, approved, remarks),
  getLeaveBalance: (tenantId: string, employeeId: string, year?: string) => 
    ipcRenderer.invoke('hrm:getLeaveBalance', tenantId, employeeId, year),
  getLeaves: (tenantId: string, filters?: unknown) => 
    ipcRenderer.invoke('hrm:getLeaves', tenantId, filters),
  
  // Payroll
  createPayroll: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('hrm:createPayroll', tenantId, data, userId),
  getPayroll: (id: string, tenantId: string) => 
    ipcRenderer.invoke('hrm:getPayroll', id, tenantId),
  getPayrolls: (tenantId: string, month: string) => 
    ipcRenderer.invoke('hrm:getPayrolls', tenantId, month),
  processPayroll: (tenantId: string, month: string, userId: string) => 
    ipcRenderer.invoke('hrm:processPayroll', tenantId, month, userId)
};

// Manufacturing API
const manufacturingAPI = {
  // BOM
  createBOM: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('manufacturing:createBOM', tenantId, data, userId),
  getBOM: (id: string, tenantId: string) => 
    ipcRenderer.invoke('manufacturing:getBOM', id, tenantId),
  getBOMs: (tenantId: string, itemId?: string) => 
    ipcRenderer.invoke('manufacturing:getBOMs', tenantId, itemId),
  
  // Production Orders
  createProductionOrder: (tenantId: string, data: unknown, userId: string) => 
    ipcRenderer.invoke('manufacturing:createProductionOrder', tenantId, data, userId),
  getProductionOrder: (id: string, tenantId: string) => 
    ipcRenderer.invoke('manufacturing:getProductionOrder', id, tenantId),
  getProductionOrders: (tenantId: string, filters?: { status?: string }) => 
    ipcRenderer.invoke('manufacturing:getProductionOrders', tenantId, filters),
  startProduction: (id: string, tenantId: string) => 
    ipcRenderer.invoke('manufacturing:startProduction', id, tenantId),
  completeProduction: (id: string, tenantId: string, actualQty: number) => 
    ipcRenderer.invoke('manufacturing:completeProduction', id, tenantId, actualQty),
  
  // Work Centers
  createWorkCenter: (tenantId: string, data: unknown) => 
    ipcRenderer.invoke('manufacturing:createWorkCenter', tenantId, data),
  getWorkCenter: (id: string, tenantId: string) => 
    ipcRenderer.invoke('manufacturing:getWorkCenter', id, tenantId),
  getWorkCenters: (tenantId: string) => 
    ipcRenderer.invoke('manufacturing:getWorkCenters', tenantId)
};

// Report API
const reportAPI = {
  // Export
  exportToPdf: (reportType: string, data: unknown) => ipcRenderer.invoke('report:exportToPdf', reportType, data),
  exportToExcel: (reportType: string, data: unknown) => ipcRenderer.invoke('report:exportToExcel', reportType, data),
  
  // Print
  print: (reportType: string, data: unknown) => ipcRenderer.invoke('report:print', reportType, data)
};

// Auth API
const authAPI = {
  login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
  changePassword: (userId: string, oldPassword: string, newPassword: string) => 
    ipcRenderer.invoke('auth:changePassword', userId, oldPassword, newPassword)
};

// Dashboard API
const dashboardAPI = {
  getStats: (tenantId: string) => ipcRenderer.invoke('dashboard:getStats', tenantId),
  getRecentTransactions: (tenantId: string, limit?: number) => 
    ipcRenderer.invoke('dashboard:getRecentTransactions', tenantId, limit)
};

// Expose APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  finance: financeAPI,
  inventory: inventoryAPI,
  sales: salesAPI,
  purchase: purchaseAPI,
  gst: gstAPI,
  hrm: hrmAPI,
  manufacturing: manufacturingAPI,
  master: masterAPI,
  report: reportAPI,
  auth: authAPI,
  dashboard: dashboardAPI,
  
  // Utility functions
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Type definitions for renderer
export type ElectronAPI = {
  finance: typeof financeAPI;
  inventory: typeof inventoryAPI;
  sales: typeof salesAPI;
  purchase: typeof purchaseAPI;
  gst: typeof gstAPI;
  hrm: typeof hrmAPI;
  manufacturing: typeof manufacturingAPI;
  master: typeof masterAPI;
  report: typeof reportAPI;
  auth: typeof authAPI;
  dashboard: typeof dashboardAPI;
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
};

