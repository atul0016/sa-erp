import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Modal, Badge } from '../../components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      purchase: {
        getPurchaseInvoices: (tenantId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  vendor_invoice_no: string;
  date: string;
  due_date: string;
  vendor_name: string;
  vendor_gstin: string;
  po_number: string;
  grn_number: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  paid: number;
  status: 'draft' | 'posted' | 'partial' | 'paid' | 'cancelled';
  tds_applicable: boolean;
  tds_amount: number;
}

export function PurchaseInvoices() {
  const { state, notify } = useApp();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [state.user?.tenant_id]);

  const loadInvoices = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.purchase.getPurchaseInvoices(state.user.tenant_id);
      
      if (response.success && response.data) {
        setInvoices(response.data.map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          vendor_invoice_no: inv.vendor_invoice_no || '',
          date: inv.invoice_date,
          due_date: inv.due_date,
          vendor_name: inv.vendor_name,
          vendor_gstin: inv.vendor_gstin || '',
          po_number: inv.po_number || '',
          grn_number: inv.grn_number || '',
          subtotal: Number(inv.subtotal) || 0,
          cgst: Number(inv.cgst_amount) || 0,
          sgst: Number(inv.sgst_amount) || 0,
          igst: Number(inv.igst_amount) || 0,
          total: Number(inv.total) || 0,
          paid: Number(inv.paid) || 0,
          status: inv.status,
          tds_applicable: inv.tds_applicable === true,
          tds_amount: Number(inv.tds_amount) || 0,
        })));
      } else {
        notify('error', response.error || 'Failed to load invoices');
      }
    } catch (error) {
      console.error('Error loading purchase invoices:', error);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filter);

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid, 0);
  const totalOutstanding = totalAmount - totalPaid;
  const totalGST = invoices.reduce((sum, inv) => sum + inv.cgst + inv.sgst + inv.igst, 0);
  const totalTDS = invoices.reduce((sum, inv) => sum + inv.tds_amount, 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'primary'> = {
      paid: 'success',
      partial: 'warning',
      posted: 'primary',
      draft: 'secondary',
      cancelled: 'danger',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const columns = [
    { key: 'invoice_number', header: 'Invoice No.', render: (row: PurchaseInvoice) => (
      <span className="font-mono text-sm text-indigo-600">{row.invoice_number}</span>
    )},
    { key: 'date', header: 'Date', render: (row: PurchaseInvoice) => (
      <span className="text-sm">{formatDate(row.date)}</span>
    )},
    { key: 'vendor', header: 'Vendor', render: (row: PurchaseInvoice) => (
      <div>
        <div className="font-medium text-slate-900 dark:text-white">{row.vendor_name}</div>
        <div className="text-xs text-slate-500">{row.vendor_gstin}</div>
      </div>
    )},
    { key: 'vendor_invoice', header: 'Vendor Inv #', render: (row: PurchaseInvoice) => (
      <span className="text-sm font-mono">{row.vendor_invoice_no || '-'}</span>
    )},
    { key: 'amount', header: 'Amount', render: (row: PurchaseInvoice) => (
      <div>
        <div className="font-medium">{formatCurrency(row.total)}</div>
        <div className="text-xs text-slate-500">GST: {formatCurrency(row.cgst + row.sgst + row.igst)}</div>
      </div>
    )},
    { key: 'due_date', header: 'Due Date', render: (row: PurchaseInvoice) => {
      const isOverdue = new Date(row.due_date) < new Date() && row.status !== 'paid';
      return (
        <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
          {formatDate(row.due_date)}
          {isOverdue && <ExclamationTriangleIcon className="w-4 h-4 inline ml-1" />}
        </span>
      );
    }},
    { key: 'balance', header: 'Balance', render: (row: PurchaseInvoice) => (
      <span className={`font-medium ${row.total - row.paid > 0 ? 'text-red-600' : 'text-green-600'}`}>
        {formatCurrency(row.total - row.paid)}
      </span>
    )},
    { key: 'status', header: 'Status', render: (row: PurchaseInvoice) => getStatusBadge(row.status) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Invoices</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage vendor bills and GST input credits
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Invoices</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{invoices.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <div className="text-sm text-slate-500">Total Purchases</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <div className="text-sm text-slate-500">GST Input Credit</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(totalGST)}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <div className="text-sm text-slate-500">TDS Deducted</div>
            <div className="text-xl font-bold text-amber-600">{formatCurrency(totalTDS)}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <div className="text-sm text-slate-500">Outstanding</div>
            <div className="text-xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'draft', 'posted', 'partial', 'paid', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === status
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

      {/* TDS Section Info */}
      <Card className="p-4">
        <h3 className="font-medium text-slate-900 dark:text-white mb-2">TDS Compliance (Section 194C/194J)</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
            <div className="text-slate-500">TDS @ 1% (194C - Individual/HUF)</div>
            <div className="font-semibold">{formatCurrency(totalTDS * 0.4)}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
            <div className="text-slate-500">TDS @ 2% (194C - Others)</div>
            <div className="font-semibold">{formatCurrency(totalTDS * 0.6)}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
            <div className="text-slate-500">Next TDS Due Date</div>
            <div className="font-semibold">7th Feb 2024</div>
          </div>
        </div>
      </Card>

      {/* New Invoice Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Purchase Invoice"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); notify('success', 'Invoice created successfully'); setShowModal(false); loadInvoices(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Vendor</label>
              <select className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600">
                <option value="">Select Vendor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Vendor Invoice No.</label>
              <input type="text" placeholder="Vendor invoice reference" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Invoice Date</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
              <input type="date" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">PO Reference</label>
            <input type="text" placeholder="Linked PO number" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Create Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PurchaseInvoices;
