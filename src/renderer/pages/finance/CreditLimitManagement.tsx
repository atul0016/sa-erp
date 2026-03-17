/**
 * Credit Limit Management Page
 * 
 * Customer credit management with risk assessment
 * Per The ERP Architect's Handbook specifications
 */

import { useState, useEffect } from 'react';
import {
  CreditCardIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
  PencilSquareIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface CustomerCredit {
  id: string;
  customer_code: string;
  customer_name: string;
  gstin: string;
  credit_limit: number;
  current_outstanding: number;
  overdue_amount: number;
  utilization_percent: number;
  days_overdue: number;
  payment_terms: number;
  last_payment_date?: string;
  average_days_to_pay: number;
  credit_rating: 'A' | 'B' | 'C' | 'D';
  risk_status: 'low' | 'medium' | 'high' | 'blocked';
  hold_status: boolean;
}

interface CreditLimitRequest {
  id: string;
  customer_name: string;
  current_limit: number;
  requested_limit: number;
  requested_by: string;
  requested_date: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
}

interface PaymentHistory {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_date: string;
  amount: number;
  days_taken: number;
}

export default function CreditLimitManagement() {
  const [activeTab, setActiveTab] = useState<'customers' | 'requests' | 'aging'>('customers');
  const [customers, setCustomers] = useState<CustomerCredit[]>([]);
  const [requests, setRequests] = useState<CreditLimitRequest[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCredit | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Mock customer credit data
    setCustomers([
      {
        id: '1',
        customer_code: 'CUST001',
        customer_name: 'ABC Engineering Pvt Ltd',
        gstin: '27AABCA1234M1Z5',
        credit_limit: 500000,
        current_outstanding: 385000,
        overdue_amount: 0,
        utilization_percent: 77,
        days_overdue: 0,
        payment_terms: 30,
        last_payment_date: '2024-01-10',
        average_days_to_pay: 28,
        credit_rating: 'A',
        risk_status: 'low',
        hold_status: false,
      },
      {
        id: '2',
        customer_code: 'CUST002',
        customer_name: 'XYZ Industries Ltd',
        gstin: '27AABCX5678N1Z8',
        credit_limit: 750000,
        current_outstanding: 680000,
        overdue_amount: 125000,
        utilization_percent: 91,
        days_overdue: 15,
        payment_terms: 45,
        last_payment_date: '2023-12-20',
        average_days_to_pay: 52,
        credit_rating: 'B',
        risk_status: 'medium',
        hold_status: false,
      },
      {
        id: '3',
        customer_code: 'CUST003',
        customer_name: 'PQR Manufacturing Co',
        gstin: '27AABCP9012K1Z2',
        credit_limit: 300000,
        current_outstanding: 320000,
        overdue_amount: 180000,
        utilization_percent: 107,
        days_overdue: 45,
        payment_terms: 30,
        last_payment_date: '2023-11-25',
        average_days_to_pay: 68,
        credit_rating: 'D',
        risk_status: 'high',
        hold_status: true,
      },
      {
        id: '4',
        customer_code: 'CUST004',
        customer_name: 'DEF Traders',
        gstin: '27AABCD3456L1Z9',
        credit_limit: 200000,
        current_outstanding: 45000,
        overdue_amount: 0,
        utilization_percent: 23,
        days_overdue: 0,
        payment_terms: 15,
        last_payment_date: '2024-01-12',
        average_days_to_pay: 12,
        credit_rating: 'A',
        risk_status: 'low',
        hold_status: false,
      },
      {
        id: '5',
        customer_code: 'CUST005',
        customer_name: 'LMN Steel Works',
        gstin: '27AABCL7890M1Z3',
        credit_limit: 450000,
        current_outstanding: 390000,
        overdue_amount: 45000,
        utilization_percent: 87,
        days_overdue: 8,
        payment_terms: 30,
        last_payment_date: '2024-01-05',
        average_days_to_pay: 35,
        credit_rating: 'B',
        risk_status: 'medium',
        hold_status: false,
      },
    ]);

    // Mock credit limit requests
    setRequests([
      {
        id: '1',
        customer_name: 'ABC Engineering Pvt Ltd',
        current_limit: 500000,
        requested_limit: 750000,
        requested_by: 'Sales Manager',
        requested_date: '2024-01-14',
        status: 'pending',
        remarks: 'Large project order expected',
      },
      {
        id: '2',
        customer_name: 'DEF Traders',
        current_limit: 200000,
        requested_limit: 350000,
        requested_by: 'Account Executive',
        requested_date: '2024-01-12',
        status: 'approved',
        remarks: 'Good payment history',
      },
      {
        id: '3',
        customer_name: 'GHI Enterprises',
        current_limit: 300000,
        requested_limit: 500000,
        requested_by: 'Regional Head',
        requested_date: '2024-01-10',
        status: 'rejected',
        remarks: 'Recent payment delays',
      },
    ]);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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

  const getRiskBadge = (risk: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      low: { bg: 'bg-green-100', text: 'text-green-600' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      high: { bg: 'bg-red-100', text: 'text-red-600' },
      blocked: { bg: 'bg-gray-800', text: 'text-white' },
    };
    const style = styles[risk] || styles.low;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {risk.toUpperCase()}
      </span>
    );
  };

  const getRatingBadge = (rating: string) => {
    const colors: Record<string, string> = {
      A: 'bg-green-500',
      B: 'bg-blue-500',
      C: 'bg-yellow-500',
      D: 'bg-red-500',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${colors[rating] || colors.C}`}>
        {rating}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      approved: { bg: 'bg-green-100', text: 'text-green-600' },
      rejected: { bg: 'bg-red-100', text: 'text-red-600' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const filteredCustomers = customers.filter(c => {
    if (filterRisk !== 'all' && c.risk_status !== filterRisk) return false;
    if (searchQuery && !c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    totalCredit: customers.reduce((sum, c) => sum + c.credit_limit, 0),
    totalOutstanding: customers.reduce((sum, c) => sum + c.current_outstanding, 0),
    totalOverdue: customers.reduce((sum, c) => sum + c.overdue_amount, 0),
    blockedCustomers: customers.filter(c => c.hold_status).length,
    highRisk: customers.filter(c => c.risk_status === 'high').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Credit Limit Management</h1>
          <p className="text-gray-600">Manage customer credit limits and risk assessment</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Credit</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalCredit)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.totalOutstanding)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalOverdue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Blocked</p>
              <p className="text-lg font-bold text-gray-600">{stats.blockedCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">High Risk</p>
              <p className="text-lg font-bold text-red-600">{stats.highRisk}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {stats.highRisk > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">
              {stats.highRisk} customer(s) flagged as high risk with significant overdue amounts.
            </p>
            <p className="text-sm text-red-600">Review and take necessary action to minimize credit exposure.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'customers', label: 'Customer Credits', icon: UserGroupIcon },
              { id: 'requests', label: 'Limit Requests', icon: CreditCardIcon },
              { id: 'aging', label: 'Receivables Aging', icon: ChartBarIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Rating</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Credit Limit</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Outstanding</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Overdue</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Utilization</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Avg Days</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Risk</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.map(customer => (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-gray-50 ${customer.hold_status ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {customer.hold_status && (
                            <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded">HOLD</span>
                          )}
                          <div>
                            <div className="font-medium text-gray-800">{customer.customer_name}</div>
                            <div className="text-xs text-gray-500">{customer.customer_code} • {customer.gstin}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getRatingBadge(customer.credit_rating)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(customer.credit_limit)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={customer.current_outstanding > customer.credit_limit ? 'text-red-600 font-bold' : ''}>
                          {formatCurrency(customer.current_outstanding)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {customer.overdue_amount > 0 ? (
                          <div>
                            <span className="text-red-600 font-medium">{formatCurrency(customer.overdue_amount)}</span>
                            <div className="text-xs text-red-500">{customer.days_overdue} days</div>
                          </div>
                        ) : (
                          <span className="text-green-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                customer.utilization_percent > 100 ? 'bg-red-500' :
                                customer.utilization_percent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(customer.utilization_percent, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            customer.utilization_percent > 100 ? 'text-red-600' :
                            customer.utilization_percent > 80 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {customer.utilization_percent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${
                          customer.average_days_to_pay > customer.payment_terms ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {customer.average_days_to_pay}d
                        </span>
                        <span className="text-xs text-gray-500 block">/{customer.payment_terms}d</span>
                      </td>
                      <td className="px-4 py-3 text-center">{getRiskBadge(customer.risk_status)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setSelectedCustomer(customer); setShowEditModal(true); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Credit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Current Limit</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Requested</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Increase</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Requested By</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{request.customer_name}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(request.current_limit)}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">{formatCurrency(request.requested_limit)}</td>
                    <td className="px-4 py-3 text-right text-green-600">
                      +{formatCurrency(request.requested_limit - request.current_limit)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{request.requested_by}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(request.requested_date)}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(request.status)}</td>
                    <td className="px-4 py-3 text-center">
                      {request.status === 'pending' && (
                        <div className="flex justify-center gap-2">
                          <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                            Approve
                          </button>
                          <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Aging Tab */}
        {activeTab === 'aging' && (
          <div className="p-6">
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[
                { label: '0-30 Days', amount: 850000, count: 12, color: 'bg-green-500' },
                { label: '31-60 Days', amount: 320000, count: 5, color: 'bg-yellow-500' },
                { label: '61-90 Days', amount: 145000, count: 3, color: 'bg-orange-500' },
                { label: '91-120 Days', amount: 78000, count: 2, color: 'bg-red-500' },
                { label: '120+ Days', amount: 52000, count: 1, color: 'bg-red-700' },
              ].map((bucket, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className={`w-full h-2 ${bucket.color} rounded-full mb-3`}></div>
                  <p className="text-sm text-gray-500">{bucket.label}</p>
                  <p className="text-xl font-bold text-gray-800">{formatCurrency(bucket.amount)}</p>
                  <p className="text-xs text-gray-500">{bucket.count} invoices</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Aging Summary by Customer</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">0-30</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">31-60</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">61-90</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">91-120</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">120+</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.slice(0, 5).map(customer => (
                    <tr key={customer.id} className="bg-white hover:bg-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-800">{customer.customer_name}</td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {formatCurrency(customer.current_outstanding * 0.5)}
                      </td>
                      <td className="px-4 py-3 text-right text-yellow-600">
                        {formatCurrency(customer.current_outstanding * 0.25)}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600">
                        {formatCurrency(customer.current_outstanding * 0.15)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {formatCurrency(customer.current_outstanding * 0.07)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-700">
                        {formatCurrency(customer.current_outstanding * 0.03)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatCurrency(customer.current_outstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Credit Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Edit Credit Limit</h2>
            <p className="text-gray-600 mb-6">{selectedCustomer.customer_name}</p>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Current Limit</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedCustomer.credit_limit)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Outstanding</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(selectedCustomer.current_outstanding)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Credit Limit</label>
                <input
                  type="number"
                  defaultValue={selectedCustomer.credit_limit}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (Days)</label>
                <input
                  type="number"
                  defaultValue={selectedCustomer.payment_terms}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credit Rating</label>
                <select defaultValue={selectedCustomer.credit_rating} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="A">A - Excellent</option>
                  <option value="B">B - Good</option>
                  <option value="C">C - Average</option>
                  <option value="D">D - Poor</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="holdStatus"
                  defaultChecked={selectedCustomer.hold_status}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="holdStatus" className="text-sm font-medium text-gray-700">
                  Put customer on credit hold
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for change..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowEditModal(false); setSelectedCustomer(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
