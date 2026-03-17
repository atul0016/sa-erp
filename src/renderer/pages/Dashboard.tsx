import React, { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Card } from '../components/common';
import {
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  TruckIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ClockIcon,
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
}

interface RecentTransaction {
  id: string;
  type: string;
  number: string;
  party: string;
  amount: number;
  date: string;
}

export function Dashboard() {
  const { state, notify } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [state.user?.tenant_id]);

  const loadDashboardData = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const [statsResponse, transactionsResponse] = await Promise.all([
        window.electronAPI.dashboard.getStats(state.user.tenant_id),
        window.electronAPI.dashboard.getRecentTransactions(state.user.tenant_id, 10)
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        notify('error', 'Failed to load dashboard stats');
      }

      if (transactionsResponse.success && transactionsResponse.data) {
        setRecentTransactions(transactionsResponse.data.map((t: any) => ({
          id: t.id || Math.random().toString(),
          type: t.type,
          number: t.number,
          party: t.party,
          amount: t.amount,
          date: t.date,
        })));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      notify('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome back, {state.user?.first_name}! Here's your business overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card padding="md" className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-green-500 rounded-lg">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Sales This Month</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(stats?.salesThisMonth || 0)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            <span>12% vs last month</span>
          </div>
        </Card>

        <Card padding="md" className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-blue-500 rounded-lg">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Purchase This Month</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(stats?.purchaseThisMonth || 0)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600">
            <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            <span>5% vs last month</span>
          </div>
        </Card>

        <Card padding="md" className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-amber-500 rounded-lg">
              <CurrencyRupeeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Receivables</p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {formatCurrency(stats?.receivablesTotal || 0)}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-amber-600">
            <span>15 invoices outstanding</span>
          </div>
        </Card>

        <Card padding="md" className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-purple-500 rounded-lg">
              <CurrencyRupeeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Payables</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(stats?.payablesTotal || 0)}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600">
            <span>8 invoices pending</span>
          </div>
        </Card>
      </div>

      {/* Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <Card title="Alerts" className="lg:col-span-1">
          <div className="space-y-4">
            {stats?.lowStockItems && stats.lowStockItems > 0 && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Low Stock Alert
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {stats.lowStockItems} items below minimum stock
                  </p>
                </div>
              </div>
            )}

            {stats?.pendingSalesOrders && stats.pendingSalesOrders > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <ClockIcon className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Pending Orders
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300">
                    {stats.pendingSalesOrders} sales orders to process
                  </p>
                </div>
              </div>
            )}

            {stats?.pendingGRNs && stats.pendingGRNs > 0 && (
              <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <CubeIcon className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Pending GRN
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    {stats.pendingGRNs} deliveries to receive
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card title="Recent Transactions" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Number</th>
                  <th className="pb-3">Party</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="text-sm">
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.type.includes('Sales') ? 'bg-green-100 text-green-800' :
                        tx.type.includes('Purchase') ? 'bg-blue-100 text-blue-800' :
                        tx.type === 'Receipt' ? 'bg-amber-100 text-amber-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{tx.number}</td>
                    <td className="py-3">{tx.party}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(tx.amount)}</td>
                    <td className="py-3 text-slate-500">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Cash Flow & Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Monthly Sales Trend" description="Last 6 months performance">
          <div className="h-64 flex items-center justify-center text-slate-400">
            <p>Chart placeholder - Sales trend will appear here</p>
          </div>
        </Card>

        <Card title="GST Summary" description="Current month liability">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Output GST</span>
              <span className="font-medium text-slate-900 dark:text-white">₹2,45,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Input GST</span>
              <span className="font-medium text-slate-900 dark:text-white">₹1,87,500</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-slate-900 dark:text-white font-medium">Net GST Payable</span>
              <span className="text-lg font-bold text-indigo-600">₹57,500</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
