/**
 * SA ERP - Type Declarations for Window API
 */

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FinanceAPI {
  getChartOfAccounts(tenantId: string): Promise<APIResponse>;
  createAccount(tenantId: string, data: unknown): Promise<APIResponse>;
  updateAccount(id: string, tenantId: string, data: unknown): Promise<APIResponse>;
  getAccountBalance(tenantId: string, accountId: string, asOfDate?: string): Promise<APIResponse>;
  getTrialBalance(tenantId: string, asOfDate?: string): Promise<APIResponse>;
  createJournalEntry(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getJournalEntry(id: string, tenantId: string): Promise<APIResponse>;
  postJournalEntry(id: string, tenantId: string): Promise<APIResponse>;
  getAccountLedger(tenantId: string, accountId: string, fromDate: string, toDate: string): Promise<APIResponse>;
  getProfitAndLoss(tenantId: string, fromDate: string, toDate: string): Promise<APIResponse>;
  getBalanceSheet(tenantId: string, asOfDate: string): Promise<APIResponse>;
}

export interface InventoryAPI {
  createItem(tenantId: string, data: unknown): Promise<APIResponse>;
  updateItem(id: string, tenantId: string, data: unknown): Promise<APIResponse>;
  getItem(id: string, tenantId: string): Promise<APIResponse>;
  getItems(tenantId: string): Promise<APIResponse<any[]>>;
  searchItems(tenantId: string, query: string, limit?: number): Promise<APIResponse<any[]>>;
  getLowStockItems(tenantId: string): Promise<APIResponse<any[]>>;
  getLowStockAlerts(tenantId: string): Promise<APIResponse<any[]>>;
  createWarehouse(tenantId: string, data: unknown): Promise<APIResponse>;
  getWarehouse(id: string, tenantId: string): Promise<APIResponse>;
  getWarehouses(tenantId: string): Promise<APIResponse<any[]>>;
  receiveStock(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  issueStock(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  transferStock(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  adjustStock(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getItemStock(tenantId: string, itemId: string): Promise<APIResponse>;
  getStockMovements(tenantId: string, filters?: any): Promise<APIResponse<any[]>>;
  getStockValuation(tenantId: string): Promise<APIResponse<any[]>>;
}

export interface SalesAPI {
  createCustomer(tenantId: string, data: unknown): Promise<APIResponse>;
  updateCustomer(id: string, tenantId: string, data: unknown): Promise<APIResponse>;
  getCustomer(id: string, tenantId: string): Promise<APIResponse>;
  searchCustomers(tenantId: string, query: string): Promise<APIResponse<any[]>>;
  getCustomerBalance(tenantId: string, customerId: string): Promise<APIResponse>;
  createSalesOrder(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getSalesOrder(id: string, tenantId: string): Promise<APIResponse>;
  getSalesOrders(tenantId: string): Promise<APIResponse<any[]>>;
  confirmSalesOrder(id: string, tenantId: string): Promise<APIResponse>;
  createSalesInvoice(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getSalesInvoice(id: string, tenantId: string): Promise<APIResponse>;
  getSalesInvoices(tenantId: string): Promise<APIResponse<any[]>>;
  getOutstandingInvoices(tenantId: string, customerId?: string): Promise<APIResponse<any[]>>;
  createCustomerReceipt(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getCustomerReceipts(tenantId: string): Promise<APIResponse<any[]>>;
  getSalesReport(tenantId: string, fromDate: string, toDate: string): Promise<APIResponse>;
  getAgingReport(tenantId: string): Promise<APIResponse>;
}

export interface PurchaseAPI {
  createVendor(tenantId: string, data: unknown): Promise<APIResponse>;
  updateVendor(id: string, tenantId: string, data: unknown): Promise<APIResponse>;
  getVendor(id: string, tenantId: string): Promise<APIResponse>;
  searchVendors(tenantId: string, query: string): Promise<APIResponse<any[]>>;
  getVendorBalance(tenantId: string, vendorId: string): Promise<APIResponse>;
  createPurchaseOrder(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getPurchaseOrder(id: string, tenantId: string): Promise<APIResponse>;
  getPurchaseOrders(tenantId: string): Promise<APIResponse<any[]>>;
  approvePurchaseOrder(id: string, tenantId: string): Promise<APIResponse>;
  getPendingPurchaseOrders(tenantId: string, vendorId?: string): Promise<APIResponse<any[]>>;
  createGRN(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getGoodsReceiptNotes(tenantId: string): Promise<APIResponse<any[]>>;
  createPurchaseInvoice(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getPurchaseInvoices(tenantId: string): Promise<APIResponse<any[]>>;
  getOutstandingInvoices(tenantId: string, vendorId?: string): Promise<APIResponse<any[]>>;
  createVendorPayment(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getVendorPayments(tenantId: string): Promise<APIResponse<any[]>>;
  getPurchaseReport(tenantId: string, fromDate: string, toDate: string): Promise<APIResponse>;
  getAgingReport(tenantId: string): Promise<APIResponse>;
}

export interface GSTAPI {
  generateEInvoiceJson(tenantId: string, invoiceId: string): Promise<APIResponse>;
  submitEInvoice(tenantId: string, invoiceId: string, userId: string): Promise<APIResponse>;
  cancelEInvoice(tenantId: string, einvoiceId: string, reason: string): Promise<APIResponse>;
  generateEwayBill(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  updateEwayBillVehicle(tenantId: string, ewayBillId: string, vehicleNumber: string, reason: string): Promise<APIResponse>;
  getExpiringEwayBills(tenantId: string, daysAhead?: number): Promise<APIResponse<any[]>>;
  prepareGSTR1(tenantId: string, returnPeriod: string): Promise<APIResponse>;
  getGSTR1Data(tenantId: string, month: string): Promise<APIResponse>;
  getGSTR1B2BDetails(tenantId: string, returnPeriod: string): Promise<APIResponse>;
  performITCReconciliation(tenantId: string, returnPeriod: string): Promise<APIResponse>;
  getGSTLiabilitySummary(tenantId: string, fromDate: string, toDate: string): Promise<APIResponse>;
  getHSNWiseSummary(tenantId: string, fromDate: string, toDate: string): Promise<APIResponse>;
  getTdsSections(): Promise<APIResponse<any[]>>;
  getTdsTransactions(tenantId: string, filters?: any): Promise<APIResponse<any[]>>;
  getTdsSummary(tenantId: string, quarter?: string): Promise<APIResponse>;
}

export interface ManufacturingAPI {
  createBOM(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getBOM(id: string, tenantId: string): Promise<APIResponse>;
  getBOMs(tenantId: string): Promise<APIResponse<any[]>>;
  getBOMsForItem(tenantId: string, itemId: string): Promise<APIResponse<any[]>>;
  approveBOM(id: string, tenantId: string): Promise<APIResponse>;
  setDefaultBOM(id: string, tenantId: string): Promise<APIResponse>;
  createWorkCenter(tenantId: string, data: unknown): Promise<APIResponse>;
  getWorkCenters(tenantId: string): Promise<APIResponse<any[]>>;
  getWorkCenterUtilization(tenantId: string, workCenterId: string, fromDate: string, toDate: string): Promise<APIResponse>;
  createProductionOrder(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getProductionOrder(id: string, tenantId: string): Promise<APIResponse>;
  getProductionOrders(tenantId: string, filters?: { status?: string }): Promise<APIResponse<any[]>>;
  releaseProductionOrder(id: string, tenantId: string): Promise<APIResponse>;
  startProductionOrder(id: string, tenantId: string): Promise<APIResponse>;
  issueMaterials(tenantId: string, productionOrderId: string, data: unknown, userId: string): Promise<APIResponse>;
  recordProduction(tenantId: string, productionOrderId: string, data: unknown, userId: string): Promise<APIResponse>;
  runMRP(tenantId: string, data: unknown): Promise<APIResponse>;
  createJobWorkOrder(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getJobWorkOrder(id: string, tenantId: string): Promise<APIResponse>;
  createQCInspection(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  getQCInspection(id: string, tenantId: string): Promise<APIResponse>;
  getProductionReport(tenantId: string, fromDate: string, toDate: string): Promise<APIResponse>;
  getWorkCenterLoadReport(tenantId: string, fromDate: string, toDate: string): Promise<APIResponse>;
}

export interface HRMAPI {
  createEmployee(tenantId: string, data: unknown): Promise<APIResponse>;
  getEmployee(id: string, tenantId: string): Promise<APIResponse>;
  getEmployees(tenantId: string, filters?: { departmentId?: string; status?: string }): Promise<APIResponse<any[]>>;
  updateEmployee(id: string, tenantId: string, data: unknown): Promise<APIResponse>;
  createSalaryStructure(tenantId: string, data: unknown): Promise<APIResponse>;
  getSalaryStructure(employeeId: string, tenantId: string): Promise<APIResponse>;
  recordAttendance(tenantId: string, data: unknown): Promise<APIResponse>;
  getAttendanceReport(tenantId: string, employeeId: string, month: string): Promise<APIResponse<any[]>>;
  applyLeave(tenantId: string, data: unknown, userId: string): Promise<APIResponse>;
  approveLeave(id: string, tenantId: string, approverId: string, approved: boolean, remarks?: string): Promise<APIResponse>;
  getLeaves(tenantId: string, filters?: any): Promise<APIResponse<any[]>>;
  getLeaveBalance(tenantId: string, employeeId: string, year?: string): Promise<APIResponse>;
  processPayroll(tenantId: string, month: string, userId: string): Promise<APIResponse>;
  getPayrolls(tenantId: string, month: string): Promise<APIResponse<any[]>>;
  getPayslip(employeeId: string, tenantId: string, month: string): Promise<APIResponse>;
  submitTaxDeclaration(tenantId: string, data: unknown): Promise<APIResponse>;
  generateForm16(tenantId: string, employeeId: string, fiscalYear: string): Promise<APIResponse>;
  getPFReport(tenantId: string, month: string): Promise<APIResponse>;
  getESIReport(tenantId: string, month: string): Promise<APIResponse>;
}

export interface MasterAPI {
  getTenant(tenantId: string): Promise<APIResponse>;
  updateTenant(tenantId: string, data: unknown): Promise<APIResponse>;
  getUsers(tenantId: string): Promise<APIResponse<any[]>>;
  createUser(tenantId: string, data: unknown): Promise<APIResponse>;
  updateUser(id: string, tenantId: string, data: unknown): Promise<APIResponse>;
  getRoles(tenantId: string): Promise<APIResponse<any[]>>;
  getCustomers(tenantId: string): Promise<APIResponse<any[]>>;
  getVendors(tenantId: string): Promise<APIResponse<any[]>>;
  getUnitsOfMeasure(tenantId: string): Promise<APIResponse<any[]>>;
  getHSNCodes(query?: string): Promise<APIResponse<any[]>>;
  getCategories(tenantId: string): Promise<APIResponse<any[]>>;
  createCategory(tenantId: string, data: unknown): Promise<APIResponse>;
}

export interface ReportAPI {
  exportToPdf(reportType: string, data: unknown): Promise<APIResponse>;
  exportToExcel(reportType: string, data: unknown): Promise<APIResponse>;
  print(reportType: string, data: unknown): Promise<APIResponse>;
}

export interface AuthAPI {
  login(username: string, password: string): Promise<APIResponse>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<APIResponse>;
}

export interface DashboardAPI {
  getStats(tenantId: string): Promise<APIResponse>;
  getRecentTransactions(tenantId: string, limit?: number): Promise<APIResponse<any[]>>;
}

declare global {
  interface Window {
    electronAPI: {
      finance: FinanceAPI;
      inventory: InventoryAPI;
      sales: SalesAPI;
      purchase: PurchaseAPI;
      gst: GSTAPI;
      manufacturing: ManufacturingAPI;
      hrm: HRMAPI;
      master: MasterAPI;
      report: ReportAPI;
      dashboard: DashboardAPI;
      auth: AuthAPI;
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
    };
  }
}

export {};

