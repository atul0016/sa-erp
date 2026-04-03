/**
 * Sales Orders Page
 * 
 * Comprehensive sales order management with approval workflow
 * Per The ERP Architect's Handbook specifications
 */

import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      sales: {
        getSalesOrders: (tenantId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

interface SalesOrder {
  id: string;
  order_number: string;
  order_date: string;
  customer_code: string;
  customer_name: string;
  customer_gstin: string;
  delivery_date: string;
  payment_terms: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid';
  credit_check: 'passed' | 'failed' | 'warning' | 'pending';
  items_count: number;
  fulfilled_qty: number;
  total_qty: number;
  created_by: string;
  approved_by?: string;
}

interface SalesOrderItem {
  id: string;
  item_code: string;
  item_name: string;
  hsn_code: string;
  ordered_qty: number;
  shipped_qty: number;
  pending_qty: number;
  uom: string;
  unit_price: number;
  discount_percent: number;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  available_stock: number;
}

export default function SalesOrders() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);

  useEffect(() => {
    loadOrders();
  }, [state.user?.tenant_id]);

  const loadOrders = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.sales.getSalesOrders(state.user.tenant_id);
      
      if (response.success && response.data) {
        setOrders(response.data.map((o: any) => ({
          id: String(o.id),
          order_number: o.order_number,
          order_date: o.order_date,
          customer_code: o.customer_code,
          customer_name: o.customer_name,
          customer_gstin: o.customer_gstin || '',
          delivery_date: o.delivery_date,
          payment_terms: Number(o.payment_terms) || 0,
          subtotal: Number(o.subtotal) || 0,
          tax_amount: Number(o.tax_amount) || 0,
          total_amount: Number(o.total_amount) || 0,
          status: o.status,
          payment_status: o.payment_status || 'pending',
          credit_check: o.credit_check || 'pending',
          items_count: Number(o.items_count) || 0,
          fulfilled_qty: Number(o.fulfilled_qty) || 0,
          total_qty: Number(o.total_qty) || 0,
          created_by: o.created_by,
          approved_by: o.approved_by,
        })));
      }
    } catch (error) {
      console.error('Error loading sales orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Additional initialization if needed
  }, []);

  if (loading) {
    return <div className="p-6 flex items-center justify-center">Loading...</div>;
  }

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
      pending_approval: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: ClockIcon },
      approved: { bg: 'bg-blue-100', text: 'text-blue-600', icon: CheckCircleIcon },
      processing: { bg: 'bg-purple-100', text: 'text-purple-600', icon: ShoppingCartIcon },
      shipped: { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: TruckIcon },
      delivered: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircleIcon },
      cancelled: { bg: 'bg-red-100', text: 'text-red-600', icon: XCircleIcon },
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

  const getCreditBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      passed: { bg: 'bg-green-100', text: 'text-green-600' },
      failed: { bg: 'bg-red-100', text: 'text-red-600' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-600' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>
        Credit: {status.toUpperCase()}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      paid: { bg: 'bg-green-100', text: 'text-green-600' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-600' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending' && !['pending_approval', 'approved'].includes(order.status)) return false;
    if (activeTab === 'processing' && !['processing', 'shipped'].includes(order.status)) return false;
    if (activeTab === 'completed' && !['delivered', 'cancelled'].includes(order.status)) return false;
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (searchQuery && !order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending_approval').length,
    processing: orders.filter(o => ['processing', 'shipped'].includes(o.status)).length,
    totalValue: orders.filter(o => !['cancelled'].includes(o.status)).reduce((sum, o) => sum + o.total_amount, 0),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Orders</h1>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Sales Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TruckIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">{stats.processing}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Value</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b flex items-center justify-between px-4">
          <nav className="flex -mb-px">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'processing', label: 'Processing' },
              { id: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 py-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Delivery</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Fulfillment</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {order.order_number}
                    </button>
                    <div className="flex items-center gap-1 mt-1">
                      {getCreditBadge(order.credit_check)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{order.customer_name}</div>
                    <div className="text-xs text-gray-500">{order.customer_gstin}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.order_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.delivery_date)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                    <div className="text-xs text-gray-500">{order.items_count} items</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(order.fulfilled_qty / order.total_qty) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {order.fulfilled_qty}/{order.total_qty}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getStatusBadge(order.status)}
                      {getPaymentBadge(order.payment_status)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        title="View"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {order.status === 'draft' && (
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Duplicate">
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedOrder.order_number}</h2>
                <p className="text-gray-600">{selectedOrder.customer_name}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedOrder.status)}
                {getPaymentBadge(selectedOrder.payment_status)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Order Date</span>
                <div className="font-medium">{formatDate(selectedOrder.order_date)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Delivery Date</span>
                <div className="font-medium">{formatDate(selectedOrder.delivery_date)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Payment Terms</span>
                <div className="font-medium">{selectedOrder.payment_terms} days</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Credit Check</span>
                <div className="font-medium capitalize">{selectedOrder.credit_check}</div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-3">Order Items</h3>
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">HSN</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Ordered</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Shipped</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Pending</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Rate</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">GST</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orderItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-800">{item.item_name}</div>
                      <div className="text-xs text-gray-500">{item.item_code}</div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{item.hsn_code}</td>
                    <td className="px-3 py-2 text-center">{item.ordered_qty} {item.uom}</td>
                    <td className="px-3 py-2 text-center text-green-600">{item.shipped_qty} {item.uom}</td>
                    <td className="px-3 py-2 text-center">
                      {item.pending_qty > 0 ? (
                        <span className="text-yellow-600 font-medium">{item.pending_qty} {item.uom}</span>
                      ) : (
                        <span className="text-green-600">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-3 py-2 text-right text-sm">{item.gst_rate}%</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={5}></td>
                  <td colSpan={2} className="px-3 py-2 text-right font-medium">Subtotal:</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(selectedOrder.subtotal)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={5}></td>
                  <td colSpan={2} className="px-3 py-2 text-right font-medium">Tax:</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(selectedOrder.tax_amount)}</td>
                </tr>
                <tr className="bg-blue-50">
                  <td colSpan={5}></td>
                  <td colSpan={2} className="px-3 py-2 text-right font-bold">Total:</td>
                  <td className="px-3 py-2 text-right font-bold text-lg">{formatCurrency(selectedOrder.total_amount)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex justify-between">
              <div className="flex gap-2">
                {selectedOrder.status === 'pending_approval' && (
                  <>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Approve
                    </button>
                    <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                      Reject
                    </button>
                  </>
                )}
                {selectedOrder.status === 'approved' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create Delivery
                  </button>
                )}
                {selectedOrder.status === 'processing' && (
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Generate Invoice
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">New Sales Order</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Customer</option>
                  <option value="CUST001">ABC Engineering Pvt Ltd</option>
                  <option value="CUST002">XYZ Industries Ltd</option>
                  <option value="CUST003">PQR Manufacturing Co</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / PO Number</label>
                <input
                  type="text"
                  placeholder="Customer PO reference"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create & Add Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
