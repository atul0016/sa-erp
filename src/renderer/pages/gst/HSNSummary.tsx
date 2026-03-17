import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Package,
  IndianRupee,
  RefreshCw,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context';

interface HSNItem {
  hsnCode: string;
  description: string;
  uom: string;
  quantity: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cessAmount: number;
  totalTax: number;
  totalValue: number;
  invoiceCount: number;
  expanded?: boolean;
}

const HSNSummary: React.FC = () => {
  const { state } = useApp();
  const [hsnData, setHsnData] = useState<HSNItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'hsn' | 'value' | 'tax'>('value');
  const [month, setMonth] = useState('2024-01');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHSNSummary();
  }, [month, state.user?.tenant_id]);

  const loadHSNSummary = async () => {
    if (!state.user?.tenant_id) return;

    try {
      setLoading(true);
      setError(null);

      const fromDate = `${month}-01`;
      const lastDay = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
      const toDate = `${month}-${lastDay}`;

      const result = await window.electronAPI.gst.getHSNWiseSummary(state.user.tenant_id, fromDate, toDate);
      
      if (result.success && result.data) {
        setHsnData(result.data);
      } else {
        setError(result.error || 'Failed to load HSN summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HSN summary');
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const toggleHSN = (hsnCode: string) => {
    setHsnData(
      hsnData.map((h) => (h.hsnCode === hsnCode ? { ...h, expanded: !h.expanded } : h))
    );
  };

  // Filter and sort HSN data
  let filteredData = hsnData.filter(
    (hsn) =>
      hsn.hsnCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hsn.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort data
  switch (sortBy) {
    case 'hsn':
      filteredData = filteredData.sort((a, b) => a.hsnCode.localeCompare(b.hsnCode));
      break;
    case 'value':
      filteredData = filteredData.sort((a, b) => b.totalValue - a.totalValue);
      break;
    case 'tax':
      filteredData = filteredData.sort((a, b) => b.totalTax - a.totalTax);
      break;
  }

  // Calculate summary
  const summary = {
    totalHSN: hsnData.length,
    totalInvoices: hsnData.reduce((sum, h) => sum + h.invoiceCount, 0),
    totalTaxableValue: hsnData.reduce((sum, h) => sum + h.taxableValue, 0),
    totalIGST: hsnData.reduce((sum, h) => sum + h.igst, 0),
    totalCGST: hsnData.reduce((sum, h) => sum + h.cgst, 0),
    totalSGST: hsnData.reduce((sum, h) => sum + h.sgst, 0),
    totalTax: hsnData.reduce((sum, h) => sum + h.totalTax, 0),
    totalValue: hsnData.reduce((sum, h) => sum + h.totalValue, 0),
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
          <h1 className="text-2xl font-bold text-gray-900">HSN Summary Report</h1>
          <p className="text-gray-500">HSN/SAC-wise summary for GST returns (GSTR-1)</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export to Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Download GSTR-1 Format
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total HSN Codes</p>
              <p className="text-xl font-bold text-blue-900">{summary.totalHSN}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Total Invoices</p>
              <p className="text-xl font-bold text-green-900">{summary.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Taxable Value</p>
              <p className="text-xl font-bold text-purple-900">{formatCurrency(summary.totalTaxableValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600 font-medium">Total Tax</p>
              <p className="text-xl font-bold text-orange-900">{formatCurrency(summary.totalTax)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">IGST</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.totalIGST)}</p>
            <p className="text-xs text-blue-600 mt-1">Integrated GST</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">CGST</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(summary.totalCGST)}</p>
            <p className="text-xs text-green-600 mt-1">Central GST</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">SGST</p>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(summary.totalSGST)}</p>
            <p className="text-xs text-purple-600 mt-1">State GST</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Total Value</p>
            <p className="text-2xl font-bold text-orange-900">{formatCurrency(summary.totalValue)}</p>
            <p className="text-xs text-orange-600 mt-1">Inc. all taxes</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs text-gray-500 mb-1">Search HSN/Description</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search HSN code or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="value">Total Value</option>
              <option value="tax">Tax Amount</option>
              <option value="hsn">HSN Code</option>
            </select>
          </div>
        </div>
      </div>

      {/* HSN Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">HSN Code</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">UOM</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Taxable Value</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">IGST</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">CGST</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">SGST</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Total Tax</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Total Value</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((hsn) => (
                <tr key={hsn.hsnCode} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-mono font-medium text-gray-900">{hsn.hsnCode}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">{hsn.description}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs font-medium text-gray-600">{hsn.uom}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatNumber(hsn.quantity)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatCurrency(hsn.taxableValue)}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-700 font-medium">
                    {hsn.igst > 0 ? formatCurrency(hsn.igst) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-green-700 font-medium">
                    {hsn.cgst > 0 ? formatCurrency(hsn.cgst) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-purple-700 font-medium">
                    {hsn.sgst > 0 ? formatCurrency(hsn.sgst) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-orange-700">
                    {formatCurrency(hsn.totalTax)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    {formatCurrency(hsn.totalValue)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-xs">
                      {hsn.invoiceCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr className="font-bold">
                <td colSpan={4} className="py-3 px-4 text-right text-gray-900">
                  TOTAL:
                </td>
                <td className="py-3 px-4 text-right text-gray-900">
                  {formatCurrency(summary.totalTaxableValue)}
                </td>
                <td className="py-3 px-4 text-right text-blue-700">
                  {formatCurrency(summary.totalIGST)}
                </td>
                <td className="py-3 px-4 text-right text-green-700">
                  {formatCurrency(summary.totalCGST)}
                </td>
                <td className="py-3 px-4 text-right text-purple-700">
                  {formatCurrency(summary.totalSGST)}
                </td>
                <td className="py-3 px-4 text-right text-orange-700">
                  {formatCurrency(summary.totalTax)}
                </td>
                <td className="py-3 px-4 text-right text-gray-900">
                  {formatCurrency(summary.totalValue)}
                </td>
                <td className="py-3 px-4 text-center text-gray-900">{summary.totalInvoices}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HSNSummary;
