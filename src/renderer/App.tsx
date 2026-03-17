import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import { MainLayout } from './components/layout';
import { 
  Dashboard, 
  Login,
  // Finance
  ChartOfAccounts,
  JournalEntries,
  BankReconciliation,
  CreditLimitManagement,
  GeneralLedger,
  TrialBalance,
  ProfitAndLoss,
  BalanceSheet,
  // Inventory
  Items,
  Warehouses,
  GatePassManagement,
  StockLedger,
  StockMovements,
  StockValuation,
  LowStockAlerts,
  // Sales
  Customers,
  SalesInvoices,
  POSTerminal,
  SalesOrders,
  CustomerReceipts,
  AgingReport,
  // Purchase
  Vendors,
  PurchaseOrders,
  PurchaseInvoices,
  VendorPayments,
  GoodsReceiptNote,
  // Manufacturing
  BillOfMaterials,
  ProductionOrders,
  ShopFloorKiosk,
  OEEDashboard,
  MRPPlanning,
  JobWorkChallan,
  WorkCenters,
  QCInspection,
  // HRM
  Employees,
  Payroll,
  Attendance,
  LeaveManagement,
  TaxDeclarations,
  // Reports
  FinancialReports,
  SalesReports,
  PurchaseReports,
  InventoryReports,
  GSTReports,
  // GST
  EInvoice,
  GSTR1,
  TdsManagement,
  GSTR2BReconciliation,
  EWayBill,
  ITCReconciliation,
  HSNSummary,
  // Settings
  Settings,
} from './pages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }
  
  if (state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      
      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        
        {/* Finance Module */}
        <Route path="/finance" element={<ChartOfAccounts />} />
        <Route path="/finance/accounts" element={<ChartOfAccounts />} />
        <Route path="/finance/journal" element={<JournalEntries />} />
        <Route path="/finance/bank-reconciliation" element={<BankReconciliation />} />
        <Route path="/finance/credit-management" element={<CreditLimitManagement />} />
        <Route path="/finance/ledger" element={<GeneralLedger />} />
        <Route path="/finance/trial-balance" element={<TrialBalance />} />
        <Route path="/finance/pnl" element={<ProfitAndLoss />} />
        <Route path="/finance/balance-sheet" element={<BalanceSheet />} />
        
        {/* Inventory Module */}
        <Route path="/inventory" element={<Items />} />
        <Route path="/inventory/items" element={<Items />} />
        <Route path="/inventory/warehouses" element={<Warehouses />} />
        <Route path="/inventory/stock-ledger" element={<StockLedger />} />
        <Route path="/inventory/gate-pass" element={<GatePassManagement />} />
        <Route path="/inventory/moves" element={<StockMovements />} />
        <Route path="/inventory/valuation" element={<StockValuation />} />
        <Route path="/inventory/low-stock" element={<LowStockAlerts />} />
        
        {/* Sales Module */}
        <Route path="/sales" element={<SalesInvoices />} />
        <Route path="/sales/customers" element={<Customers />} />
        <Route path="/sales/orders" element={<SalesOrders />} />
        <Route path="/sales/invoices" element={<SalesInvoices />} />
        <Route path="/sales/pos" element={<POSTerminal />} />
        <Route path="/sales/receipts" element={<CustomerReceipts />} />
        <Route path="/sales/aging" element={<AgingReport />} />
        
        {/* Purchase Module */}
        <Route path="/purchase" element={<PurchaseOrders />} />
        <Route path="/purchase/vendors" element={<Vendors />} />
        <Route path="/purchase/orders" element={<PurchaseOrders />} />
        <Route path="/purchase/grn" element={<GoodsReceiptNote />} />
        <Route path="/purchase/invoices" element={<PurchaseInvoices />} />
        <Route path="/purchase/payments" element={<VendorPayments />} />
        
        {/* Manufacturing Module */}
        <Route path="/manufacturing" element={<ProductionOrders />} />
        <Route path="/manufacturing/bom" element={<BillOfMaterials />} />
        <Route path="/manufacturing/work-centers" element={<WorkCenters />} />
        <Route path="/manufacturing/production" element={<ProductionOrders />} />
        <Route path="/manufacturing/mrp" element={<MRPPlanning />} />
        <Route path="/manufacturing/job-work" element={<JobWorkChallan />} />
        <Route path="/manufacturing/shop-floor" element={<ShopFloorKiosk />} />
        <Route path="/manufacturing/oee" element={<OEEDashboard />} />
        <Route path="/manufacturing/qc" element={<QCInspection />} />
        
        {/* HRM Module */}
        <Route path="/hrm" element={<Employees />} />
        <Route path="/hrm/employees" element={<Employees />} />
        <Route path="/hrm/attendance" element={<Attendance />} />
        <Route path="/hrm/leave" element={<LeaveManagement />} />
        <Route path="/hrm/payroll" element={<Payroll />} />
        <Route path="/hrm/tax" element={<TaxDeclarations />} />
        
        {/* GST Module */}
        <Route path="/gst" element={<EInvoice />} />
        <Route path="/gst/e-invoice" element={<EInvoice />} />
        <Route path="/gst/e-way-bill" element={<EWayBill />} />
        <Route path="/gst/gstr1" element={<GSTR1 />} />
        <Route path="/gst/gstr2b" element={<GSTR2BReconciliation />} />
        <Route path="/gst/tds" element={<TdsManagement />} />
        <Route path="/gst/itc" element={<ITCReconciliation />} />
        <Route path="/gst/hsn" element={<HSNSummary />} />
        
        {/* Reports Module */}
        <Route path="/reports" element={<FinancialReports />} />
        <Route path="/reports/financial" element={<FinancialReports />} />
        <Route path="/reports/sales" element={<SalesReports />} />
        <Route path="/reports/purchase" element={<PurchaseReports />} />
        <Route path="/reports/inventory" element={<InventoryReports />} />
        <Route path="/reports/gst" element={<GSTReports />} />
        
        {/* Settings Module */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/company" element={<Settings />} />
        <Route path="/settings/users" element={<Settings />} />
        <Route path="/settings/roles" element={<Settings />} />
        <Route path="/settings/master" element={<Settings />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppRouter({ children }: { children: React.ReactNode }) {
  const useHashRouter = import.meta.env.VITE_ROUTER_MODE === 'hash';
  return useHashRouter ? <HashRouter>{children}</HashRouter> : <BrowserRouter>{children}</BrowserRouter>;
}

export function App() {
  return (
    <AppProvider>
      <AppRouter>
        <AppRoutes />
      </AppRouter>
    </AppProvider>
  );
}

export default App;
