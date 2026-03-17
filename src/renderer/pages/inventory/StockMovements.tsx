import React, { useState, useEffect } from 'react';
import {
  ArrowsRightLeftIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CubeIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Badge } from '../../components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      inventory: {
        getStockMovements: (tenantId: string, filters?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

interface StockMovement {
  id: number;
  date: string;
  voucher_type: 'Purchase' | 'Sale' | 'Transfer' | 'Adjustment' | 'Production' | 'Return';
  voucher_number: string;
  item_code: string;
  item_name: string;
  hsn_code: string;
  from_warehouse: string;
  to_warehouse: string;
  quantity_in: number;
  quantity_out: number;
  unit: string;
  rate: number;
  value: number;
  batch_number?: string;
  remarks: string;
}

export function StockMovements() {
  const { state, notify } = useApp();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '2024-01-01', to: '2024-01-31' });
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');

  useEffect(() => {
    loadMovements();
  }, [filter, dateRange, selectedWarehouse, selectedItem, state.user?.tenant_id]);

  const loadMovements = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.inventory.getStockMovements(state.user.tenant_id, {
        from_date: dateRange.from,
        to_date: dateRange.to,
        warehouse: selectedWarehouse,
        item: selectedItem,
      });
      
      if (response.success && response.data) {
        setMovements(response.data.map((m: any) => ({
          id: m.id,
          date: m.movement_date,
          voucher_type: m.voucher_type,
          voucher_number: m.voucher_number,
          item_code: m.item_code,
          item_name: m.item_name,
          hsn_code: m.hsn_code || '',
          from_warehouse: m.from_warehouse || '-',
          to_warehouse: m.to_warehouse || '-',
          quantity_in: Number(m.quantity_in) || 0,
          quantity_out: Number(m.quantity_out) || 0,
          unit: m.uom,
          rate: Number(m.rate) || 0,
          value: Number(m.value) || 0,
          batch_number: m.batch_number,
          remarks: m.remarks || '',
        })));
      } else {
        notify('error', response.error || 'Failed to load stock movements');
      }

      // Fallback to mock data
      const mockMovements: StockMovement[] = [
        {
          id: 1,
          date: '2024-01-02',
          voucher_type: 'Purchase',
          voucher_number: 'GRN-2024-0001',
          item_code: 'RM-001',
          item_name: 'Mild Steel Sheets 2mm',
          hsn_code: '72085100',
          from_warehouse: '-',
          to_warehouse: 'Main Warehouse',
          quantity_in: 500,
          quantity_out: 0,
          unit: 'KG',
          rate: 75,
          value: 37500,
          batch_number: 'BTH-2024-001',
          remarks: 'PO-2024-0001 - Steel India Pvt Ltd',
        },
        {
          id: 2,
          date: '2024-01-03',
          voucher_type: 'Transfer',
          voucher_number: 'STN-2024-0001',
          item_code: 'RM-001',
          item_name: 'Mild Steel Sheets 2mm',
          hsn_code: '72085100',
          from_warehouse: 'Main Warehouse',
          to_warehouse: 'Production Floor',
          quantity_in: 0,
          quantity_out: 200,
          unit: 'KG',
          rate: 75,
          value: 15000,
          batch_number: 'BTH-2024-001',
          remarks: 'Transfer for Production',
        },
        {
          id: 3,
          date: '2024-01-05',
          voucher_type: 'Production',
          voucher_number: 'PRD-2024-0001',
          item_code: 'FG-001',
          item_name: 'Steel Brackets Type-A',
          hsn_code: '73269099',
          from_warehouse: '-',
          to_warehouse: 'Finished Goods',
          quantity_in: 100,
          quantity_out: 0,
          unit: 'PCS',
          rate: 250,
          value: 25000,
          batch_number: 'FG-BTH-001',
          remarks: 'Production completed',
        },
        {
          id: 4,
          date: '2024-01-08',
          voucher_type: 'Sale',
          voucher_number: 'DN-2024-0001',
          item_code: 'FG-001',
          item_name: 'Steel Brackets Type-A',
          hsn_code: '73269099',
          from_warehouse: 'Finished Goods',
          to_warehouse: '-',
          quantity_in: 0,
          quantity_out: 50,
          unit: 'PCS',
          rate: 350,
          value: 17500,
          batch_number: 'FG-BTH-001',
          remarks: 'INV-2024-0001 - ABC Industries',
        },
        {
          id: 5,
          date: '2024-01-10',
          voucher_type: 'Purchase',
          voucher_number: 'GRN-2024-0002',
          item_code: 'RM-002',
          item_name: 'Fasteners Assorted Box',
          hsn_code: '73181500',
          from_warehouse: '-',
          to_warehouse: 'Main Warehouse',
          quantity_in: 50,
          quantity_out: 0,
          unit: 'BOX',
          rate: 1200,
          value: 60000,
          remarks: 'PO-2024-0002 - Hardware Hub',
        },
        {
          id: 6,
          date: '2024-01-12',
          voucher_type: 'Adjustment',
          voucher_number: 'ADJ-2024-0001',
          item_code: 'RM-002',
          item_name: 'Fasteners Assorted Box',
          hsn_code: '73181500',
          from_warehouse: 'Main Warehouse',
          to_warehouse: '-',
          quantity_in: 0,
          quantity_out: 2,
          unit: 'BOX',
          rate: 1200,
          value: 2400,
          remarks: 'Damaged goods - written off',
        },
        {
          id: 7,
          date: '2024-01-15',
          voucher_type: 'Return',
          voucher_number: 'RET-2024-0001',
          item_code: 'FG-001',
          item_name: 'Steel Brackets Type-A',
          hsn_code: '73269099',
          from_warehouse: '-',
          to_warehouse: 'Finished Goods',
          quantity_in: 5,
          quantity_out: 0,
          unit: 'PCS',
          rate: 350,
          value: 1750,
          batch_number: 'FG-BTH-001',
          remarks: 'Sales return - minor defects',
        },
        {
          id: 8,
          date: '2024-01-18',
          voucher_type: 'Transfer',
          voucher_number: 'STN-2024-0002',
          item_code: 'RM-001',
          item_name: 'Mild Steel Sheets 2mm',
          hsn_code: '72085100',
          from_warehouse: 'Main Warehouse',
          to_warehouse: 'Production Floor',
          quantity_in: 0,
          quantity_out: 150,
          unit: 'KG',
          rate: 75,
          value: 11250,
          batch_number: 'BTH-2024-001',
          remarks: 'Transfer for Production Batch 2',
        },
        {
          id: 9,
          date: '2024-01-20',
          voucher_type: 'Production',
          voucher_number: 'PRD-2024-0002',
          item_code: 'FG-002',
          item_name: 'Steel Mounting Plates',
          hsn_code: '73269099',
          from_warehouse: '-',
          to_warehouse: 'Finished Goods',
          quantity_in: 75,
          quantity_out: 0,
          unit: 'PCS',
          rate: 180,
          value: 13500,
          batch_number: 'FG-BTH-002',
          remarks: 'Production Batch 2 completed',
        },
        {
          id: 10,
          date: '2024-01-22',
          voucher_type: 'Sale',
          voucher_number: 'DN-2024-0002',
          item_code: 'FG-002',
          item_name: 'Steel Mounting Plates',
          hsn_code: '73269099',
          from_warehouse: 'Finished Goods',
          to_warehouse: '-',
          quantity_in: 0,
          quantity_out: 40,
          unit: 'PCS',
          rate: 280,
          value: 11200,
          batch_number: 'FG-BTH-002',
          remarks: 'INV-2024-0002 - XYZ Manufacturing',
        },
      ];

      let filtered = mockMovements;
      if (filter !== 'all') {
        filtered = filtered.filter(m => m.voucher_type === filter);
      }
      setMovements(filtered);
    } catch (error) {
      notify('error', 'Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockMovements();
  }, [filter]);

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

  const getVoucherTypeBadge = (type: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'secondary' | 'primary'> = {
      Purchase: 'success',
      Sale: 'danger',
      Transfer: 'warning',
      Adjustment: 'secondary',
      Production: 'primary',
      Return: 'warning',
    };
    return <Badge variant={variants[type] || 'secondary'}>{type}</Badge>;
  };

  // Calculate stats
  const totalIn = movements.reduce((sum, m) => sum + m.quantity_in, 0);
  const totalOut = movements.reduce((sum, m) => sum + m.quantity_out, 0);
  const totalValueIn = movements.filter(m => m.quantity_in > 0).reduce((sum, m) => sum + m.value, 0);
  const totalValueOut = movements.filter(m => m.quantity_out > 0).reduce((sum, m) => sum + m.value, 0);

  const columns = [
    { key: 'date', header: 'Date', render: (row: StockMovement) => (
      <span className="text-sm">{formatDate(row.date)}</span>
    )},
    { key: 'voucher', header: 'Voucher', render: (row: StockMovement) => (
      <div>
        <span className="font-mono text-sm text-indigo-600">{row.voucher_number}</span>
        <div className="mt-1">{getVoucherTypeBadge(row.voucher_type)}</div>
      </div>
    )},
    { key: 'item', header: 'Item', render: (row: StockMovement) => (
      <div>
        <div className="font-medium text-slate-900 dark:text-white">{row.item_name}</div>
        <div className="text-xs text-slate-500">
          {row.item_code} | HSN: {row.hsn_code}
          {row.batch_number && ` | Batch: ${row.batch_number}`}
        </div>
      </div>
    )},
    { key: 'warehouse', header: 'Warehouse', render: (row: StockMovement) => (
      <div className="text-sm">
        {row.from_warehouse !== '-' && (
          <div className="text-red-600">From: {row.from_warehouse}</div>
        )}
        {row.to_warehouse !== '-' && (
          <div className="text-green-600">To: {row.to_warehouse}</div>
        )}
      </div>
    )},
    { key: 'qty_in', header: 'Qty In', render: (row: StockMovement) => (
      <span className={`font-medium ${row.quantity_in > 0 ? 'text-green-600' : 'text-slate-300'}`}>
        {row.quantity_in > 0 ? `+${row.quantity_in} ${row.unit}` : '-'}
      </span>
    )},
    { key: 'qty_out', header: 'Qty Out', render: (row: StockMovement) => (
      <span className={`font-medium ${row.quantity_out > 0 ? 'text-red-600' : 'text-slate-300'}`}>
        {row.quantity_out > 0 ? `-${row.quantity_out} ${row.unit}` : '-'}
      </span>
    )},
    { key: 'rate', header: 'Rate', render: (row: StockMovement) => (
      <span className="text-sm">{formatCurrency(row.rate)}</span>
    )},
    { key: 'value', header: 'Value', render: (row: StockMovement) => (
      <span className="font-medium text-slate-900 dark:text-white">
        {formatCurrency(row.value)}
      </span>
    )},
    { key: 'remarks', header: 'Remarks', render: (row: StockMovement) => (
      <span className="text-sm text-slate-500 truncate max-w-xs block">{row.remarks}</span>
    )},
  ];

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'Purchase', label: 'Purchase' },
    { key: 'Sale', label: 'Sale' },
    { key: 'Transfer', label: 'Transfer' },
    { key: 'Production', label: 'Production' },
    { key: 'Adjustment', label: 'Adjustment' },
    { key: 'Return', label: 'Return' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stock Movements</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track inventory ins and outs with HSN details
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ArrowDownIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Stock In</div>
              <div className="text-xl font-bold text-green-600">{totalIn.toLocaleString()}</div>
              <div className="text-xs text-slate-500">{formatCurrency(totalValueIn)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ArrowUpIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Stock Out</div>
              <div className="text-xl font-bold text-red-600">{totalOut.toLocaleString()}</div>
              <div className="text-xs text-slate-500">{formatCurrency(totalValueOut)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <ArrowsRightLeftIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Net Movement</div>
              <div className={`text-xl font-bold ${totalIn - totalOut >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalIn - totalOut >= 0 ? '+' : ''}{(totalIn - totalOut).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TruckIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Transactions</div>
              <div className="text-xl font-bold text-purple-600">{movements.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Warehouse
            </label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">All Warehouses</option>
              <option value="main">Main Warehouse</option>
              <option value="production">Production Floor</option>
              <option value="finished">Finished Goods</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {filterButtons.map((btn) => (
            <Button
              key={btn.key}
              variant={filter === btn.key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(btn.key)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Movements Table */}
      <Card>
        <div className="px-6 py-4 border-b dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Stock Movement Register
          </h3>
          <p className="text-sm text-slate-500">
            {formatDate(dateRange.from)} to {formatDate(dateRange.to)}
          </p>
        </div>
        <DataTable
          columns={columns}
          data={movements}
          keyExtractor={(row) => row.id.toString()}
          loading={loading}
        />
      </Card>
    </div>
  );
}

export default StockMovements;
