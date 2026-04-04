import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  IndianRupee,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  Package,
} from 'lucide-react';
import { useApp } from '../../context';

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
  topProduct: string;
  topCustomer: string;
  revenueGrowth: number;
  ordersGrowth: number;
}

interface ProductPerformance {
  productName: string;
  quantity: number;
  revenue: number;
  orders: number;
  avgPrice: number;
}

interface CustomerPerformance {
  customerName: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  lastOrderDate: string;
}

const SalesReports: React.FC = () => {
  const { state } = useApp();
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [customerPerformance, setCustomerPerformance] = useState<CustomerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-31');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSalesReport();
  }, [dateFrom, dateTo, state.user?.tenant_id]);

  const loadSalesReport = async () => {
    if (!state.user?.tenant_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await window.electronAPI.sales.getSalesReport(state.user.tenant_id, dateFrom, dateTo);
      
      if (response.success && response.data) {
        const data = response.data;
        setMetrics({
          totalRevenue: data.summary?.total_sales || 0,
          totalOrders: data.summary?.total_invoices || 0,
          avgOrderValue: data.summary?.total_invoices > 0 ? data.summary.total_sales / data.summary.total_invoices : 0,
          totalCustomers: data.byCustomer?.length || 0,
          topProduct: data.byItem?.[0]?.item_name || 'N/A',
          topCustomer: data.byCustomer?.[0]?.customer_name || 'N/A',
          revenueGrowth: 0,
          ordersGrowth: 0,
        });

        setProductPerformance(data.byItem?.slice(0, 10).map((item: any) => ({
          productName: item.item_name,
          quantity: item.total_quantity,
          revenue: item.total_sales,
          orders: 0,
          avgPrice: item.total_sales / (item.total_quantity || 1)
        })) || []);

        setCustomerPerformance(data.byCustomer?.slice(0, 10).map((customer: any) => ({
          customerName: customer.customer_name,
          orders: customer.invoice_count,
          revenue: customer.total_sales,
          avgOrderValue: customer.total_sales / (customer.invoice_count || 1),
          lastOrderDate: new Date().toISOString().split('T')[0]
        })) || []);
      } else {
        setError(response.error || 'Failed to load sales report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales report');
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-500">Comprehensive sales analytics and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert('Export PDF coming soon')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button onClick={() => alert('Export coming soon')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
          <button onClick={() => alert('Filter applied')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
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
              {metrics.revenueGrowth}%
            </div>
          </div>
          <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-200 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-700" />
            </div>
            <div className="flex items-center gap-1 text-green-700 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              {metrics.ordersGrowth}%
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-green-900">{metrics.totalOrders}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-200 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-700" />
            </div>
          </div>
          <p className="text-sm text-purple-600 font-medium">Avg Order Value</p>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(metrics.avgOrderValue)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-200 rounded-lg">
              <Users className="h-6 w-6 text-orange-700" />
            </div>
          </div>
          <p className="text-sm text-orange-600 font-medium">Total Customers</p>
          <p className="text-2xl font-bold text-orange-900">{metrics.totalCustomers}</p>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Product</h2>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-blue-900">{metrics.topProduct}</p>
            <p className="text-sm text-blue-600 mt-1">Best selling product this period</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Customer</h2>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-green-900">{metrics.topCustomer}</p>
            <p className="text-sm text-green-600 mt-1">Highest revenue contributor</p>
          </div>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Product Performance</h2>
          <p className="text-sm text-gray-500">Top selling products by revenue</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Product Name</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Orders</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Avg Price</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productPerformance.map((product, idx) => {
                const share = (product.revenue / metrics.totalRevenue) * 100;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{product.productName}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">{product.quantity}</td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">{product.orders}</td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      {formatCurrency(product.avgPrice)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-blue-700">
                      {formatCurrency(product.revenue)}
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

      {/* Customer Performance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Customer Performance</h2>
          <p className="text-sm text-gray-500">Top customers by revenue contribution</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Customer Name</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Orders</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Avg Order Value</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Last Order</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customerPerformance.map((customer, idx) => {
                const share = (customer.revenue / metrics.totalRevenue) * 100;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{customer.customerName}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">{customer.orders}</td>
                    <td className="py-4 px-6 text-right font-bold text-green-700">
                      {formatCurrency(customer.revenue)}
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      {formatCurrency(customer.avgOrderValue)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{formatDate(customer.lastOrderDate)}</td>
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

export default SalesReports;
