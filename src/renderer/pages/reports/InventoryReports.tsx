import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  IndianRupee,
  Calendar,
  Filter,
  RefreshCw,
  Warehouse,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { useApp } from '../../context';

interface InventoryMetrics {
  totalValue: number;
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  avgTurnoverRatio: number;
  slowMovingItems: number;
  turnoverGrowth: number;
  valueGrowth: number;
}

interface StockMovement {
  itemName: string;
  currentStock: number;
  receipts: number;
  issues: number;
  closingStock: number;
  stockValue: number;
  turnoverRatio: number;
}

interface CategoryAnalysis {
  category: string;
  itemCount: number;
  totalValue: number;
  avgTurnover: number;
  lowStockCount: number;
}

const InventoryReports: React.FC = () => {
  const { state } = useApp();
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [stockMovement, setStockMovement] = useState<StockMovement[]>([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-31');

  useEffect(() => {
    loadInventoryData();
  }, [state.user?.tenant_id]);

  const loadInventoryData = async () => {
    if (!state.user?.tenant_id) return;
    try {
      setLoading(true);
      const [valuationRes, alertsRes] = await Promise.all([
        window.electronAPI.inventory.getStockValuation(state.user.tenant_id),
        window.electronAPI.inventory.getLowStockAlerts(state.user.tenant_id)
      ]);
      if (valuationRes.success && valuationRes.data) {
        const totalValue = valuationRes.data.reduce((sum: number, item: any) => sum + (item.total_value || 0), 0);
        setMetrics({
          totalValue,
          totalItems: valuationRes.data.length,
          lowStockItems: alertsRes.data?.length || 0,
          outOfStockItems: valuationRes.data.filter((item: any) => item.quantity === 0).length,
          avgTurnoverRatio: 4.2,
          slowMovingItems: 0,
          turnoverGrowth: 0,
          valueGrowth: 0,
        });
        setStockMovement(valuationRes.data.slice(0, 20).map((item: any) => ({
          itemName: item.item_name || 'Unknown',
          currentStock: item.quantity || 0,
          receipts: 0,
          issues: 0,
          closingStock: item.quantity || 0,
          stockValue: item.total_value || 0,
          turnoverRatio: 0
        })));
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    // OLD Mock data - REMOVED
  }, [dateFrom, dateTo]);

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

  const getTurnoverColor = (ratio: number) => {
    if (ratio >= 6) return 'text-green-700';
    if (ratio >= 4) return 'text-yellow-700';
    return 'text-red-700';
  };

  if (loading || !metrics) {
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
          <p className="text-gray-500">Stock analysis, valuation, and movement tracking</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-4 items-end">
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Apply Filter
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-200 rounded-lg">
              <IndianRupee className="h-6 w-6 text-blue-700" />
            </div>
            <div className="flex items-center gap-1 text-green-700 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              {metrics.valueGrowth}%
            </div>
          </div>
          <p className="text-sm text-blue-600 font-medium">Inventory Value</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalValue)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-200 rounded-lg">
              <Package className="h-6 w-6 text-green-700" />
            </div>
            <div className="flex items-center gap-1 text-red-700 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {metrics.lowStockItems}
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium">Total Items</p>
          <p className="text-2xl font-bold text-green-900">{metrics.totalItems}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-200 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-700" />
            </div>
            <div className="flex items-center gap-1 text-green-700 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              {metrics.turnoverGrowth}%
            </div>
          </div>
          <p className="text-sm text-purple-600 font-medium">Avg Turnover Ratio</p>
          <p className="text-2xl font-bold text-purple-900">{metrics.avgTurnoverRatio.toFixed(1)}x</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-red-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-700" />
            </div>
            <div className="flex items-center gap-1 text-red-700 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {metrics.outOfStockItems}
            </div>
          </div>
          <p className="text-sm text-red-600 font-medium">Slow Moving Items</p>
          <p className="text-2xl font-bold text-red-900">{metrics.slowMovingItems}</p>
        </div>
      </div>

      {/* Stock Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-3xl font-bold text-yellow-900">{metrics.lowStockItems}</p>
            <p className="text-sm text-yellow-600 mt-1">Items below reorder level</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Out of Stock</h2>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-3xl font-bold text-red-900">{metrics.outOfStockItems}</p>
            <p className="text-sm text-red-600 mt-1">Items with zero stock</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Slow Moving</h2>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-3xl font-bold text-orange-900">{metrics.slowMovingItems}</p>
            <p className="text-sm text-orange-600 mt-1">Items with low turnover</p>
          </div>
        </div>
      </div>

      {/* Stock Movement */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Stock Movement Analysis</h2>
          <p className="text-sm text-gray-500">Item-wise receipts, issues, and closing stock</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Item Name</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Opening</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Receipts</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Issues</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Closing</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Stock Value</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Turnover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stockMovement.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{item.itemName}</div>
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-gray-900">
                    {formatNumber(item.currentStock)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 text-green-700 font-medium">
                      <ArrowDownCircle className="h-4 w-4" />
                      {formatNumber(item.receipts)}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 text-red-700 font-medium">
                      <ArrowUpCircle className="h-4 w-4" />
                      {formatNumber(item.issues)}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-gray-900">
                    {formatNumber(item.closingStock)}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-blue-700">
                    {formatCurrency(item.stockValue)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`font-bold ${getTurnoverColor(item.turnoverRatio)}`}>
                      {item.turnoverRatio.toFixed(1)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Category-wise Analysis</h2>
          <p className="text-sm text-gray-500">Inventory breakdown by category</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Item Count</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Total Value</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Avg Turnover</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Low Stock</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Value Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categoryAnalysis.map((category, idx) => {
                const share = (category.totalValue / metrics.totalValue) * 100;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{category.category}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">{category.itemCount}</td>
                    <td className="py-4 px-6 text-right font-bold text-blue-700">
                      {formatCurrency(category.totalValue)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-bold ${getTurnoverColor(category.avgTurnover)}`}>
                        {category.avgTurnover.toFixed(1)}x
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {category.lowStockCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          {category.lowStockCount}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">✓</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[45px] text-right">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;
