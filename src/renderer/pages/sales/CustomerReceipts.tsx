import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  CreditCard,
  Banknote,
  Building2,
  Receipt,
} from 'lucide-react';
import { useApp } from '../../context';

interface CustomerReceipt {
  id: string;
  receiptNo: string;
  date: string;
  customerCode: string;
  customerName: string;
  customerGSTIN: string;
  invoiceRefs: {
    invoiceNo: string;
    invoiceDate: string;
    invoiceAmount: number;
    amountAdjusted: number;
    tdsDeducted: number;
  }[];
  totalAmount: number;
  tdsAmount: number;
  netReceived: number;
  paymentMode: 'Cash' | 'Cheque' | 'NEFT/RTGS' | 'UPI' | 'Card';
  bankAccount: string;
  referenceNo: string;
  chequeNo?: string;
  chequeDate?: string;
  upiId?: string;
  narration: string;
  status: 'Cleared' | 'Pending' | 'Bounced' | 'Cancelled';
  clearedDate?: string;
  createdBy: string;
}

const CustomerReceipts: React.FC = () => {
  const { state, notify } = useApp();
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-31');
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);

  useEffect(() => {
    loadCustomerReceipts();
  }, [state.user?.tenant_id]);

  const loadCustomerReceipts = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.sales.getCustomerReceipts(state.user.tenant_id);
      const transformedReceipts = response.map((r: any) => ({
        id: r.id?.toString() || '',
        receiptNo: r.receipt_number || '',
        date: r.receipt_date || '',
        customerCode: r.customer_code || '',
        customerName: r.customer_name || '',
        customerGSTIN: r.customer_gstin || '',
        invoiceRefs: r.invoice_refs || [],
        totalAmount: r.total_amount || 0,
        tdsAmount: r.tds_amount || 0,
        netReceived: r.net_received || 0,
        paymentMode: r.payment_mode || 'Cash',
        bankAccount: r.bank_account || '',
        referenceNo: r.reference_number || '',
        chequeNo: r.cheque_number,
        chequeDate: r.cheque_date,
        upiId: r.upi_id,
        narration: r.narration || '',
        status: r.status || 'Pending',
        clearedDate: r.cleared_date,
        createdBy: r.created_by || '',
      }));
      setReceipts(transformedReceipts);
    } catch (error) {
      notify('error', 'Failed to load customer receipts');
      console.error('Load receipts error:', error);
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

  // Filter receipts
  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      searchQuery === '' ||
      receipt.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || receipt.status === selectedStatus;
    const matchesMode = selectedPaymentMode === 'all' || receipt.paymentMode === selectedPaymentMode;
    const matchesDate = receipt.date >= dateFrom && receipt.date <= dateTo;
    return matchesSearch && matchesStatus && matchesMode && matchesDate;
  });

  // Calculate totals
  const totals = {
    totalReceipts: filteredReceipts.length,
    totalAmount: filteredReceipts.reduce((sum, r) => sum + r.netReceived, 0),
    clearedAmount: filteredReceipts.filter((r) => r.status === 'Cleared').reduce((sum, r) => sum + r.netReceived, 0),
    pendingAmount: filteredReceipts.filter((r) => r.status === 'Pending').reduce((sum, r) => sum + r.netReceived, 0),
    bouncedAmount: filteredReceipts.filter((r) => r.status === 'Bounced').reduce((sum, r) => sum + r.netReceived, 0),
    tdsCollected: filteredReceipts.reduce((sum, r) => sum + r.tdsAmount, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Cleared':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-amber-100 text-amber-800';
      case 'Bounced':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return <Banknote className="h-4 w-4" />;
      case 'Cheque':
        return <Receipt className="h-4 w-4" />;
      case 'NEFT/RTGS':
        return <Building2 className="h-4 w-4" />;
      case 'UPI':
        return <CreditCard className="h-4 w-4" />;
      case 'Card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <IndianRupee className="h-4 w-4" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Customer Receipts</h1>
          <p className="text-gray-500">Track and manage customer payments and TDS</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Receipt
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <IndianRupee className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Received</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Cleared</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.clearedAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-3">
            <Clock className="h-10 w-10 text-amber-600" />
            <div>
              <p className="text-sm text-amber-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-amber-900">{formatCurrency(totals.pendingAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Bounced</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(totals.bouncedAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <Receipt className="h-10 w-10 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">TDS Collected</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(totals.tdsCollected)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Receipt no, customer, reference..."
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="Cleared">Cleared</option>
              <option value="Pending">Pending</option>
              <option value="Bounced">Bounced</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Payment Mode</label>
            <select
              value={selectedPaymentMode}
              onChange={(e) => setSelectedPaymentMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="NEFT/RTGS">NEFT/RTGS</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Receipt</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Payment Mode</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">TDS</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Net Received</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReceipts.map((receipt) => (
                <React.Fragment key={receipt.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedReceipt(expandedReceipt === receipt.id ? null : receipt.id)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-blue-600">{receipt.receiptNo}</div>
                        <div className="text-xs text-gray-500">{formatDate(receipt.date)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{receipt.customerName}</div>
                        <div className="text-xs text-gray-500">{receipt.customerGSTIN}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getPaymentModeIcon(receipt.paymentMode)}
                        <div>
                          <div className="text-sm text-gray-900">{receipt.paymentMode}</div>
                          {receipt.chequeNo && (
                            <div className="text-xs text-gray-500">Chq: {receipt.chequeNo}</div>
                          )}
                          {receipt.referenceNo && (
                            <div className="text-xs text-gray-500">{receipt.referenceNo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                      {formatCurrency(receipt.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {receipt.tdsAmount > 0 ? (
                        <span className="text-sm text-purple-600">-{formatCurrency(receipt.tdsAmount)}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatCurrency(receipt.netReceived)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(receipt.status)}`}>
                        {receipt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  {/* Expanded Row - Invoice Details */}
                  {expandedReceipt === receipt.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={8} className="py-4 px-8">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Invoice Adjustments</h4>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-500 border-b border-gray-200">
                                  <th className="text-left py-2">Invoice No</th>
                                  <th className="text-left py-2">Date</th>
                                  <th className="text-right py-2">Invoice Amt</th>
                                  <th className="text-right py-2">Adjusted</th>
                                  <th className="text-right py-2">TDS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {receipt.invoiceRefs.map((inv, idx) => (
                                  <tr key={idx} className="text-gray-600 border-b border-gray-100">
                                    <td className="py-2 text-blue-600">{inv.invoiceNo}</td>
                                    <td className="py-2">{formatDate(inv.invoiceDate)}</td>
                                    <td className="py-2 text-right">{formatCurrency(inv.invoiceAmount)}</td>
                                    <td className="py-2 text-right">{formatCurrency(inv.amountAdjusted)}</td>
                                    <td className="py-2 text-right text-purple-600">
                                      {inv.tdsDeducted > 0 ? formatCurrency(inv.tdsDeducted) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Receipt Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Bank Account:</span>
                                <span className="text-gray-900">{receipt.bankAccount}</span>
                              </div>
                              {receipt.chequeNo && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Cheque No:</span>
                                    <span className="text-gray-900">{receipt.chequeNo}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Cheque Date:</span>
                                    <span className="text-gray-900">{formatDate(receipt.chequeDate!)}</span>
                                  </div>
                                </>
                              )}
                              {receipt.referenceNo && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Reference:</span>
                                  <span className="text-gray-900">{receipt.referenceNo}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-500">Narration:</span>
                                <span className="text-gray-900">{receipt.narration}</span>
                              </div>
                              {receipt.clearedDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Cleared On:</span>
                                  <span className="text-green-600">{formatDate(receipt.clearedDate)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-500">Created By:</span>
                                <span className="text-gray-900">{receipt.createdBy}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900">
                  Total ({filteredReceipts.length} receipts)
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-600">
                  {formatCurrency(totals.totalAmount + totals.tdsCollected)}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-purple-600">
                  -{formatCurrency(totals.tdsCollected)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">
                  {formatCurrency(totals.totalAmount)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Mode Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">By Payment Mode</h3>
          <div className="space-y-3">
            {['Cash', 'Cheque', 'NEFT/RTGS', 'UPI'].map((mode) => {
              const modeReceipts = receipts.filter((r) => r.paymentMode === mode);
              const modeTotal = modeReceipts.reduce((sum, r) => sum + r.netReceived, 0);
              const percentage = totals.totalAmount > 0 ? (modeTotal / totals.totalAmount) * 100 : 0;
              return (
                <div key={mode} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-24">
                    {getPaymentModeIcon(mode)}
                    <span className="text-sm text-gray-600">{mode}</span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                  <div className="text-right w-28">
                    <div className="font-medium text-gray-900">{formatCurrency(modeTotal)}</div>
                    <div className="text-xs text-gray-500">{modeReceipts.length} receipts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Receipts</h3>
          <div className="space-y-3">
            {filteredReceipts.slice(0, 5).map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">{receipt.customerName}</div>
                  <div className="text-xs text-gray-500">
                    {receipt.receiptNo} • {formatDate(receipt.date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">{formatCurrency(receipt.netReceived)}</div>
                  <span className={`text-xs ${getStatusBadge(receipt.status)} px-1.5 py-0.5 rounded`}>
                    {receipt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReceipts;
