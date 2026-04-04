import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context';
import { usePermissions } from '../../hooks/usePermissions';
import {
  HomeIcon,
  CurrencyRupeeIcon,
  CubeIcon,
  ShoppingCartIcon,
  TruckIcon,
  DocumentChartBarIcon,
  CogIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

interface NavChild {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Approvals', href: '/approvals', icon: ShieldCheckIcon },
  { name: 'Notifications', href: '/notifications', icon: BellIcon },
  {
    name: 'Finance',
    href: '/finance',
    icon: CurrencyRupeeIcon,
    children: [
      { name: 'Chart of Accounts', href: '/finance/accounts' },
      { name: 'Journal Entries', href: '/finance/journal' },
      { name: 'General Ledger', href: '/finance/ledger' },
      { name: 'Trial Balance', href: '/finance/trial-balance' },
      { name: 'Profit & Loss', href: '/finance/pnl' },
      { name: 'Balance Sheet', href: '/finance/balance-sheet' },
      { name: 'Bank Reconciliation', href: '/finance/bank-reconciliation' },
      { name: 'Credit Management', href: '/finance/credit-management' },
    ],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: CubeIcon,
    children: [
      { name: 'Items', href: '/inventory/items' },
      { name: 'Warehouses', href: '/inventory/warehouses' },
      { name: 'Stock Ledger', href: '/inventory/stock-ledger' },
      { name: 'Stock Moves', href: '/inventory/moves' },
      { name: 'Valuation', href: '/inventory/valuation' },
      { name: 'Low Stock Alerts', href: '/inventory/low-stock' },
      { name: 'Gate Pass', href: '/inventory/gate-pass' },
    ],
  },
  {
    name: 'Sales',
    href: '/sales',
    icon: ShoppingCartIcon,
    children: [
      { name: 'Customers', href: '/sales/customers' },
      { name: 'Sales Orders', href: '/sales/orders' },
      { name: 'Invoices', href: '/sales/invoices' },
      { name: 'POS Terminal', href: '/sales/pos' },
      { name: 'Receipts', href: '/sales/receipts' },
      { name: 'Aging Report', href: '/sales/aging' },
    ],
  },
  {
    name: 'Purchase',
    href: '/purchase',
    icon: TruckIcon,
    children: [
      { name: 'Vendors', href: '/purchase/vendors' },
      { name: 'Purchase Orders', href: '/purchase/orders' },
      { name: 'GRN', href: '/purchase/grn' },
      { name: 'Invoices', href: '/purchase/invoices' },
      { name: 'Payments', href: '/purchase/payments' },
    ],
  },
  {
    name: 'Manufacturing',
    href: '/manufacturing',
    icon: WrenchScrewdriverIcon,
    children: [
      { name: 'BOM', href: '/manufacturing/bom' },
      { name: 'Work Centers', href: '/manufacturing/work-centers' },
      { name: 'Production Orders', href: '/manufacturing/production' },
      { name: 'MRP Planning', href: '/manufacturing/mrp' },
      { name: 'Job Work', href: '/manufacturing/job-work' },
      { name: 'Shop Floor', href: '/manufacturing/shop-floor' },
      { name: 'OEE Dashboard', href: '/manufacturing/oee' },
      { name: 'QC Inspection', href: '/manufacturing/qc' },
    ],
  },
  {
    name: 'HRM',
    href: '/hrm',
    icon: UsersIcon,
    children: [
      { name: 'Employees', href: '/hrm/employees' },
      { name: 'Attendance', href: '/hrm/attendance' },
      { name: 'Leave Management', href: '/hrm/leave' },
      { name: 'Payroll', href: '/hrm/payroll' },
      { name: 'Tax Declarations', href: '/hrm/tax' },
    ],
  },
  {
    name: 'GST & Tax',
    href: '/gst',
    icon: BanknotesIcon,
    children: [
      { name: 'E-Invoice', href: '/gst/e-invoice' },
      { name: 'E-Way Bill', href: '/gst/e-way-bill' },
      { name: 'GSTR-1', href: '/gst/gstr1' },
      { name: 'GSTR-2B Recon', href: '/gst/gstr2b' },
      { name: 'TDS Management', href: '/gst/tds' },
      { name: 'ITC Reconciliation', href: '/gst/itc' },
      { name: 'HSN Summary', href: '/gst/hsn' },
    ],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: DocumentChartBarIcon,
    children: [
      { name: 'Financial', href: '/reports/financial' },
      { name: 'Sales', href: '/reports/sales' },
      { name: 'Purchase', href: '/reports/purchase' },
      { name: 'Inventory', href: '/reports/inventory' },
      { name: 'GST', href: '/reports/gst' },
    ],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: CogIcon,
    children: [
      { name: 'Company Profile', href: '/settings/company' },
      { name: 'Users', href: '/settings/users' },
      { name: 'Roles', href: '/settings/roles' },
      { name: 'Master Data', href: '/settings/master' },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { state, dispatch, logout } = useApp();
  const { canRoute, roleName, isAdmin, isCEO } = usePermissions();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Auto-expand active section
  React.useEffect(() => {
    const activeParent = navigation.find(
      item => item.children && item.href !== '/' && location.pathname.startsWith(item.href)
    );
    if (activeParent && !expandedItems.includes(activeParent.name)) {
      setExpandedItems(prev => [...prev, activeParent.name]);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const isChildActive = (href: string) => location.pathname === href;

  // Close mobile sidebar and collapse section on child click
  const handleChildClick = (parentName: string) => {
    setExpandedItems(prev => prev.filter(n => n !== parentName));
    if (window.innerWidth < 1024) {
      dispatch({ type: 'SET_SIDEBAR', payload: false });
    }
  };

  // Close mobile sidebar on top-level link click
  const handleTopLevelClick = () => {
    if (window.innerWidth < 1024) {
      dispatch({ type: 'SET_SIDEBAR', payload: false });
    }
  };

  // Filter navigation by permissions
  const filteredNavigation = navigation
    .map(item => {
      if (!item.children) {
        return canRoute(item.href) ? item : null;
      }
      const filteredChildren = item.children.filter(child => canRoute(child.href));
      if (filteredChildren.length === 0) return null;
      return { ...item, children: filteredChildren };
    })
    .filter(Boolean) as NavItem[];

  return (
    <div
      className={`${
        state.sidebarOpen ? 'w-64' : 'w-[68px]'
      } h-screen flex flex-col transition-all duration-300 border-r shadow-sidebar
        bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-surface-200 dark:border-surface-700">
        {state.sidebarOpen && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-tight text-surface-900 dark:text-surface-100 truncate">SA ERP</h1>
              <p className="text-[10px] text-surface-400 truncate">{state.user?.tenant_name || 'Enterprise'}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors flex-shrink-0"
          aria-label={state.sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={state.sidebarOpen}
        >
          {state.sidebarOpen ? (
            <ChevronDoubleLeftIcon className="h-4 w-4 text-surface-400" />
          ) : (
            <ChevronDoubleRightIcon className="h-4 w-4 text-surface-400" />
          )}
        </button>
      </div>

      {/* Role badge */}
      {state.sidebarOpen && (
        <div className="px-4 py-2">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider
            ${isCEO ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400' : 
              isAdmin ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 
              'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'}`}>
            <ShieldCheckIcon className="h-3 w-3" />
            {roleName}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2" role="navigation" aria-label="Main navigation">
        <div className="space-y-0.5">
          {filteredNavigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`sidebar-item w-full ${
                      isActive(item.href) ? 'sidebar-item-active' : ''
                    }`}
                    aria-expanded={expandedItems.includes(item.name)}
                  >
                    <item.icon className="h-[18px] w-[18px] flex-shrink-0 sidebar-icon" />
                    {state.sidebarOpen && (
                      <>
                        <span className="flex-1 text-left truncate">{item.name}</span>
                        <svg
                          className={`h-3.5 w-3.5 flex-shrink-0 transform transition-transform duration-200 ${
                            expandedItems.includes(item.name) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {state.sidebarOpen && expandedItems.includes(item.name) && (
                    <div className="mt-0.5 ml-4 pl-3 border-l border-surface-200 dark:border-surface-700 space-y-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          onClick={() => handleChildClick(item.name)}
                          className={`block px-2.5 py-1.5 text-[13px] rounded-md transition-colors truncate ${
                            isChildActive(child.href)
                              ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 font-medium'
                              : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800'
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.href}
                  onClick={handleTopLevelClick}
                  className={`sidebar-item ${isActive(item.href) ? 'sidebar-item-active' : ''}`}
                >
                  <item.icon className="h-[18px] w-[18px] flex-shrink-0 sidebar-icon" />
                  {state.sidebarOpen && <span className="truncate">{item.name}</span>}
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* User Footer */}
      <div className="border-t border-surface-200 dark:border-surface-700 p-3">
        {state.sidebarOpen ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-xs flex-shrink-0">
              {state.user?.first_name?.[0]}{state.user?.last_name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                {state.user?.first_name} {state.user?.last_name}
              </p>
              <p className="text-[11px] text-surface-400 truncate">{state.user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors flex-shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4 text-surface-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg flex justify-center transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <ArrowLeftOnRectangleIcon className="h-4 w-4 text-surface-400" />
          </button>
        )}
      </div>
    </div>
  );
}
