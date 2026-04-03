import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context';
import { usePermissions } from '../hooks/usePermissions';
import { SkeletonStats, SkeletonTable } from '../components/common';
import {
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  TruckIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UsersIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  salesThisMonth: number;
  purchaseThisMonth: number;
  receivablesTotal: number;
  payablesTotal: number;
  lowStockItems: number;
  pendingSalesOrders: number;
  pendingPurchaseOrders: number;
  pendingGRNs: number;
  netProfit: number;
  cashBalance: number;
  totalCustomers: number;
  totalVendors: number;
  totalItems: number;
  totalEmployees: number;
  salesGrowth: number;
  purchaseGrowth: number;
  gstPayable: number;
  tdsPayable: number;
  pendingApprovals: number;
  monthlyTrend: { month: string; sales: number; purchase: number }[];
  topCustomers: { name: string; amount: number }[];
}

interface RecentTransaction {
  id: string;
  type: string;
  number: string;
  party: string;
  amount: number;
  date: string;
  status: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const formatCompact = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const statusColor: Record<string, string> = {
  paid: 'badge-success',
  completed: 'badge-success',
  confirmed: 'badge-primary',
  pending: 'badge-warning',
  overdue: 'badge-error',
};

export function Dashboard() {
  const { state, notify } = useApp();
  const { isCEO, isAdmin, isManager } = usePermissions();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTx, setRecentTx] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [state.user?.tenant_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    if (!state.user?.tenant_id) return;
    setLoading(true);
    try {
      const [sr, tr] = await Promise.all([
        window.electronAPI.dashboard.getStats(state.user.tenant_id),
        window.electronAPI.dashboard.getRecentTransactions(state.user.tenant_id, 10),
      ]);
      if (sr.success && sr.data) setStats(sr.data as DashboardStats);
      if (tr.success && tr.data) setRecentTx(tr.data as RecentTransaction[]);
    } catch {
      notify('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="skeleton h-7 w-48 mb-2" /><div className="skeleton h-4 w-72" /></div>
        <SkeletonStats count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><SkeletonTable rows={5} cols={3} /><SkeletonTable rows={5} cols={2} /></div>
      </div>
    );
  }

  const s = stats;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100">
            {isCEO ? 'Executive Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-sm text-surface-400">
            Welcome back, {state.user?.first_name}. Here's your business overview for <span className="font-medium text-surface-600 dark:text-surface-300">FY {state.fiscalYear}</span>
          </p>
        </div>
        {(isCEO || isAdmin) && s?.pendingApprovals && s.pendingApprovals > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg text-sm">
            <CheckBadgeIcon className="h-4 w-4 text-accent-600" />
            <span className="font-medium text-accent-700 dark:text-accent-400">{s.pendingApprovals} pending approvals</span>
          </div>
        )}
      </div>

      {/* KPI Cards Row 1 - Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label="Sales This Month"
          value={formatCompact(s?.salesThisMonth || 0)}
          icon={ShoppingCartIcon}
          trend={s?.salesGrowth}
          color="success"
          href="/sales/invoices"
        />
        <KPICard
          label="Purchases"
          value={formatCompact(s?.purchaseThisMonth || 0)}
          icon={TruckIcon}
          trend={s?.purchaseGrowth}
          color="primary"
          href="/purchase/orders"
        />
        <KPICard
          label="Receivables"
          value={formatCompact(s?.receivablesTotal || 0)}
          icon={CurrencyRupeeIcon}
          subtitle="15 invoices"
          color="warning"
          href="/sales/aging"
        />
        <KPICard
          label="Payables"
          value={formatCompact(s?.payablesTotal || 0)}
          icon={BanknotesIcon}
          subtitle="8 invoices"
          color="danger"
          href="/purchase/payments"
        />
      </div>

      {/* KPI Cards Row 2 - Operations (CEO/Admin only) */}
      {(isCEO || isAdmin || isManager) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard label="Net Profit" value={formatCompact(s?.netProfit || 0)} icon={ArrowTrendingUpIcon} color="success" href="/finance/pnl" />
          <KPICard label="Cash Balance" value={formatCompact(s?.cashBalance || 0)} icon={CurrencyRupeeIcon} color="primary" href="/finance/accounts" />
          <KPICard label="GST Payable" value={formatCompact(s?.gstPayable || 0)} icon={BanknotesIcon} color="warning" href="/gst/gstr1" />
          <KPICard label="TDS Payable" value={formatCompact(s?.tdsPayable || 0)} icon={BanknotesIcon} color="neutral" href="/gst/tds" />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Alerts */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-card">
          <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Alerts & Actions</h3>
          </div>
          <div className="p-4 space-y-3">
            {s?.lowStockItems && s.lowStockItems > 0 && (
              <AlertRow icon={ExclamationTriangleIcon} color="danger" title="Low Stock" desc={`${s.lowStockItems} items below reorder level`} href="/inventory/low-stock" />
            )}
            {s?.pendingSalesOrders && s.pendingSalesOrders > 0 && (
              <AlertRow icon={ClockIcon} color="warning" title="Pending Sales Orders" desc={`${s.pendingSalesOrders} orders to process`} href="/sales/orders" />
            )}
            {s?.pendingPurchaseOrders && s.pendingPurchaseOrders > 0 && (
              <AlertRow icon={ClockIcon} color="primary" title="Pending POs" desc={`${s.pendingPurchaseOrders} orders awaiting`} href="/purchase/orders" />
            )}
            {s?.pendingGRNs && s.pendingGRNs > 0 && (
              <AlertRow icon={CubeIcon} color="primary" title="Pending GRN" desc={`${s.pendingGRNs} deliveries to receive`} href="/purchase/grn" />
            )}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <MiniStat label="Customers" value={s?.totalCustomers || 0} icon={UsersIcon} />
              <MiniStat label="Vendors" value={s?.totalVendors || 0} icon={TruckIcon} />
              <MiniStat label="Products" value={s?.totalItems || 0} icon={CubeIcon} />
              <MiniStat label="Employees" value={s?.totalEmployees || 0} icon={UsersIcon} />
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-card">
          <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Recent Transactions</h3>
            <Link to="/reports/financial" className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-surface-400 uppercase tracking-wider border-b border-surface-100 dark:border-surface-700">
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Number</th>
                  <th className="px-4 py-2.5 hidden sm:table-cell">Party</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5 hidden md:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50 dark:divide-surface-700/50">
                {recentTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-2.5 text-surface-600 dark:text-surface-300">{tx.type}</td>
                    <td className="px-4 py-2.5 font-medium text-surface-900 dark:text-surface-100">{tx.number}</td>
                    <td className="px-4 py-2.5 text-surface-500 hidden sm:table-cell truncate max-w-[180px]">{tx.party}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-surface-900 dark:text-surface-100">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className={`badge ${statusColor[tx.status] || 'badge-neutral'}`}>{tx.status}</span>
                    </td>
                  </tr>
                ))}
                {recentTx.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-surface-400">No recent transactions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Grid - Charts & GST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Trend - mini bar chart via CSS*/}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-card">
          <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700 flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4 text-surface-400" />
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Monthly Trend</h3>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-3 h-40">
              {s?.monthlyTrend?.map(m => {
                const maxVal = Math.max(...(s.monthlyTrend?.map(t => t.sales) || [1]));
                const salesH = (m.sales / maxVal) * 100;
                const purchH = (m.purchase / maxVal) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-32">
                      <div className="flex-1 bg-primary-500/80 rounded-t transition-all" style={{ height: `${salesH}%` }} title={`Sales: ${formatCompact(m.sales)}`} />
                      <div className="flex-1 bg-accent-400/60 rounded-t transition-all" style={{ height: `${purchH}%` }} title={`Purchase: ${formatCompact(m.purchase)}`} />
                    </div>
                    <span className="text-[10px] text-surface-400 font-medium">{m.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
              <div className="flex items-center gap-1.5 text-xs text-surface-500">
                <div className="h-2 w-2 rounded-sm bg-primary-500" /> Sales
              </div>
              <div className="flex items-center gap-1.5 text-xs text-surface-500">
                <div className="h-2 w-2 rounded-sm bg-accent-400" /> Purchase
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers + GST */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-card">
          <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Top Customers</h3>
          </div>
          <div className="p-4 space-y-3">
            {s?.topCustomers?.map((c, i) => {
              const maxAmt = s.topCustomers?.[0]?.amount || 1;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-surface-700 dark:text-surface-300 truncate mr-2">{c.name}</span>
                    <span className="font-medium text-surface-900 dark:text-surface-100 whitespace-nowrap">{formatCompact(c.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(c.amount / maxAmt) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──── Sub-components ──── */

function KPICard({ label, value, icon: Icon, trend, subtitle, color, href }: {
  label: string; value: string; icon: any; trend?: number; subtitle?: string;
  color: 'success' | 'primary' | 'warning' | 'danger' | 'neutral'; href?: string;
}) {
  const colorMap = {
    success: 'bg-success-50 dark:bg-success-900/15 text-success-600 dark:text-success-400',
    primary: 'bg-primary-50 dark:bg-primary-900/15 text-primary-600 dark:text-primary-400',
    warning: 'bg-warning-50 dark:bg-warning-900/15 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-50 dark:bg-danger-900/15 text-danger-600 dark:text-danger-400',
    neutral: 'bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400',
  };

  const content = (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-card p-4 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {trend >= 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-100 leading-tight">{value}</p>
      <p className="text-xs text-surface-400 mt-1">{subtitle || label}</p>
    </div>
  );

  return href ? <Link to={href}>{content}</Link> : content;
}

function AlertRow({ icon: Icon, color, title, desc, href }: { icon: any; color: string; title: string; desc: string; href: string }) {
  const bg: Record<string, string> = {
    danger: 'bg-danger-50 dark:bg-danger-900/15 text-danger-600',
    warning: 'bg-warning-50 dark:bg-warning-900/15 text-warning-600',
    primary: 'bg-primary-50 dark:bg-primary-900/15 text-primary-600',
  };
  return (
    <Link to={href} className={`flex items-center gap-3 p-3 rounded-lg ${bg[color] || bg.primary} hover:opacity-80 transition-opacity`}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs opacity-75">{desc}</p>
      </div>
    </Link>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
      <Icon className="h-4 w-4 text-surface-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{value}</p>
        <p className="text-[10px] text-surface-400">{label}</p>
      </div>
    </div>
  );
}
