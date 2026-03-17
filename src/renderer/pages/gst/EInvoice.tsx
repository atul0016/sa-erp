import React, { useState, useEffect } from 'react';
import {
  DocumentCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Modal } from '../../components/common';
import { useApp } from '../../context';

interface EInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_gstin: string;
  irn: string | null;
  ack_number: string | null;
  ack_date: string | null;
  status: 'pending' | 'generated' | 'cancelled' | 'failed';
  total: number;
  error_message: string | null;
}

export function EInvoice() {
  const { notify } = useApp();
  const [invoices, setInvoices] = useState<EInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [processingBulk, setProcessingBulk] = useState(false);

  useEffect(() => {
    loadEInvoices();
  }, []);

  const loadEInvoices = async () => {
    try {
      // Mock data
      setInvoices([
        { id: 1, invoice_number: 'INV-2024-0001', invoice_date: '2024-01-15', customer_name: 'ABC Industries Pvt Ltd', customer_gstin: '27AABCU9603R1ZM', irn: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4', ack_number: 'ACK123456789', ack_date: '2024-01-15', status: 'generated', total: 118000, error_message: null },
        { id: 2, invoice_number: 'INV-2024-0002', invoice_date: '2024-01-18', customer_name: 'XYZ Manufacturing Co', customer_gstin: '27AADCX9999R1ZN', irn: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5', ack_number: 'ACK234567890', ack_date: '2024-01-18', status: 'generated', total: 88500, error_message: null },
        { id: 3, invoice_number: 'INV-2024-0003', invoice_date: '2024-01-20', customer_name: 'Global Trade Exports', customer_gstin: '07AABCG1234R1ZP', irn: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6', ack_number: 'ACK345678901', ack_date: '2024-01-20', status: 'generated', total: 177000, error_message: null },
        { id: 4, invoice_number: 'INV-2024-0004', invoice_date: '2024-01-22', customer_name: 'South Star Industries', customer_gstin: '33AABCS5678R1ZQ', irn: null, ack_number: null, ack_date: null, status: 'pending', total: 53100, error_message: null },
        { id: 5, invoice_number: 'INV-2024-0005', invoice_date: '2024-01-23', customer_name: 'North Enterprises', customer_gstin: '06AABCN1234R1ZS', irn: null, ack_number: null, ack_date: null, status: 'failed', total: 75000, error_message: 'Invalid GSTIN format' },
      ]);
    } catch (error) {
      notify('error', 'Failed to load e-invoices');
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

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleGenerateEInvoice = async (invoiceId: number) => {
    notify('info', 'Generating e-invoice...');
    // Simulate API call
    setTimeout(() => {
      notify('success', 'E-Invoice generated successfully');
      loadEInvoices();
    }, 2000);
  };

  const handleBulkGenerate = async () => {
    if (selectedInvoices.length === 0) {
      notify('warning', 'Please select invoices to generate');
      return;
    }
    setProcessingBulk(true);
    notify('info', `Generating ${selectedInvoices.length} e-invoices...`);
    // Simulate API call
    setTimeout(() => {
      notify('success', `${selectedInvoices.length} e-invoices generated successfully`);
      setSelectedInvoices([]);
      setProcessingBulk(false);
      loadEInvoices();
    }, 3000);
  };

  const pendingCount = invoices.filter(i => i.status === 'pending').length;
  const generatedCount = invoices.filter(i => i.status === 'generated').length;
  const failedCount = invoices.filter(i => i.status === 'failed').length;

  const columns = [
    { key: 'select', header: '', render: (row: EInvoice) => (
      row.status === 'pending' ? (
        <input
          type="checkbox"
          checked={selectedInvoices.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedInvoices([...selectedInvoices, row.id]);
            } else {
              setSelectedInvoices(selectedInvoices.filter(id => id !== row.id));
            }
          }}
          className="rounded border-slate-300"
        />
      ) : null
    )},
    { key: 'invoice_number', header: 'Invoice No.', render: (row: EInvoice) => (
      <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{row.invoice_number}</span>
    )},
    { key: 'invoice_date', header: 'Date', render: (row: EInvoice) => formatDate(row.invoice_date) },
    { key: 'customer_name', header: 'Customer', render: (row: EInvoice) => (
      <div>
        <div className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">{row.customer_name}</div>
        <div className="text-xs text-slate-500">{row.customer_gstin}</div>
      </div>
    )},
    { key: 'total', header: 'Amount', render: (row: EInvoice) => (
      <span className="font-medium">{formatCurrency(row.total)}</span>
    )},
    { key: 'status', header: 'Status', render: (row: EInvoice) => (
      <div className="flex items-center gap-2">
        {row.status === 'generated' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
        {row.status === 'pending' && <ClockIcon className="w-4 h-4 text-yellow-500" />}
        {row.status === 'failed' && <XCircleIcon className="w-4 h-4 text-red-500" />}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'generated' ? 'bg-green-100 text-green-800' :
          row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          row.status === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-slate-100 text-slate-800'
        }`}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      </div>
    )},
    { key: 'irn', header: 'IRN', render: (row: EInvoice) => (
      row.irn ? (
        <div className="text-xs font-mono text-slate-500 truncate max-w-[150px]" title={row.irn}>
          {row.irn.substring(0, 20)}...
        </div>
      ) : (
        <span className="text-xs text-slate-400">-</span>
      )
    )},
    { key: 'ack_date', header: 'Ack Date', render: (row: EInvoice) => (
      <span className="text-sm">{formatDate(row.ack_date)}</span>
    )},
    { key: 'actions', header: '', render: (row: EInvoice) => (
      row.status === 'pending' || row.status === 'failed' ? (
        <Button size="sm" onClick={() => handleGenerateEInvoice(row.id)}>
          Generate
        </Button>
      ) : null
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">E-Invoice</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Generate and manage GST e-invoices (IRN)
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => loadEInvoices()}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleBulkGenerate}
            disabled={selectedInvoices.length === 0 || processingBulk}
          >
            <DocumentCheckIcon className="w-4 h-4 mr-2" />
            Generate Selected ({selectedInvoices.length})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DocumentCheckIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Invoices</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{invoices.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-sm text-green-700 dark:text-green-300">Generated</div>
              <div className="text-xl font-bold text-green-600">{generatedCount}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-yellow-500" />
            <div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Pending</div>
              <div className="text-xl font-bold text-yellow-600">{pendingCount}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <XCircleIcon className="w-8 h-8 text-red-500" />
            <div>
              <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
              <div className="text-xl font-bold text-red-600">{failedCount}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Failed Invoices Alert */}
      {failedCount > 0 && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-800 dark:text-red-200">E-Invoice Generation Failed</div>
              <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                {invoices.filter(i => i.status === 'failed').map(i => (
                  <div key={i.id}>{i.invoice_number}: {i.error_message}</div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={invoices}
          keyExtractor={(row) => row.id.toString()}
          loading={loading}
          onRowClick={(row) => console.log('View e-invoice', row)}
        />
      </Card>

      {/* Help Section */}
      <Card className="p-4">
        <h3 className="font-medium text-slate-900 dark:text-white mb-2">About E-Invoicing</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li>• E-Invoice is mandatory for businesses with turnover exceeding ₹5 Crore</li>
          <li>• IRN (Invoice Reference Number) is generated by the IRP (Invoice Registration Portal)</li>
          <li>• E-Invoices must be generated within 24 hours of invoice creation</li>
          <li>• QR code will be auto-generated for validated e-invoices</li>
        </ul>
      </Card>
    </div>
  );
}

export default EInvoice;
