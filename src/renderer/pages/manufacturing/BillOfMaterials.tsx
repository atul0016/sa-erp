import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, CubeIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card, Badge, Modal, Table } from '@components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      manufacturing: {
        getBOMs: (tenantId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

interface BOM {
  id: number;
  bom_code: string;
  item_name: string;
  item_code: string;
  quantity: number;
  uom: string;
  bom_type: 'Manufacturing' | 'Assembly' | 'Kit';
  is_active: boolean;
  is_default: boolean;
  operation_cost: number;
  raw_material_cost: number;
  total_cost: number;
  components_count: number;
  operations_count: number;
  version: number;
}

interface BOMComponent {
  id: number;
  item_name: string;
  item_code: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  wastage_percent: number;
  source_warehouse: string;
}

interface BOMOperation {
  id: number;
  operation_name: string;
  work_center: string;
  time_in_mins: number;
  hour_rate: number;
  operating_cost: number;
  description: string;
}

const BillOfMaterials: React.FC = () => {
  const { state, notify } = useApp();
  const [boms, setBoms] = useState<BOM[]>([]);
  const [components, setComponents] = useState<BOMComponent[]>([]);
  const [operations, setOperations] = useState<BOMOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadBOMs();
  }, [state.user?.tenant_id]);

  const loadBOMs = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.manufacturing.getBOMs(state.user.tenant_id);
      
      if (response.success && response.data) {
        setBoms(response.data.map((b: any) => ({
          id: b.id,
          bom_code: b.bom_code,
          item_name: b.item_name,
          item_code: b.item_code,
          quantity: Number(b.quantity) || 1,
          uom: b.uom,
          bom_type: b.bom_type,
          is_active: b.is_active !== false,
          is_default: b.is_default === true,
          operation_cost: Number(b.operation_cost) || 0,
          raw_material_cost: Number(b.raw_material_cost) || 0,
          total_cost: Number(b.total_cost) || 0,
          components_count: Number(b.components_count) || 0,
          operations_count: Number(b.operations_count) || 0,
          version: Number(b.version) || 1,
        })));
      }
    } catch (error) {
      console.error('Error loading BOMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBOMs = boms.filter((bom) => {
    const matchesSearch =
      bom.bom_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bom.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bom.item_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || bom.bom_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalBOMs: boms.length,
    active: boms.filter((b) => b.is_active).length,
    manufacturing: boms.filter((b) => b.bom_type === 'Manufacturing').length,
    assembly: boms.filter((b) => b.bom_type === 'Assembly').length,
  };

  const columns = [
    { key: 'bom_code', label: 'BOM Code' },
    { key: 'item', label: 'Item' },
    { key: 'type', label: 'Type' },
    { key: 'components', label: 'Components' },
    { key: 'operations', label: 'Operations' },
    { key: 'costs', label: 'Costs' },
    { key: 'version', label: 'Version' },
    { key: 'status', label: 'Status' },
  ];

  const renderRow = (bom: BOM) => ({
    bom_code: (
      <div>
        <div className="font-mono text-sm font-medium">{bom.bom_code}</div>
        {bom.is_default && (
          <Badge variant="primary" className="text-xs mt-1">
            Default
          </Badge>
        )}
      </div>
    ),
    item: (
      <div>
        <div className="font-medium text-gray-900">{bom.item_name}</div>
        <div className="text-sm text-gray-500 font-mono">{bom.item_code}</div>
      </div>
    ),
    type: (
      <Badge
        variant={
          bom.bom_type === 'Manufacturing'
            ? 'primary'
            : bom.bom_type === 'Assembly'
            ? 'secondary'
            : 'default'
        }
      >
        {bom.bom_type}
      </Badge>
    ),
    components: (
      <div className="flex items-center gap-2">
        <CubeIcon className="h-5 w-5 text-gray-400" />
        <span className="font-medium">{bom.components_count}</span>
      </div>
    ),
    operations: (
      <div className="flex items-center gap-2">
        <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400" />
        <span className="font-medium">{bom.operations_count}</span>
      </div>
    ),
    costs: (
      <div className="text-sm">
        <div className="font-medium text-gray-900">
          ₹{bom.total_cost.toLocaleString('en-IN')}
        </div>
        <div className="text-xs text-gray-500">
          RM: ₹{bom.raw_material_cost.toLocaleString('en-IN')} + Op: ₹
          {bom.operation_cost.toLocaleString('en-IN')}
        </div>
      </div>
    ),
    version: <span className="font-mono text-sm">v{bom.version}</span>,
    status: (
      <Badge variant={bom.is_active ? 'success' : 'error'}>
        {bom.is_active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  });

  const handleRowClick = (bom: BOM) => {
    setSelectedBOM(bom);
    setShowDetailModal(true);
  };

  useEffect(() => {
    const loadBOMDetails = async () => {
      if (!selectedBOM || !state.user?.tenant_id) return;
      try {
        const [compRes, opsRes] = await Promise.all([
          window.electronAPI.manufacturing.getBOMComponents(state.user.tenant_id, selectedBOM.id),
          window.electronAPI.manufacturing.getBOMOperations(state.user.tenant_id, selectedBOM.id),
        ]);
        if (compRes.success && compRes.data) setComponents(compRes.data);
        if (opsRes.success && opsRes.data) setOperations(opsRes.data);
      } catch (error) {
        console.error('Error loading BOM details:', error);
      }
    };
    loadBOMDetails();
  }, [selectedBOM?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill of Materials</h1>
          <p className="text-gray-600">Manage manufacturing BOMs and assembly configurations</p>
        </div>
        <Button onClick={() => notify('info', 'BOM creation coming soon')}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create BOM
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Total BOMs</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalBOMs}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Manufacturing</div>
          <div className="text-2xl font-bold text-blue-600">{stats.manufacturing}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Assembly</div>
          <div className="text-2xl font-bold text-purple-600">{stats.assembly}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search BOMs..."
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
            <option value="Manufacturing">Manufacturing</option>
            <option value="Assembly">Assembly</option>
            <option value="Kit">Kit</option>
          </select>
        </div>
      </Card>

      {/* BOMs Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredBOMs}
          renderRow={renderRow}
          onRowClick={handleRowClick}
          loading={loading}
        />
      </Card>

      {/* BOM Detail Modal */}
      {showDetailModal && selectedBOM && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`BOM - ${selectedBOM.bom_code}`}
          size="large"
        >
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Item</label>
                <div className="font-medium">{selectedBOM.item_name}</div>
                <div className="text-sm text-gray-500 font-mono">{selectedBOM.item_code}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Quantity</label>
                <div className="font-medium">
                  {selectedBOM.quantity} {selectedBOM.uom}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <div className="font-medium">{selectedBOM.bom_type}</div>
              </div>
            </div>

            {/* Components Table */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <CubeIcon className="h-5 w-5" />
                Components ({components.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Item
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Wastage
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {components.map((component) => (
                      <tr key={component.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{component.item_name}</div>
                          <div className="text-sm text-gray-500">{component.item_code}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {component.quantity} {component.uom}
                        </td>
                        <td className="px-4 py-3 text-right">₹{component.rate}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          ₹{component.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right">{component.wastage_percent}%</td>
                        <td className="px-4 py-3">{component.source_warehouse}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operations Table */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <WrenchScrewdriverIcon className="h-5 w-5" />
                Operations ({operations.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Operation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Work Center
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Time (mins)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Hour Rate
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {operations.map((operation) => (
                      <tr key={operation.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{operation.operation_name}</div>
                          <div className="text-sm text-gray-500">{operation.description}</div>
                        </td>
                        <td className="px-4 py-3">{operation.work_center}</td>
                        <td className="px-4 py-3 text-right">{operation.time_in_mins}</td>
                        <td className="px-4 py-3 text-right">₹{operation.hour_rate}/hr</td>
                        <td className="px-4 py-3 text-right font-medium">
                          ₹{operation.operating_cost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Raw Material Cost:</span>
                    <span className="font-medium">
                      ₹{selectedBOM.raw_material_cost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operation Cost:</span>
                    <span className="font-medium">
                      ₹{selectedBOM.operation_cost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Cost:</span>
                    <span>₹{selectedBOM.total_cost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              <Button variant="secondary" onClick={() => { notify('info', 'Edit mode coming soon'); }}>Edit BOM</Button>
              <Button onClick={() => { notify('success', 'Production order created'); setShowDetailModal(false); }}>Create Production Order</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BillOfMaterials;
