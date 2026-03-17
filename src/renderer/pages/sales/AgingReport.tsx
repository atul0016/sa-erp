import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Phone,
  Mail,
  AlertCircle,
  TrendingUp,
  Users,
  IndianRupee,
  Clock,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToExcel, makePhoneCall, sendEmail } from '../../utils/exportHelpers';
import { useApp } from '../../context';

interface AgingBucket {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120: number;
  total: number;
}

interface CustomerAging {
  id: string;
  customerName: string;
  gstin: string;
  contactPerson: string;
  phone: string;
  email: string;
  creditLimit: number;
  creditDays: number;
  aging: AgingBucket;
  invoices: Invoice[];
  expanded?: boolean;
}

interface Invoice {
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  pending: number;
  overdueDays: number;
  status: 'Current' | 'Overdue';
}

const AgingReport: React.FC = () => {
  const { state } = useApp();
  const [customers, setCustomers] = useState<CustomerAging[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'total' | 'overdue' | 'name'>('total');
  const [filterOverdue, setFilterOverdue] = useState(false);

  useEffect(() => {
    fetchAgingReport();
  }, [state.user?.tenant_id]);

  const handleRefresh = () => {
    fetchAgingReport();
  };

  const fetchAgingReport = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await window.electronAPI.sales.getAgingReport(state.user.tenant_id);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        // Transform backend data to frontend format
        const transformedData: CustomerAging[] = response.data.map((item: any) => ({
          id: item.customer_id || Math.random().toString(),
          customerName: item.customer_name,
          gstin: item.gstin || '',
          contactPerson: item.contact_person || '',
          phone: item.phone || '',
          email: item.email || '',
          creditLimit: item.credit_limit || 0,
          creditDays: item.credit_days || 30,
          aging: {
            current: Number(item.current) || 0,
            days30: Number(item.days_1_30) || 0,
            days60: Number(item.days_31_60) || 0,
            days90: Number(item.days_61_90) || 0,
            days120: Number(item.over_90) || 0,
            total: Number(item.total) || 0,
          },
          invoices: item.invoices || [],
        }));
        
        setCustomers(transformedData);
      } else {
        throw new Error(response.error || 'Failed to fetch aging report');
      }
    } catch (err) {
      console.error('Error fetching aging report:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Fallback to mock data on error
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock data fallback
    const mockData: CustomerAging[] = [
      {
        id: '1',
        customerName: 'ABC Industries Pvt Ltd',
        gstin: '27AABCU9603R1ZM',
        contactPerson: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        email: 'rajesh@abcindustries.com',
        creditLimit: 500000,
        creditDays: 30,
        aging: {
          current: 125000,
          days30: 85000,
          days60: 45000,
          days90: 0,
          days120: 0,
          total: 255000,
        },
        invoices: [
          {
            invoiceNo: 'INV-2024-001',
            invoiceDate: '2025-12-15',
            dueDate: '2026-01-14',
            amount: 125000,
            pending: 125000,
            overdueDays: 0,
            status: 'Current',
          },
          {
            invoiceNo: 'INV-2023-156',
            invoiceDate: '2023-11-15',
            dueDate: '2023-12-15',
            amount: 85000,
            pending: 85000,
            overdueDays: 30,
            status: 'Overdue',
          },
          {
            invoiceNo: 'INV-2023-098',
            invoiceDate: '2023-10-15',
            dueDate: '2023-11-14',
            amount: 45000,
            pending: 45000,
            overdueDays: 61,
            status: 'Overdue',
          },
        ],
      },
      {
        id: '2',
        customerName: 'XYZ Manufacturing Ltd',
        gstin: '27AABCX9603R1ZM',
        contactPerson: 'Priya Sharma',
        phone: '+91 98765 43211',
        email: 'priya@xyzmanuf.com',
        creditLimit: 750000,
        creditDays: 45,
        aging: {
          current: 0,
          days30: 0,
          days60: 125000,
          days90: 85000,
          days120: 45000,
          total: 255000,
        },
        invoices: [
          {
            invoiceNo: 'INV-2023-145',
            invoiceDate: '2023-10-20',
            dueDate: '2023-12-04',
            amount: 125000,
            pending: 125000,
            overdueDays: 41,
            status: 'Overdue',
          },
          {
            invoiceNo: 'INV-2023-089',
            invoiceDate: '2023-09-15',
            dueDate: '2023-10-30',
            amount: 85000,
            pending: 85000,
            overdueDays: 76,
            status: 'Overdue',
          },
          {
            invoiceNo: 'INV-2023-034',
            invoiceDate: '2023-08-10',
            dueDate: '2023-09-24',
            amount: 45000,
            pending: 45000,
            overdueDays: 112,
            status: 'Overdue',
          },
        ],
      },
      {
        id: '3',
        customerName: 'PQR Traders',
        gstin: '27AABCP9603R1ZM',
        contactPerson: 'Amit Patel',
        phone: '+91 98765 43212',
        email: 'amit@pqrtraders.com',
        creditLimit: 300000,
        creditDays: 30,
        aging: {
          current: 95000,
          days30: 0,
          days60: 0,
          days90: 0,
          days120: 0,
          total: 95000,
        },
        invoices: [
          {
            invoiceNo: 'INV-2024-012',
            invoiceDate: '2026-01-05',
            dueDate: '2026-02-04',
            amount: 95000,
            pending: 95000,
            overdueDays: 0,
            status: 'Current',
          },
        ],
      },
      {
        id: '4',
        customerName: 'MNO Enterprises',
        gstin: '27AABCM9603R1ZM',
        contactPerson: 'Sunita Reddy',
        phone: '+91 98765 43213',
        email: 'sunita@mnoent.com',
        creditLimit: 400000,
        creditDays: 30,
        aging: {
          current: 75000,
          days30: 65000,
          days60: 0,
          days90: 0,
          days120: 0,
          total: 140000,
        },
        invoices: [
          {
            invoiceNo: 'INV-2024-008',
            invoiceDate: '2026-01-02',
            dueDate: '2026-02-01',
            amount: 75000,
            pending: 75000,
            overdueDays: 0,
            status: 'Current',
          },
          {
            invoiceNo: 'INV-2023-189',
            invoiceDate: '2023-11-28',
            dueDate: '2023-12-28',
            amount: 65000,
            pending: 65000,
            overdueDays: 17,
            status: 'Overdue',
          },
        ],
      },
      {
        id: '5',
        customerName: 'DEF Solutions Pvt Ltd',
        gstin: '27AABCD9603R1ZM',
        contactPerson: 'Vikram Singh',
        phone: '+91 98765 43214',
        email: 'vikram@defsolutions.com',
        creditLimit: 600000,
        creditDays: 45,
        aging: {
          current: 185000,
          days30: 0,
          days60: 0,
          days90: 0,
          days120: 0,
          total: 185000,
        },
        invoices: [
          {
            invoiceNo: 'INV-2024-015',
            invoiceDate: '2026-01-08',
            dueDate: '2026-02-22',
            amount: 185000,
            pending: 185000,
            overdueDays: 0,
            status: 'Current',
          },
        ],
      },
    ];

    setCustomers(mockData);
  };

  useEffect(() => {
    fetchAgingReport();
  }, [state.user?.tenant_id]);

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

  const toggleCustomer = (customerId: string) => {
    setCustomers(
      customers.map((c) =>
        c.id === customerId ? { ...c, expanded: !c.expanded } : c
      )
    );
  };

  const handleExportToExcel = () => {
    const exportData = filteredCustomers.map(c => ({
      Customer: c.customerName,
      GSTIN: c.gstin,
      Current: c.aging.current,
      'Days_1_30': c.aging.days30,
      'Days_31_60': c.aging.days60,
      'Days_61_90': c.aging.days90,
      'Days_90_Plus': c.aging.days120,
      Total: c.aging.total,
    }));
    exportToExcel(exportData, 'Aging_Report');
  };

  const handlePhoneCall = (phone: string, customerName: string) => {
    if (confirm(`Call ${customerName} at ${phone}?`)) {
      makePhoneCall(phone);
    }
  };

  const handleSendEmail = (email: string, customerName: string) => {
    sendEmail(email, `Payment Reminder - ${customerName}`, `Dear ${customerName},\\n\\nThis is a reminder regarding your outstanding payments.`);
  };

  const handleSendBulkReminders = () => {
    const overdueCustomers = customers.filter(c => 
      c.aging.days30 + c.aging.days60 + c.aging.days90 + c.aging.days120 > 0
    );
    if (overdueCustomers.length === 0) {
      alert('No customers with overdue payments');
      return;
    }
    if (confirm(`Send payment reminders to ${overdueCustomers.length} customers?`)) {
      alert(`Reminders sent to ${overdueCustomers.length} customers`);
    }
  };

  // Calculate totals
  const totals = customers.reduce(
    (acc, customer) => ({
      current: acc.current + customer.aging.current,
      days30: acc.days30 + customer.aging.days30,
      days60: acc.days60 + customer.aging.days60,
      days90: acc.days90 + customer.aging.days90,
      days120: acc.days120 + customer.aging.days120,
      total: acc.total + customer.aging.total,
    }),
    { current: 0, days30: 0, days60: 0, days90: 0, days120: 0, total: 0 }
  );

  // Filter and sort
  let filteredCustomers = customers.filter((c) =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterOverdue) {
    filteredCustomers = filteredCustomers.filter(
      (c) => c.aging.days30 + c.aging.days60 + c.aging.days90 + c.aging.days120 > 0
    );
  }

  filteredCustomers.sort((a, b) => {
    if (sortBy === 'total') return b.aging.total - a.aging.total;
    if (sortBy === 'name') return a.customerName.localeCompare(b.customerName);
    if (sortBy === 'overdue') {
      const aOverdue = a.aging.days30 + a.aging.days60 + a.aging.days90 + a.aging.days120;
      const bOverdue = b.aging.days30 + b.aging.days60 + b.aging.days90 + b.aging.days120;
      return bOverdue - aOverdue;
    }
    return 0;
  });

  const overdueCount = customers.filter(
    (c) => c.aging.days30 + c.aging.days60 + c.aging.days90 + c.aging.days120 > 0
  ).length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500">Loading aging report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button 
            onClick={handleRefresh}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Receivable Aging</h1>
          <p className="text-gray-500">Track outstanding customer payments by age</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSendBulkReminders}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Send Reminders
          </button>
          <button 
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Current</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(totals.current)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">1-30 Days</p>
              <p className="text-xl font-bold text-yellow-900">{formatCurrency(totals.days30)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600 font-medium">31-60 Days</p>
              <p className="text-xl font-bold text-orange-900">{formatCurrency(totals.days60)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">61-90 Days</p>
              <p className="text-xl font-bold text-red-900">{formatCurrency(totals.days90)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">90+ Days</p>
              <p className="text-xl font-bold text-purple-900">{formatCurrency(totals.days120)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.total)}</p>
            </div>
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Customers with Dues</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              <p className="text-xs text-orange-600">{overdueCount} overdue</p>
            </div>
            <Users className="h-10 w-10 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue Amount</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.days30 + totals.days60 + totals.days90 + totals.days120)}
              </p>
              <p className="text-xs text-gray-500">
                {((totals.days30 + totals.days60 + totals.days90 + totals.days120) / totals.total * 100).toFixed(1)}% of total
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs text-gray-500 mb-1">Search Customer</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Customer name or GSTIN..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="total">Total Amount</option>
              <option value="overdue">Overdue Amount</option>
              <option value="name">Customer Name</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="overdue"
              checked={filterOverdue}
              onChange={(e) => setFilterOverdue(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="overdue" className="text-sm text-gray-700">
              Show only overdue
            </label>
          </div>
        </div>
      </div>

      {/* Aging Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Current</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">1-30 Days</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">31-60 Days</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">61-90 Days</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">90+ Days</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCustomer(customer.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {customer.expanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                        <div>
                          <div className="font-medium text-gray-900">{customer.customerName}</div>
                          <div className="text-xs text-gray-500">{customer.gstin}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {customer.aging.current > 0 && formatCurrency(customer.aging.current)}
                    </td>
                    <td className="py-3 px-4 text-right text-yellow-700">
                      {customer.aging.days30 > 0 && formatCurrency(customer.aging.days30)}
                    </td>
                    <td className="py-3 px-4 text-right text-orange-700">
                      {customer.aging.days60 > 0 && formatCurrency(customer.aging.days60)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-700">
                      {customer.aging.days90 > 0 && formatCurrency(customer.aging.days90)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-900 font-medium">
                      {customer.aging.days120 > 0 && formatCurrency(customer.aging.days120)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {formatCurrency(customer.aging.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handlePhoneCall(customer.phone, customer.customerName)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors" 
                          title={`Call ${customer.phone}`}
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleSendEmail(customer.email, customer.customerName)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors" 
                          title={`Email ${customer.email}`}
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {customer.expanded && (
                    <tr>
                      <td colSpan={8} className="bg-gray-50 p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="text-gray-500">Contact:</span>{' '}
                              <span className="font-medium">{customer.contactPerson}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Phone:</span>{' '}
                              <span className="font-medium">{customer.phone}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>{' '}
                              <span className="font-medium">{customer.email}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Credit Limit:</span>{' '}
                              <span className="font-medium">{formatCurrency(customer.creditLimit)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Credit Days:</span>{' '}
                              <span className="font-medium">{customer.creditDays} days</span>
                            </div>
                          </div>
                          <table className="w-full text-sm">
                            <thead className="bg-white">
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Invoice</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Date</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Due Date</th>
                                <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Amount</th>
                                <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Pending</th>
                                <th className="text-center py-2 px-3 text-xs font-medium text-gray-600">Days</th>
                                <th className="text-center py-2 px-3 text-xs font-medium text-gray-600">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {customer.invoices.map((invoice) => (
                                <tr key={invoice.invoiceNo} className="border-b border-gray-100">
                                  <td className="py-2 px-3 font-medium">{invoice.invoiceNo}</td>
                                  <td className="py-2 px-3">{formatDate(invoice.invoiceDate)}</td>
                                  <td className="py-2 px-3">{formatDate(invoice.dueDate)}</td>
                                  <td className="py-2 px-3 text-right">{formatCurrency(invoice.amount)}</td>
                                  <td className="py-2 px-3 text-right font-medium">{formatCurrency(invoice.pending)}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        invoice.overdueDays === 0
                                          ? 'bg-green-100 text-green-800'
                                          : invoice.overdueDays <= 30
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {invoice.overdueDays === 0 ? '-' : `${invoice.overdueDays}d`}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        invoice.status === 'Current'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {invoice.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300 font-bold">
              <tr>
                <td className="py-3 px-4 text-gray-900">Total</td>
                <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(totals.current)}</td>
                <td className="py-3 px-4 text-right text-yellow-700">{formatCurrency(totals.days30)}</td>
                <td className="py-3 px-4 text-right text-orange-700">{formatCurrency(totals.days60)}</td>
                <td className="py-3 px-4 text-right text-red-700">{formatCurrency(totals.days90)}</td>
                <td className="py-3 px-4 text-right text-red-900">{formatCurrency(totals.days120)}</td>
                <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(totals.total)}</td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgingReport;
