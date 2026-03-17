import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Filter,
  BarChart3,
  Warehouse,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context';

interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  hsn: string;
  category: string;
  warehouse: string;
  uom: string;
  quantity: number;
  avgCost: number;
  lastPurchaseRate: number;
  marketRate: number;
  stockValue: number;
  reorderLevel: number;
  maxLevel: number;
  lastMovementDate: string;
  valuationMethod: 'FIFO' | 'LIFO' | 'Weighted Average';
  batches: {
    batchNo: string;
    qty: number;
    rate: number;
    expiryDate?: string;
  }[];
}

interface CategorySummary {
  category: string;
  itemCount: number;
  totalQty: number;
  totalValue: number;
  percentageOfTotal: number;
}

const StockValuation: React.FC = () => {
  const { state, notify } = useApp();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [valuationDate, setValuationDate] = useState(new Date().toISOString().split('T')[0]);
  const [valuationMethod, setValuationMethod] = useState<'all' | 'FIFO' | 'LIFO' | 'Weighted Average'>('all');
  const [showBatches, setShowBatches] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'quantity' | 'name'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadStockValuation();
  }, [state.user?.tenant_id, valuationDate]);

  const loadStockValuation = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.inventory.getStockValuation(state.user.tenant_id);
      
      if (response.success && response.data) {
        setItems(response.data.map((item: any) => ({
          id: String(item.id),
          itemCode: item.item_code || '',
          itemName: item.item_name || '',
          hsn: item.hsn_code || '',
          category: item.category || '',
          warehouse: item.warehouse || '',
          uom: item.uom || '',
          quantity: Number(item.quantity) || 0,
          avgCost: Number(item.avg_cost) || 0,
          lastPurchaseRate: Number(item.last_purchase_rate) || 0,
          marketRate: Number(item.market_rate) || 0,
          stockValue: Number(item.stock_value) || 0,
          reorderLevel: Number(item.reorder_level) || 0,
          maxLevel: Number(item.max_level) || 0,
          lastMovementDate: item.last_movement_date || '',
          valuationMethod: item.valuation_method || 'Weighted Average',
          batches: item.batches || [],
        })));
      } else {
        notify?.('error', response.error || 'Failed to load stock valuation');
      }
    } catch (error) {
      console.error('Error loading stock valuation:', error);
      notify?.('error', 'Failed to load stock valuation');
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
    const methodMatch = valuationMethod === 'all' || item.valuationMethod === valuationMethod;
    return warehouseMatch && categoryMatch && methodMatch;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'value':
        comparison = a.stockValue - b.stockValue;
        break;
      case 'quantity':
        comparison = a.quantity - b.quantity;
        break;
      case 'name':
        comparison = a.itemName.localeCompare(b.itemName);
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Calculate category summaries
  const categorySummaries: CategorySummary[] = React.useMemo(() => {
    const totalValue = filteredItems.reduce((sum, item) => sum + item.stockValue, 0);
    const categoryMap = new Map<string, { itemCount: number; totalQty: number; totalValue: number }>();

    filteredItems.forEach((item) => {
      const existing = categoryMap.get(item.category) || { itemCount: 0, totalQty: 0, totalValue: 0 };
      categoryMap.set(item.category, {
        itemCount: existing.itemCount + 1,
        totalQty: existing.totalQty + item.quantity,
        totalValue: existing.totalValue + item.stockValue,
      });
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
      percentageOfTotal: totalValue > 0 ? (data.totalValue / totalValue) * 100 : 0,
    }));
  }, [filteredItems]);

  // Calculate totals
  const totals = React.useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => ({
        totalItems: acc.totalItems + 1,
        totalQty: acc.totalQty + item.quantity,
        totalValue: acc.totalValue + item.stockValue,
        belowReorder: acc.belowReorder + (item.quantity <= item.reorderLevel ? 1 : 0),
        excessStock: acc.excessStock + (item.maxLevel > 0 && item.quantity > item.maxLevel ? 1 : 0),
      }),
      { totalItems: 0, totalQty: 0, totalValue: 0, belowReorder: 0, excessStock: 0 }
    );
  }, [filteredItems]);

  // Get unique warehouses and categories
  const warehouses = ['all', ...new Set(items.map((item) => item.warehouse))];
  const categories = ['all', ...new Set(items.map((item) => item.category))];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Raw Material': 'bg-blue-100 text-blue-800',
      'Finished Goods': 'bg-green-100 text-green-800',
      'Work in Progress': 'bg-yellow-100 text-yellow-800',
      Consumables: 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStockStatus = (item: StockItem) => {
    if (item.quantity <= item.reorderLevel) {
      return { status: 'Low', color: 'text-red-600', bg: 'bg-red-50' };
    }
    if (item.maxLevel > 0 && item.quantity > item.maxLevel) {
      return { status: 'Excess', color: 'text-orange-600', bg: 'bg-orange-50' };
    }
    return { status: 'Normal', color: 'text-green-600', bg: 'bg-green-50' };
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
          <h1 className="text-2xl font-bold text-gray-900">Stock Valuation</h1>
          <p className="text-gray-500">Comprehensive inventory valuation with batch details</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <Package className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-900">{formatNumber(totals.totalItems)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <Warehouse className="h-10 w-10 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Warehouses</p>
              <p className="text-2xl font-bold text-purple-900">{warehouses.length - 1}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <TrendingDown className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Below Reorder</p>
              <p className="text-2xl font-bold text-red-900">{totals.belowReorder}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-10 w-10 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600 font-medium">Excess Stock</p>
              <p className="text-2xl font-bold text-orange-900">{totals.excessStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category-wise Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {categorySummaries.map((category) => (
            <div key={category.category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(category.category)}`}>
                  {category.category}
                </span>
                <span className="text-xs text-gray-500">{category.itemCount} items</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(category.totalValue)}</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${category.percentageOfTotal}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{category.percentageOfTotal.toFixed(1)}% of total</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valuation Date</label>
            <input
              type="date"
              value={valuationDate}
              onChange={(e) => setValuationDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
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
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valuation Method</label>
            <select
              value={valuationMethod}
              onChange={(e) => setValuationMethod(e.target.value as typeof valuationMethod)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Methods</option>
              <option value="FIFO">FIFO</option>
              <option value="LIFO">LIFO</option>
              <option value="Weighted Average">Weighted Average</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="value">Value</option>
              <option value="quantity">Quantity</option>
              <option value="name">Item Name</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Valuation Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Item</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">HSN</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Warehouse</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Avg Cost</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Market Rate</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Stock Value</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedItems.map((item) => {
                const status = getStockStatus(item);
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`hover:bg-gray-50 cursor-pointer ${status.bg}`}
                      onClick={() => setShowBatches(showBatches === item.id ? null : item.id)}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-xs text-gray-500">{item.itemCode}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.hsn}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.warehouse}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-gray-900">
                          {formatNumber(item.quantity)} {item.uom}
                        </span>
                        <div className="text-xs text-gray-500">ROL: {item.reorderLevel}</div>
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">{formatCurrency(item.avgCost)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-gray-600">{formatCurrency(item.marketRate)}</span>
                        {item.marketRate > item.avgCost && (
                          <div className="text-xs text-green-600">
                            +{formatCurrency(item.marketRate - item.avgCost)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {formatCurrency(item.stockValue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-medium ${status.color}`}>{status.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs text-gray-500">{item.valuationMethod}</span>
                      </td>
                    </tr>
                    {/* Batch Details */}
                    {showBatches === item.id && (
                      <tr className="bg-blue-50">
                        <td colSpan={10} className="py-3 px-8">
                          <div className="text-sm font-medium text-gray-700 mb-2">Batch Details</div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="text-left py-1 px-2">Batch No</th>
                                <th className="text-right py-1 px-2">Quantity</th>
                                <th className="text-right py-1 px-2">Rate</th>
                                <th className="text-right py-1 px-2">Value</th>
                                <th className="text-left py-1 px-2">Expiry</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.batches.map((batch, idx) => (
                                <tr key={idx} className="text-gray-600">
                                  <td className="py-1 px-2 font-medium">{batch.batchNo}</td>
                                  <td className="py-1 px-2 text-right">
                                    {formatNumber(batch.qty)} {item.uom}
                                  </td>
                                  <td className="py-1 px-2 text-right">{formatCurrency(batch.rate)}</td>
                                  <td className="py-1 px-2 text-right">{formatCurrency(batch.qty * batch.rate)}</td>
                                  <td className="py-1 px-2">
                                    {batch.expiryDate ? (
                                      <span
                                        className={`${
                                          new Date(batch.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                                            ? 'text-orange-600'
                                            : ''
                                        }`}
                                      >
                                        {batch.expiryDate}
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan={4} className="py-3 px-4 font-semibold text-gray-900">
                  Total ({filteredItems.length} items)
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">-</td>
                <td className="py-3 px-4 text-right">-</td>
                <td className="py-3 px-4 text-right">-</td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totals.totalValue)}</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Valuation Notes:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Stock values are calculated as per selected valuation method (FIFO/LIFO/Weighted Average)</li>
              <li>Market rates are indicative and may vary. Please verify before financial reporting.</li>
              <li>Items below reorder level should be replenished. Consider generating Purchase Requisitions.</li>
              <li>Click on any row to view batch-wise breakup and valuation details.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockValuation;
