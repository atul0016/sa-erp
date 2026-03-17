import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Modal } from '../../components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      gst: {
        getGSTR1Data: (tenantId: string, month: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      };
    };
  }
}

interface GSTR1Summary {
  section: string;
  description: string;
  invoice_count: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total_tax: number;
}

interface GSTR1Invoice {
  invoice_number: string;
  invoice_date: string;
  customer_gstin: string;
  customer_name: string;
  place_of_supply: string;
  invoice_type: string;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export function GSTR1() {
  const { state, notify } = useApp();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('01-2024');
  const [summary, setSummary] = useState<GSTR1Summary[]>([]);
  const [invoices, setInvoices] = useState<GSTR1Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'b2b' | 'b2c'>('summary');

  useEffect(() => {
    loadGSTR1Data();
  }, [selectedMonth, state.user?.tenant_id]);

  const loadGSTR1Data = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.gst.getGSTR1Data(state.user.tenant_id, selectedMonth);
      
      if (response.success && response.data) {
        setSummary(response.data.summary || []);
        setInvoices(response.data.invoices || []);
      } else {
        notify('error', response.error || 'Failed to load GSTR-1 data');
      }
    } catch (error) {
      console.error('Error loading GSTR-1:', error);
      notify('error', 'Failed to load GSTR-1 data');
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

  const totalTaxableValue = summary.reduce((sum, s) => sum + s.taxable_value, 0);
  const totalTax = summary.reduce((sum, s) => sum + s.total_tax, 0);

  const summaryColumns = [
    { key: 'section', header: 'Section', render: (row: GSTR1Summary) => (
      <span className="font-mono text-sm font-medium text-indigo-600">{row.section}</span>
    )},
    { key: 'description', header: 'Description', render: (row: GSTR1Summary) => (
      <span className="text-sm">{row.description}</span>
    )},
    { key: 'invoice_count', header: 'Invoices', render: (row: GSTR1Summary) => (
      <span className="font-medium">{row.invoice_count}</span>
    )},
    { key: 'taxable_value', header: 'Taxable Value', render: (row: GSTR1Summary) => (
      <span className={row.taxable_value < 0 ? 'text-red-600' : ''}>
        {formatCurrency(row.taxable_value)}
      </span>
    )},
    { key: 'cgst', header: 'CGST', render: (row: GSTR1Summary) => formatCurrency(row.cgst) },
    { key: 'sgst', header: 'SGST', render: (row: GSTR1Summary) => formatCurrency(row.sgst) },
    { key: 'igst', header: 'IGST', render: (row: GSTR1Summary) => formatCurrency(row.igst) },
    { key: 'total_tax', header: 'Total Tax', render: (row: GSTR1Summary) => (
      <span className={`font-medium ${row.total_tax < 0 ? 'text-red-600' : 'text-green-600'}`}>
        {formatCurrency(row.total_tax)}
      </span>
    )},
  ];

  const invoiceColumns = [
    { key: 'invoice_number', header: 'Invoice No.', render: (row: GSTR1Invoice) => (
      <span className="font-mono text-sm text-indigo-600">{row.invoice_number}</span>
    )},
    { key: 'invoice_date', header: 'Date', render: (row: GSTR1Invoice) => row.invoice_date },
    { key: 'customer_gstin', header: 'GSTIN', render: (row: GSTR1Invoice) => (
      <span className="font-mono text-xs">{row.customer_gstin}</span>
    )},
    { key: 'customer_name', header: 'Customer', render: (row: GSTR1Invoice) => (
      <span className="truncate max-w-[150px] block">{row.customer_name}</span>
    )},
    { key: 'place_of_supply', header: 'POS', render: (row: GSTR1Invoice) => (
      <span className="text-xs">{row.place_of_supply}</span>
    )},
    { key: 'taxable_value', header: 'Taxable Value', render: (row: GSTR1Invoice) => formatCurrency(row.taxable_value) },
    { key: 'cgst', header: 'CGST', render: (row: GSTR1Invoice) => formatCurrency(row.cgst) },
    { key: 'sgst', header: 'SGST', render: (row: GSTR1Invoice) => formatCurrency(row.sgst) },
    { key: 'igst', header: 'IGST', render: (row: GSTR1Invoice) => formatCurrency(row.igst) },
    { key: 'total', header: 'Total', render: (row: GSTR1Invoice) => (
      <span className="font-medium">{formatCurrency(row.total)}</span>
    )},
  ];

  const months = [
    '01-2024', '02-2024', '03-2024', '04-2024', '05-2024', '06-2024',
    '07-2024', '08-2024', '09-2024', '10-2024', '11-2024', '12-2024'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">GSTR-1</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Outward supplies return summary
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600"
          >
            {months.map(m => (
              <option key={m} value={m}>
                {new Date(m.split('-')[1] + '-' + m.split('-')[0] + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button>
            File GSTR-1
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-500">Return Period</div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {new Date(selectedMonth.split('-')[1] + '-' + selectedMonth.split('-')[0] + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total Invoices</div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {summary.reduce((sum, s) => sum + s.invoice_count, 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Taxable Value</div>
          <div className="mt-1 text-xl font-bold text-indigo-600">{formatCurrency(totalTaxableValue)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total Tax Liability</div>
          <div className="mt-1 text-xl font-bold text-green-600">{formatCurrency(totalTax)}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-4">
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'b2b', label: 'B2B Invoices' },
            { id: 'b2c', label: 'B2C Supplies' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'summary' && (
        <Card>
          <DataTable
            columns={summaryColumns}
            data={summary}
            keyExtractor={(row) => row.section}
            loading={loading}
          />
          <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex justify-between items-center">
              <span className="font-medium">Grand Total</span>
              <div className="flex gap-8">
                <span>Taxable: <strong>{formatCurrency(totalTaxableValue)}</strong></span>
                <span>Tax: <strong className="text-green-600">{formatCurrency(totalTax)}</strong></span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'b2b' && (
        <Card>
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            keyExtractor={(row) => row.invoice_number}
            loading={loading}
          />
        </Card>
      )}

      {activeTab === 'b2c' && (
        <Card className="p-6">
          <div className="text-center text-slate-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>B2C supplies summary will be shown here</p>
          </div>
        </Card>
      )}

      {/* Filing Status */}
      <Card className="p-4">
        <h3 className="font-medium text-slate-900 dark:text-white mb-3">Filing Status</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-yellow-600">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>Not Filed</span>
          </div>
          <span className="text-sm text-slate-500">Due Date: 11th of next month</span>
        </div>
      </Card>
    </div>
  );
}

export default GSTR1;
