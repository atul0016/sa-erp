import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context';
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
  BuildingOfficeIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
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
    ],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: CubeIcon,
    children: [
      { name: 'Items', href: '/inventory/items' },
      { name: 'Warehouses', href: '/inventory/warehouses' },
      { name: 'Stock Moves', href: '/inventory/moves' },
      { name: 'Stock Valuation', href: '/inventory/valuation' },
      { name: 'Low Stock Alerts', href: '/inventory/low-stock' },
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
      { name: 'MRP', href: '/manufacturing/mrp' },
      { name: 'Job Work', href: '/manufacturing/job-work' },
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
    name: 'GST',
    href: '/gst',
    icon: BanknotesIcon,
    children: [
      { name: 'E-Invoice', href: '/gst/e-invoice' },
      { name: 'E-Way Bill', href: '/gst/e-way-bill' },
      { name: 'GSTR-1', href: '/gst/gstr1' },
      { name: 'ITC Reconciliation', href: '/gst/itc' },
      { name: 'HSN Summary', href: '/gst/hsn' },
    ],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: DocumentChartBarIcon,
    children: [
      { name: 'Financial Reports', href: '/reports/financial' },
      { name: 'Sales Reports', href: '/reports/sales' },
      { name: 'Purchase Reports', href: '/reports/purchase' },
      { name: 'Inventory Reports', href: '/reports/inventory' },
      { name: 'GST Reports', href: '/reports/gst' },
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
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={`${
        state.sidebarOpen ? 'w-64' : 'w-20'
      } bg-white/90 backdrop-blur text-slate-800 flex flex-col transition-all duration-300 min-h-screen border-r border-slate-200/80`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200/80">
        {state.sidebarOpen && (
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-teal-600/10 flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-teal-700" />
            </div>
            <div>
              <h1 className="font-bold text-lg">SA ERP</h1>
              <p className="text-xs text-slate-500">{state.user?.tenant_name}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {state.sidebarOpen ? (
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          ) : (
            <ChevronDoubleRightIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpand(item.name)}
                  className={`w-full flex items-center px-4 py-2.5 text-sm rounded-r-xl transition-all ${
                    isActive(item.href)
                      ? 'bg-teal-50 text-teal-800 border-l-4 border-teal-600'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {state.sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.name}</span>
                      <svg
                        className={`h-4 w-4 transform transition-transform ${
                          expandedItems.includes(item.name) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </button>
                {state.sidebarOpen && expandedItems.includes(item.name) && (
                  <div className="bg-slate-50/80">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={`block pl-12 pr-4 py-2 text-sm transition-colors ${
                          location.pathname === child.href
                            ? 'text-teal-700 bg-teal-100/70'
                            : 'text-slate-600 hover:bg-slate-100'
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
                className={`flex items-center px-4 py-2.5 text-sm rounded-r-xl transition-all ${
                  isActive(item.href)
                    ? 'bg-teal-50 text-teal-800 border-l-4 border-teal-600'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {state.sidebarOpen && <span>{item.name}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="border-t border-slate-200/80 p-4">
        {state.sidebarOpen ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {state.user?.first_name} {state.user?.last_name}
              </p>
              <p className="text-xs text-slate-500">{state.user?.username}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Logout"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full p-2 hover:bg-slate-100 rounded-lg flex justify-center transition-colors"
            title="Logout"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

