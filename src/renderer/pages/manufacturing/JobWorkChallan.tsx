/**
 * Job Work Challan Page
 * 
 * GST Section 143 compliant job work management
 * Per The ERP Architect's Handbook specifications
 */

import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  TruckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  FunnelIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface JobWorkChallan {
  id: string;
  challan_number: string;
  challan_type: 'outward' | 'inward';
  challan_date: string;
  job_worker_name: string;
  job_worker_gstin: string;
  process_name: string;
  expected_return_date?: string;
  actual_return_date?: string;
  days_remaining?: number;
  status: 'draft' | 'dispatched' | 'partial_return' | 'completed' | 'overdue';
  total_value: number;
  items: JobWorkItem[];
}

interface JobWorkItem {
  id: string;
  item_name: string;
  item_code: string;
  hsn_code: string;
  uom: string;
  outward_qty: number;
  received_qty: number;
  scrap_qty: number;
  pending_qty: number;
  rate: number;
  amount: number;
}

interface ITC04Summary {
  quarter: string;
  challans_sent: number;
  challans_received: number;
  pending_return: number;
  value_sent: number;
  value_received: number;
  due_date: string;
  status: 'pending' | 'filed';
}

export default function JobWorkChallan() {
  const [activeTab, setActiveTab] = useState<'challans' | 'itc04'>('challans');
  const [challans, setChallans] = useState<JobWorkChallan[]>([]);
  const [itc04Summary, setItc04Summary] = useState<ITC04Summary[]>([]);
  const [selectedChallan, setSelectedChallan] = useState<JobWorkChallan | null>(null);
  const [showNewChallanModal, setShowNewChallanModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const loadJobWorkData = async () => {
      try {
        const result = await (window as any).electronAPI.manufacturing.getJobWorkChallans();
        if (result?.success) {
          setChallans(result.data.challans || []);
          setItc04Summary(result.data.itc04Summary ? [result.data.itc04Summary] : []);
        }
      } catch (error) {
        console.error('Failed to load job work data:', error);
      }
    };
    loadJobWorkData();
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-600', icon: DocumentTextIcon },
      dispatched: { bg: 'bg-blue-100', text: 'text-blue-600', icon: TruckIcon },
      partial_return: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: ClockIcon },
      completed: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircleIcon },
      overdue: { bg: 'bg-red-100', text: 'text-red-600', icon: ExclamationTriangleIcon },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: ClockIcon },
      filed: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircleIcon },
    };
    const style = styles[status] || styles.draft;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const filteredChallans = challans.filter(c => 
    filterStatus === 'all' || c.status === filterStatus
  );

  const stats = {
    total: challans.length,
    dispatched: challans.filter(c => c.status === 'dispatched').length,
    partial: challans.filter(c => c.status === 'partial_return').length,
    overdue: challans.filter(c => c.status === 'overdue').length,
    completed: challans.filter(c => c.status === 'completed').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Work Challan</h1>
          <p className="text-gray-600">GST Section 143 compliant job work management</p>
        </div>

        <button
          onClick={() => setShowNewChallanModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Challan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:bg-gray-50" onClick={() => setFilterStatus('all')}>
          <p className="text-sm text-gray-500">Total Challans</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:bg-blue-50" onClick={() => setFilterStatus('dispatched')}>
          <p className="text-sm text-gray-500">Dispatched</p>
          <p className="text-2xl font-bold text-blue-600">{stats.dispatched}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:bg-yellow-50" onClick={() => setFilterStatus('partial_return')}>
          <p className="text-sm text-gray-500">Partial Return</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:bg-red-50" onClick={() => setFilterStatus('overdue')}>
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:bg-green-50" onClick={() => setFilterStatus('completed')}>
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Warning Banner for Overdue */}
      {stats.overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-medium text-red-800">
              {stats.overdue} challan(s) overdue! As per GST Section 143, goods must be returned within 1 year.
            </p>
            <p className="text-sm text-red-600">Failure to receive goods back may attract tax liability.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'challans', label: 'Job Work Challans', icon: DocumentTextIcon },
              { id: 'itc04', label: 'ITC-04 Returns', icon: CalendarDaysIcon },
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

        {/* Challans Tab */}
        {activeTab === 'challans' && (
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Challan #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Job Worker</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Process</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Expected Return</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Value</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredChallans.map(challan => (
                  <tr key={challan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedChallan(challan)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {challan.challan_number}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{challan.job_worker_name}</div>
                      <div className="text-xs text-gray-500">{challan.job_worker_gstin}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{challan.process_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(challan.challan_date)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {challan.expected_return_date && formatDate(challan.expected_return_date)}
                      </div>
                      {challan.days_remaining !== undefined && challan.status !== 'completed' && (
                        <div className={`text-xs ${challan.days_remaining < 0 ? 'text-red-600' : challan.days_remaining < 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {challan.days_remaining < 0 
                            ? `${Math.abs(challan.days_remaining)} days overdue`
                            : `${challan.days_remaining} days left`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(challan.total_value)}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(challan.status)}</td>
                    <td className="px-4 py-3 text-center">
                      {['dispatched', 'partial_return', 'overdue'].includes(challan.status) && (
                        <button
                          onClick={() => { setSelectedChallan(challan); setShowReceiveModal(true); }}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Receive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ITC-04 Tab */}
        {activeTab === 'itc04' && (
          <div className="p-6">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>ITC-04:</strong> Quarterly return showing goods sent to job worker and received back.
                Must be filed by 25th of month following quarter end.
              </p>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Quarter</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Challans Sent</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Received Back</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Pending</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Value Sent</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Value Received</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Due Date</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {itc04Summary.map((summary, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{summary.quarter}</td>
                    <td className="px-4 py-3 text-center">{summary.challans_sent}</td>
                    <td className="px-4 py-3 text-center text-green-600">{summary.challans_received}</td>
                    <td className="px-4 py-3 text-center">
                      {summary.pending_return > 0 ? (
                        <span className="text-yellow-600 font-medium">{summary.pending_return}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(summary.value_sent)}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(summary.value_received)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(summary.due_date)}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(summary.status)}</td>
                    <td className="px-4 py-3 text-center">
                      {summary.status === 'pending' ? (
                        <button onClick={() => alert('Generate ITC-04 coming soon')} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                          Generate ITC-04
                        </button>
                      ) : (
                        <button onClick={() => alert('View coming soon')} className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Challan Detail Modal */}
      {selectedChallan && !showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedChallan.challan_number}</h2>
                <p className="text-gray-600">{selectedChallan.job_worker_name}</p>
              </div>
              {getStatusBadge(selectedChallan.status)}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Process</span>
                <div className="font-medium">{selectedChallan.process_name}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Challan Date</span>
                <div className="font-medium">{formatDate(selectedChallan.challan_date)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Expected Return</span>
                <div className="font-medium">
                  {selectedChallan.expected_return_date ? formatDate(selectedChallan.expected_return_date) : '-'}
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-3">Items</h3>
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">HSN</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Sent</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Received</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Scrap</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Pending</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedChallan.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-800">{item.item_name}</div>
                      <div className="text-xs text-gray-500">{item.item_code}</div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{item.hsn_code}</td>
                    <td className="px-3 py-2 text-center">{item.outward_qty} {item.uom}</td>
                    <td className="px-3 py-2 text-center text-green-600">{item.received_qty} {item.uom}</td>
                    <td className="px-3 py-2 text-center text-red-600">{item.scrap_qty} {item.uom}</td>
                    <td className="px-3 py-2 text-center">
                      {item.pending_qty > 0 ? (
                        <span className="text-yellow-600 font-medium">{item.pending_qty} {item.uom}</span>
                      ) : (
                        <span className="text-green-600">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={6} className="px-3 py-2 text-right font-medium">Total Value:</td>
                  <td className="px-3 py-2 text-right font-bold">{formatCurrency(selectedChallan.total_value)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedChallan(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button onClick={() => alert('Print Challan coming soon')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Print Challan
              </button>
              {['dispatched', 'partial_return', 'overdue'].includes(selectedChallan.status) && (
                <button
                  onClick={() => setShowReceiveModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Receive Goods
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && selectedChallan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Receive Goods</h2>
            <p className="text-gray-600 mb-6">{selectedChallan.challan_number} - {selectedChallan.job_worker_name}</p>

            <div className="space-y-4 mb-6">
              {selectedChallan.items.filter(i => i.pending_qty > 0).map(item => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="font-medium text-gray-800">{item.item_name}</div>
                      <div className="text-sm text-gray-500">Pending: {item.pending_qty} {item.uom}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Good Qty</label>
                      <input
                        type="number"
                        max={item.pending_qty}
                        defaultValue={item.pending_qty}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Scrap Qty</label>
                      <input
                        type="number"
                        defaultValue={0}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowReceiveModal(false); setSelectedChallan(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={() => alert('Confirm Receipt coming soon')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Challan Modal */}
      {showNewChallanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">New Job Work Challan</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Worker</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Job Worker</option>
                  <option value="1">Precision Machining Works</option>
                  <option value="2">Surface Treatment Co.</option>
                  <option value="3">Heat Treatment Services</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Process</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Process</option>
                  <option value="machining">CNC Machining</option>
                  <option value="plating">Zinc Plating</option>
                  <option value="hardening">Hardening</option>
                  <option value="grinding">Grinding</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewChallanModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={() => setShowNewChallanModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create & Add Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
