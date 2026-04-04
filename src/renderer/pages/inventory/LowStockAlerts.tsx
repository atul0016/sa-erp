import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  Bell,
  Download,
  Filter,
  TrendingDown,
  RefreshCw,
  Mail,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context';

interface LowStockItem {
  id: string;
  itemCode: string;
  itemName: string;
  hsn: string;
  category: string;
  warehouse: string;
  uom: string;
  currentStock: number;
  reorderLevel: number;
  minimumLevel: number;
  maxLevel: number;
  avgConsumption: number; // per day
  leadTime: number; // days
  daysUntilStockout: number;
  lastPurchaseDate: string;
  lastPurchaseRate: number;
  preferredSupplier: string;
  supplierContact: string;
  status: 'critical' | 'warning' | 'normal';
  suggestedOrderQty: number;
  estimatedOrderValue: number;
}

const LowStockAlerts: React.FC = () => {
  const { state, notify } = useApp();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'critical' | 'warning'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    loadAlerts();
  }, [state.user?.tenant_id]);

  const loadAlerts = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.inventory.getLowStockAlerts(state.user.tenant_id);
      
      if (response.success && response.data) {
        setItems(response.data.map((item: any) => ({
          id: String(item.id),
          itemCode: item.item_code,
          itemName: item.item_name,
          hsn: item.hsn_code || '',
          category: item.category || '',
          warehouse: item.warehouse || '',
          uom: item.uom,
          currentStock: Number(item.current_stock) || 0,
          reorderLevel: Number(item.reorder_level) || 0,
          minimumLevel: Number(item.minimum_level) || 0,
          maxLevel: Number(item.max_level) || 0,
          avgConsumption: Number(item.avg_consumption) || 0,
          leadTime: Number(item.lead_time) || 0,
          daysUntilStockout: Number(item.days_until_stockout) || 0,
          lastPurchaseDate: item.last_purchase_date || '',
          lastPurchaseRate: Number(item.last_purchase_rate) || 0,
          preferredSupplier: item.preferred_supplier || '',
          supplierContact: item.supplier_contact || '',
          status: item.status,
          suggestedOrderQty: Number(item.suggested_order_qty) || 0,
          estimatedOrderValue: Number(item.estimated_order_value) || 0,
        })));
      } else {
        notify?.('error', response.error || 'Failed to load alerts');
      }
    } catch (error) {
      console.error('Error loading low stock alerts:', error);
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const warehouseMatch = selectedWarehouse === 'all' || item.warehouse === selectedWarehouse;
    const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
    return warehouseMatch && categoryMatch && statusMatch;
  });

  // Get unique warehouses and categories
  const warehouses = ['all', ...new Set(items.map((item) => item.warehouse))];
  const categories = ['all', ...new Set(items.map((item) => item.category))];

  // Calculate totals
  const totals = {
    critical: items.filter((i) => i.status === 'critical').length,
    warning: items.filter((i) => i.status === 'warning').length,
    totalValue: items.reduce((sum, i) => sum + i.estimatedOrderValue, 0),
    selectedValue: items
      .filter((i) => selectedItems.includes(i.id))
      .reduce((sum, i) => sum + i.estimatedOrderValue, 0),
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map((i) => i.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStockPercentage = (current: number, reorder: number) => {
    const percentage = (current / reorder) * 100;
    return Math.min(percentage, 100);
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
          <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
          <p className="text-gray-500">Monitor items below reorder level and generate purchase orders</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert('Set Alert Rules coming soon')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Bell className="h-4 w-4" />
            Set Alert Rules
          </button>
          <button
            onClick={() => alert('Generate PO coming soon')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              selectedItems.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={selectedItems.length === 0}
          >
            <ShoppingCart className="h-4 w-4" />
            Generate PO ({selectedItems.length})
          </button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-200 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Critical Items</p>
              <p className="text-3xl font-bold text-red-900">{totals.critical}</p>
              <p className="text-xs text-red-600">Below minimum level</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-medium">Warning Items</p>
              <p className="text-3xl font-bold text-amber-900">{totals.warning}</p>
              <p className="text-xs text-amber-600">At reorder level</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-200 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Est. Order Value</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.totalValue)}</p>
              <p className="text-xs text-blue-600">All items</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-200 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Selected Items</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.selectedValue)}</p>
              <p className="text-xs text-green-600">{selectedItems.length} items selected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-3 py-2 rounded-lg text-sm ${
                  selectedStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setSelectedStatus('critical')}
                className={`px-3 py-2 rounded-lg text-sm ${
                  selectedStatus === 'critical'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                Critical ({totals.critical})
              </button>
              <button
                onClick={() => setSelectedStatus('warning')}
                className={`px-3 py-2 rounded-lg text-sm ${
                  selectedStatus === 'warning'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
              >
                Warning ({totals.warning})
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Warehouse</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Warehouses</option>
              {warehouses
                .filter((w) => w !== 'all')
                .map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              {categories
                .filter((c) => c !== 'all')
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => alert('Email Report coming soon')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Mail className="h-4 w-4" />
              Email Report
            </button>
            <button onClick={() => alert('Export coming soon')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Item</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Warehouse</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Current Stock</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Stock Level</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Days Left</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Suggested Qty</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Est. Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 ${item.status === 'critical' ? 'bg-red-50' : ''}`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{item.itemName}</div>
                      <div className="text-xs text-gray-500">
                        {item.itemCode} | HSN: {item.hsn}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.warehouse}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(item.status)}`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-medium text-gray-900">
                      {formatNumber(item.currentStock)} {item.uom}
                    </div>
                    <div className="text-xs text-gray-500">ROL: {item.reorderLevel}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-24 mx-auto">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{item.minimumLevel}</span>
                        <span>{item.reorderLevel}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.status === 'critical'
                              ? 'bg-red-500'
                              : item.status === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${getStockPercentage(item.currentStock, item.reorderLevel)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span
                        className={`font-medium ${
                          item.daysUntilStockout <= 3
                            ? 'text-red-600'
                            : item.daysUntilStockout <= 7
                            ? 'text-amber-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {item.daysUntilStockout} days
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Lead: {item.leadTime}d</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-medium text-blue-600">
                      {formatNumber(item.suggestedOrderQty)} {item.uom}
                    </div>
                    <div className="text-xs text-gray-500">@ {formatCurrency(item.lastPurchaseRate)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">{item.preferredSupplier}</div>
                    {item.supplierContact !== '-' && (
                      <div className="text-xs text-gray-500">{item.supplierContact}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {item.estimatedOrderValue > 0 ? formatCurrency(item.estimatedOrderValue) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button onClick={() => alert('Auto Generate PO coming soon')} className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-3">
              <ShoppingCart className="h-5 w-5" />
              <div>
                <div className="font-medium">Auto Generate PO</div>
                <div className="text-xs text-blue-600">Create PO for all critical items</div>
              </div>
            </button>
            <button onClick={() => alert('Notify Suppliers coming soon')} className="w-full text-left px-4 py-3 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-3">
              <Mail className="h-5 w-5" />
              <div>
                <div className="font-medium">Notify Suppliers</div>
                <div className="text-xs text-amber-600">Send email to preferred suppliers</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Top Critical Items</h3>
          <div className="space-y-2">
            {items
              .filter((i) => i.status === 'critical')
              .slice(0, 3)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                    <div className="text-xs text-gray-500">{item.daysUntilStockout} days left</div>
                  </div>
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Alert Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email alerts</span>
              <input type="checkbox" className="rounded border-gray-300" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Daily summary</span>
              <input type="checkbox" className="rounded border-gray-300" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Auto-generate PO</span>
              <input type="checkbox" className="rounded border-gray-300" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LowStockAlerts;
