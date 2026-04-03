import React, { Suspense, lazy } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import { MainLayout } from './components/layout';
import { usePermissions } from './hooks/usePermissions';
import { AccessDenied } from './components/common';
import { PageErrorBoundary } from './components/common/ErrorBoundary';

// Eagerly loaded (always needed)
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

// Lazy-loaded pages – each module becomes its own chunk
const ApprovalQueue = lazy(() => import('./pages/ApprovalQueue'));
const NotificationCenter = lazy(() => import('./pages/NotificationCenter'));

// Finance
const ChartOfAccounts = lazy(() => import('./pages/finance/ChartOfAccounts').then(m => ({ default: m.ChartOfAccounts })));
const JournalEntries = lazy(() => import('./pages/finance/JournalEntries').then(m => ({ default: m.JournalEntries })));
const BankReconciliation = lazy(() => import('./pages/finance/BankReconciliation'));
const CreditLimitManagement = lazy(() => import('./pages/finance/CreditLimitManagement'));
const GeneralLedger = lazy(() => import('./pages/finance/GeneralLedger').then(m => ({ default: m.GeneralLedger })));
const TrialBalance = lazy(() => import('./pages/finance/TrialBalance').then(m => ({ default: m.TrialBalance })));
const ProfitAndLoss = lazy(() => import('./pages/finance/ProfitAndLoss').then(m => ({ default: m.ProfitAndLoss })));
const BalanceSheet = lazy(() => import('./pages/finance/BalanceSheet').then(m => ({ default: m.BalanceSheet })));

// Inventory
const Items = lazy(() => import('./pages/inventory/Items').then(m => ({ default: m.Items })));
const Warehouses = lazy(() => import('./pages/inventory/Warehouses').then(m => ({ default: m.Warehouses })));
const GatePassManagement = lazy(() => import('./pages/inventory/GatePassManagement'));
const StockLedger = lazy(() => import('./pages/inventory/StockLedger'));
const StockMovements = lazy(() => import('./pages/inventory/StockMovements').then(m => ({ default: m.StockMovements })));
const StockValuation = lazy(() => import('./pages/inventory/StockValuation'));
const LowStockAlerts = lazy(() => import('./pages/inventory/LowStockAlerts'));

// Sales
const Customers = lazy(() => import('./pages/sales/Customers').then(m => ({ default: m.Customers })));
const SalesInvoices = lazy(() => import('./pages/sales/SalesInvoices').then(m => ({ default: m.SalesInvoices })));
const POSTerminal = lazy(() => import('./pages/sales/POSTerminal'));
const SalesOrders = lazy(() => import('./pages/sales/SalesOrders'));
const CustomerReceipts = lazy(() => import('./pages/sales/CustomerReceipts'));
const AgingReport = lazy(() => import('./pages/sales/AgingReport'));

// Purchase
const Vendors = lazy(() => import('./pages/purchase/Vendors'));
const PurchaseOrders = lazy(() => import('./pages/purchase/PurchaseOrders'));
const PurchaseInvoices = lazy(() => import('./pages/purchase/PurchaseInvoices').then(m => ({ default: m.PurchaseInvoices })));
const VendorPayments = lazy(() => import('./pages/purchase/VendorPayments'));
const GoodsReceiptNote = lazy(() => import('./pages/purchase/GoodsReceiptNote'));

// Manufacturing
const BillOfMaterials = lazy(() => import('./pages/manufacturing/BillOfMaterials'));
const ProductionOrders = lazy(() => import('./pages/manufacturing/ProductionOrders'));
const ShopFloorKiosk = lazy(() => import('./pages/manufacturing/ShopFloorKiosk'));
const OEEDashboard = lazy(() => import('./pages/manufacturing/OEEDashboard'));
const MRPPlanning = lazy(() => import('./pages/manufacturing/MRPPlanning'));
const JobWorkChallan = lazy(() => import('./pages/manufacturing/JobWorkChallan'));
const WorkCenters = lazy(() => import('./pages/manufacturing/WorkCenters'));
const QCInspection = lazy(() => import('./pages/manufacturing/QCInspection'));

// HRM
const Employees = lazy(() => import('./pages/hrm/Employees'));
const Payroll = lazy(() => import('./pages/hrm/Payroll'));
const Attendance = lazy(() => import('./pages/hrm/Attendance'));
const LeaveManagement = lazy(() => import('./pages/hrm/LeaveManagement'));
const TaxDeclarations = lazy(() => import('./pages/hrm/TaxDeclarations'));

// Reports
const FinancialReports = lazy(() => import('./pages/reports/FinancialReports'));
const SalesReports = lazy(() => import('./pages/reports/SalesReports'));
const PurchaseReports = lazy(() => import('./pages/reports/PurchaseReports'));
const InventoryReports = lazy(() => import('./pages/reports/InventoryReports'));
const GSTReports = lazy(() => import('./pages/reports/GSTReports'));

// GST
const EInvoice = lazy(() => import('./pages/gst/EInvoice').then(m => ({ default: m.EInvoice })));
const GSTR1 = lazy(() => import('./pages/gst/GSTR1').then(m => ({ default: m.GSTR1 })));
const TdsManagement = lazy(() => import('./pages/gst/TdsManagement'));
const GSTR2BReconciliation = lazy(() => import('./pages/gst/GSTR2BReconciliation'));
const EWayBill = lazy(() => import('./pages/gst/EWayBill'));
const ITCReconciliation = lazy(() => import('./pages/gst/ITCReconciliation'));
const HSNSummary = lazy(() => import('./pages/gst/HSNSummary'));

// Settings
const Settings = lazy(() => import('./pages/settings/Settings').then(m => ({ default: m.Settings })));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-900">
      <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center mb-4 animate-pulse-soft">
        <span className="text-white font-bold text-lg">SA</span>
      </div>
      <div className="h-1 w-32 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <div className="h-full w-1/2 bg-primary-500 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  
  if (state.isLoading) return <LoadingScreen />;
  if (!state.isAuthenticated) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  
  if (state.isLoading) return <LoadingScreen />;
  if (state.isAuthenticated) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

/** Wraps a route element with permission check */
function Guarded({ children, module }: { children: React.ReactNode; module?: string }) {
  const { canRoute } = usePermissions();
  const location = useLocation();

  if (!canRoute(location.pathname)) {
    return <AccessDenied />;
  }

  return (
    <PageErrorBoundary moduleName={module}>
      <Suspense fallback={<ChunkLoading />}>
        {children}
      </Suspense>
    </PageErrorBoundary>
  );
}

function ChunkLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 rounded-lg bg-primary-600 animate-pulse-soft" />
    </div>
  );
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
        <Route path="/" element={<Guarded module="Dashboard"><Dashboard /></Guarded>} />
        <Route path="/approvals" element={<Guarded module="Approvals"><ApprovalQueue /></Guarded>} />
        <Route path="/notifications" element={<Guarded module="Notifications"><NotificationCenter /></Guarded>} />
        
        {/* Finance Module */}
        <Route path="/finance" element={<Guarded module="Finance"><ChartOfAccounts /></Guarded>} />
        <Route path="/finance/accounts" element={<Guarded module="Finance"><ChartOfAccounts /></Guarded>} />
        <Route path="/finance/journal" element={<Guarded module="Finance"><JournalEntries /></Guarded>} />
        <Route path="/finance/bank-reconciliation" element={<Guarded module="Finance"><BankReconciliation /></Guarded>} />
        <Route path="/finance/credit-management" element={<Guarded module="Finance"><CreditLimitManagement /></Guarded>} />
        <Route path="/finance/ledger" element={<Guarded module="Finance"><GeneralLedger /></Guarded>} />
        <Route path="/finance/trial-balance" element={<Guarded module="Finance"><TrialBalance /></Guarded>} />
        <Route path="/finance/pnl" element={<Guarded module="Finance"><ProfitAndLoss /></Guarded>} />
        <Route path="/finance/balance-sheet" element={<Guarded module="Finance"><BalanceSheet /></Guarded>} />
        
        {/* Inventory Module */}
        <Route path="/inventory" element={<Guarded module="Inventory"><Items /></Guarded>} />
        <Route path="/inventory/items" element={<Guarded module="Inventory"><Items /></Guarded>} />
        <Route path="/inventory/warehouses" element={<Guarded module="Inventory"><Warehouses /></Guarded>} />
        <Route path="/inventory/stock-ledger" element={<Guarded module="Inventory"><StockLedger /></Guarded>} />
        <Route path="/inventory/gate-pass" element={<Guarded module="Inventory"><GatePassManagement /></Guarded>} />
        <Route path="/inventory/moves" element={<Guarded module="Inventory"><StockMovements /></Guarded>} />
        <Route path="/inventory/valuation" element={<Guarded module="Inventory"><StockValuation /></Guarded>} />
        <Route path="/inventory/low-stock" element={<Guarded module="Inventory"><LowStockAlerts /></Guarded>} />
        
        {/* Sales Module */}
        <Route path="/sales" element={<Guarded module="Sales"><SalesInvoices /></Guarded>} />
        <Route path="/sales/customers" element={<Guarded module="Sales"><Customers /></Guarded>} />
        <Route path="/sales/orders" element={<Guarded module="Sales"><SalesOrders /></Guarded>} />
        <Route path="/sales/invoices" element={<Guarded module="Sales"><SalesInvoices /></Guarded>} />
        <Route path="/sales/pos" element={<Guarded module="Sales"><POSTerminal /></Guarded>} />
        <Route path="/sales/receipts" element={<Guarded module="Sales"><CustomerReceipts /></Guarded>} />
        <Route path="/sales/aging" element={<Guarded module="Sales"><AgingReport /></Guarded>} />
        
        {/* Purchase Module */}
        <Route path="/purchase" element={<Guarded module="Purchase"><PurchaseOrders /></Guarded>} />
        <Route path="/purchase/vendors" element={<Guarded module="Purchase"><Vendors /></Guarded>} />
        <Route path="/purchase/orders" element={<Guarded module="Purchase"><PurchaseOrders /></Guarded>} />
        <Route path="/purchase/grn" element={<Guarded module="Purchase"><GoodsReceiptNote /></Guarded>} />
        <Route path="/purchase/invoices" element={<Guarded module="Purchase"><PurchaseInvoices /></Guarded>} />
        <Route path="/purchase/payments" element={<Guarded module="Purchase"><VendorPayments /></Guarded>} />
        
        {/* Manufacturing Module */}
        <Route path="/manufacturing" element={<Guarded module="Manufacturing"><ProductionOrders /></Guarded>} />
        <Route path="/manufacturing/bom" element={<Guarded module="Manufacturing"><BillOfMaterials /></Guarded>} />
        <Route path="/manufacturing/work-centers" element={<Guarded module="Manufacturing"><WorkCenters /></Guarded>} />
        <Route path="/manufacturing/production" element={<Guarded module="Manufacturing"><ProductionOrders /></Guarded>} />
        <Route path="/manufacturing/mrp" element={<Guarded module="Manufacturing"><MRPPlanning /></Guarded>} />
        <Route path="/manufacturing/job-work" element={<Guarded module="Manufacturing"><JobWorkChallan /></Guarded>} />
        <Route path="/manufacturing/shop-floor" element={<Guarded module="Manufacturing"><ShopFloorKiosk /></Guarded>} />
        <Route path="/manufacturing/oee" element={<Guarded module="Manufacturing"><OEEDashboard /></Guarded>} />
        <Route path="/manufacturing/qc" element={<Guarded module="Manufacturing"><QCInspection /></Guarded>} />
        
        {/* HRM Module */}
        <Route path="/hrm" element={<Guarded module="HRM"><Employees /></Guarded>} />
        <Route path="/hrm/employees" element={<Guarded module="HRM"><Employees /></Guarded>} />
        <Route path="/hrm/attendance" element={<Guarded module="HRM"><Attendance /></Guarded>} />
        <Route path="/hrm/leave" element={<Guarded module="HRM"><LeaveManagement /></Guarded>} />
        <Route path="/hrm/payroll" element={<Guarded module="HRM"><Payroll /></Guarded>} />
        <Route path="/hrm/tax" element={<Guarded module="HRM"><TaxDeclarations /></Guarded>} />
        
        {/* GST Module */}
        <Route path="/gst" element={<Guarded module="GST"><EInvoice /></Guarded>} />
        <Route path="/gst/e-invoice" element={<Guarded module="GST"><EInvoice /></Guarded>} />
        <Route path="/gst/e-way-bill" element={<Guarded module="GST"><EWayBill /></Guarded>} />
        <Route path="/gst/gstr1" element={<Guarded module="GST"><GSTR1 /></Guarded>} />
        <Route path="/gst/gstr2b" element={<Guarded module="GST"><GSTR2BReconciliation /></Guarded>} />
        <Route path="/gst/tds" element={<Guarded module="GST"><TdsManagement /></Guarded>} />
        <Route path="/gst/itc" element={<Guarded module="GST"><ITCReconciliation /></Guarded>} />
        <Route path="/gst/hsn" element={<Guarded module="GST"><HSNSummary /></Guarded>} />
        
        {/* Reports Module */}
        <Route path="/reports" element={<Guarded module="Reports"><FinancialReports /></Guarded>} />
        <Route path="/reports/financial" element={<Guarded module="Reports"><FinancialReports /></Guarded>} />
        <Route path="/reports/sales" element={<Guarded module="Reports"><SalesReports /></Guarded>} />
        <Route path="/reports/purchase" element={<Guarded module="Reports"><PurchaseReports /></Guarded>} />
        <Route path="/reports/inventory" element={<Guarded module="Reports"><InventoryReports /></Guarded>} />
        <Route path="/reports/gst" element={<Guarded module="Reports"><GSTReports /></Guarded>} />
        
        {/* Settings Module */}
        <Route path="/settings" element={<Guarded module="Settings"><Settings /></Guarded>} />
        <Route path="/settings/company" element={<Guarded module="Settings"><Settings /></Guarded>} />
        <Route path="/settings/users" element={<Guarded module="Settings"><Settings /></Guarded>} />
        <Route path="/settings/roles" element={<Guarded module="Settings"><Settings /></Guarded>} />
        <Route path="/settings/master" element={<Guarded module="Settings"><Settings /></Guarded>} />
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
