import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Search,
  Download,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Camera,
  RefreshCw,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface InspectionParameter {
  parameter: string;
  specification: string;
  measuredValue: string;
  result: 'Pass' | 'Fail';
  remarks?: string;
}

interface Defect {
  type: string;
  quantity: number;
  severity: 'Critical' | 'Major' | 'Minor';
  description: string;
}

interface QCInspection {
  id: string;
  inspectionNo: string;
  inspectionDate: string;
  inspectionType: 'Incoming' | 'In-Process' | 'Final' | 'Patrol';
  itemCode: string;
  itemName: string;
  batchNo: string;
  lotSize: number;
  sampleSize: number;
  acceptedQty: number;
  rejectedQty: number;
  reworkQty: number;
  status: 'Pending' | 'In Progress' | 'Pass' | 'Fail' | 'Conditional Pass';
  inspector: string;
  duration: number;
  grnNo?: string;
  poNo?: string;
  vendorName?: string;
  workOrder?: string;
  parameters: InspectionParameter[];
  defects: Defect[];
  notes?: string;
}

const QCInspection: React.FC = () => {
  const [inspections, setInspections] = useState<QCInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInspection, setSelectedInspection] = useState<QCInspection | null>(null);

  useEffect(() => {
    const loadInspections = async () => {
      try {
        const result = await (window as any).electronAPI.manufacturing.getQCInspections();
        if (result?.success) setInspections(result.data);
      } catch (error) {
        console.error('Failed to load QC inspections:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInspections();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Pending': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Pass': 'bg-green-100 text-green-800',
      'Fail': 'bg-red-100 text-red-800',
      'Conditional Pass': 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Conditional Pass':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles = {
      Critical: 'bg-red-100 text-red-800',
      Major: 'bg-orange-100 text-orange-800',
      Minor: 'bg-yellow-100 text-yellow-800',
    };
    return styles[severity as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // Filter inspections
  const filteredInspections = inspections.filter((insp) => {
    const matchesSearch =
      insp.inspectionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.batchNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || insp.status === statusFilter;
    const matchesType = typeFilter === 'all' || insp.inspectionType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate summary
  const summary = {
    total: inspections.length,
    pass: inspections.filter((i) => i.status === 'Pass').length,
    fail: inspections.filter((i) => i.status === 'Fail').length,
    conditional: inspections.filter((i) => i.status === 'Conditional Pass').length,
    inProgress: inspections.filter((i) => i.status === 'In Progress').length,
    passRate: (inspections.filter((i) => i.status === 'Pass').length / inspections.length) * 100,
    totalDefects: inspections.reduce((sum, i) => sum + i.defects.length, 0),
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Quality Control Inspection</h1>
          <p className="text-gray-500">Track quality inspections and maintain standards</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Camera className="h-4 w-4" />
            Capture
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            New Inspection
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-xl font-bold text-blue-900">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Pass</p>
              <p className="text-xl font-bold text-green-900">{summary.pass}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Fail</p>
              <p className="text-xl font-bold text-red-900">{summary.fail}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">Conditional</p>
              <p className="text-xl font-bold text-yellow-900">{summary.conditional}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">In Progress</p>
              <p className="text-xl font-bold text-purple-900">{summary.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-600 font-medium">Pass Rate</p>
              <p className="text-xl font-bold text-indigo-900">{summary.passRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600 font-medium">Defects</p>
              <p className="text-xl font-bold text-orange-900">{summary.totalDefects}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Inspection no, item, batch..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="Incoming">Incoming</option>
              <option value="In-Process">In-Process</option>
              <option value="Final">Final</option>
              <option value="Patrol">Patrol</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Conditional Pass">Conditional Pass</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredInspections.map((insp) => (
          <div key={insp.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ClipboardCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{insp.inspectionNo}</h3>
                  <p className="text-sm text-gray-500">
                    {insp.inspectionType} • {formatDate(insp.inspectionDate)}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${getStatusBadge(insp.status)}`}>
                {getStatusIcon(insp.status)}
                {insp.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Item</p>
                <p className="font-medium text-gray-900">{insp.itemName}</p>
                <p className="text-xs text-gray-500">{insp.itemCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Batch/Lot</p>
                <p className="font-medium text-gray-900">{insp.batchNo}</p>
                <p className="text-xs text-gray-500">Lot: {insp.lotSize}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Inspector</p>
                <p className="font-medium text-gray-900">{insp.inspector}</p>
                <p className="text-xs text-gray-500">{insp.duration > 0 ? `${insp.duration} mins` : 'In progress'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reference</p>
                <p className="font-medium text-gray-900">{insp.grnNo || insp.workOrder || '-'}</p>
                <p className="text-xs text-gray-500">{insp.vendorName || 'Internal'}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Sample Size</p>
                <p className="text-lg font-bold text-blue-900">{insp.sampleSize}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Accepted</p>
                <p className="text-lg font-bold text-green-900">{insp.acceptedQty}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-600 font-medium">Rejected</p>
                <p className="text-lg font-bold text-red-900">{insp.rejectedQty}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-600 font-medium">Rework</p>
                <p className="text-lg font-bold text-yellow-900">{insp.reworkQty}</p>
              </div>
            </div>

            {insp.defects.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Defects Found:</p>
                <div className="space-y-2">
                  {insp.defects.map((defect, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-red-50 p-2 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{defect.type}</p>
                        <p className="text-xs text-gray-600">{defect.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">{defect.quantity} units</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadge(defect.severity)}`}>
                          {defect.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insp.notes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Notes:</p>
                <p className="text-sm text-gray-900">{insp.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedInspection(insp)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <FileText className="h-4 w-4" />
                View Details
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Download className="h-4 w-4" />
                Download Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QCInspection;
