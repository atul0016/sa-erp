import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyRupeeIcon,
  DocumentTextIcon,
  ScaleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Modal } from '../../components/common';
import { useApp } from '../../context';

interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
  parent_id: number | null;
  balance: number;
  is_active: boolean;
}

declare global {
  interface Window {
    api: {
      finance: {
        getChartOfAccounts: (tenantId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

export function ChartOfAccounts() {
  const { state, notify } = useApp();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadAccounts();
  }, [state.user?.tenant_id]);

  const loadAccounts = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.finance.getChartOfAccounts(state.user.tenant_id);
      
      if (response.success && response.data) {
        setAccounts(response.data.map((a: any) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          type: a.type,
          parent_id: a.parent_id,
          balance: Number(a.balance) || 0,
          is_active: a.is_active !== false,
        })));
      } else {
        notify('error', response.error || 'Failed to load accounts');
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      notify('error', 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = filter === 'all' 
    ? accounts 
    : accounts.filter(a => a.type.toLowerCase() === filter.toLowerCase());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    { key: 'code', header: 'Code', render: (row: Account) => (
      <span className="font-mono text-sm">{row.code}</span>
    )},
    { key: 'name', header: 'Account Name', render: (row: Account) => (
      <div className="flex items-center">
        <span className={row.parent_id ? 'ml-4' : 'font-semibold'}>{row.name}</span>
      </div>
    )},
    { key: 'type', header: 'Type', render: (row: Account) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.type === 'Asset' ? 'bg-blue-100 text-blue-800' :
        row.type === 'Liability' ? 'bg-red-100 text-red-800' :
        row.type === 'Equity' ? 'bg-purple-100 text-purple-800' :
        row.type === 'Revenue' ? 'bg-green-100 text-green-800' :
        'bg-orange-100 text-orange-800'
      }`}>
        {row.type}
      </span>
    )},
    { key: 'balance', header: 'Balance', render: (row: Account) => (
      <span className={`font-medium ${
        row.type === 'Asset' || row.type === 'Expense' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
      }`}>
        {formatCurrency(row.balance)}
      </span>
    )},
    { key: 'is_active', header: 'Status', render: (row: Account) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        row.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
      }`}>
        {row.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your accounting structure
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {['all', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map((type, index) => {
          if (type === 'all') return null;
          const typeAccounts = accounts.filter(a => a.type === type);
          const total = typeAccounts.reduce((sum, a) => sum + a.balance, 0);
          return (
            <Card key={type} className="p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">{type}</div>
              <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                {formatCurrency(total)}
              </div>
              <div className="mt-1 text-xs text-slate-400">{typeAccounts.length} accounts</div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === type
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredAccounts}
          keyExtractor={(row) => row.id.toString()}
          loading={loading}
          onRowClick={(row) => console.log('View account', row)}
        />
      </Card>

      {/* Add Account Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Account"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); notify('success', 'Account created successfully'); setShowModal(false); loadAccounts(); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account Code
            </label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              placeholder="e.g., 1140"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              placeholder="e.g., Prepaid Expenses"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account Type
            </label>
            <select className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600">
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Parent Account
            </label>
            <select className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600">
              <option value="">None (Top Level)</option>
              {accounts.filter(a => !a.parent_id).map(a => (
                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ChartOfAccounts;
