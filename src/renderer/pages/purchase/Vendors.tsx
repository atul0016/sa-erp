import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, BuildingOfficeIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Button, Input, Card, Badge, Modal, Table } from '@components/common';
import { useApp } from '../../context';

interface Vendor {
  id: number;
  code: string;
  name: string;
  gstin: string | null;
  pan: string | null;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  vendor_type: 'Supplier' | 'Contractor' | 'Service Provider';
  payment_terms: string;
  credit_days: number;
  credit_limit: number;
  rating: number;
  is_gst_registered: boolean;
  is_msme: boolean;
  outstanding: number;
  status: 'Active' | 'Inactive';
}

const Vendors: React.FC = () => {
  const { state, notify } = useApp();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadVendors();
  }, [state.user?.tenant_id]);

  const loadVendors = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.master.getVendors(state.user.tenant_id);
      
      if (response.success && response.data) {
        setVendors(response.data.map((v: any) => ({
          id: v.id,
          code: v.code,
          name: v.name,
          gstin: v.gstin,
          pan: v.pan,
          contact_person: v.contact_person || '',
          phone: v.phone || '',
          email: v.email || '',
          address: v.address || '',
          city: v.city || '',
          state: v.state || '',
          pincode: v.pincode || '',
          vendor_type: v.vendor_type || 'Supplier',
          payment_terms: v.payment_terms || 'Net 30',
          credit_days: Number(v.credit_days) || 30,
          credit_limit: Number(v.credit_limit) || 0,
          rating: Number(v.rating) || 0,
          is_gst_registered: v.is_gst_registered !== false,
          is_msme: v.is_msme === true,
          outstanding: Number(v.outstanding) || 0,
          status: v.is_active === false ? 'Inactive' : 'Active',
        })));
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [state.user?.tenant_id]);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      '';
    const matchesType = filterType === 'all' || vendor.vendor_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalVendors: vendors.length,
    activeVendors: vendors.filter((v) => v.status === 'Active').length,
    gstRegistered: vendors.filter((v) => v.is_gst_registered).length,
    msme: vendors.filter((v) => v.is_msme).length,
    totalOutstanding: vendors.reduce((sum, v) => sum + v.outstanding, 0),
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Vendor Name' },
    { key: 'vendor_type', label: 'Type' },
    { key: 'contact', label: 'Contact' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'payment_terms', label: 'Payment Terms' },
    { key: 'outstanding', label: 'Outstanding' },
    { key: 'rating', label: 'Rating' },
    { key: 'status', label: 'Status' },
  ];

  const renderRow = (vendor: Vendor) => ({
    code: <span className="font-mono text-sm">{vendor.code}</span>,
    name: (
      <div>
        <div className="font-medium text-gray-900">{vendor.name}</div>
        <div className="text-sm text-gray-500">{vendor.contact_person}</div>
      </div>
    ),
    vendor_type: (
      <Badge variant={vendor.vendor_type === 'Supplier' ? 'primary' : 'secondary'}>
        {vendor.vendor_type}
      </Badge>
    ),
    contact: (
      <div className="text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <PhoneIcon className="h-4 w-4" />
          {vendor.phone}
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <EnvelopeIcon className="h-4 w-4" />
          {vendor.email}
        </div>
      </div>
    ),
    gstin: vendor.gstin ? (
      <div>
        <span className="font-mono text-sm">{vendor.gstin}</span>
        {vendor.is_msme && (
          <Badge variant="success" className="ml-2">
            MSME
          </Badge>
        )}
      </div>
    ) : (
      <span className="text-gray-400">Not Registered</span>
    ),
    payment_terms: (
      <div>
        <div className="text-sm font-medium">{vendor.payment_terms}</div>
        <div className="text-xs text-gray-500">{vendor.credit_days} days</div>
      </div>
    ),
    outstanding: (
      <span
        className={`font-medium ${
          vendor.outstanding > vendor.credit_limit * 0.8 ? 'text-red-600' : 'text-gray-900'
        }`}
      >
        ₹{vendor.outstanding.toLocaleString('en-IN')}
      </span>
    ),
    rating: renderStars(vendor.rating),
    status: (
      <Badge variant={vendor.status === 'Active' ? 'success' : 'error'}>
        {vendor.status}
      </Badge>
    ),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage vendor master data</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Total Vendors</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalVendors}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600">{stats.activeVendors}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">GST Registered</div>
          <div className="text-2xl font-bold text-blue-600">{stats.gstRegistered}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">MSME</div>
          <div className="text-2xl font-bold text-purple-600">{stats.msme}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Total Outstanding</div>
          <div className="text-2xl font-bold text-orange-600">
            ₹{stats.totalOutstanding.toLocaleString('en-IN')}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="Supplier">Supplier</option>
            <option value="Contractor">Contractor</option>
            <option value="Service Provider">Service Provider</option>
          </select>
        </div>
      </Card>

      {/* Vendors Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredVendors}
          renderRow={renderRow}
          onRowClick={(vendor) => setSelectedVendor(vendor)}
          loading={loading}
        />
      </Card>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Vendor"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Vendor Code" required />
              <Input label="Vendor Name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="GSTIN" />
              <Input label="PAN" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Person" required />
              <Input label="Phone" type="tel" required />
            </div>
            <Input label="Email" type="email" required />
            <Input label="Address" />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" />
              <Input label="State" />
              <Input label="Pincode" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select className="px-4 py-2 border rounded-lg">
                <option value="">Select Type</option>
                <option value="Supplier">Supplier</option>
                <option value="Contractor">Contractor</option>
                <option value="Service Provider">Service Provider</option>
              </select>
              <Input label="Payment Terms" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Credit Days" type="number" />
              <Input label="Credit Limit" type="number" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">GST Registered</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">MSME</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => { notify('success', 'Vendor created successfully'); setShowAddModal(false); loadVendors(); }}>Save Vendor</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Vendors;
