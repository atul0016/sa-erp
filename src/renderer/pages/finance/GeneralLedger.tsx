import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  FunnelIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Badge } from '../../components/common';
import { useApp } from '../../context';

interface LedgerEntry {
  id: number;
  date: string;
  voucher_type: string;
  voucher_number: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
  narration: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

export function GeneralLedger() {
  const { state, notify } = useApp();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '2024-01-01', to: '2024-01-31' });

  useEffect(() => {
    loadAccounts();
  }, [state.user?.tenant_id]);

  useEffect(() => {
    if (selectedAccount && state.user?.tenant_id) {
      loadLedger();
    }
  }, [selectedAccount, dateRange, state.user?.tenant_id]);

  const loadAccounts = async () => {
    if (!state.user?.tenant_id) return;
    
    try {
      const response = await window.electronAPI.finance.getChartOfAccounts(state.user.tenant_id);
      
      if (response.success && response.data) {
        setAccounts(response.data.map((acc: any) => ({
          id: String(acc.id),
          code: acc.account_code,
          name: acc.account_name,
          type: acc.account_type,
        })));
      } else {
        notify('error', response.error || 'Failed to load accounts');
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      notify('error', 'Failed to load accounts');
    }
  };

  const loadLedger = async () => {
    if (!state.user?.tenant_id || !selectedAccount) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.finance.getAccountLedger(
        state.user.tenant_id,
        selectedAccount,
        dateRange.from,
        dateRange.to
      );
      
      if (response.success && response.data) {
        setEntries(response.data.map((entry: any, index: number) => ({
          id: index + 1,
          date: entry.date,
          voucher_type: entry.voucher_type || '',
          voucher_number: entry.voucher_number || '',
          particulars: entry.particulars || '',
          debit: Number(entry.debit) || 0,
          credit: Number(entry.credit) || 0,
          balance: Number(entry.balance) || 0,
          narration: entry.narration || '',
        })));
      } else {
        notify('error', response.error || 'Failed to load ledger');
      }
    } catch (error) {
      console.error('Error loading ledger:', error);
      notify('error', 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
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

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;

  const columns = [
    { key: 'date', header: 'Date', render: (row: LedgerEntry) => (
      <span className="text-sm">{formatDate(row.date)}</span>
    )},
    { key: 'voucher', header: 'Voucher', render: (row: LedgerEntry) => (
      <div>
        <span className="font-mono text-sm text-indigo-600">{row.voucher_number}</span>
        <div className="text-xs text-slate-500">{row.voucher_type}</div>
      </div>
    )},
    { key: 'particulars', header: 'Particulars', render: (row: LedgerEntry) => (
      <div>
        <div className="font-medium text-slate-900 dark:text-white">{row.particulars}</div>
        <div className="text-xs text-slate-500">{row.narration}</div>
      </div>
    )},
    { key: 'debit', header: 'Debit', render: (row: LedgerEntry) => (
      <span className={`font-medium ${row.debit > 0 ? 'text-green-600' : 'text-slate-300'}`}>
        {row.debit > 0 ? formatCurrency(row.debit) : '-'}
      </span>
    )},
    { key: 'credit', header: 'Credit', render: (row: LedgerEntry) => (
      <span className={`font-medium ${row.credit > 0 ? 'text-red-600' : 'text-slate-300'}`}>
        {row.credit > 0 ? formatCurrency(row.credit) : '-'}
      </span>
    )},
    { key: 'balance', header: 'Balance', render: (row: LedgerEntry) => (
      <span className="font-semibold text-slate-900 dark:text-white">
        {formatCurrency(row.balance)}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">General Ledger</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View account-wise transaction details
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">Select an account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
        </div>
      </Card>

      {selectedAccount ? (
        <>
          {/* Account Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpenIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Opening Balance</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {entries.length > 0 ? formatCurrency(entries[0].debit || entries[0].credit) : '₹0'}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <ArrowUpIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Total Debits</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(totalDebit)}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <ArrowDownIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Total Credits</div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(totalCredit)}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <BookOpenIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Closing Balance</div>
                  <div className="text-xl font-bold text-indigo-600">{formatCurrency(closingBalance)}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Ledger Table */}
          <Card>
            <div className="px-6 py-4 border-b dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {accounts.find(a => a.id === selectedAccount)?.code} - {accounts.find(a => a.id === selectedAccount)?.name}
              </h3>
              <p className="text-sm text-slate-500">
                Period: {formatDate(dateRange.from)} to {formatDate(dateRange.to)}
              </p>
            </div>
            <DataTable
              columns={columns}
              data={entries}
              keyExtractor={(row) => row.id.toString()}
              loading={loading}
            />
            {/* Totals Row */}
            <div className="px-6 py-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <div className="flex gap-16">
                  <span className="font-bold text-green-600">{formatCurrency(totalDebit)}</span>
                  <span className="font-bold text-red-600">{formatCurrency(totalCredit)}</span>
                  <span className="font-bold text-indigo-600">{formatCurrency(closingBalance)}</span>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12">
          <div className="text-center text-slate-500">
            <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Select an Account</h3>
            <p className="mt-1">Choose an account from the dropdown to view its ledger</p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default GeneralLedger;
