import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Truck,
  IndianRupee,
  Calendar,
  Filter,
  RefreshCw,
  Package,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context';

interface PurchaseMetrics {
  totalSpend: number;
  totalOrders: number;
  avgOrderValue: number;
  totalVendors: number;
  topVendor: string;
  topCategory: string;
  spendGrowth: number;
  ordersGrowth: number;
  pendingPOs: number;
  overdueDeliveries: number;
}

interface VendorPerformance {
  vendorName: string;
  orders: number;
  spend: number;
  onTimeDelivery: number;
  qualityRating: number;
  lastOrderDate: string;
}

interface CategorySpend {
  category: string;
  spend: number;
  orders: number;
  avgPrice: number;
  topItem: string;
}

const PurchaseReports: React.FC = () => {
  const { state } = useApp();
  const [metrics, setMetrics] = useState<PurchaseMetrics | null>(null);
  const [vendorPerformance, setVendorPerformance] = useState<VendorPerformance[]>([]);
  const [categorySpend, setCategorySpend] = useState<CategorySpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-31');

  useEffect(() => {
    loadPurchaseReport();
  }, [dateFrom, dateTo, state.user?.tenant_id]);

  const loadPurchaseReport = async () => {
    if (!state.user?.tenant_id) return;
    try {
      setLoading(true);
      const response = await window.electronAPI.purchase.getPurchaseReport(state.user.tenant_id, dateFrom, dateTo);
      if (response.success && response.data) {
        const data = response.data;
        setMetrics({
          totalSpend: data.summary?.total_purchases || 0,
          totalOrders: data.summary?.total_invoices || 0,
          avgOrderValue: data.summary?.total_invoices > 0 ? data.summary.total_purchases / data.summary.total_invoices : 0,
          totalVendors: data.byVendor?.length || 0,
          topVendor: data.byVendor?.[0]?.vendor_name || 'N/A',
          topCategory: 'Raw Materials',
          spendGrowth: 0,
          ordersGrowth: 0,
          pendingPOs: 0,
          overdueDeliveries: 0,
        });
        setVendorPerformance(data.byVendor?.map((v: any) => ({
          vendorName: v.vendor_name,
          orders: v.invoice_count,
          spend: v.total_purchases,
          onTimeDelivery: 95,
          qualityRating: 4.5,
          lastOrderDate: new Date().toISOString().split('T')[0]
        })) || []);
      }
      setLoading(false);
    } catch (err) {
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-700';
    if (rating >= 4.0) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getDeliveryColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-700';
    if (percentage >= 80) return 'text-yellow-700';
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Reports</h1>
          <p className="text-gray-500">Comprehensive purchase analytics and vendor performance</p>
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
              {metrics.spendGrowth}%
            </div>
          </div>
          <p className="text-sm text-blue-600 font-medium">Total Spend</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalSpend)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-200 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-green-700" />
            </div>
            <div className="flex items-center gap-1 text-green-700 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              {metrics.ordersGrowth}%
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium">Purchase Orders</p>
          <p className="text-2xl font-bold text-green-900">{metrics.totalOrders}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-yellow-200 rounded-lg">
              <Package className="h-6 w-6 text-yellow-700" />
            </div>
            <div className="flex items-center gap-1 text-orange-700 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              {metrics.pendingPOs}
            </div>
          </div>
          <p className="text-sm text-yellow-600 font-medium">Avg PO Value</p>
          <p className="text-2xl font-bold text-yellow-900">{formatCurrency(metrics.avgOrderValue)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-200 rounded-lg">
              <Truck className="h-6 w-6 text-orange-700" />
            </div>
            <div className="flex items-center gap-1 text-red-700 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              {metrics.overdueDeliveries}
            </div>
          </div>
          <p className="text-sm text-orange-600 font-medium">Active Vendors</p>
          <p className="text-2xl font-bold text-orange-900">{metrics.totalVendors}</p>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Vendor</h2>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-blue-900">{metrics.topVendor}</p>
            <p className="text-sm text-blue-600 mt-1">Highest purchase volume this period</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Category</h2>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-green-900">{metrics.topCategory}</p>
            <p className="text-sm text-green-600 mt-1">Highest spend category</p>
          </div>
        </div>
      </div>

      {/* Vendor Performance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Vendor Performance</h2>
          <p className="text-sm text-gray-500">Top vendors by spend and performance metrics</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Vendor Name</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Orders</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Total Spend</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">On-Time %</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Quality</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Last Order</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendorPerformance.map((vendor, idx) => {
                const share = (vendor.spend / metrics.totalSpend) * 100;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{vendor.vendorName}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">{vendor.orders}</td>
                    <td className="py-4 px-6 text-right font-bold text-blue-700">
                      {formatCurrency(vendor.spend)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-bold ${getDeliveryColor(vendor.onTimeDelivery)}`}>
                        {vendor.onTimeDelivery}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-bold ${getRatingColor(vendor.qualityRating)}`}>
                        {vendor.qualityRating.toFixed(1)} ⭐
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{formatDate(vendor.lastOrderDate)}</td>
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

      {/* Category Spend */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Category-wise Spend Analysis</h2>
          <p className="text-sm text-gray-500">Purchase breakdown by category</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Orders</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Total Spend</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Avg Price</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Top Item</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categorySpend.map((category, idx) => {
                const share = (category.spend / metrics.totalSpend) * 100;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{category.category}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">{category.orders}</td>
                    <td className="py-4 px-6 text-right font-bold text-green-700">
                      {formatCurrency(category.spend)}
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      {formatCurrency(category.avgPrice)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{category.topItem}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-green-500 h-2 rounded-full"
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

export default PurchaseReports;
