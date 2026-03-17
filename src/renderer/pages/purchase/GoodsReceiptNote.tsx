import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  IndianRupee,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Scan,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToExcel } from '../../utils/exportHelpers';
import { useApp } from '../../context';

interface GRNItem {
  itemCode: string;
  itemName: string;
  hsnCode: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  rate: number;
  amount: number;
  remarks?: string;
}

interface GRN {
  id: string;
  grnNo: string;
  grnDate: string;
  poNo: string;
  poDate: string;
  vendorName: string;
  gstin: string;
  invoiceNo: string;
  invoiceDate: string;
  challanNo: string;
  challanDate: string;
  transporterName: string;
  vehicleNo: string;
  lrNo: string;
  receivedBy: string;
  inspectedBy: string;
  warehouse: string;
  status: 'Draft' | 'Pending Inspection' | 'Partially Received' | 'Completed' | 'Rejected';
  totalAmount: number;
  items: GRNItem[];
  expanded?: boolean;
}

const GoodsReceiptNote: React.FC = () => {
  const { state, notify } = useApp();
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-31');

  useEffect(() => {
    loadGRNs();
  }, [state.user?.tenant_id]);

  const loadGRNs = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.purchase.getGoodsReceiptNotes(state.user.tenant_id);
      if (response.success && response.data && Array.isArray(response.data)) {
        const transformedGRNs = response.data.map((g: any) => ({
        id: g.id?.toString() || '',
        grnNo: g.grn_number || '',
        grnDate: g.grn_date || '',
        poNo: g.po_number || '',
        poDate: g.po_date || '',
        vendorName: g.vendor_name || '',
        gstin: g.gstin || '',
        invoiceNo: g.invoice_number || '',
        invoiceDate: g.invoice_date || '',
        challanNo: g.challan_number || '',
        challanDate: g.challan_date || '',
        transporterName: g.transporter_name || '',
        vehicleNo: g.vehicle_number || '',
        lrNo: g.lr_number || '',
        receivedBy: g.received_by || '',
        inspectedBy: g.inspected_by || '',
        warehouse: g.warehouse || '',
        status: g.status || 'Draft',
        totalAmount: g.total_amount || 0,
        items: g.items || [],
      }));
      setGrns(transformedGRNs);
      }
    } catch (error) {
      notify('error', 'Failed to load goods receipt notes');
      console.error('Load GRNs error:', error);
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

  const toggleGRN = (grnId: string) => {
    setGrns(grns.map((g) => (g.id === grnId ? { ...g, expanded: !g.expanded } : g)));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Pending Inspection': 'bg-yellow-100 text-yellow-800',
      'Partially Received': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Pending Inspection':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Partially Received':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  // Filter GRNs
  const filteredGRNs = grns.filter((grn) => {
    const matchesSearch =
      grn.grnNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grn.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grn.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || grn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary
  const summary = {
    total: grns.length,
    completed: grns.filter((g) => g.status === 'Completed').length,
    pending: grns.filter((g) => g.status === 'Pending Inspection').length,
    partial: grns.filter((g) => g.status === 'Partially Received').length,
    draft: grns.filter((g) => g.status === 'Draft').length,
    totalValue: grns.reduce((sum, g) => sum + g.totalAmount, 0),
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
          <h1 className="text-2xl font-bold text-gray-900">Goods Receipt Note (GRN)</h1>
          <p className="text-gray-500">Track and manage material receipts from vendors</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => alert('Barcode scanning feature coming soon!')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Scan className="h-4 w-4" />
            Scan Barcode
          </button>
          <button 
            onClick={() => {
              const exportData = filteredGRNs.map(g => ({
                GRN_No: g.grnNo,
                Date: g.grnDate,
                PO_No: g.poNo,
                Vendor: g.vendorName,
                Invoice_No: g.invoiceNo,
                Status: g.status,
                Amount: g.totalAmount,
              }));
              exportToExcel(exportData, 'GRN_Report');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </button>
          <button 
            onClick={() => alert('New GRN creation form will open here')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New GRN
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total GRNs</p>
              <p className="text-xl font-bold text-blue-900">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Completed</p>
              <p className="text-xl font-bold text-green-900">{summary.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-xl font-bold text-yellow-900">{summary.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Partial</p>
              <p className="text-xl font-bold text-purple-900">{summary.partial}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Draft</p>
              <p className="text-xl font-bold text-gray-900">{summary.draft}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
          <div className="flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-600 font-medium">Total Value</p>
              <p className="text-xl font-bold text-indigo-900">{formatCurrency(summary.totalValue)}</p>
            </div>
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
                placeholder="GRN no, PO no, vendor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending Inspection">Pending Inspection</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRN Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">GRN Details</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">PO Details</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Vendor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Transport</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGRNs.map((grn) => (
                <React.Fragment key={grn.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleGRN(grn.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {grn.expanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                        <div>
                          <div className="font-medium text-gray-900">{grn.grnNo}</div>
                          <div className="text-xs text-gray-500">{formatDate(grn.grnDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{grn.poNo}</div>
                      <div className="text-xs text-gray-500">{formatDate(grn.poDate)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{grn.vendorName}</div>
                      <div className="text-xs text-gray-500">{grn.gstin}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">{grn.transporterName}</div>
                      <div className="text-xs text-gray-500">{grn.vehicleNo}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(grn.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(grn.status)}`}>
                        {getStatusIcon(grn.status)}
                        {grn.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                          <FileText className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600" title="Print">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {grn.expanded && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 p-4">
                        <div className="space-y-4">
                          {/* GRN Details */}
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Invoice No:</span>{' '}
                              <span className="font-medium">{grn.invoiceNo}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Invoice Date:</span>{' '}
                              <span className="font-medium">{formatDate(grn.invoiceDate)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Challan No:</span>{' '}
                              <span className="font-medium">{grn.challanNo}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">LR No:</span>{' '}
                              <span className="font-medium">{grn.lrNo}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Received By:</span>{' '}
                              <span className="font-medium">{grn.receivedBy}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Inspected By:</span>{' '}
                              <span className="font-medium">{grn.inspectedBy}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Warehouse:</span>{' '}
                              <span className="font-medium">{grn.warehouse}</span>
                            </div>
                          </div>

                          {/* Items Table */}
                          <table className="w-full text-sm">
                            <thead className="bg-white">
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Item</th>
                                <th className="text-center py-2 px-3 text-xs font-medium text-gray-600">HSN</th>
                                <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Ordered</th>
                                <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Received</th>
                                <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Accepted</th>
                                <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Rejected</th>
                                <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Rate</th>
                                <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Amount</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {grn.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                  <td className="py-2 px-3">
                                    <div className="font-medium">{item.itemName}</div>
                                    <div className="text-xs text-gray-500">{item.itemCode}</div>
                                  </td>
                                  <td className="py-2 px-3 text-center text-gray-600">{item.hsnCode}</td>
                                  <td className="py-2 px-3 text-right">
                                    {item.orderedQty} {item.unit}
                                  </td>
                                  <td className="py-2 px-3 text-right font-medium">
                                    {item.receivedQty} {item.unit}
                                  </td>
                                  <td className="py-2 px-3 text-right text-green-700 font-medium">
                                    {item.acceptedQty} {item.unit}
                                  </td>
                                  <td className="py-2 px-3 text-right text-red-700 font-medium">
                                    {item.rejectedQty > 0 && `${item.rejectedQty} ${item.unit}`}
                                  </td>
                                  <td className="py-2 px-3 text-right">{formatCurrency(item.rate)}</td>
                                  <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                                  <td className="py-2 px-3 text-xs text-gray-500">{item.remarks}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-medium">
                              <tr>
                                <td colSpan={7} className="py-2 px-3 text-right">Total:</td>
                                <td className="py-2 px-3 text-right">{formatCurrency(grn.totalAmount)}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GoodsReceiptNote;
