/**
 * Bank Reconciliation Page
 * 
 * Auto-matching with fuzzy logic per The ERP Architect's Handbook
 */

import { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface BankEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  matched: boolean;
  matched_to?: string;
  confidence?: number;
}

interface LedgerEntry {
  id: string;
  date: string;
  voucher_number: string;
  narration: string;
  debit: number;
  credit: number;
  party_name?: string;
  matched: boolean;
  matched_to?: string;
}

interface ReconciliationSummary {
  bank_balance: number;
  book_balance: number;
  unmatched_bank: number;
  unmatched_book: number;
  matched_count: number;
  total_entries: number;
}

export default function BankReconciliation() {
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankEntries, setBankEntries] = useState<BankEntry[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    bank_balance: 0,
    book_balance: 0,
    unmatched_bank: 0,
    unmatched_book: 0,
    matched_count: 0,
    total_entries: 0,
  });
  const [selectedBankEntry, setSelectedBankEntry] = useState<BankEntry | null>(null);
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<LedgerEntry | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isAutoMatching, setIsAutoMatching] = useState(false);

  useEffect(() => {
    // Mock bank entries
    setBankEntries([
      { id: 'B1', date: '2024-01-05', description: 'NEFT-SHARMA ENGINEERING WORKS', reference: 'NEFT-UTR12345', debit: 125000, credit: 0, balance: 875000, matched: true, matched_to: 'L1', confidence: 95 },
      { id: 'B2', date: '2024-01-08', description: 'CHQ DEP-XYZ TRADERS', reference: 'CHQ-456789', debit: 0, credit: 250000, balance: 1125000, matched: true, matched_to: 'L2', confidence: 92 },
      { id: 'B3', date: '2024-01-10', description: 'RTGS-KUMAR CONSULTANTS', reference: 'RTGS-789012', debit: 85000, credit: 0, balance: 1040000, matched: false },
      { id: 'B4', date: '2024-01-12', description: 'IMPS-MISC PAYMENT', reference: 'IMPS-345678', debit: 15000, credit: 0, balance: 1025000, matched: false },
      { id: 'B5', date: '2024-01-15', description: 'CHQ DEP-ABC CORP', reference: 'CHQ-901234', debit: 0, credit: 180000, balance: 1205000, matched: true, matched_to: 'L4', confidence: 88 },
      { id: 'B6', date: '2024-01-18', description: 'BANK CHARGES', reference: 'BC-JAN2024', debit: 2500, credit: 0, balance: 1202500, matched: false },
      { id: 'B7', date: '2024-01-20', description: 'INTEREST CREDITED', reference: 'INT-Q3', debit: 0, credit: 8500, balance: 1211000, matched: false },
    ]);

    // Mock ledger entries
    setLedgerEntries([
      { id: 'L1', date: '2024-01-04', voucher_number: 'PMT-2024-0012', narration: 'Payment to Sharma Engineering Works - PI-2024-0078', debit: 0, credit: 125000, party_name: 'Sharma Engineering Works', matched: true, matched_to: 'B1' },
      { id: 'L2', date: '2024-01-07', voucher_number: 'RCV-2024-0008', narration: 'Receipt from XYZ Traders - SI-2024-0045', debit: 250000, credit: 0, party_name: 'XYZ Traders', matched: true, matched_to: 'B2' },
      { id: 'L3', date: '2024-01-09', voucher_number: 'PMT-2024-0015', narration: 'Payment to Kumar Consultants - SI-2024-0052', debit: 0, credit: 85000, party_name: 'Kumar Consultants', matched: false },
      { id: 'L4', date: '2024-01-14', voucher_number: 'RCV-2024-0011', narration: 'Receipt from ABC Corporation', debit: 180000, credit: 0, party_name: 'ABC Corporation', matched: true, matched_to: 'B5' },
      { id: 'L5', date: '2024-01-16', voucher_number: 'PMT-2024-0018', narration: 'Payment to Ravi Transport', debit: 0, credit: 45000, party_name: 'Ravi Transport', matched: false },
    ]);

    // Calculate summary
    setSummary({
      bank_balance: 1211000,
      book_balance: 1196000,
      unmatched_bank: 4,
      unmatched_book: 2,
      matched_count: 3,
      total_entries: 7,
    });
  }, [selectedBank, statementDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAutoMatch = async () => {
    setIsAutoMatching(true);
    // Simulate auto-matching process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update entries with matches
    setBankEntries(prev => prev.map(entry => {
      if (entry.id === 'B3') {
        return { ...entry, matched: true, matched_to: 'L3', confidence: 87 };
      }
      return entry;
    }));

    setLedgerEntries(prev => prev.map(entry => {
      if (entry.id === 'L3') {
        return { ...entry, matched: true, matched_to: 'B3' };
      }
      return entry;
    }));

    setSummary(prev => ({
      ...prev,
      matched_count: prev.matched_count + 1,
      unmatched_bank: prev.unmatched_bank - 1,
      unmatched_book: prev.unmatched_book - 1,
    }));

    setIsAutoMatching(false);
  };

  const handleManualMatch = () => {
    if (selectedBankEntry && selectedLedgerEntry) {
      setBankEntries(prev => prev.map(entry =>
        entry.id === selectedBankEntry.id
          ? { ...entry, matched: true, matched_to: selectedLedgerEntry.id, confidence: 100 }
          : entry
      ));

      setLedgerEntries(prev => prev.map(entry =>
        entry.id === selectedLedgerEntry.id
          ? { ...entry, matched: true, matched_to: selectedBankEntry.id }
          : entry
      ));

      setSelectedBankEntry(null);
      setSelectedLedgerEntry(null);
    }
  };

  const handleUnmatch = (bankId: string, ledgerId: string) => {
    setBankEntries(prev => prev.map(entry =>
      entry.id === bankId
        ? { ...entry, matched: false, matched_to: undefined, confidence: undefined }
        : entry
    ));

    setLedgerEntries(prev => prev.map(entry =>
      entry.id === ledgerId
        ? { ...entry, matched: false, matched_to: undefined }
        : entry
    ));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bank Reconciliation</h1>
          <p className="text-gray-600">Match bank statements with book entries</p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Bank Account</option>
            <option value="hdfc-current">HDFC Bank - Current A/c</option>
            <option value="icici-current">ICICI Bank - Current A/c</option>
            <option value="sbi-saving">SBI - Savings A/c</option>
          </select>

          <input
            type="date"
            value={statementDate}
            onChange={(e) => setStatementDate(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            Import Statement
          </button>

          <button
            onClick={handleAutoMatch}
            disabled={isAutoMatching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isAutoMatching ? 'animate-spin' : ''}`} />
            Auto Match
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Bank Balance</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(summary.bank_balance)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Book Balance</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(summary.book_balance)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Difference</p>
          <p className={`text-xl font-bold ${summary.bank_balance - summary.book_balance === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.bank_balance - summary.book_balance)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Matched</p>
          <p className="text-xl font-bold text-green-600">{summary.matched_count} / {summary.total_entries}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Unmatched</p>
          <p className="text-xl font-bold text-yellow-600">
            Bank: {summary.unmatched_bank} | Book: {summary.unmatched_book}
          </p>
        </div>
      </div>

      {/* Manual Match Action */}
      {selectedBankEntry && selectedLedgerEntry && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-blue-700 font-medium">Ready to match:</span>
            <span className="bg-white px-3 py-1 rounded text-sm">{selectedBankEntry.description}</span>
            <LinkIcon className="h-5 w-5 text-blue-600" />
            <span className="bg-white px-3 py-1 rounded text-sm">{selectedLedgerEntry.voucher_number}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedBankEntry(null); setSelectedLedgerEntry(null); }}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleManualMatch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              Match Entries
            </button>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Bank Statement */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5 text-blue-600" />
              Bank Statement
            </h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded">
                <FunnelIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Credit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bankEntries.map(entry => (
                  <tr
                    key={entry.id}
                    onClick={() => !entry.matched && setSelectedBankEntry(entry)}
                    className={`cursor-pointer transition-colors
                      ${entry.matched ? 'bg-green-50' : 'hover:bg-blue-50'}
                      ${selectedBankEntry?.id === entry.id ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(entry.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                        {entry.description}
                      </div>
                      <div className="text-xs text-gray-500">{entry.reference}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.matched ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(entry.confidence!)}`}>
                            {entry.confidence}%
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnmatch(entry.id, entry.matched_to!);
                            }}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          Unmatched
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Book/Ledger Entries */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-green-600" />
              Book Entries
            </h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded">
                <FunnelIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Voucher</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Credit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ledgerEntries.map(entry => (
                  <tr
                    key={entry.id}
                    onClick={() => !entry.matched && setSelectedLedgerEntry(entry)}
                    className={`cursor-pointer transition-colors
                      ${entry.matched ? 'bg-green-50' : 'hover:bg-blue-50'}
                      ${selectedLedgerEntry?.id === entry.id ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(entry.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">
                        {entry.voucher_number}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {entry.narration}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.matched ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          Unmatched
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Import Bank Statement</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-4">
              <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Drag & drop your bank statement or click to browse</p>
              <p className="text-sm text-gray-500">Supported formats: CSV, XLSX, OFX, MT940</p>
              <input type="file" className="hidden" />
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Choose File
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
