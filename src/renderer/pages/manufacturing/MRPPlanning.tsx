/**
 * MRP Planning Page
 * 
 * Material Requirements Planning with backward scheduling
 * Per The ERP Architect's Handbook specifications
 */

import { useState, useEffect } from 'react';
import {
  CalculatorIcon,
  PlayIcon,
  ClockIcon,
  CubeIcon,
  ShoppingCartIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface MRPRun {
  id: string;
  run_number: string;
  run_date: string;
  planning_horizon_days: number;
  status: 'draft' | 'running' | 'completed' | 'error';
  items_planned: number;
  purchase_suggestions: number;
  production_suggestions: number;
  created_by: string;
}

interface PlannedOrder {
  id: string;
  item_code: string;
  item_name: string;
  order_type: 'purchase' | 'production';
  required_date: string;
  order_date: string;
  quantity: number;
  uom: string;
  source: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'suggested' | 'converted' | 'cancelled';
  demand_source: string;
}

interface DemandSummary {
  gross_requirements: number;
  scheduled_receipts: number;
  on_hand: number;
  net_requirements: number;
  planned_orders: number;
}

export default function MRPPlanning() {
  const [activeTab, setActiveTab] = useState<'runs' | 'planned_orders' | 'demand'>('runs');
  const [mrpRuns, setMrpRuns] = useState<MRPRun[]>([]);
  const [plannedOrders, setPlannedOrders] = useState<PlannedOrder[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);

  useEffect(() => {
    // Mock MRP runs
    setMrpRuns([
      {
        id: '1',
        run_number: 'MRP-2024-001',
        run_date: '2024-01-15',
        planning_horizon_days: 30,
        status: 'completed',
        items_planned: 156,
        purchase_suggestions: 45,
        production_suggestions: 28,
        created_by: 'Admin',
      },
      {
        id: '2',
        run_number: 'MRP-2024-002',
        run_date: '2024-01-10',
        planning_horizon_days: 30,
        status: 'completed',
        items_planned: 142,
        purchase_suggestions: 38,
        production_suggestions: 22,
        created_by: 'Admin',
      },
    ]);

    // Mock planned orders
    setPlannedOrders([
      {
        id: '1',
        item_code: 'RM-STEEL-001',
        item_name: 'Mild Steel Rod 12mm',
        order_type: 'purchase',
        required_date: '2024-01-25',
        order_date: '2024-01-18',
        quantity: 500,
        uom: 'Kg',
        source: 'Sharma Steel Suppliers',
        priority: 'high',
        status: 'suggested',
        demand_source: 'PO-2024-0125',
      },
      {
        id: '2',
        item_code: 'RM-ALUM-002',
        item_name: 'Aluminum Sheet 2mm',
        order_type: 'purchase',
        required_date: '2024-01-28',
        order_date: '2024-01-20',
        quantity: 200,
        uom: 'Kg',
        source: 'Metal World',
        priority: 'medium',
        status: 'suggested',
        demand_source: 'PO-2024-0126',
      },
      {
        id: '3',
        item_code: 'COMP-SHAFT-001',
        item_name: 'Drive Shaft Assembly',
        order_type: 'production',
        required_date: '2024-01-30',
        order_date: '2024-01-22',
        quantity: 50,
        uom: 'Nos',
        source: 'BOM-SHAFT-001',
        priority: 'high',
        status: 'suggested',
        demand_source: 'SO-2024-0089',
      },
      {
        id: '4',
        item_code: 'RM-BEAR-003',
        item_name: 'Ball Bearing 6205',
        order_type: 'purchase',
        required_date: '2024-01-22',
        order_date: '2024-01-15',
        quantity: 100,
        uom: 'Nos',
        source: 'SKF Distributors',
        priority: 'critical',
        status: 'suggested',
        demand_source: 'Safety Stock',
      },
      {
        id: '5',
        item_code: 'FG-PUMP-001',
        item_name: 'Centrifugal Pump Model A',
        order_type: 'production',
        required_date: '2024-02-05',
        order_date: '2024-01-25',
        quantity: 25,
        uom: 'Nos',
        source: 'BOM-PUMP-001',
        priority: 'medium',
        status: 'suggested',
        demand_source: 'SO-2024-0092',
      },
    ]);
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
      running: { bg: 'bg-blue-100', text: 'text-blue-600' },
      completed: { bg: 'bg-green-100', text: 'text-green-600' },
      error: { bg: 'bg-red-100', text: 'text-red-600' },
      suggested: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      converted: { bg: 'bg-green-100', text: 'text-green-600' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
    };
    const style = styles[status] || styles.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      low: { bg: 'bg-gray-100', text: 'text-gray-600' },
      medium: { bg: 'bg-blue-100', text: 'text-blue-600' },
      high: { bg: 'bg-orange-100', text: 'text-orange-600' },
      critical: { bg: 'bg-red-100', text: 'text-red-600' },
    };
    const style = styles[priority] || styles.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const handleRunMRP = async () => {
    setIsRunning(true);
    setRunProgress(0);
    
    // Simulate MRP run progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setRunProgress(i);
    }
    
    setIsRunning(false);
    setShowNewRunModal(false);
  };

  const handleConvertOrders = () => {
    if (selectedItems.length > 0) {
      setPlannedOrders(prev =>
        prev.map(order =>
          selectedItems.includes(order.id)
            ? { ...order, status: 'converted' as const }
            : order
        )
      );
      setSelectedItems([]);
    }
  };

  const purchaseOrders = plannedOrders.filter(o => o.order_type === 'purchase' && o.status === 'suggested');
  const productionOrders = plannedOrders.filter(o => o.order_type === 'production' && o.status === 'suggested');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">MRP Planning</h1>
          <p className="text-gray-600">Material Requirements Planning with backward scheduling</p>
        </div>

        <button
          onClick={() => setShowNewRunModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlayIcon className="h-5 w-5" />
          Run MRP
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalculatorIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last MRP Run</p>
              <p className="text-lg font-bold text-gray-800">15 Jan 2024</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShoppingCartIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Purchase Suggestions</p>
              <p className="text-lg font-bold text-orange-600">{purchaseOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <WrenchScrewdriverIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Production Suggestions</p>
              <p className="text-lg font-bold text-green-600">{productionOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Critical Items</p>
              <p className="text-lg font-bold text-red-600">
                {plannedOrders.filter(o => o.priority === 'critical').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'runs', label: 'MRP Runs', icon: ClockIcon },
              { id: 'planned_orders', label: 'Planned Orders', icon: CubeIcon },
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

        {/* MRP Runs Tab */}
        {activeTab === 'runs' && (
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Run Number</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Horizon (Days)</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Items Planned</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Purchase</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Production</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mrpRuns.map(run => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{run.run_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(run.run_date)}</td>
                    <td className="px-4 py-3 text-center text-sm">{run.planning_horizon_days}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium">{run.items_planned}</td>
                    <td className="px-4 py-3 text-center text-sm text-orange-600">{run.purchase_suggestions}</td>
                    <td className="px-4 py-3 text-center text-sm text-green-600">{run.production_suggestions}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(run.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{run.created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Planned Orders Tab */}
        {activeTab === 'planned_orders' && (
          <div className="p-6">
            {/* Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={handleConvertOrders}
                  disabled={selectedItems.length === 0}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm
                    ${selectedItems.length > 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Convert to Orders ({selectedItems.length})
                </button>
              </div>

              <div className="flex gap-2">
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Types</option>
                  <option value="purchase">Purchase</option>
                  <option value="production">Production</option>
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(plannedOrders.filter(o => o.status === 'suggested').map(o => o.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Item</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Required Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Priority</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plannedOrders.map(order => (
                  <tr key={order.id} className={`hover:bg-gray-50 ${order.status !== 'suggested' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(order.id)}
                        onChange={() => {
                          setSelectedItems(prev =>
                            prev.includes(order.id)
                              ? prev.filter(id => id !== order.id)
                              : [...prev, order.id]
                          );
                        }}
                        disabled={order.status !== 'suggested'}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{order.item_name}</div>
                      <div className="text-xs text-gray-500">{order.item_code}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.order_type === 'purchase' ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                          Purchase
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                          Production
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {order.quantity} {order.uom}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.order_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.required_date)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800">{order.source}</div>
                      <div className="text-xs text-gray-500">Demand: {order.demand_source}</div>
                    </td>
                    <td className="px-4 py-3 text-center">{getPriorityBadge(order.priority)}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New MRP Run Modal */}
      {showNewRunModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Run MRP</h2>

            {!isRunning ? (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planning Horizon (Days)
                    </label>
                    <input
                      type="number"
                      defaultValue={30}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Include Items
                    </label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="all">All Items</option>
                      <option value="raw_material">Raw Materials Only</option>
                      <option value="finished_goods">Finished Goods Only</option>
                      <option value="below_reorder">Below Reorder Level Only</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="include_safety" defaultChecked className="rounded border-gray-300" />
                    <label htmlFor="include_safety" className="text-sm text-gray-700">
                      Include Safety Stock Requirements
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="explode_bom" defaultChecked className="rounded border-gray-300" />
                    <label htmlFor="explode_bom" className="text-sm text-gray-700">
                      Explode Multi-level BOMs
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowNewRunModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRunMRP}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <PlayIcon className="h-4 w-4" />
                    Start MRP Run
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8">
                <div className="flex items-center justify-center mb-4">
                  <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
                <p className="text-center text-gray-600 mb-4">Running MRP calculation...</p>
                <div className="bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 rounded-full h-3 transition-all duration-300"
                    style={{ width: `${runProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">{runProgress}% complete</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
