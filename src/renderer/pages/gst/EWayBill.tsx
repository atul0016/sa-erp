/**
 * E-Way Bill Page
 * 
 * GST E-Way Bill generation and management
 * Per The ERP Architect's Handbook specifications
 */

import { useState, useEffect } from 'react';
import {
  TruckIcon,
  DocumentTextIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  QrCodeIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

interface EWayBill {
  id: string;
  ewb_number: string;
  ewb_date: string;
  valid_until: string;
  document_type: 'invoice' | 'delivery_challan' | 'bill_of_supply' | 'others';
  document_number: string;
  document_date: string;
  supplier_gstin: string;
  supplier_name: string;
  recipient_gstin: string;
  recipient_name: string;
  from_place: string;
  from_state: string;
  from_pincode: string;
  to_place: string;
  to_state: string;
  to_pincode: string;
  distance_km: number;
  transport_mode: 'road' | 'rail' | 'air' | 'ship';
  transporter_name?: string;
  transporter_id?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  total_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  status: 'active' | 'cancelled' | 'expired' | 'extended';
  hours_remaining?: number;
  extended_count: number;
}

interface EWayBillItem {
  id: string;
  product_name: string;
  hsn_code: string;
  quantity: number;
  uom: string;
  taxable_value: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
}

export default function EWayBill() {
  const [activeTab, setActiveTab] = useState<'generated' | 'pending' | 'cancelled'>('generated');
  const [ewayBills, setEwayBills] = useState<EWayBill[]>([]);
  const [selectedBill, setSelectedBill] = useState<EWayBill | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const loadEWayBills = async () => {
      try {
        const result = await (window as any).electronAPI.gst.getEWayBills();
        if (result?.success) setEwayBills(result.data.bills || []);
      } catch (error) {
        console.error('Failed to load e-way bills:', error);
      }
    };
    loadEWayBills();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string, hoursRemaining?: number) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      active: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircleIcon },
      cancelled: { bg: 'bg-red-100', text: 'text-red-600', icon: XCircleIcon },
      expired: { bg: 'bg-gray-100', text: 'text-gray-600', icon: ClockIcon },
      extended: { bg: 'bg-blue-100', text: 'text-blue-600', icon: ArrowPathIcon },
    };
    const style = styles[status] || styles.active;
    const Icon = style.icon;

    // Check if expiring soon
    if (status === 'active' && hoursRemaining !== undefined && hoursRemaining < 6) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
          <ExclamationTriangleIcon className="h-3 w-3" />
          EXPIRING ({hoursRemaining}h)
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </span>
    );
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'road': return '🚛';
      case 'rail': return '🚂';
      case 'air': return '✈️';
      case 'ship': return '🚢';
      default: return '🚛';
    }
  };

  const filteredBills = ewayBills.filter(bill => {
    if (activeTab === 'generated' && bill.status !== 'cancelled') return true;
    if (activeTab === 'cancelled' && bill.status === 'cancelled') return true;
    if (activeTab === 'pending') return false; // Would show invoices pending E-Way Bill
    return false;
  });

  const stats = {
    active: ewayBills.filter(b => b.status === 'active').length,
    expiringSoon: ewayBills.filter(b => b.status === 'active' && b.hours_remaining && b.hours_remaining < 6).length,
    cancelled: ewayBills.filter(b => b.status === 'cancelled').length,
    expired: ewayBills.filter(b => b.status === 'expired').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">E-Way Bill Management</h1>
          <p className="text-gray-600">Generate and manage GST E-Way Bills</p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Generate E-Way Bill
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expired</p>
              <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Soon Warning */}
      {stats.expiringSoon > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">
              {stats.expiringSoon} E-Way Bill(s) expiring within 6 hours!
            </p>
            <p className="text-sm text-yellow-600">Extend validity or update vehicle details if required.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'generated', label: 'Generated E-Way Bills', icon: DocumentTextIcon },
              { id: 'pending', label: 'Pending Generation', icon: ClockIcon },
              { id: 'cancelled', label: 'Cancelled', icon: XCircleIcon },
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

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">E-Way Bill</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Document</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Route</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Transport</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Valid Until</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {bill.ewb_number}
                      </button>
                      <div className="text-xs text-gray-500">{formatDateTime(bill.ewb_date)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{bill.document_number}</div>
                      <div className="text-xs text-gray-500 capitalize">{bill.document_type.replace('_', ' ')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <span className="text-gray-800">{bill.from_place}</span>
                        <span className="text-gray-400 mx-1">→</span>
                        <span className="text-gray-800">{bill.to_place}</span>
                      </div>
                      <div className="text-xs text-gray-500">{bill.distance_km} km</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTransportIcon(bill.transport_mode)}</span>
                        <div>
                          <div className="text-sm font-medium">{bill.vehicle_number || '-'}</div>
                          <div className="text-xs text-gray-500">{bill.transporter_name || 'Self'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium">{formatCurrency(bill.total_value)}</div>
                      <div className="text-xs text-gray-500">
                        Tax: {formatCurrency(bill.cgst + bill.sgst + bill.igst)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{formatDateTime(bill.valid_until)}</div>
                      {bill.hours_remaining !== undefined && bill.status === 'active' && (
                        <div className={`text-xs ${bill.hours_remaining < 6 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {bill.hours_remaining}h remaining
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(bill.status, bill.hours_remaining)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <QrCodeIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Print">
                          <PrinterIcon className="h-4 w-4" />
                        </button>
                        {bill.status === 'active' && (
                          <>
                            <button
                              onClick={() => { setSelectedBill(bill); setShowVehicleModal(true); }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Update Vehicle"
                            >
                              <TruckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedBill(bill); setShowExtendModal(true); }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Extend Validity"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* E-Way Bill Detail Modal */}
      {selectedBill && !showExtendModal && !showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">E-Way Bill Details</h2>
                <p className="text-gray-600">#{selectedBill.ewb_number}</p>
              </div>
              {getStatusBadge(selectedBill.status, selectedBill.hours_remaining)}
            </div>

            {/* QR Code Placeholder */}
            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                <QrCodeIcon className="h-20 w-20 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">From</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{selectedBill.supplier_name}</p>
                  <p className="text-sm text-gray-500">{selectedBill.supplier_gstin}</p>
                  <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4" />
                    {selectedBill.from_place}, {selectedBill.from_state} - {selectedBill.from_pincode}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">To</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{selectedBill.recipient_name}</p>
                  <p className="text-sm text-gray-500">{selectedBill.recipient_gstin}</p>
                  <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4" />
                    {selectedBill.to_place}, {selectedBill.to_state} - {selectedBill.to_pincode}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Document</span>
                <div className="font-medium">{selectedBill.document_number}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Distance</span>
                <div className="font-medium">{selectedBill.distance_km} km</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Transport</span>
                <div className="font-medium capitalize">{selectedBill.transport_mode}</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <span className="text-sm text-gray-500">Taxable Value</span>
                  <div className="font-bold text-gray-800">{formatCurrency(selectedBill.total_value)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">CGST</span>
                  <div className="font-medium">{formatCurrency(selectedBill.cgst)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">SGST</span>
                  <div className="font-medium">{formatCurrency(selectedBill.sgst)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">IGST</span>
                  <div className="font-medium">{formatCurrency(selectedBill.igst)}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <PrinterIcon className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Validity Modal */}
      {showExtendModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Extend E-Way Bill</h2>
            <p className="text-gray-600 mb-6">#{selectedBill.ewb_number}</p>

            <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> E-Way Bill can be extended only within 8 hours before or after expiry.
                This is extension #{selectedBill.extended_count + 1}.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Place</label>
                <input
                  type="text"
                  placeholder="Enter current location"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Distance (km)</label>
                <input
                  type="number"
                  defaultValue={selectedBill.distance_km / 2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Extension</label>
                <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select reason</option>
                  <option value="natural_calamity">Natural Calamity</option>
                  <option value="law_order">Law and Order</option>
                  <option value="transshipment">Trans Shipment</option>
                  <option value="accident">Accident</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional remarks..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowExtendModal(false); setSelectedBill(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Extend Validity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Vehicle Modal */}
      {showVehicleModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Update Vehicle Details</h2>
            <p className="text-gray-600 mb-6">#{selectedBill.ewb_number}</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  defaultValue={selectedBill.vehicle_number}
                  placeholder="MH12AB1234"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
                <select defaultValue={selectedBill.transport_mode} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="road">Road</option>
                  <option value="rail">Rail</option>
                  <option value="air">Air</option>
                  <option value="ship">Ship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Update</label>
                <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select reason</option>
                  <option value="breakdown">Vehicle Breakdown</option>
                  <option value="transshipment">Trans Shipment</option>
                  <option value="first_time">First Time Entry</option>
                  <option value="others">Others</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowVehicleModal(false); setSelectedBill(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Update Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate E-Way Bill Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Generate E-Way Bill</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Invoice/Document</label>
                <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select document</option>
                  <option value="INV-2024-0126">INV-2024-0126 - XYZ Industries (₹2,85,000)</option>
                  <option value="INV-2024-0127">INV-2024-0127 - PQR Traders (₹1,45,000)</option>
                  <option value="DC-2024-0048">DC-2024-0048 - DEF Exports (₹3,20,000)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
                <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="road">Road</option>
                  <option value="rail">Rail</option>
                  <option value="air">Air</option>
                  <option value="ship">Ship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                <input
                  type="number"
                  placeholder="Auto-calculated or enter manually"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  placeholder="MH12AB1234 (optional if transporter ID provided)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporter ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Transporter GSTIN"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              E-Way Bill is mandatory for goods movement exceeding ₹50,000 in value.
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Generate E-Way Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
