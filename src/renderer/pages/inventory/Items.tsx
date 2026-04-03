import React, { useState, useEffect } from 'react';
import {
  CubeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Modal } from '../../components/common';
import { useApp } from '../../context';

interface Item {
  id: number;
  code: string;
  name: string;
  hsn_code: string;
  category: string;
  uom: string;
  type: 'Goods' | 'Service';
  stock_qty: number;
  reorder_level: number;
  unit_price: number;
  last_purchase_price: number;
  gst_rate: number;
  is_active: boolean;
}

export function Items() {
  const { state, notify } = useApp();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hsn_code: '',
    category: '',
    uom: 'Nos',
    type: 'Goods' as 'Goods' | 'Service',
    unit_price: 0,
    reorder_level: 10,
    gst_rate: 18,
  });

  useEffect(() => {
    loadItems();
  }, [state.user?.tenant_id]);

  const loadItems = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.inventory.getItems(state.user.tenant_id);
      
      if (response.success && response.data) {
        setItems(response.data.map((i: any) => ({
          id: i.id,
          code: i.code,
          name: i.name,
          hsn_code: i.hsn_code || '',
          category: i.category || '',
          uom: i.uom,
          type: i.type,
          stock_qty: Number(i.stock_qty) || 0,
          reorder_level: Number(i.reorder_level) || 0,
          unit_price: Number(i.unit_price) || 0,
          last_purchase_price: Number(i.last_purchase_price) || 0,
          gst_rate: Number(i.gst_rate) || 0,
          is_active: i.is_active !== false,
        })));
      } else {
        notify('error', response.error || 'Failed to load items');
      }
    } catch (error) {
      console.error('Error loading items:', error);
      notify('error', 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.user?.tenant_id) {
      notify('error', 'User not authenticated');
      return;
    }

    if (!formData.name.trim()) {
      notify('error', 'Item name is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await window.electronAPI.inventory.createItem(state.user.tenant_id, {
        ...formData,
        is_active: true,
      });

      if (response.success) {
        notify('success', 'Item created successfully');
        setShowModal(false);
        setFormData({
          name: '',
          hsn_code: '',
          category: '',
          uom: 'Nos',
          type: 'Goods',
          unit_price: 0,
          reorder_level: 10,
          gst_rate: 18,
        });
        loadItems();
      } else {
        notify('error', response.error || 'Failed to create item');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      notify('error', 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['all', ...new Set(items.map(i => i.category))];
  
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter(i => i.stock_qty <= i.reorder_level && i.type === 'Goods');

  const columns = [
    { key: 'code', header: 'Code', render: (row: Item) => (
      <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{row.code}</span>
    )},
    { key: 'name', header: 'Item Name', render: (row: Item) => (
      <div>
        <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
        <div className="text-xs text-slate-500">HSN: {row.hsn_code}</div>
      </div>
    )},
    { key: 'category', header: 'Category', render: (row: Item) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.category === 'Raw Material' ? 'bg-blue-100 text-blue-800' :
        row.category === 'Finished Goods' ? 'bg-green-100 text-green-800' :
        row.category === 'Consumable' ? 'bg-orange-100 text-orange-800' :
        'bg-purple-100 text-purple-800'
      }`}>
        {row.category}
      </span>
    )},
    { key: 'stock_qty', header: 'Stock', render: (row: Item) => (
      <div className="flex items-center gap-2">
        <span className={`font-medium ${
          row.stock_qty <= row.reorder_level ? 'text-red-600' : 'text-slate-900 dark:text-white'
        }`}>
          {row.stock_qty} {row.uom}
        </span>
        {row.stock_qty <= row.reorder_level && row.type === 'Goods' && (
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
        )}
      </div>
    )},
    { key: 'unit_price', header: 'Unit Price', render: (row: Item) => (
      <span className="font-medium">{formatCurrency(row.unit_price)}</span>
    )},
    { key: 'gst_rate', header: 'GST', render: (row: Item) => (
      <span className="text-sm">{row.gst_rate}%</span>
    )},
    { key: 'is_active', header: 'Status', render: (row: Item) => (
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Items</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage products, services, and inventory items
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CubeIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Items</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{items.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Raw Materials</div>
          <div className="mt-1 text-xl font-bold text-blue-600">
            {items.filter(i => i.category === 'Raw Material').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Finished Goods</div>
          <div className="mt-1 text-xl font-bold text-green-600">
            {items.filter(i => i.category === 'Finished Goods').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Services</div>
          <div className="mt-1 text-xl font-bold text-purple-600">
            {items.filter(i => i.type === 'Service').length}
          </div>
        </Card>
        <Card className={`p-4 ${lowStockItems.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
          <div className="text-sm text-slate-500">Low Stock</div>
          <div className="mt-1 text-xl font-bold text-red-600">{lowStockItems.length}</div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-800 dark:text-red-200">Low Stock Alert</div>
              <div className="text-sm text-red-600 dark:text-red-300">
                {lowStockItems.map(i => i.name).join(', ')} - below reorder level
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredItems}
          keyExtractor={(row) => row.id.toString()}
          loading={loading}
          onRowClick={(row) => console.log('View item', row)}
        />
      </Card>

      {/* Add Item Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Item"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Item Code
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder="Auto-generated"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                HSN Code
              </label>
              <input
                type="text"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder="e.g., 7208"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              placeholder="e.g., Steel Sheet 3mm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="">Select Category</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Finished Goods">Finished Goods</option>
                <option value="Consumable">Consumable</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Unit of Measure
              </label>
              <select 
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="Nos">NOS (Numbers)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="MTR">MTR (Meters)</option>
                <option value="LTR">LTR (Liters)</option>
                <option value="SET">SET</option>
                <option value="BOX">BOX</option>
                <option value="HRS">HRS (Hours)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Unit Price
              </label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Reorder Level
              </label>
              <input
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                GST Rate (%)
              </label>
              <select 
                value={formData.gst_rate}
                onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Items;
