/**
 * Global API Type Declarations for window.electronAPI
 * Centralized to avoid conflicts across different pages
 */

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

declare global {
  interface Window {
    electronAPI: {
      // Sales Module
      sales: {
        getSalesOrders: (tenantId: string) => Promise<APIResponse<any[]>>;
        getSalesInvoices: (tenantId: string) => Promise<APIResponse<any[]>>;
        getAgingReport: (tenantId: string) => Promise<APIResponse<any>>;
        getCustomerReceipts: (tenantId: string) => Promise<APIResponse<any[]>>;
        getSalesReport: (tenantId: string, fromDate: string, toDate: string) => Promise<APIResponse<any>>;
        createSalesOrder: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
        createSalesInvoice: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
        createCustomerReceipt: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
      };

      // Purchase Module
      purchase: {
        getPurchaseOrders: (tenantId: string) => Promise<APIResponse<any[]>>;
        getPurchaseInvoices: (tenantId: string) => Promise<APIResponse<any[]>>;
        getVendorPayments: (tenantId: string) => Promise<APIResponse<any[]>>;
        getGoodsReceiptNotes: (tenantId: string) => Promise<APIResponse<any[]>>;
        getPurchaseReport: (tenantId: string, fromDate: string, toDate: string) => Promise<APIResponse<any>>;
        createPurchaseOrder: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
        createPurchaseInvoice: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
        createVendorPayment: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
        createGRN: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
      };

      // Master Data
      master: {
        getCustomers: (tenantId: string) => Promise<APIResponse<any[]>>;
        getVendors: (tenantId: string) => Promise<APIResponse<any[]>>;
        createCustomer: (data: any) => Promise<APIResponse>;
        updateCustomer: (id: number, data: any) => Promise<APIResponse>;
        deleteCustomer: (id: number) => Promise<APIResponse>;
        createVendor: (data: any) => Promise<APIResponse>;
        updateVendor: (id: number, data: any) => Promise<APIResponse>;
        deleteVendor: (id: number) => Promise<APIResponse>;
      };

      // Finance Module
      finance: {
        getChartOfAccounts: (tenantId: string) => Promise<APIResponse<any[]>>;
        getJournalEntries: (tenantId: string) => Promise<APIResponse<any[]>>;
        getTrialBalance: (tenantId: string, asOnDate: string) => Promise<APIResponse<any[]>>;
        getProfitAndLoss: (tenantId: string, fromDate: string, toDate: string) => Promise<APIResponse<any>>;
        getBalanceSheet: (tenantId: string, asOnDate: string) => Promise<APIResponse<any>>;
        getGeneralLedger: (tenantId: string, accountCode: string) => Promise<APIResponse<any[]>>;
        getAccountLedger: (tenantId: string, accountCode: string, fromDate: string, toDate: string) => Promise<APIResponse<any[]>>;
      };

      // Inventory Module
      inventory: {
        getItems: (tenantId: string) => Promise<APIResponse<any[]>>;
        getWarehouses: (tenantId: string) => Promise<APIResponse<any[]>>;
        getStockMovements: (tenantId: string, filters?: any) => Promise<APIResponse<any[]>>;
        getStockValuation: (tenantId: string) => Promise<APIResponse<any[]>>;
        getLowStockAlerts: (tenantId: string) => Promise<APIResponse<any[]>>;
        createItem: (data: any) => Promise<APIResponse>;
        updateItem: (id: number, data: any) => Promise<APIResponse>;
        deleteItem: (id: number) => Promise<APIResponse>;
      };

      // Manufacturing Module
      manufacturing: {
        getBOMs: (tenantId: string, itemId?: string) => Promise<APIResponse<any[]>>;
        getBOM: (id: string, tenantId: string) => Promise<APIResponse<any>>;
        createBOM: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
        getProductionOrders: (tenantId: string, filters?: { status?: string }) => Promise<APIResponse<any[]>>;
        getProductionOrder: (id: string, tenantId: string) => Promise<APIResponse<any>>;
        createProductionOrder: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
        startProduction: (id: string, tenantId: string) => Promise<APIResponse>;
        completeProduction: (id: string, tenantId: string, actualQty: number) => Promise<APIResponse>;
        getWorkCenters: (tenantId: string) => Promise<APIResponse<any[]>>;
        getWorkCenter: (id: string, tenantId: string) => Promise<APIResponse<any>>;
        createWorkCenter: (tenantId: string, data: any) => Promise<APIResponse>;
        getQCInspections: (tenantId: string) => Promise<APIResponse<any[]>>;
      };

      // HRM Module
      hrm: {
        getEmployees: (tenantId: string, filters?: { departmentId?: string; status?: string }) => Promise<APIResponse<any[]>>;
        getEmployee: (id: string, tenantId: string) => Promise<APIResponse<any>>;
        createEmployee: (tenantId: string, data: any) => Promise<APIResponse>;
        updateEmployee: (id: number, tenantId: string, data: any) => Promise<APIResponse>;
        deleteEmployee: (id: number) => Promise<APIResponse>;
        getPayrolls: (tenantId: string, month: string) => Promise<APIResponse<any[]>>;
        createPayroll: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
        getAttendanceReport: (tenantId: string, employeeId: string, month: string) => Promise<APIResponse<any[]>>;
        recordAttendance: (tenantId: string, data: any) => Promise<APIResponse>;
        getLeaveBalance: (tenantId: string, employeeId: string, year?: string) => Promise<APIResponse<any>>;
        getLeaves: (tenantId: string, filters?: any) => Promise<APIResponse<any[]>>;
        applyLeave: (tenantId: string, data: any, userId: string) => Promise<APIResponse>;
        approveLeave: (id: string, tenantId: string, approverId: string, approved: boolean, remarks?: string) => Promise<APIResponse>;
        getSalaryStructure: (employeeId: string, tenantId: string) => Promise<APIResponse<any>>;
        createSalaryStructure: (tenantId: string, data: any) => Promise<APIResponse>;
      };

      // GST Module
      gst: {
        getGSTR1Data: (tenantId: string, month: string) => Promise<APIResponse<any>>;
        getGSTR2BData: (tenantId: string, month: string) => Promise<APIResponse<any>>;
        getGSTR1B2BDetails: (tenantId: string, period: string) => Promise<APIResponse<any>>;
        performITCReconciliation: (tenantId: string, period: string) => Promise<APIResponse<any>>;
        getEInvoices: (tenantId: string) => Promise<APIResponse<any[]>>;
        getEWayBills: (tenantId: string) => Promise<APIResponse<any[]>>;
        getITCReconciliation: (tenantId: string, month: string) => Promise<APIResponse<any[]>>;
        getHSNSummary: (tenantId: string, month: string) => Promise<APIResponse<any[]>>;
        getTdsSections: () => Promise<APIResponse<any[]>>;
        getTdsTransactions: (tenantId: string, filters?: any) => Promise<APIResponse<any[]>>;
        getTdsSummary: (tenantId: string, quarter?: string) => Promise<APIResponse<any>>;
      };

      // Dashboard Module
      dashboard: {
        getStats: (tenantId: string) => Promise<APIResponse<any>>;
        getRecentTransactions: (tenantId: string, limit?: number) => Promise<APIResponse<any[]>>;
      };

      // Reports Module
      reports: {
        getFinancialReports: (tenantId: string, params: any) => Promise<APIResponse<any>>;
        getSalesReports: (tenantId: string, params: any) => Promise<APIResponse<any>>;
        getPurchaseReports: (tenantId: string, params: any) => Promise<APIResponse<any>>;
        getInventoryReports: (tenantId: string, params: any) => Promise<APIResponse<any>>;
        getGSTReports: (tenantId: string, params: any) => Promise<APIResponse<any>>;
      };
    };
  }
}

export {};
