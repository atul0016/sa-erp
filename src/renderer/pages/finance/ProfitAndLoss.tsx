import React, { useState, useEffect } from 'react';
import {
  CurrencyRupeeIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, Badge } from '../../components/common';
import { useApp } from '../../context';

interface PnLLineItem {
  id: number;
  code: string;
  name: string;
  amount: number;
  previousAmount: number;
  isSubtotal?: boolean;
  isHeader?: boolean;
  indent?: number;
}

export function ProfitAndLoss() {
  const { state, notify } = useApp();
  const [revenueItems, setRevenueItems] = useState<PnLLineItem[]>([]);
  const [expenseItems, setExpenseItems] = useState<PnLLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '2024-01-01', to: '2024-01-31' });
  const [comparisonPeriod, setComparisonPeriod] = useState('previous_month');

  useEffect(() => {
    loadProfitAndLoss();
  }, [dateRange, comparisonPeriod, state.user?.tenant_id]);

  const loadProfitAndLoss = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.finance.getProfitAndLoss(
        state.user.tenant_id,
        dateRange.from,
        dateRange.to
      );
      
      if (response.success && response.data) {
        setRevenueItems(response.data.revenue || []);
        setExpenseItems(response.data.expenses || []);
      } else {
        notify('error', response.error || 'Failed to load P&L');
      }
    } catch (error) {
      console.error('Error loading P&L:', error);
      notify('error', 'Failed to load P&L');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
    return isNegative ? `(${formatted})` : formatted;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  // Calculate totals
  const totalRevenue = revenueItems.filter(i => i.isSubtotal).reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenseItems.filter(i => i.isSubtotal).reduce((sum, i) => sum + i.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const previousRevenue = revenueItems.filter(i => i.isSubtotal).reduce((sum, i) => sum + i.previousAmount, 0);
  const previousExpenses = expenseItems.filter(i => i.isSubtotal).reduce((sum, i) => sum + i.previousAmount, 0);
  const previousProfit = previousRevenue - previousExpenses;

  const profitChange = calculateChange(netProfit, previousProfit);
  const isProfitable = netProfit > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profit & Loss Statement</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Income and expenditure for the selected period
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Compare With
            </label>
            <select
              value={comparisonPeriod}
              onChange={(e) => setComparisonPeriod(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="previous_month">Previous Month</option>
              <option value="previous_quarter">Previous Quarter</option>
              <option value="previous_year">Previous Year</option>
              <option value="none">No Comparison</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Revenue</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
              <div className="text-xs text-slate-500">
                {calculateChange(totalRevenue, previousRevenue) >= 0 ? '+' : ''}{calculateChange(totalRevenue, previousRevenue).toFixed(1)}% vs prev
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Expenses</div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
              <div className="text-xs text-slate-500">
                {calculateChange(totalExpenses, previousExpenses) >= 0 ? '+' : ''}{calculateChange(totalExpenses, previousExpenses).toFixed(1)}% vs prev
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isProfitable ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
              <CurrencyRupeeIcon className={`w-6 h-6 ${isProfitable ? 'text-indigo-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <div className="text-sm text-slate-500">Net {isProfitable ? 'Profit' : 'Loss'}</div>
              <div className={`text-xl font-bold ${isProfitable ? 'text-indigo-600' : 'text-orange-600'}`}>
                {formatCurrency(Math.abs(netProfit))}
              </div>
              <div className="text-xs text-slate-500">
                {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}% vs prev
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Profit Margin</div>
              <div className="text-xl font-bold text-purple-600">
                {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-slate-500">
                Gross Margin: {totalRevenue > 0 ? (((totalRevenue - 360000) / totalRevenue) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* P&L Statement */}
      <Card>
        <div className="px-6 py-4 border-b dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Statement of Profit and Loss
          </h3>
          <p className="text-sm text-slate-500">
            For the period {formatDate(dateRange.from)} to {formatDate(dateRange.to)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Particulars</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">Current Period</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">Previous Period</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">Change %</th>
              </tr>
            </thead>
            <tbody>
              {/* Revenue Section */}
              <tr className="bg-green-50 dark:bg-green-900/20">
                <td colSpan={4} className="px-4 py-2 font-bold text-green-700 dark:text-green-400">I. INCOME</td>
              </tr>
              {revenueItems.map((item) => (
                <tr 
                  key={item.id} 
                  className={`
                    ${item.isHeader ? 'bg-slate-50 dark:bg-slate-800/50 font-semibold' : ''}
                    ${item.isSubtotal ? 'bg-green-50/50 dark:bg-green-900/10 font-bold border-t border-b dark:border-slate-700' : ''}
                    hover:bg-slate-50 dark:hover:bg-slate-800/50
                  `}
                >
                  <td className="px-4 py-2" style={{ paddingLeft: `${(item.indent || 0) * 20 + 16}px` }}>
                    {item.code && <span className="text-xs text-slate-500 mr-2">{item.code}</span>}
                    {item.name}
                  </td>
                  <td className="px-4 py-2 text-right text-green-600">{item.amount !== 0 ? formatCurrency(item.amount) : ''}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{item.previousAmount !== 0 ? formatCurrency(item.previousAmount) : ''}</td>
                  <td className="px-4 py-2 text-right">
                    {item.amount !== 0 && item.previousAmount !== 0 && (
                      <span className={calculateChange(item.amount, item.previousAmount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateChange(item.amount, item.previousAmount) >= 0 ? '+' : ''}
                        {calculateChange(item.amount, item.previousAmount).toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-green-100 dark:bg-green-900/30 font-bold">
                <td className="px-4 py-3">Total Income (I)</td>
                <td className="px-4 py-3 text-right text-green-700">{formatCurrency(totalRevenue)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(previousRevenue)}</td>
                <td className="px-4 py-3 text-right text-green-600">
                  +{calculateChange(totalRevenue, previousRevenue).toFixed(1)}%
                </td>
              </tr>

              {/* Expense Section */}
              <tr className="bg-red-50 dark:bg-red-900/20">
                <td colSpan={4} className="px-4 py-2 font-bold text-red-700 dark:text-red-400">II. EXPENSES</td>
              </tr>
              {expenseItems.map((item) => (
                <tr 
                  key={item.id} 
                  className={`
                    ${item.isHeader ? 'bg-slate-50 dark:bg-slate-800/50 font-semibold' : ''}
                    ${item.isSubtotal ? 'bg-red-50/50 dark:bg-red-900/10 font-bold border-t border-b dark:border-slate-700' : ''}
                    hover:bg-slate-50 dark:hover:bg-slate-800/50
                  `}
                >
                  <td className="px-4 py-2" style={{ paddingLeft: `${(item.indent || 0) * 20 + 16}px` }}>
                    {item.code && <span className="text-xs text-slate-500 mr-2">{item.code}</span>}
                    {item.name}
                  </td>
                  <td className="px-4 py-2 text-right text-red-600">{item.amount !== 0 ? formatCurrency(item.amount) : ''}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{item.previousAmount !== 0 ? formatCurrency(item.previousAmount) : ''}</td>
                  <td className="px-4 py-2 text-right">
                    {item.amount !== 0 && item.previousAmount !== 0 && (
                      <span className={calculateChange(item.amount, item.previousAmount) <= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateChange(item.amount, item.previousAmount) >= 0 ? '+' : ''}
                        {calculateChange(item.amount, item.previousAmount).toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-red-100 dark:bg-red-900/30 font-bold">
                <td className="px-4 py-3">Total Expenses (II)</td>
                <td className="px-4 py-3 text-right text-red-700">{formatCurrency(totalExpenses)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(previousExpenses)}</td>
                <td className="px-4 py-3 text-right text-red-600">
                  +{calculateChange(totalExpenses, previousExpenses).toFixed(1)}%
                </td>
              </tr>

              {/* Net Profit/Loss */}
              <tr className={`font-bold text-lg ${isProfitable ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                <td className="px-4 py-4">III. PROFIT / (LOSS) BEFORE TAX (I - II)</td>
                <td className={`px-4 py-4 text-right ${isProfitable ? 'text-indigo-700' : 'text-orange-700'}`}>
                  {formatCurrency(netProfit)}
                </td>
                <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(previousProfit)}</td>
                <td className="px-4 py-4 text-right">
                  <span className={profitChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default ProfitAndLoss;
