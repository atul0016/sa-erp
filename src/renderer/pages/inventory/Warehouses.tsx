import React, { useState, useEffect } from 'react';
import {
  BuildingStorefrontIcon,
  PlusIcon,
  MapPinIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Modal } from '../../components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      inventory: {
        getWarehouses: (tenantId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

interface Warehouse {
  id: number;
  code: string;
  name: string;
  type: 'Main' | 'Branch' | 'Transit' | 'Scrap';
  address: string;
  city: string;
  state: string;
  manager: string;
  total_items: number;
  total_value: number;
  is_active: boolean;
}

interface StockSummary {
  item_code: string;
  item_name: string;
  quantity: number;
  value: number;
}

export function Warehouses() {
  const { state, notify } = useApp();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, [state.user?.tenant_id]);

  const loadWarehouses = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.inventory.getWarehouses(state.user.tenant_id);
      
      if (response.success && response.data) {
        setWarehouses(response.data.map((w: any) => ({
          id: w.id,
          code: w.code,
          name: w.name,
          type: w.type,
          address: w.address || '',
          city: w.city || '',
          state: w.state || '',
          manager: w.manager || '',
          total_items: Number(w.total_items) || 0,
          total_value: Number(w.total_value) || 0,
          is_active: w.is_active !== false,
        })));
      } else {
        notify('error', response.error || 'Failed to load warehouses');
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
      notify('error', 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const loadMockWarehouses = () => {
    setWarehouses([
        { id: 1, code: 'WH-MAIN', name: 'Main Warehouse', type: 'Main', address: '123 Industrial Area', city: 'Mumbai', state: 'Maharashtra', manager: 'Rajesh Kumar', total_items: 156, total_value: 4500000, is_active: true },
        { id: 2, code: 'WH-PUNE', name: 'Pune Branch', type: 'Branch', address: '45 MIDC Chakan', city: 'Pune', state: 'Maharashtra', manager: 'Amit Patil', total_items: 78, total_value: 1800000, is_active: true },
        { id: 3, code: 'WH-DEL', name: 'Delhi Warehouse', type: 'Branch', address: '67 Okhla Industrial', city: 'Delhi', state: 'Delhi', manager: 'Suresh Singh', total_items: 45, total_value: 950000, is_active: true },
        { id: 4, code: 'WH-TRANS', name: 'Transit Warehouse', type: 'Transit', address: 'Logistics Hub', city: 'Mumbai', state: 'Maharashtra', manager: 'Vijay More', total_items: 23, total_value: 320000, is_active: true },
        { id: 5, code: 'WH-SCRAP', name: 'Scrap Yard', type: 'Scrap', address: '12 Industrial Area', city: 'Mumbai', state: 'Maharashtra', manager: 'Mahesh Jadhav', total_items: 12, total_value: 45000, is_active: true },
      ]);
  };

  useEffect(() => {
    loadMockWarehouses();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalValue = warehouses.reduce((sum, w) => sum + w.total_value, 0);
  const totalItems = warehouses.reduce((sum, w) => sum + w.total_items, 0);

  const columns = [
    { key: 'code', header: 'Code', render: (row: Warehouse) => (
      <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{row.code}</span>
    )},
    { key: 'name', header: 'Warehouse', render: (row: Warehouse) => (
      <div>
        <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <MapPinIcon className="w-3 h-3" /> {row.city}, {row.state}
        </div>
      </div>
    )},
    { key: 'type', header: 'Type', render: (row: Warehouse) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.type === 'Main' ? 'bg-indigo-100 text-indigo-800' :
        row.type === 'Branch' ? 'bg-blue-100 text-blue-800' :
        row.type === 'Transit' ? 'bg-yellow-100 text-yellow-800' :
        'bg-slate-100 text-slate-800'
      }`}>
        {row.type}
      </span>
    )},
    { key: 'manager', header: 'Manager', render: (row: Warehouse) => (
      <span className="text-sm">{row.manager}</span>
    )},
    { key: 'total_items', header: 'Items', render: (row: Warehouse) => (
      <div className="flex items-center gap-2">
        <CubeIcon className="w-4 h-4 text-slate-400" />
        <span className="font-medium">{row.total_items}</span>
      </div>
    )},
    { key: 'total_value', header: 'Stock Value', render: (row: Warehouse) => (
      <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(row.total_value)}</span>
    )},
    { key: 'is_active', header: 'Status', render: (row: Warehouse) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        row.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
      }`}>
        {row.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Warehouses</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage storage locations and track inventory
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BuildingStorefrontIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Warehouses</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{warehouses.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total Items</div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{totalItems}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total Stock Value</div>
          <div className="mt-1 text-xl font-bold text-green-600">{formatCurrency(totalValue)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Active Locations</div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {warehouses.filter(w => w.is_active).length}
          </div>
        </Card>
      </div>

      {/* Warehouse Distribution Chart Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Distribution by Warehouse</h3>
        <div className="flex flex-wrap gap-4">
          {warehouses.map((warehouse) => (
            <div key={warehouse.id} className="flex-1 min-w-[150px]">
              <div className="text-sm text-slate-500">{warehouse.name}</div>
              <div className="mt-1 relative h-4 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(warehouse.total_value / totalValue) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {((warehouse.total_value / totalValue) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={warehouses}
          keyExtractor={(row) => row.id.toString()}
          loading={loading}
          onRowClick={(row) => setSelectedWarehouse(row)}
        />
      </Card>

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Warehouse"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Warehouse Code
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder="e.g., WH-NEW"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Type
              </label>
              <select className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600">
                <option value="Main">Main</option>
                <option value="Branch">Branch</option>
                <option value="Transit">Transit</option>
                <option value="Scrap">Scrap</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Warehouse Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              placeholder="e.g., Chennai Branch"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Address
            </label>
            <textarea
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              rows={2}
              placeholder="Full address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                City
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                State
              </label>
              <select className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600">
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Telangana">Telangana</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Manager Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              placeholder="Manager name"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Warehouses;
