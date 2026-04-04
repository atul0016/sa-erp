/**
 * Gate Pass Management - RGP/NRGP
 * 
 * Returnable Gate Pass & Non-Returnable Gate Pass
 * Per The ERP Architect's Handbook specifications
 */

import { useState, useEffect } from 'react';
import {
  TruckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface GatePass {
  id: string;
  gate_pass_number: string;
  type: 'RGP' | 'NRGP';
  direction: 'outward' | 'inward';
  party_name: string;
  purpose: string;
  vehicle_number?: string;
  driver_name?: string;
  expected_return?: string;
  actual_return?: string;
  status: 'draft' | 'approved' | 'dispatched' | 'partial_return' | 'returned' | 'closed' | 'overdue';
  created_at: string;
  items: GatePassItem[];
}

interface GatePassItem {
  id: string;
  item_name: string;
  item_code: string;
  uom: string;
  outward_qty: number;
  returned_qty: number;
  pending_qty: number;
}

export default function GatePassManagement() {
  const [activeTab, setActiveTab] = useState<'all' | 'rgp' | 'nrgp' | 'pending'>('all');
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    const loadGatePasses = async () => {
      try {
        const result = await (window as any).electronAPI.inventory.getGatePasses();
        if (result?.success) setGatePasses(result.data);
      } catch (error) {
        console.error('Failed to load gate passes:', error);
      }
    };
    loadGatePasses();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-600', icon: DocumentTextIcon },
      approved: { bg: 'bg-blue-100', text: 'text-blue-600', icon: CheckCircleIcon },
      dispatched: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: TruckIcon },
      partial_return: { bg: 'bg-orange-100', text: 'text-orange-600', icon: ClockIcon },
      returned: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircleIcon },
      closed: { bg: 'bg-gray-100', text: 'text-gray-600', icon: CheckCircleIcon },
      overdue: { bg: 'bg-red-100', text: 'text-red-600', icon: ExclamationTriangleIcon },
    };

    const style = styles[status] || styles.draft;
    const Icon = style.icon;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (type: 'RGP' | 'NRGP') => {
    return type === 'RGP' 
      ? <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-600 text-white">RGP</span>
      : <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-600 text-white">NRGP</span>;
  };

  const filteredPasses = gatePasses.filter(gp => {
    if (activeTab === 'rgp') return gp.type === 'RGP';
    if (activeTab === 'nrgp') return gp.type === 'NRGP';
    if (activeTab === 'pending') return ['dispatched', 'partial_return', 'overdue'].includes(gp.status);
    return true;
  });

  const stats = {
    total: gatePasses.length,
    rgp: gatePasses.filter(gp => gp.type === 'RGP').length,
    nrgp: gatePasses.filter(gp => gp.type === 'NRGP').length,
    pending: gatePasses.filter(gp => ['dispatched', 'partial_return'].includes(gp.status)).length,
    overdue: gatePasses.filter(gp => gp.status === 'overdue').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gate Pass Management</h1>
          <p className="text-gray-600">Returnable (RGP) & Non-Returnable (NRGP) Gate Passes</p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Gate Pass
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total Passes</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">RGP (Returnable)</p>
          <p className="text-2xl font-bold text-blue-600">{stats.rgp}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">NRGP (Non-Returnable)</p>
          <p className="text-2xl font-bold text-purple-600">{stats.nrgp}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Pending Return</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'all', label: 'All Passes' },
              { id: 'rgp', label: 'RGP Only' },
              { id: 'nrgp', label: 'NRGP Only' },
              { id: 'pending', label: 'Pending Return' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Gate Pass List */}
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Gate Pass #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Party</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Purpose</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Expected Return</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPasses.map(gp => (
                <tr key={gp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => setSelectedPass(gp)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {gp.gate_pass_number}
                    </button>
                  </td>
                  <td className="px-4 py-3">{getTypeBadge(gp.type)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{gp.party_name}</div>
                    {gp.vehicle_number && (
                      <div className="text-xs text-gray-500">{gp.vehicle_number}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{gp.purpose}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(gp.created_at)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {gp.expected_return ? formatDate(gp.expected_return) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(gp.status)}</td>
                  <td className="px-4 py-3 text-center">
                    {gp.type === 'RGP' && ['dispatched', 'partial_return', 'overdue'].includes(gp.status) && (
                      <button
                        onClick={() => { setSelectedPass(gp); setShowReturnModal(true); }}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Record Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gate Pass Detail Modal */}
      {selectedPass && !showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-800">{selectedPass.gate_pass_number}</h2>
                  {getTypeBadge(selectedPass.type)}
                  {getStatusBadge(selectedPass.status)}
                </div>
                <p className="text-gray-600">{selectedPass.party_name}</p>
              </div>
              <button
                onClick={() => setSelectedPass(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <XCircleIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Purpose</span>
                <div className="font-medium">{selectedPass.purpose}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Vehicle</span>
                <div className="font-medium">{selectedPass.vehicle_number || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Created Date</span>
                <div className="font-medium">{formatDate(selectedPass.created_at)}</div>
              </div>
              {selectedPass.expected_return && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-sm text-gray-500">Expected Return</span>
                  <div className="font-medium">{formatDate(selectedPass.expected_return)}</div>
                </div>
              )}
            </div>

            {/* Items */}
            <h3 className="font-semibold text-gray-800 mb-3">Items</h3>
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Outward</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Returned</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedPass.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-800">{item.item_name}</div>
                      <div className="text-xs text-gray-500">{item.item_code}</div>
                    </td>
                    <td className="px-3 py-2 text-center">{item.outward_qty} {item.uom}</td>
                    <td className="px-3 py-2 text-center text-green-600">{item.returned_qty} {item.uom}</td>
                    <td className="px-3 py-2 text-center">
                      {item.pending_qty > 0 ? (
                        <span className="text-yellow-600 font-medium">{item.pending_qty} {item.uom}</span>
                      ) : (
                        <span className="text-green-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button onClick={() => alert('Print Gate Pass coming soon')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Print Gate Pass
              </button>
              {selectedPass.type === 'RGP' && ['dispatched', 'partial_return', 'overdue'].includes(selectedPass.status) && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Record Return
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return Entry Modal */}
      {showReturnModal && selectedPass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Record Return</h2>
            <p className="text-gray-600 mb-6">{selectedPass.gate_pass_number} - {selectedPass.party_name}</p>

            <div className="space-y-4 mb-6">
              {selectedPass.items.filter(i => i.pending_qty > 0).map(item => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-medium text-gray-800">{item.item_name}</div>
                      <div className="text-sm text-gray-500">Pending: {item.pending_qty} {item.uom}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600">Return Qty:</label>
                    <input
                      type="number"
                      max={item.pending_qty}
                      defaultValue={item.pending_qty}
                      className="w-24 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">{item.uom}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-2">Remarks</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Any remarks about the return..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowReturnModal(false); setSelectedPass(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Gate Pass Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">New Gate Pass</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gate Pass Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="RGP" defaultChecked className="text-blue-600" />
                    <span>RGP (Returnable)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="NRGP" className="text-blue-600" />
                    <span>NRGP (Non-Returnable)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Select or enter party name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select purpose</option>
                  <option value="repair">Repair & Maintenance</option>
                  <option value="calibration">Calibration</option>
                  <option value="job_work">Job Work</option>
                  <option value="sample">Sample</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="MH12AB1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create & Add Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
