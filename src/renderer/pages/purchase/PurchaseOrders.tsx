import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card, Badge, Modal, Table } from '@components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      purchase: {
        getPurchaseOrders: (tenantId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  po_date: string;
  vendor_name: string;
  vendor_gstin: string | null;
  reference: string;
  total_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  grand_total: number;
  delivery_date: string;
  delivery_address: string;
  payment_terms: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Partially Received' | 'Received' | 'Cancelled';
  approved_by: string | null;
  approved_date: string | null;
  items_count: number;
  received_items: number;
}

interface POItem {
  id: number;
  item_name: string;
  hsn_code: string;
  quantity: number;
  uom: string;
  rate: number;
  discount_percent: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  received_quantity: number;
  pending_quantity: number;
}

const PurchaseOrders: React.FC = () => {
  const { state } = useApp();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [state.user?.tenant_id]);

  const loadOrders = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.purchase.getPurchaseOrders(state.user.tenant_id);
      
      if (response.success && response.data) {
        setOrders(response.data.map((po: any) => ({
          id: po.id,
          po_number: po.po_number,
          po_date: po.po_date,
          vendor_name: po.vendor_name,
          vendor_gstin: po.vendor_gstin,
          reference: po.reference || '',
          total_amount: Number(po.total_amount) || 0,
          cgst_amount: Number(po.cgst_amount) || 0,
          sgst_amount: Number(po.sgst_amount) || 0,
          igst_amount: Number(po.igst_amount) || 0,
          grand_total: Number(po.grand_total) || 0,
          delivery_date: po.delivery_date,
          delivery_address: po.delivery_address || '',
          payment_terms: po.payment_terms || '',
          status: po.status,
          approved_by: po.approved_by,
          approved_date: po.approved_date,
          items_count: Number(po.items_count) || 0,
          received_items: Number(po.received_items) || 0,
        })));
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalOrders: orders.length,
    draft: orders.filter((o) => o.status === 'Draft').length,
    submitted: orders.filter((o) => o.status === 'Submitted').length,
    approved: orders.filter((o) => o.status === 'Approved').length,
    totalValue: orders.reduce((sum, o) => sum + o.grand_total, 0),
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
      Draft: 'default',
      Submitted: 'primary',
      Approved: 'success',
      'Partially Received': 'warning',
      Received: 'success',
      Cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const columns = [
    { key: 'po_number', label: 'PO Number' },
    { key: 'po_date', label: 'PO Date' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'reference', label: 'Reference' },
    { key: 'delivery_date', label: 'Delivery Date' },
    { key: 'items', label: 'Items' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ];

  const renderRow = (order: PurchaseOrder) => ({
    po_number: (
      <div>
        <div className="font-mono text-sm font-medium">{order.po_number}</div>
        <div className="text-xs text-gray-500">{order.payment_terms}</div>
      </div>
    ),
    po_date: new Date(order.po_date).toLocaleDateString('en-IN'),
    vendor: (
      <div>
        <div className="font-medium text-gray-900">{order.vendor_name}</div>
        {order.vendor_gstin && (
          <div className="text-xs text-gray-500 font-mono">{order.vendor_gstin}</div>
        )}
      </div>
    ),
    reference: order.reference,
    delivery_date: (
      <div className="flex items-center gap-2">
        <ClockIcon className="h-4 w-4 text-gray-400" />
        {new Date(order.delivery_date).toLocaleDateString('en-IN')}
      </div>
    ),
    items: (
      <div className="text-sm">
        <span className="font-medium">{order.items_count}</span> items
        {order.received_items > 0 && (
          <div className="text-xs text-green-600">
            {order.received_items} received
          </div>
        )}
      </div>
    ),
    amount: (
      <div className="text-right">
        <div className="font-medium text-gray-900">
          ₹{order.grand_total.toLocaleString('en-IN')}
        </div>
        <div className="text-xs text-gray-500">
          Base: ₹{order.total_amount.toLocaleString('en-IN')}
        </div>
      </div>
    ),
    status: <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>,
  });

  const handleRowClick = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  useEffect(() => {
    const loadPOItems = async () => {
      if (!selectedOrder || !state.user?.tenant_id) return;
      try {
        const response = await window.electronAPI.purchase.getPurchaseOrderItems(state.user.tenant_id, selectedOrder.id);
        if (response.success && response.data) {
          setPOItems(response.data);
        }
      } catch (error) {
        console.error('Error loading PO items:', error);
      }
    };
    loadPOItems();
  }, [selectedOrder?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Manage purchase orders and track deliveries</p>
        </div>
        <Button>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Purchase Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Draft</div>
          <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Submitted</div>
          <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-purple-600">
            ₹{stats.totalValue.toLocaleString('en-IN')}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by PO number, vendor, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredOrders}
          renderRow={renderRow}
          onRowClick={handleRowClick}
          loading={loading}
        />
      </Card>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Purchase Order - ${selectedOrder.po_number}`}
          size="large"
        >
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Vendor</label>
                <div className="font-medium">{selectedOrder.vendor_name}</div>
                {selectedOrder.vendor_gstin && (
                  <div className="text-sm text-gray-500 font-mono">{selectedOrder.vendor_gstin}</div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">PO Date</label>
                <div className="font-medium">
                  {new Date(selectedOrder.po_date).toLocaleDateString('en-IN')}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Delivery Date</label>
                <div className="font-medium">
                  {new Date(selectedOrder.delivery_date).toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="font-medium mb-3">Order Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">GST</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {poItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.item_name}</div>
                          <div className="text-sm text-gray-500">HSN: {item.hsn_code}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.quantity} {item.uom}
                        </td>
                        <td className="px-4 py-3 text-right">₹{item.rate}</td>
                        <td className="px-4 py-3 text-right">{item.discount_percent}%</td>
                        <td className="px-4 py-3 text-right">₹{item.taxable_amount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right">{item.gst_rate}%</td>
                        <td className="px-4 py-3 text-right font-medium">₹{item.total_amount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={item.received_quantity > 0 ? 'success' : 'default'}>
                            {item.received_quantity}/{item.quantity}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedOrder.cgst_amount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">CGST:</span>
                        <span>₹{selectedOrder.cgst_amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">SGST:</span>
                        <span>₹{selectedOrder.sgst_amount.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                  {selectedOrder.igst_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IGST:</span>
                      <span>₹{selectedOrder.igst_amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Grand Total:</span>
                    <span>₹{selectedOrder.grand_total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              <div className="flex gap-3">
                {selectedOrder.status === 'Draft' && (
                  <>
                    <Button variant="secondary">
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Edit
                    </Button>
                    <Button>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Submit for Approval
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'Submitted' && (
                  <Button>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Approve
                  </Button>
                )}
                {selectedOrder.status === 'Approved' && (
                  <Button>
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Create GRN
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrders;
