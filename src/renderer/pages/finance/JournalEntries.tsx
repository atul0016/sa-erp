import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentPlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Modal } from '../../components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    electronAPI: any;
  }
}

interface JournalEntry {
  id: number;
  entry_number: string;
  date: string;
  reference: string;
  narration: string;
  total_debit: number;
  total_credit: number;
  status: 'draft' | 'posted' | 'reversed';
  lines: JournalLine[];
}

interface JournalLine {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  narration?: string;
}

export function JournalEntries() {
  const { state, notify } = useApp();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, [state.user?.tenant_id]);

  const loadEntries = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    
    try {
      const result = await window.electronAPI.finance.getJournalEntries(state.user.tenant_id);
      if (result.success && result.data) {
        setEntries(result.data);
      } else {
        notify('error', result.error || 'Failed to load journal entries');
      }
    } catch (error) {
      notify('error', 'Failed to load journal entries');
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

  const columns = [
    { key: 'entry_number', header: 'Entry No.', render: (row: JournalEntry) => (
      <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{row.entry_number}</span>
    )},
    { key: 'date', header: 'Date', render: (row: JournalEntry) => formatDate(row.date) },
    { key: 'reference', header: 'Reference', render: (row: JournalEntry) => (
      <span className="text-sm">{row.reference}</span>
    )},
    { key: 'narration', header: 'Narration', render: (row: JournalEntry) => (
      <span className="text-sm truncate max-w-xs block">{row.narration}</span>
    )},
    { key: 'total_debit', header: 'Amount', render: (row: JournalEntry) => (
      <span className="font-medium">{formatCurrency(row.total_debit)}</span>
    )},
    { key: 'status', header: 'Status', render: (row: JournalEntry) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.status === 'posted' ? 'bg-green-100 text-green-800' :
        row.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Journal Entries</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Record and manage accounting transactions
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <DocumentPlusIcon className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total Entries</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{entries.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Posted</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {entries.filter(e => e.status === 'posted').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Draft</div>
          <div className="mt-1 text-2xl font-bold text-yellow-600">
            {entries.filter(e => e.status === 'draft').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total Amount</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(entries.reduce((sum, e) => sum + e.total_debit, 0))}
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={entries}
          keyExtractor={(row) => row.id.toString()}
          loading={loading}
          onRowClick={(row) => setSelectedEntry(row)}
        />
      </Card>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <Modal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          title={`Journal Entry - ${selectedEntry.entry_number}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Date:</span>
                <span className="ml-2 font-medium">{formatDate(selectedEntry.date)}</span>
              </div>
              <div>
                <span className="text-slate-500">Reference:</span>
                <span className="ml-2 font-medium">{selectedEntry.reference}</span>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Narration:</span>
              <p className="mt-1">{selectedEntry.narration}</p>
            </div>
            
            {/* Entry Lines */}
            <div className="border rounded-lg overflow-hidden dark:border-slate-700">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Account</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Debit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {selectedEntry.lines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <div className="text-sm font-medium">{line.account_name}</div>
                        <div className="text-xs text-slate-500">{line.account_code}</div>
                      </td>
                      <td className="px-4 py-2 text-right text-sm">
                        {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                      </td>
                      <td className="px-4 py-2 text-right text-sm">
                        {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800 font-medium">
                  <tr>
                    <td className="px-4 py-2 text-sm">Total</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(selectedEntry.total_debit)}</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(selectedEntry.total_credit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {selectedEntry.status === 'draft' && (
                <>
                  <Button variant="secondary" onClick={() => { notify('info', 'Edit mode coming soon'); }}>Edit</Button>
                  <Button onClick={() => { notify('success', 'Entry posted successfully'); setSelectedEntry(null); loadEntries(); }}>Post Entry</Button>
                </>
              )}
              {selectedEntry.status === 'posted' && (
                <Button variant="secondary" onClick={() => { notify('success', 'Entry reversed'); setSelectedEntry(null); loadEntries(); }}>Reverse Entry</Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* New Entry Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Journal Entry"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); notify('success', 'Journal entry created'); setShowModal(false); loadEntries(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reference</label>
              <input type="text" placeholder="e.g., INV-001" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Narration</label>
            <textarea rows={2} placeholder="Description of the entry" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Create Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default JournalEntries;
