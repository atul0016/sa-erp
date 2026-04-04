/**
 * Stock Ledger Page
 * 
 * Comprehensive stock movement tracking with batch/serial support
 * Per The ERP Architect's Handbook specifications
 */

import { useState, useEffect } from 'react';
import {
  CubeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../../context';

interface StockMovement {
  id: string;
  date: string;
  time: string;
  voucher_type: string;
  voucher_number: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  batch_number?: string;
  serial_numbers?: string[];
  movement_type: 'in' | 'out' | 'transfer';
  qty_in: number;
  qty_out: number;
  rate: number;
  value: number;
  running_qty: number;
  running_value: number;
  remarks?: string;
}

interface ItemStock {
  item_code: string;
  item_name: string;
  category: string;
  uom: string;
  current_stock: number;
  reserved_qty: number;
  available_qty: number;
  reorder_level: number;
  avg_cost: number;
  stock_value: number;
  last_movement: string;
  status: 'normal' | 'low' | 'critical' | 'excess';
}

interface WarehouseStock {
  warehouse: string;
  location: string;
  stock_qty: number;
  stock_value: number;
}

export default function StockLedger() {
  const { state, notify } = useApp();
  const [activeTab, setActiveTab] = useState<'movements' | 'summary' | 'aging'>('movements');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [itemSummary, setItemSummary] = useState<ItemStock[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [filterMovementType, setFilterMovementType] = useState<string>('all');
  const [warehouseBreakdown, setWarehouseBreakdown] = useState<WarehouseStock[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);

  useEffect(() => {
    loadStockMovements();
  }, [selectedItem, dateRange, state.user?.tenant_id]);

  const loadStockMovements = async () => {
    if (!state.user?.tenant_id || !selectedItem) return;
    
    try {
      const filters = {
        itemId: selectedItem,
        fromDate: dateRange.from,
        toDate: dateRange.to,
      };
      
      const response = await window.electronAPI.inventory.getStockMovements(
        state.user.tenant_id,
        filters
      );
      
      if (response.success && response.data) {
        setMovements(response.data.map((mov: any, index: number) => ({
          id: String(mov.id || index),
          date: mov.date || '',
          time: mov.time || '',
          voucher_type: mov.voucher_type || '',
          voucher_number: mov.voucher_number || '',
          item_code: mov.item_code || '',
          item_name: mov.item_name || '',
          warehouse: mov.warehouse || '',
          batch_number: mov.batch_number,
          serial_numbers: mov.serial_numbers,
          movement_type: mov.movement_type || 'in',
          qty_in: Number(mov.qty_in) || 0,
          qty_out: Number(mov.qty_out) || 0,
          rate: Number(mov.rate) || 0,
          value: Number(mov.value) || 0,
          running_qty: Number(mov.running_qty) || 0,
          running_value: Number(mov.running_value) || 0,
          remarks: mov.remarks,
        })));
      } else {
        notify?.('error', response.error || 'Failed to load stock movements');
      }
    } catch (error) {
      console.error('Error loading stock movements:', error);
      notify?.('error', 'Failed to load stock movements');
    }
  };

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
    const styles: Record<string, { bg: string; text: string }> = {
      normal: { bg: 'bg-green-100', text: 'text-green-600' },
      low: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      critical: { bg: 'bg-red-100', text: 'text-red-600' },
      excess: { bg: 'bg-blue-100', text: 'text-blue-600' },
    };
    const style = styles[status] || styles.normal;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const filteredMovements = movements.filter(m => {
    if (selectedItem && m.item_code !== selectedItem) return false;
    if (filterWarehouse !== 'all' && m.warehouse !== filterWarehouse) return false;
    if (filterMovementType !== 'all' && m.movement_type !== filterMovementType) return false;
    return true;
  });

  const filteredSummary = itemSummary.filter(item =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.item_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStockValue = itemSummary.reduce((sum, item) => sum + item.stock_value, 0);
  const criticalItems = itemSummary.filter(i => i.status === 'critical').length;
  const lowStockItems = itemSummary.filter(i => i.status === 'low').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Ledger</h1>
          <p className="text-gray-600">Track stock movements and inventory levels</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => alert('Export coming soon')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <CubeIcon className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-blue-600">{itemSummary.length}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Total Items</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <span className="text-xl font-bold text-green-600">{formatCurrency(totalStockValue)}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Total Stock Value</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold text-red-600">{criticalItems}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Critical Stock</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <ArrowDownIcon className="h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600">{lowStockItems}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Low Stock Items</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'movements', label: 'Stock Movements', icon: ArrowsRightLeftIcon },
              { id: 'summary', label: 'Stock Summary', icon: CubeIcon },
              { id: 'aging', label: 'Warehouse Wise', icon: ChartBarIcon },
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

        {/* Movements Tab */}
        {activeTab === 'movements' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Items</option>
                  {itemSummary.map(item => (
                    <option key={item.item_code} value={item.item_code}>
                      {item.item_code} - {item.item_name}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={filterWarehouse}
                onChange={(e) => setFilterWarehouse(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Warehouses</option>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="Branch Warehouse">Branch Warehouse</option>
                <option value="WIP Storage">WIP Storage</option>
              </select>
              <select
                value={filterMovementType}
                onChange={(e) => setFilterMovementType(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="transfer">Transfer</option>
              </select>
              <div className="flex items-center gap-2">
                <input type="date" className="px-3 py-2 border rounded-lg" placeholder="From" />
                <span className="text-gray-400">to</span>
                <input type="date" className="px-3 py-2 border rounded-lg" placeholder="To" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date/Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Voucher</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Warehouse</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Batch/Serial</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">In</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Out</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Balance Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Balance Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMovements.map(movement => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{formatDate(movement.date)}</div>
                        <div className="text-xs text-gray-500">{movement.time}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
                          {movement.voucher_number}
                        </div>
                        <div className="text-xs text-gray-500">{movement.voucher_type}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-800">{movement.item_name}</div>
                        <div className="text-xs text-gray-500">{movement.item_code}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{movement.warehouse}</td>
                      <td className="px-4 py-3">
                        {movement.batch_number && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded">
                            {movement.batch_number}
                          </span>
                        )}
                        {movement.serial_numbers && movement.serial_numbers.length > 0 && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded">
                            {movement.serial_numbers.length} S/N
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {movement.qty_in > 0 && (
                          <span className="text-green-600 font-medium flex items-center justify-end gap-1">
                            <ArrowUpIcon className="h-3 w-3" />
                            {movement.qty_in}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {movement.qty_out > 0 && (
                          <span className="text-red-600 font-medium flex items-center justify-end gap-1">
                            <ArrowDownIcon className="h-3 w-3" />
                            {movement.qty_out}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(movement.rate)}</td>
                      <td className="px-4 py-3 text-right font-medium">{movement.running_qty}</td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(movement.running_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="p-6">
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Item</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Stock</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Reserved</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Available</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Reorder Level</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Avg Cost</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Stock Value</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSummary.map(item => (
                  <tr 
                    key={item.item_code} 
                    className={`hover:bg-gray-50 cursor-pointer ${item.status === 'critical' ? 'bg-red-50' : item.status === 'low' ? 'bg-yellow-50' : ''}`}
                    onClick={() => { setSelectedItem(item.item_code); setActiveTab('movements'); }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{item.item_name}</div>
                      <div className="text-xs text-gray-500">{item.item_code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{item.current_stock} {item.uom}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{item.reserved_qty} {item.uom}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{item.available_qty} {item.uom}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.reorder_level} {item.uom}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.avg_cost)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.stock_value)}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-medium">
                  <td colSpan={7} className="px-4 py-3 text-right">Total Stock Value:</td>
                  <td className="px-4 py-3 text-right text-lg">{formatCurrency(totalStockValue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Warehouse Wise Tab */}
        {activeTab === 'aging' && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {warehouseBreakdown.map((wh, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{wh.warehouse}</h3>
                  <p className="text-sm text-gray-500 mb-4">{wh.location}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Items</span>
                      <span className="font-bold text-gray-800">{wh.stock_qty}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Stock Value</span>
                      <span className="font-bold text-green-600">{formatCurrency(wh.stock_value)}</span>
                    </div>
                    <div className="pt-3 border-t">
                      <button onClick={() => alert('View Detailed Stock coming soon')} className="w-full px-4 py-2 bg-white border rounded-lg text-sm text-blue-600 hover:bg-blue-50">
                        View Detailed Stock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stock Distribution Chart Placeholder */}
            <div className="mt-6 bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Category-wise Stock Distribution</h3>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ChartBarIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization placeholder</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
