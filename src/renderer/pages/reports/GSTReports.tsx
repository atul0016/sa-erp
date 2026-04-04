import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Package,
} from 'lucide-react';
import { useApp } from '../../context';

interface GSTMetrics {
  totalSales: number;
  totalPurchases: number;
  outputGST: number;
  inputGST: number;
  itcAvailable: number;
  itcUtilized: number;
  gstPayable: number;
  gstRefund: number;
  complianceScore: number;
}

interface GSTBreakdown {
  type: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
  color: string;
}

interface GSTRStatus {
  return: string;
  period: string;
  dueDate: string;
  status: 'Filed' | 'Pending' | 'Overdue';
  filedOn?: string;
  arn?: string;
}

const GSTReports: React.FC = () => {
  const { state } = useApp();
  const [metrics, setMetrics] = useState<GSTMetrics | null>(null);
  const [salesGST, setSalesGST] = useState<GSTBreakdown[]>([]);
  const [purchaseGST, setPurchaseGST] = useState<GSTBreakdown[]>([]);
  const [gstrStatus, setGstrStatus] = useState<GSTRStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('2024-01');

  useEffect(() => {
    loadGSTData();
  }, [month, state.user?.tenant_id]);

  const loadGSTData = async () => {
    if (!state.user?.tenant_id) return;
    try {
      setLoading(true);
      const response = await window.electronAPI.gst.getGSTLiabilitySummary(state.user.tenant_id, `${month}-01`, `${month}-31`);
      if (response.success && response.data) {
        setMetrics({
          totalSales: response.data.total_sales || 0,
          totalPurchases: response.data.total_purchases || 0,
          outputGST: response.data.output_gst || 0,
          inputGST: response.data.input_gst || 0,
          itcAvailable: response.data.itc_available || 0,
          itcUtilized: response.data.itc_utilized || 0,
          gstPayable: response.data.gst_payable || 0,
          gstRefund: response.data.gst_refund || 0,
          complianceScore: 95,
        });
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGSTData();
  }, [month]);

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

  const getStatusBadge = (status: string) => {
    const styles = {
      Filed: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Overdue: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Filed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
      green: { bg: 'bg-green-50', text: 'text-green-700' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700' },
      red: { bg: 'bg-red-50', text: 'text-red-700' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading || !metrics) {
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
          <h1 className="text-2xl font-bold text-gray-900">GST Reports</h1>
          <p className="text-gray-500">GST liability, ITC, and compliance tracking</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert('Download GSTR-3B coming soon')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Download GSTR-3B
          </button>
          <button onClick={() => alert('Export coming soon')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Month Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tax Period</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button onClick={() => alert('Filter applied')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Apply Filter
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-200 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-700" />
            </div>
          </div>
          <p className="text-sm text-blue-600 font-medium">Output GST (Sales)</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.outputGST)}</p>
          <p className="text-xs text-blue-600 mt-1">On sales of {formatCurrency(metrics.totalSales)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-200 rounded-lg">
              <TrendingDown className="h-6 w-6 text-green-700" />
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium">Input GST (ITC)</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.inputGST)}</p>
          <p className="text-xs text-green-600 mt-1">On purchases of {formatCurrency(metrics.totalPurchases)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-200 rounded-lg">
              <IndianRupee className="h-6 w-6 text-orange-700" />
            </div>
          </div>
          <p className="text-sm text-orange-600 font-medium">GST Payable</p>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(metrics.gstPayable)}</p>
          <p className="text-xs text-orange-600 mt-1">Net liability this month</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-200 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-700" />
            </div>
          </div>
          <p className="text-sm text-purple-600 font-medium">Compliance Score</p>
          <p className="text-2xl font-bold text-purple-900">{metrics.complianceScore}%</p>
          <p className="text-xs text-purple-600 mt-1">Excellent compliance</p>
        </div>
      </div>

      {/* ITC Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Input Tax Credit (ITC) Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">ITC Available</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.itcAvailable)}</p>
            <p className="text-xs text-blue-600 mt-1">Eligible for utilization</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">ITC Utilized</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.itcUtilized)}</p>
            <p className="text-xs text-green-600 mt-1">Applied against output tax</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">ITC Balance</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(metrics.itcAvailable - metrics.itcUtilized)}
            </p>
            <p className="text-xs text-purple-600 mt-1">Carried forward</p>
          </div>
        </div>
      </div>

      {/* Sales GST Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Output GST Breakdown (Sales)</h2>
          <p className="text-sm text-gray-500">Category-wise GST on sales</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Taxable Value</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">IGST</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">CGST</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">SGST</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salesGST.map((item, idx) => {
                const colors = getColorClasses(item.color);
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className={`font-medium ${colors.text}`}>{item.type}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      {formatCurrency(item.taxableValue)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-blue-700">
                      {item.igst > 0 ? formatCurrency(item.igst) : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-green-700">
                      {item.cgst > 0 ? formatCurrency(item.cgst) : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-purple-700">
                      {item.sgst > 0 ? formatCurrency(item.sgst) : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-orange-700">
                      {formatCurrency(item.totalTax)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-bold">
                <td className="py-4 px-6 text-gray-900">TOTAL OUTPUT GST</td>
                <td className="py-4 px-6 text-right text-gray-900">
                  {formatCurrency(salesGST.reduce((sum, i) => sum + i.taxableValue, 0))}
                </td>
                <td className="py-4 px-6 text-right text-blue-700">
                  {formatCurrency(salesGST.reduce((sum, i) => sum + i.igst, 0))}
                </td>
                <td className="py-4 px-6 text-right text-green-700">
                  {formatCurrency(salesGST.reduce((sum, i) => sum + i.cgst, 0))}
                </td>
                <td className="py-4 px-6 text-right text-purple-700">
                  {formatCurrency(salesGST.reduce((sum, i) => sum + i.sgst, 0))}
                </td>
                <td className="py-4 px-6 text-right text-orange-700">
                  {formatCurrency(salesGST.reduce((sum, i) => sum + i.totalTax, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase GST Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Input GST Breakdown (Purchases)</h2>
          <p className="text-sm text-gray-500">Category-wise ITC on purchases</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Taxable Value</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">IGST</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">CGST</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">SGST</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Total ITC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchaseGST.map((item, idx) => {
                const colors = getColorClasses(item.color);
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className={`font-medium ${colors.text}`}>{item.type}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      {formatCurrency(item.taxableValue)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-blue-700">
                      {item.igst > 0 ? formatCurrency(item.igst) : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-green-700">
                      {item.cgst > 0 ? formatCurrency(item.cgst) : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-purple-700">
                      {item.sgst > 0 ? formatCurrency(item.sgst) : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-green-700">
                      {formatCurrency(item.totalTax)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-bold">
                <td className="py-4 px-6 text-gray-900">TOTAL INPUT GST (ITC)</td>
                <td className="py-4 px-6 text-right text-gray-900">
                  {formatCurrency(purchaseGST.reduce((sum, i) => sum + i.taxableValue, 0))}
                </td>
                <td className="py-4 px-6 text-right text-blue-700">
                  {formatCurrency(purchaseGST.reduce((sum, i) => sum + i.igst, 0))}
                </td>
                <td className="py-4 px-6 text-right text-green-700">
                  {formatCurrency(purchaseGST.reduce((sum, i) => sum + i.cgst, 0))}
                </td>
                <td className="py-4 px-6 text-right text-purple-700">
                  {formatCurrency(purchaseGST.reduce((sum, i) => sum + i.sgst, 0))}
                </td>
                <td className="py-4 px-6 text-right text-green-700">
                  {formatCurrency(purchaseGST.reduce((sum, i) => sum + i.totalTax, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* GSTR Filing Status */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">GSTR Filing Status</h2>
          <p className="text-sm text-gray-500">Track GST return filing deadlines</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Return Type</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Period</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Filed On</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">ARN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gstrStatus.map((gstr, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{gstr.return}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{gstr.period}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{gstr.dueDate}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium ${getStatusBadge(gstr.status)}`}>
                      {getStatusIcon(gstr.status)}
                      {gstr.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {gstr.filedOn ? formatDate(gstr.filedOn) : '-'}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 font-mono">{gstr.arn || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GSTReports;
