import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, DataTable, Modal } from '../../components/common';
import { useApp } from '../../context';

interface Customer {
  id: number;
  code: string;
  name: string;
  gstin: string;
  contact_person: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  credit_limit: number;
  outstanding: number;
  total_orders: number;
  is_active: boolean;
}

export function Customers() {
  const { state, notify } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    contact_person: '',
    phone: '',
    email: '',
    billing_address: '',
    billing_city: '',
    billing_state: '',
    billing_state_code: '',
    billing_pincode: '',
    credit_limit: 0,
    payment_terms: 30,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [state.user?.tenant_id]);

  const loadCustomers = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.master.getCustomers(state.user.tenant_id);
      
      if (response.success && response.data) {
        setCustomers(response.data.map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          gstin: c.gstin || '',
          contact_person: c.contact_person || '',
          phone: c.phone || '',
          email: c.email || '',
          city: c.city || '',
          state: c.state || '',
          credit_limit: Number(c.credit_limit) || 0,
          outstanding: Number(c.outstanding) || 0,
          total_orders: Number(c.total_orders) || 0,
          is_active: c.is_active !== false,
        })));
      } else {
        notify('error', response.error || 'Failed to load customers');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      notify('error', 'Failed to load customers');
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
      notify('error', 'Customer name is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await window.electronAPI.sales.createCustomer(state.user.tenant_id, {
        ...formData,
        customer_type: 'B2B',
        is_active: true,
      });

      if (response.success) {
        notify('success', 'Customer created successfully');
        setShowModal(false);
        setFormData({
          name: '',
          gstin: '',
          contact_person: '',
          phone: '',
          email: '',
          billing_address: '',
          billing_city: '',
          billing_state: '',
          billing_state_code: '',
          billing_pincode: '',
          credit_limit: 0,
          payment_terms: 30,
        });
        loadCustomers();
      } else {
        notify('error', response.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      notify('error', 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding, 0);

  const columns = [
    { key: 'code', header: 'Code', render: (row: Customer) => (
      <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{row.code}</span>
    )},
    { key: 'name', header: 'Customer', render: (row: Customer) => (
      <div>
        <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
        <div className="text-xs text-slate-500">GSTIN: {row.gstin}</div>
      </div>
    )},
    { key: 'contact', header: 'Contact', render: (row: Customer) => (
      <div className="text-sm">
        <div className="font-medium">{row.contact_person}</div>
        <div className="flex items-center gap-1 text-slate-500">
          <PhoneIcon className="w-3 h-3" /> {row.phone}
        </div>
      </div>
    )},
    { key: 'location', header: 'Location', render: (row: Customer) => (
      <div className="flex items-center gap-1 text-sm text-slate-500">
        <MapPinIcon className="w-3 h-3" /> {row.city}, {row.state}
      </div>
    )},
    { key: 'credit', header: 'Credit Limit', render: (row: Customer) => (
      <span className="text-sm">{formatCurrency(row.credit_limit)}</span>
    )},
    { key: 'outstanding', header: 'Outstanding', render: (row: Customer) => (
      <span className={`font-medium ${
        row.outstanding > row.credit_limit * 0.8 ? 'text-red-600' : 
        row.outstanding > 0 ? 'text-orange-600' : 'text-green-600'
      }`}>
        {formatCurrency(row.outstanding)}
      </span>
    )},
    { key: 'total_orders', header: 'Orders', render: (row: Customer) => (
      <span className="text-sm">{row.total_orders}</span>
    )},
    { key: 'is_active', header: 'Status', render: (row: Customer) => (
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage customer information and credit
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Customers</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{customers.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Active Customers</div>
          <div className="mt-1 text-xl font-bold text-green-600">
            {customers.filter(c => c.is_active).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total Outstanding</div>
          <div className="mt-1 text-xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total Orders</div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {customers.reduce((sum, c) => sum + c.total_orders, 0)}
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search customers by name, code, or GSTIN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600"
        />
      </div>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredCustomers}
          keyExtractor={(row) => row.id.toString()}
          loading={loading}
          onRowClick={(row) => console.log('View customer', row)}
        />
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Customer"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Customer Code
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
                GSTIN
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder="e.g., 27AABCU9603R1ZM"
                maxLength={15}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              placeholder="Full legal name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder="10-digit mobile"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              placeholder="email@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Address
            </label>
            <textarea
              value={formData.billing_address}
              onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              rows={2}
              placeholder="Full address"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                City
              </label>
              <input
                type="text"
                value={formData.billing_city}
                onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                State
              </label>
              <select 
                value={formData.billing_state}
                onChange={(e) => setFormData({ ...formData, billing_state: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="">Select State</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Pincode
              </label>
              <input
                type="text"
                value={formData.billing_pincode}
                onChange={(e) => setFormData({ ...formData, billing_pincode: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                maxLength={6}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Credit Limit (₹)
            </label>
            <input
              type="number"
              value={formData.credit_limit}
              onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
              placeholder="0"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Customers;
