import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  IndianRupee,
  FileCheck,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { useApp } from '../../context';

interface ITCRecord {
  id: string;
  gstin: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  // 2A/2B Data
  gstr2aValue?: number;
  gstr2aGst?: number;
  // Book Data
  bookValue: number;
  bookGst: number;
  // Status
  matchStatus: 'Matched' | 'Mismatched' | 'Missing in GSTR-2A' | 'Missing in Books' | 'Partial Match';
  valueDifference: number;
  gstDifference: number;
  action?: 'Claim' | 'Reverse' | 'Pending' | 'Hold';
  remarks?: string;
}

interface ReconciliationSummary {
  period: string;
  totalInvoices: number;
  matched: number;
  mismatched: number;
  missingIn2A: number;
  missingInBooks: number;
  partialMatch: number;
  totalItcClaimed: number;
  totalItcAvailable: number;
  totalItcDifference: number;
  matchPercentage: number;
}

const ITCReconciliation: React.FC = () => {
  const { state } = useApp();
  const [records, setRecords] = useState<ITCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  useEffect(() => {
    loadITCReconciliation();
  }, [selectedPeriod, state.user?.tenant_id]);

  const loadITCReconciliation = async () => {
    if (!state.user?.tenant_id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await window.electronAPI.gst.performITCReconciliation(state.user.tenant_id, selectedPeriod);
      
      if (result.success && result.data && Array.isArray(result.data)) {
        setRecords(result.data);
      } else {
        setError(result.error || 'Failed to load ITC reconciliation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ITC reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
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

  // Filter records
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      searchQuery === '' ||
      record.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.gstin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || record.matchStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary
  const summary: ReconciliationSummary = {
    period: selectedPeriod,
    totalInvoices: records.length,
    matched: records.filter((r) => r.matchStatus === 'Matched').length,
    mismatched: records.filter((r) => r.matchStatus === 'Mismatched').length,
    missingIn2A: records.filter((r) => r.matchStatus === 'Missing in GSTR-2A').length,
    missingInBooks: records.filter((r) => r.matchStatus === 'Missing in Books').length,
    partialMatch: records.filter((r) => r.matchStatus === 'Partial Match').length,
    totalItcClaimed: records.filter((r) => r.action === 'Claim').reduce((sum, r) => sum + r.bookGst, 0),
    totalItcAvailable: records.reduce((sum, r) => sum + (r.gstr2aGst || 0), 0),
    totalItcDifference: records.reduce((sum, r) => sum + r.gstDifference, 0),
    matchPercentage: records.length > 0
      ? (records.filter((r) => r.matchStatus === 'Matched').length / records.length) * 100
      : 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Matched':
        return 'bg-green-100 text-green-800';
      case 'Mismatched':
        return 'bg-red-100 text-red-800';
      case 'Missing in GSTR-2A':
        return 'bg-amber-100 text-amber-800';
      case 'Missing in Books':
        return 'bg-purple-100 text-purple-800';
      case 'Partial Match':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionBadge = (action?: string) => {
    switch (action) {
      case 'Claim':
        return 'bg-green-100 text-green-800';
      case 'Reverse':
        return 'bg-red-100 text-red-800';
      case 'Hold':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map((r) => r.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords([...selectedRecords, id]);
    } else {
      setSelectedRecords(selectedRecords.filter((r) => r !== id));
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ITC Reconciliation</h1>
          <p className="text-gray-500">Reconcile Input Tax Credit with GSTR-2A/2B data</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Import GSTR-2A
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <ArrowRightLeft className="h-4 w-4" />
            Run Reconciliation
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Return Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              <option value="2024-01">January 2024</option>
              <option value="2024-02">February 2024</option>
              <option value="2024-03">March 2024</option>
              <option value="2023-12">December 2023</option>
            </select>
          </div>
          <div className="flex-1" />
          <div className="text-sm text-gray-500">
            Last Reconciled: 25 Jan 2024, 10:30 AM
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Matched</p>
              <p className="text-2xl font-bold text-green-900">{summary.matched}</p>
              <p className="text-xs text-green-600">{summary.matchPercentage.toFixed(1)}% Match Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Mismatched</p>
              <p className="text-2xl font-bold text-red-900">{summary.mismatched}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
            <div>
              <p className="text-sm text-amber-600 font-medium">Missing in 2A</p>
              <p className="text-2xl font-bold text-amber-900">{summary.missingIn2A}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-10 w-10 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Missing in Books</p>
              <p className="text-2xl font-bold text-purple-900">{summary.missingInBooks}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <FileCheck className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Partial Match</p>
              <p className="text-2xl font-bold text-blue-900">{summary.partialMatch}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ITC Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">ITC Summary:</span>
          </div>
          <div className="px-4 py-2 bg-green-50 rounded-lg">
            <span className="text-sm text-green-600">Available (GSTR-2A): </span>
            <span className="font-semibold text-green-800">{formatCurrency(summary.totalItcAvailable)}</span>
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-600">Claimable: </span>
            <span className="font-semibold text-blue-800">{formatCurrency(summary.totalItcClaimed)}</span>
          </div>
          <div className="px-4 py-2 bg-amber-50 rounded-lg">
            <span className="text-sm text-amber-600">Difference: </span>
            <span className="font-semibold text-amber-800">{formatCurrency(Math.abs(summary.totalItcDifference))}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Supplier name, invoice no, GSTIN..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Match Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="Matched">Matched</option>
              <option value="Mismatched">Mismatched</option>
              <option value="Missing in GSTR-2A">Missing in GSTR-2A</option>
              <option value="Missing in Books">Missing in Books</option>
              <option value="Partial Match">Partial Match</option>
            </select>
          </div>
          <div className="flex gap-2">
            {selectedRecords.length > 0 && (
              <>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  Mark as Claim ({selectedRecords.length})
                </button>
                <button className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">
                  Hold Selected
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Invoice</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Book Value</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">2A Value</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Book GST</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">2A GST</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Difference</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedRecords.includes(record.id)}
                      onChange={(e) => handleSelectRecord(record.id, e.target.checked)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{record.supplierName}</div>
                      <div className="text-xs text-gray-500">{record.gstin}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm text-blue-600 font-medium">{record.invoiceNo}</div>
                      <div className="text-xs text-gray-500">{formatDate(record.invoiceDate)}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-900">
                    {record.bookValue > 0 ? formatCurrency(record.bookValue) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-900">
                    {record.gstr2aValue ? formatCurrency(record.gstr2aValue) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-900">
                    {record.bookGst > 0 ? formatCurrency(record.bookGst) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-900">
                    {record.gstr2aGst ? formatCurrency(record.gstr2aGst) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {record.gstDifference !== 0 ? (
                      <span className={`text-sm font-medium ${record.gstDifference > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {record.gstDifference > 0 ? '+' : ''}{formatCurrency(record.gstDifference)}
                      </span>
                    ) : (
                      <span className="text-sm text-green-600">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(record.matchStatus)}`}>
                      {record.matchStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionBadge(record.action)}`}>
                      {record.action || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900">
                  Total ({filteredRecords.length} invoices)
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {formatCurrency(filteredRecords.reduce((sum, r) => sum + r.bookValue, 0))}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {formatCurrency(filteredRecords.reduce((sum, r) => sum + (r.gstr2aValue || 0), 0))}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {formatCurrency(filteredRecords.reduce((sum, r) => sum + r.bookGst, 0))}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {formatCurrency(filteredRecords.reduce((sum, r) => sum + (r.gstr2aGst || 0), 0))}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-amber-600">
                  {formatCurrency(Math.abs(filteredRecords.reduce((sum, r) => sum + r.gstDifference, 0)))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Reconciliation Notes:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Import GSTR-2A/2B data from GST portal before running reconciliation</li>
              <li>Items "Missing in GSTR-2A" may not be eligible for ITC claim - verify with supplier</li>
              <li>Items "Missing in Books" should be recorded before claiming ITC</li>
              <li>Mismatched items require investigation - may be due to invoice value or tax rate differences</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITCReconciliation;
