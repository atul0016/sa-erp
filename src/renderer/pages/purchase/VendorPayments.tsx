import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Plus,
  Search,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Building2,
  Receipt,
  Banknote,
  CreditCard,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context';

interface VendorPayment {
  id: string;
  paymentNo: string;
  date: string;
  vendorCode: string;
  vendorName: string;
  vendorGSTIN: string;
  vendorPAN: string;
  invoiceRefs: {
    invoiceNo: string;
    invoiceDate: string;
    invoiceAmount: number;
    amountAdjusted: number;
    tdsDeducted: number;
    tdsSection: string;
  }[];
  grossAmount: number;
  tdsAmount: number;
  tdsSection: string;
  netPayable: number;
  paymentMode: 'Cash' | 'Cheque' | 'NEFT/RTGS' | 'UPI' | 'DD';
  bankAccount: string;
  referenceNo: string;
  chequeNo?: string;
  chequeDate?: string;
  narration: string;
  status: 'Cleared' | 'Pending' | 'Cancelled' | 'Scheduled';
  scheduledDate?: string;
  clearedDate?: string;
  createdBy: string;
}

const VendorPayments: React.FC = () => {
  const { state, notify } = useApp();
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-31');
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, [state.user?.tenant_id]);

  const loadPayments = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.purchase.getVendorPayments(state.user.tenant_id);
      const transformedPayments = response.map((p: any) => ({
        id: p.id?.toString() || '',
        paymentNo: p.payment_number || '',
        date: p.payment_date || '',
        vendorCode: p.vendor_code || '',
        vendorName: p.vendor_name || '',
        vendorGSTIN: p.vendor_gstin || '',
        vendorPAN: p.vendor_pan || '',
        invoiceRefs: p.invoice_refs || [],
        grossAmount: p.gross_amount || 0,
        tdsAmount: p.tds_amount || 0,
        tdsSection: p.tds_section || '',
        netPayable: p.net_payable || 0,
        paymentMode: p.payment_mode || 'Cash',
        bankAccount: p.bank_account || '',
        referenceNo: p.reference_number || '',
        chequeNo: p.cheque_number,
        chequeDate: p.cheque_date,
        narration: p.narration || '',
        status: p.status || 'Pending',
        scheduledDate: p.scheduled_date,
        clearedDate: p.cleared_date,
        createdBy: p.created_by || '',
      }));
      setPayments(transformedPayments);
    } catch (error) {
      notify('error', 'Failed to load vendor payments');
      console.error('Load payments error:', error);
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

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchQuery === '' ||
      payment.paymentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesMode = selectedPaymentMode === 'all' || payment.paymentMode === selectedPaymentMode;
    const matchesDate = payment.date >= dateFrom && payment.date <= dateTo;
    return matchesSearch && matchesStatus && matchesMode && matchesDate;
  });

  // Calculate totals
  const totals = {
    totalPayments: filteredPayments.length,
    totalAmount: filteredPayments.reduce((sum, p) => sum + p.netPayable, 0),
    clearedAmount: filteredPayments.filter((p) => p.status === 'Cleared').reduce((sum, p) => sum + p.netPayable, 0),
    pendingAmount: filteredPayments.filter((p) => p.status === 'Pending').reduce((sum, p) => sum + p.netPayable, 0),
    scheduledAmount: filteredPayments.filter((p) => p.status === 'Scheduled').reduce((sum, p) => sum + p.netPayable, 0),
    tdsDeducted: filteredPayments.reduce((sum, p) => sum + p.tdsAmount, 0),
    tds194C: filteredPayments.filter((p) => p.tdsSection === '194C').reduce((sum, p) => sum + p.tdsAmount, 0),
    tds194J: filteredPayments.filter((p) => p.tdsSection === '194J').reduce((sum, p) => sum + p.tdsAmount, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Cleared':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-amber-100 text-amber-800';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
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
      case 'DD':
        return <FileText className="h-4 w-4" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Vendor Payments</h1>
          <p className="text-gray-500">Manage payments to vendors with TDS compliance</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert('Export coming soon')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button onClick={() => alert('New Payment coming soon')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            New Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <IndianRupee className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Paid</p>
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

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
          <div className="flex items-center gap-3">
            <Clock className="h-10 w-10 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-600 font-medium">Scheduled</p>
              <p className="text-2xl font-bold text-indigo-900">{formatCurrency(totals.scheduledAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <FileText className="h-10 w-10 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">TDS Deducted</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(totals.tdsDeducted)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TDS Section Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-gray-900">TDS Breakdown:</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-purple-50 rounded-lg">
              <span className="text-sm text-purple-600">Section 194C: </span>
              <span className="font-semibold text-purple-800">{formatCurrency(totals.tds194C)}</span>
            </div>
            <div className="px-3 py-1 bg-purple-50 rounded-lg">
              <span className="text-sm text-purple-600">Section 194J: </span>
              <span className="font-semibold text-purple-800">{formatCurrency(totals.tds194J)}</span>
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
                placeholder="Payment no, vendor, reference..."
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
              <option value="Scheduled">Scheduled</option>
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
              <option value="DD">DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Payment</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Vendor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Payment Mode</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Gross Amount</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">TDS</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Net Payable</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <React.Fragment key={payment.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedPayment(expandedPayment === payment.id ? null : payment.id)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-blue-600">{payment.paymentNo}</div>
                        <div className="text-xs text-gray-500">{formatDate(payment.date)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{payment.vendorName}</div>
                        <div className="text-xs text-gray-500">PAN: {payment.vendorPAN}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getPaymentModeIcon(payment.paymentMode)}
                        <div>
                          <div className="text-sm text-gray-900">{payment.paymentMode}</div>
                          {payment.chequeNo && (
                            <div className="text-xs text-gray-500">Chq: {payment.chequeNo}</div>
                          )}
                          {payment.referenceNo && (
                            <div className="text-xs text-gray-500">{payment.referenceNo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                      {formatCurrency(payment.grossAmount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {payment.tdsAmount > 0 ? (
                        <div>
                          <span className="text-sm text-purple-600">-{formatCurrency(payment.tdsAmount)}</span>
                          <div className="text-xs text-purple-500">{payment.tdsSection}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatCurrency(payment.netPayable)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                      {payment.scheduledDate && (
                        <div className="text-xs text-gray-500 mt-1">Due: {formatDate(payment.scheduledDate)}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => alert('Print coming soon')} className="p-1 text-gray-400 hover:text-blue-600">
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  {/* Expanded Row - Invoice Details */}
                  {expandedPayment === payment.id && (
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
                                  <th className="text-center py-2">Section</th>
                                </tr>
                              </thead>
                              <tbody>
                                {payment.invoiceRefs.map((inv, idx) => (
                                  <tr key={idx} className="text-gray-600 border-b border-gray-100">
                                    <td className="py-2 text-blue-600">{inv.invoiceNo}</td>
                                    <td className="py-2">{formatDate(inv.invoiceDate)}</td>
                                    <td className="py-2 text-right">{formatCurrency(inv.invoiceAmount)}</td>
                                    <td className="py-2 text-right">{formatCurrency(inv.amountAdjusted)}</td>
                                    <td className="py-2 text-right text-purple-600">
                                      {inv.tdsDeducted > 0 ? formatCurrency(inv.tdsDeducted) : '-'}
                                    </td>
                                    <td className="py-2 text-center text-purple-600">{inv.tdsSection || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Payment Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Vendor GSTIN:</span>
                                <span className="text-gray-900">{payment.vendorGSTIN}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Bank Account:</span>
                                <span className="text-gray-900">{payment.bankAccount}</span>
                              </div>
                              {payment.chequeNo && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Cheque No:</span>
                                    <span className="text-gray-900">{payment.chequeNo}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Cheque Date:</span>
                                    <span className="text-gray-900">{formatDate(payment.chequeDate!)}</span>
                                  </div>
                                </>
                              )}
                              {payment.referenceNo && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Reference:</span>
                                  <span className="text-gray-900">{payment.referenceNo}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-500">Narration:</span>
                                <span className="text-gray-900">{payment.narration}</span>
                              </div>
                              {payment.clearedDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Cleared On:</span>
                                  <span className="text-green-600">{formatDate(payment.clearedDate)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-500">Created By:</span>
                                <span className="text-gray-900">{payment.createdBy}</span>
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
                  Total ({filteredPayments.length} payments)
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-600">
                  {formatCurrency(totals.totalAmount + totals.tdsDeducted)}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-purple-600">
                  -{formatCurrency(totals.tdsDeducted)}
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

      {/* Payment Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Vendors by Payment</h3>
          <div className="space-y-3">
            {Array.from(new Set(payments.map((p) => p.vendorName)))
              .map((vendorName) => {
                const vendorPayments = payments.filter((p) => p.vendorName === vendorName);
                const totalPaid = vendorPayments.reduce((sum, p) => sum + p.netPayable, 0);
                return { vendorName, totalPaid, count: vendorPayments.length };
              })
              .sort((a, b) => b.totalPaid - a.totalPaid)
              .slice(0, 5)
              .map((vendor, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{vendor.vendorName}</div>
                    <div className="text-xs text-gray-500">{vendor.count} payments</div>
                  </div>
                  <div className="font-medium text-blue-600">{formatCurrency(vendor.totalPaid)}</div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Scheduled Payments</h3>
          <div className="space-y-3">
            {payments
              .filter((p) => p.status === 'Scheduled')
              .map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{payment.vendorName}</div>
                    <div className="text-xs text-gray-500">
                      Due: {formatDate(payment.scheduledDate!)} • {payment.paymentNo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">{formatCurrency(payment.netPayable)}</div>
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Scheduled</span>
                  </div>
                </div>
              ))}
            {payments.filter((p) => p.status === 'Scheduled').length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No scheduled payments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPayments;
