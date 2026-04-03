import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Modal } from '../../components/common';
import { useApp } from '../../context';

interface SalesInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_gstin: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  due_date: string;
  status: 'draft' | 'posted' | 'partial' | 'paid' | 'cancelled';
  e_invoice_status: 'pending' | 'generated' | 'cancelled' | 'na';
}

declare global {
  interface Window {
    api: {
      sales: {
        getSalesInvoices: (tenantId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

export function SalesInvoices() {
  const { state, notify } = useApp();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadInvoices();
  }, [state.user?.tenant_id]);

  const loadInvoices = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.sales.getSalesInvoices(state.user.tenant_id);
      
      if (response.success && response.data) {
        setInvoices(response.data.map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          customer_name: inv.customer_name,
          customer_gstin: inv.customer_gstin || '',
          subtotal: Number(inv.subtotal) || 0,
          cgst: Number(inv.cgst_amount) || 0,
          sgst: Number(inv.sgst_amount) || 0,
          igst: Number(inv.igst_amount) || 0,
          total: Number(inv.total) || 0,
          due_date: inv.due_date,
          status: inv.status,
          e_invoice_status: inv.e_invoice_status || 'na',
        })));
      } else {
        notify('error', response.error || 'Failed to load invoices');
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      notify('error', 'Failed to load invoices');
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredInvoices = statusFilter === 'all' 
    ? invoices 
    : invoices.filter(i => i.status === statusFilter);

  const totalSales = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalGST = invoices.reduce((sum, i) => sum + i.cgst + i.sgst + i.igst, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'posted' || i.status === 'partial');
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0);

  const columns = [
    { key: 'invoice_number', header: 'Invoice No.', render: (row: SalesInvoice) => (
      <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{row.invoice_number}</span>
    )},
    { key: 'invoice_date', header: 'Date', render: (row: SalesInvoice) => formatDate(row.invoice_date) },
    { key: 'customer_name', header: 'Customer', render: (row: SalesInvoice) => (
      <div>
        <div className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{row.customer_name}</div>
        <div className="text-xs text-slate-500">{row.customer_gstin}</div>
      </div>
    )},
    { key: 'total', header: 'Amount', render: (row: SalesInvoice) => (
      <div>
        <div className="font-medium">{formatCurrency(row.total)}</div>
        <div className="text-xs text-slate-500">
          GST: {formatCurrency(row.cgst + row.sgst + row.igst)}
        </div>
      </div>
    )},
    { key: 'due_date', header: 'Due Date', render: (row: SalesInvoice) => (
      <span className={`text-sm ${
        new Date(row.due_date) < new Date() && row.status !== 'paid' ? 'text-red-600 font-medium' : ''
      }`}>
        {formatDate(row.due_date)}
      </span>
    )},
    { key: 'status', header: 'Status', render: (row: SalesInvoice) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.status === 'paid' ? 'bg-green-100 text-green-800' :
        row.status === 'partial' ? 'bg-blue-100 text-blue-800' :
        row.status === 'posted' ? 'bg-yellow-100 text-yellow-800' :
        row.status === 'draft' ? 'bg-slate-100 text-slate-800' :
        'bg-red-100 text-red-800'
      }`}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </span>
    )},
    { key: 'e_invoice_status', header: 'E-Invoice', render: (row: SalesInvoice) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        row.e_invoice_status === 'generated' ? 'bg-green-100 text-green-800' :
        row.e_invoice_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        row.e_invoice_status === 'cancelled' ? 'bg-red-100 text-red-800' :
        'bg-slate-100 text-slate-600'
      }`}>
        {row.e_invoice_status === 'na' ? 'N/A' : row.e_invoice_status.charAt(0).toUpperCase() + row.e_invoice_status.slice(1)}
      </span>
    )},
    { key: 'actions', header: '', render: (row: SalesInvoice) => (
      <div className="flex gap-2">
        <button className="p-1 hover:bg-slate-100 rounded dark:hover:bg-slate-700">
          <EyeIcon className="w-4 h-4 text-slate-500" />
        </button>
        <button className="p-1 hover:bg-slate-100 rounded dark:hover:bg-slate-700">
          <PrinterIcon className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sales Invoices</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create and manage GST-compliant sales invoices
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/sales/invoices/new')}>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Invoices</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{invoices.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total Sales</div>
          <div className="mt-1 text-xl font-bold text-green-600">{formatCurrency(totalSales)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total GST</div>
          <div className="mt-1 text-xl font-bold text-blue-600">{formatCurrency(totalGST)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Pending Collection</div>
          <div className="mt-1 text-xl font-bold text-orange-600">{formatCurrency(pendingAmount)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Pending E-Invoice</div>
          <div className="mt-1 text-xl font-bold text-yellow-600">
            {invoices.filter(i => i.e_invoice_status === 'pending').length}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'draft', 'posted', 'partial', 'paid', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredInvoices}
          keyExtractor={(row) => row.id.toString()}
          loading={loading}
          onRowClick={(row) => console.log('View invoice', row)}
        />
      </Card>
    </div>
  );
}

export default SalesInvoices;
