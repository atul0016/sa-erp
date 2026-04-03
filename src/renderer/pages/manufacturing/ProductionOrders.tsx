import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, PlayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card, Badge, Modal, Table } from '@components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      manufacturing: {
        getProductionOrders: (tenantId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

interface ProductionOrder {
  id: number;
  po_number: string;
  po_date: string;
  item_name: string;
  item_code: string;
  bom_code: string;
  qty_to_manufacture: number;
  manufactured_qty: number;
  uom: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  work_center: string;
  source_warehouse: string;
  target_warehouse: string;
  status: 'Draft' | 'Submitted' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  material_cost: number;
  operation_cost: number;
  total_cost: number;
  progress_percent: number;
}

interface MaterialRequirement {
  id: number;
  item_name: string;
  item_code: string;
  required_qty: number;
  transferred_qty: number;
  consumed_qty: number;
  uom: string;
  source_warehouse: string;
  rate: number;
  amount: number;
}

const ProductionOrders: React.FC = () => {
  const { state } = useApp();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [materials, setMaterials] = useState<MaterialRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [state.user?.tenant_id]);

  const loadOrders = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.manufacturing.getProductionOrders(state.user.tenant_id);
      
      if (response.success && response.data) {
        setOrders(response.data.map((po: any) => ({
          id: po.id,
          po_number: po.po_number,
          po_date: po.po_date,
          item_name: po.item_name,
          item_code: po.item_code,
          bom_code: po.bom_code,
          qty_to_manufacture: Number(po.qty_to_manufacture) || 0,
          manufactured_qty: Number(po.manufactured_qty) || 0,
          uom: po.uom,
          planned_start_date: po.planned_start_date,
          planned_end_date: po.planned_end_date,
          actual_start_date: po.actual_start_date,
          actual_end_date: po.actual_end_date,
          work_center: po.work_center || '',
          source_warehouse: po.source_warehouse || '',
          target_warehouse: po.target_warehouse || '',
          status: po.status,
          priority: po.priority || 'Medium',
          material_cost: Number(po.material_cost) || 0,
          operation_cost: Number(po.operation_cost) || 0,
          total_cost: Number(po.total_cost) || 0,
          progress_percent: Number(po.progress_percent) || 0,
        })));
      }
    } catch (error) {
      console.error('Error loading production orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalOrders: orders.length,
    inProgress: orders.filter((o) => o.status === 'In Progress').length,
    completed: orders.filter((o) => o.status === 'Completed').length,
    pending: orders.filter((o) => o.status === 'Submitted' || o.status === 'Draft').length,
    totalValue: orders.reduce((sum, o) => sum + o.total_cost, 0),
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
      Draft: 'default',
      Submitted: 'primary',
      'In Progress': 'warning',
      Completed: 'success',
      Cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: 'text-gray-600',
      Medium: 'text-blue-600',
      High: 'text-orange-600',
      Urgent: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const columns = [
    { key: 'po_number', label: 'PO Number' },
    { key: 'item', label: 'Item' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'dates', label: 'Schedule' },
    { key: 'work_center', label: 'Work Center' },
    { key: 'progress', label: 'Progress' },
    { key: 'cost', label: 'Cost' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
  ];

  const renderRow = (order: ProductionOrder) => ({
    po_number: (
      <div>
        <div className="font-mono text-sm font-medium">{order.po_number}</div>
        <div className="text-xs text-gray-500">{order.bom_code}</div>
      </div>
    ),
    item: (
      <div>
        <div className="font-medium text-gray-900">{order.item_name}</div>
        <div className="text-sm text-gray-500 font-mono">{order.item_code}</div>
      </div>
    ),
    quantity: (
      <div>
        <div className="font-medium">
          {order.manufactured_qty}/{order.qty_to_manufacture} {order.uom}
        </div>
        {order.manufactured_qty > 0 && (
          <div className="text-xs text-green-600">
            {((order.manufactured_qty / order.qty_to_manufacture) * 100).toFixed(0)}% complete
          </div>
        )}
      </div>
    ),
    dates: (
      <div className="text-sm">
        <div className="text-gray-600">
          {new Date(order.planned_start_date).toLocaleDateString('en-IN')} -{' '}
          {new Date(order.planned_end_date).toLocaleDateString('en-IN')}
        </div>
        {order.actual_start_date && (
          <div className="text-green-600 text-xs">
            Started: {new Date(order.actual_start_date).toLocaleDateString('en-IN')}
          </div>
        )}
      </div>
    ),
    work_center: order.work_center,
    progress: (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{order.progress_percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              order.progress_percent === 100
                ? 'bg-green-600'
                : order.progress_percent > 0
                ? 'bg-blue-600'
                : 'bg-gray-400'
            }`}
            style={{ width: `${order.progress_percent}%` }}
          ></div>
        </div>
      </div>
    ),
    cost: (
      <div className="text-right">
        <div className="font-medium text-gray-900">
          ₹{order.total_cost.toLocaleString('en-IN')}
        </div>
        <div className="text-xs text-gray-500">
          M: ₹{(order.material_cost / 1000).toFixed(0)}K + O: ₹
          {(order.operation_cost / 1000).toFixed(0)}K
        </div>
      </div>
    ),
    priority: (
      <span className={`font-medium ${getPriorityColor(order.priority)}`}>
        {order.priority}
      </span>
    ),
    status: <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>,
  });

  const handleRowClick = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  useEffect(() => {
    const loadMaterials = async () => {
      if (!selectedOrder || !state.user?.tenant_id) return;
      try {
        const response = await window.electronAPI.manufacturing.getProductionOrderMaterials(state.user.tenant_id, selectedOrder.id);
        if (response.success && response.data) {
          setMaterials(response.data);
        }
      } catch (error) {
        console.error('Error loading materials:', error);
      }
    };
    loadMaterials();
  }, [selectedOrder?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Orders</h1>
          <p className="text-gray-600">Manage manufacturing and assembly operations</p>
        </div>
        <Button>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Production Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
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
              placeholder="Search production orders..."
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
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
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
          title={`Production Order - ${selectedOrder.po_number}`}
          size="large"
        >
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Item</label>
                <div className="font-medium">{selectedOrder.item_name}</div>
                <div className="text-sm text-gray-500 font-mono">{selectedOrder.item_code}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Quantity</label>
                <div className="font-medium">
                  {selectedOrder.manufactured_qty}/{selectedOrder.qty_to_manufacture}{' '}
                  {selectedOrder.uom}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Work Center</label>
                <div className="font-medium">{selectedOrder.work_center}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Production Progress</label>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full flex items-center justify-center text-xs text-white font-medium ${
                    selectedOrder.progress_percent === 100
                      ? 'bg-green-600'
                      : selectedOrder.progress_percent > 0
                      ? 'bg-blue-600'
                      : 'bg-gray-400'
                  }`}
                  style={{ width: `${selectedOrder.progress_percent}%` }}
                >
                  {selectedOrder.progress_percent}%
                </div>
              </div>
            </div>

            {/* Material Requirements */}
            <div>
              <h3 className="font-medium mb-3">Material Requirements</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Item
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Required
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Transferred
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Consumed
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materials.map((material) => (
                      <tr key={material.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{material.item_name}</div>
                          <div className="text-sm text-gray-500">{material.item_code}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {material.required_qty} {material.uom}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant={
                              material.transferred_qty >= material.required_qty
                                ? 'success'
                                : 'warning'
                            }
                          >
                            {material.transferred_qty} {material.uom}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {material.consumed_qty} {material.uom}
                        </td>
                        <td className="px-4 py-3 text-right">₹{material.rate}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          ₹{material.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="font-medium">
                      ₹{selectedOrder.material_cost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operation Cost:</span>
                    <span className="font-medium">
                      ₹{selectedOrder.operation_cost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Cost:</span>
                    <span>₹{selectedOrder.total_cost.toLocaleString('en-IN')}</span>
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
                  <Button>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Submit
                  </Button>
                )}
                {selectedOrder.status === 'Submitted' && (
                  <Button>
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Start Production
                  </Button>
                )}
                {selectedOrder.status === 'In Progress' && (
                  <Button>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Complete Production
                  </Button>
                )}
                <Button variant="error">
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductionOrders;
