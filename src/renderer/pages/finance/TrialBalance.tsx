import React, { useState, useEffect } from 'react';
import {
  ScaleIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, Badge } from '../../components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      finance: {
        getTrialBalance: (tenantId: string, asOnDate: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

interface TrialBalanceEntry {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  opening_debit: number;
  opening_credit: number;
  period_debit: number;
  period_credit: number;
  closing_debit: number;
  closing_credit: number;
}

export function TrialBalance() {
  const { state, notify } = useApp();
  const [entries, setEntries] = useState<TrialBalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [asOnDate, setAsOnDate] = useState('2024-01-31');
  const [showZeroBalance, setShowZeroBalance] = useState(false);

  useEffect(() => {
    loadTrialBalance();
  }, [asOnDate, state.user?.tenant_id]);

  const loadTrialBalance = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      // Mock data for development
      const mockData: TrialBalanceEntry[] = [
        // Assets
        { id: 1, account_code: '1110', account_name: 'Cash', account_type: 'Asset',
          opening_debit: 100000, opening_credit: 0, period_debit: 370000, period_credit: 596800, closing_debit: 0, closing_credit: 126800 },
        { id: 2, account_code: '1120', account_name: 'Bank - HDFC Current', account_type: 'Asset',
          opening_debit: 500000, opening_credit: 0, period_debit: 370000, period_credit: 596800, closing_debit: 273200, closing_credit: 0 },
        { id: 3, account_code: '1130', account_name: 'Accounts Receivable', account_type: 'Asset',
          opening_debit: 250000, opening_credit: 0, period_debit: 885000, period_credit: 500000, closing_debit: 635000, closing_credit: 0 },
        { id: 4, account_code: '1140', account_name: 'Inventory', account_type: 'Asset',
          opening_debit: 800000, opening_credit: 0, period_debit: 500000, period_credit: 450000, closing_debit: 850000, closing_credit: 0 },
        { id: 5, account_code: '1150', account_name: 'Fixed Deposits', account_type: 'Asset',
          opening_debit: 200000, opening_credit: 0, period_debit: 200000, period_credit: 0, closing_debit: 400000, closing_credit: 0 },
        { id: 6, account_code: '1210', account_name: 'Plant & Machinery', account_type: 'Asset',
          opening_debit: 1500000, opening_credit: 0, period_debit: 0, period_credit: 0, closing_debit: 1500000, closing_credit: 0 },
        { id: 7, account_code: '1220', account_name: 'Furniture & Fixtures', account_type: 'Asset',
          opening_debit: 150000, opening_credit: 0, period_debit: 0, period_credit: 0, closing_debit: 150000, closing_credit: 0 },
        { id: 8, account_code: '1230', account_name: 'Accumulated Depreciation', account_type: 'Asset',
          opening_debit: 0, opening_credit: 200000, period_debit: 0, period_credit: 25000, closing_debit: 0, closing_credit: 225000 },
        
        // Liabilities
        { id: 9, account_code: '2110', account_name: 'Accounts Payable', account_type: 'Liability',
          opening_debit: 0, opening_credit: 350000, period_debit: 250000, period_credit: 450000, closing_debit: 0, closing_credit: 550000 },
        { id: 10, account_code: '2120', account_name: 'GST Output - CGST', account_type: 'Liability',
          opening_debit: 0, opening_credit: 45000, period_debit: 0, period_credit: 67500, closing_debit: 0, closing_credit: 112500 },
        { id: 11, account_code: '2121', account_name: 'GST Output - SGST', account_type: 'Liability',
          opening_debit: 0, opening_credit: 45000, period_debit: 0, period_credit: 67500, closing_debit: 0, closing_credit: 112500 },
        { id: 12, account_code: '2130', account_name: 'TDS Payable - 194C', account_type: 'Liability',
          opening_debit: 0, opening_credit: 5000, period_debit: 5000, period_credit: 8000, closing_debit: 0, closing_credit: 8000 },
        { id: 13, account_code: '2140', account_name: 'Salary Payable', account_type: 'Liability',
          opening_debit: 0, opening_credit: 0, period_debit: 250000, period_credit: 300000, closing_debit: 0, closing_credit: 50000 },
        
        // Equity
        { id: 14, account_code: '3100', account_name: 'Share Capital', account_type: 'Equity',
          opening_debit: 0, opening_credit: 2000000, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 2000000 },
        { id: 15, account_code: '3200', account_name: 'Retained Earnings', account_type: 'Equity',
          opening_debit: 0, opening_credit: 500000, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 500000 },
        
        // Revenue
        { id: 16, account_code: '4100', account_name: 'Sales Revenue', account_type: 'Revenue',
          opening_debit: 0, opening_credit: 0, period_debit: 0, period_credit: 750000, closing_debit: 0, closing_credit: 750000 },
        { id: 17, account_code: '4200', account_name: 'Service Revenue', account_type: 'Revenue',
          opening_debit: 0, opening_credit: 0, period_debit: 0, period_credit: 150000, closing_debit: 0, closing_credit: 150000 },
        
        // Expenses
        { id: 18, account_code: '5100', account_name: 'Cost of Goods Sold', account_type: 'Expense',
          opening_debit: 0, opening_credit: 0, period_debit: 450000, period_credit: 0, closing_debit: 450000, closing_credit: 0 },
        { id: 19, account_code: '5200', account_name: 'Salary Expense', account_type: 'Expense',
          opening_debit: 0, opening_credit: 0, period_debit: 300000, period_credit: 0, closing_debit: 300000, closing_credit: 0 },
        { id: 20, account_code: '5300', account_name: 'Rent Expense', account_type: 'Expense',
          opening_debit: 0, opening_credit: 0, period_debit: 45000, period_credit: 0, closing_debit: 45000, closing_credit: 0 },
        { id: 21, account_code: '5400', account_name: 'Utility Expense', account_type: 'Expense',
          opening_debit: 0, opening_credit: 0, period_debit: 12000, period_credit: 0, closing_debit: 12000, closing_credit: 0 },
        { id: 22, account_code: '5500', account_name: 'Depreciation Expense', account_type: 'Expense',
          opening_debit: 0, opening_credit: 0, period_debit: 25000, period_credit: 0, closing_debit: 25000, closing_credit: 0 },
        { id: 23, account_code: '5600', account_name: 'Bank Charges', account_type: 'Expense',
          opening_debit: 0, opening_credit: 0, period_debit: 1500, period_credit: 0, closing_debit: 1500, closing_credit: 0 },
      ];
      
      setEntries(showZeroBalance ? mockData : mockData.filter(e => e.closing_debit !== 0 || e.closing_credit !== 0));
    } catch (error) {
      notify('error', 'Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate totals
  const totals = entries.reduce((acc, entry) => ({
    opening_debit: acc.opening_debit + entry.opening_debit,
    opening_credit: acc.opening_credit + entry.opening_credit,
    period_debit: acc.period_debit + entry.period_debit,
    period_credit: acc.period_credit + entry.period_credit,
    closing_debit: acc.closing_debit + entry.closing_debit,
    closing_credit: acc.closing_credit + entry.closing_credit,
  }), { opening_debit: 0, opening_credit: 0, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 0 });

  const isBalanced = totals.closing_debit === totals.closing_credit;
  const difference = Math.abs(totals.closing_debit - totals.closing_credit);

  // Group entries by type
  const groupedEntries = {
    Asset: entries.filter(e => e.account_type === 'Asset'),
    Liability: entries.filter(e => e.account_type === 'Liability'),
    Equity: entries.filter(e => e.account_type === 'Equity'),
    Revenue: entries.filter(e => e.account_type === 'Revenue'),
    Expense: entries.filter(e => e.account_type === 'Expense'),
  };

  const accountTypeColors: Record<string, string> = {
    Asset: 'text-blue-600 bg-blue-50',
    Liability: 'text-purple-600 bg-purple-50',
    Equity: 'text-indigo-600 bg-indigo-50',
    Revenue: 'text-green-600 bg-green-50',
    Expense: 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trial Balance</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Summary of all ledger account balances
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
              As On Date
            </label>
            <input
              type="date"
              value={asOnDate}
              onChange={(e) => setAsOnDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              id="showZero"
              checked={showZeroBalance}
              onChange={(e) => setShowZeroBalance(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showZero" className="text-sm text-slate-700 dark:text-slate-300">
              Show zero balance accounts
            </label>
          </div>
          {/* Balance Status */}
          <div className="ml-auto flex items-center gap-2">
            {isBalanced ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" />
                Balanced
              </Badge>
            ) : (
              <Badge variant="danger" className="flex items-center gap-1">
                <XCircleIcon className="w-4 h-4" />
                Difference: {formatCurrency(difference)}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ScaleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Opening Total</div>
              <div className="flex gap-4">
                <span className="text-lg font-bold text-green-600">Dr: {formatCurrency(totals.opening_debit)}</span>
                <span className="text-lg font-bold text-red-600">Cr: {formatCurrency(totals.opening_credit)}</span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Period Transactions</div>
              <div className="flex gap-4">
                <span className="text-lg font-bold text-green-600">Dr: {formatCurrency(totals.period_debit)}</span>
                <span className="text-lg font-bold text-red-600">Cr: {formatCurrency(totals.period_credit)}</span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <ScaleIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Closing Total</div>
              <div className="flex gap-4">
                <span className="text-lg font-bold text-green-600">Dr: {formatCurrency(totals.closing_debit)}</span>
                <span className="text-lg font-bold text-red-600">Cr: {formatCurrency(totals.closing_credit)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Trial Balance Table */}
      <Card>
        <div className="px-6 py-4 border-b dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Trial Balance as on {formatDate(asOnDate)}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Account Name</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300" colSpan={2}>Opening Balance</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300" colSpan={2}>Period Movement</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300" colSpan={2}>Closing Balance</th>
              </tr>
              <tr className="bg-slate-100 dark:bg-slate-700">
                <th className="px-4 py-1"></th>
                <th className="px-4 py-1"></th>
                <th className="px-4 py-1 text-right text-xs text-green-600">Debit</th>
                <th className="px-4 py-1 text-right text-xs text-red-600">Credit</th>
                <th className="px-4 py-1 text-right text-xs text-green-600">Debit</th>
                <th className="px-4 py-1 text-right text-xs text-red-600">Credit</th>
                <th className="px-4 py-1 text-right text-xs text-green-600">Debit</th>
                <th className="px-4 py-1 text-right text-xs text-red-600">Credit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedEntries).map(([type, typeEntries]) => (
                typeEntries.length > 0 && (
                  <React.Fragment key={type}>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                      <td colSpan={8} className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${accountTypeColors[type]}`}>
                          {type}
                        </span>
                      </td>
                    </tr>
                    {typeEntries.map((entry) => (
                      <tr key={entry.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-sm text-slate-600 dark:text-slate-400">{entry.account_code}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white">{entry.account_name}</td>
                        <td className="px-4 py-3 text-right text-green-600">{formatCurrency(entry.opening_debit)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(entry.opening_credit)}</td>
                        <td className="px-4 py-3 text-right text-green-600">{formatCurrency(entry.period_debit)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(entry.period_credit)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(entry.closing_debit)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(entry.closing_credit)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              ))}
            </tbody>
            <tfoot className="bg-slate-100 dark:bg-slate-700 font-bold">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-slate-900 dark:text-white">Total</td>
                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(totals.opening_debit)}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(totals.opening_credit)}</td>
                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(totals.period_debit)}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(totals.period_credit)}</td>
                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(totals.closing_debit)}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(totals.closing_credit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default TrialBalance;
