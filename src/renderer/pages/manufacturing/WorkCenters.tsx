import React, { useState, useEffect } from 'react';
import {
  Factory,
  Search,
  Download,
  Plus,
  Edit2,
  Power,
  PowerOff,
  AlertCircle,
  Users,
  TrendingUp,
  Settings,
  RefreshCw,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../../context';

interface WorkCenter {
  id: string;
  code: string;
  name: string;
  type: 'Machine' | 'Manual' | 'Assembly' | 'Inspection';
  location: string;
  capacity: number;
  capacityUnit: string;
  currentLoad: number;
  availability: number;
  status: 'Active' | 'Maintenance' | 'Breakdown' | 'Inactive';
  operators: number;
  efficiency: number;
  utilizationRate: number;
  avgCycleTime: number;
  downtime: number;
  shiftsPerDay: number;
  workingHours: number;
  lastMaintenance: string;
  nextMaintenance: string;
  costPerHour: number;
}

const WorkCenters: React.FC = () => {
  const { state, notify } = useApp();
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadWorkCenters();
  }, [state.user?.tenant_id]);

  const loadWorkCenters = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.manufacturing.getWorkCenters(state.user.tenant_id);
      
      if (response.success && response.data) {
        setWorkCenters(response.data.map((wc: any) => ({
          id: String(wc.id),
          code: wc.work_center_code || '',
          name: wc.work_center_name || '',
          type: wc.work_center_type || 'Machine',
          location: wc.location || '',
          capacity: Number(wc.capacity) || 0,
          capacityUnit: wc.capacity_unit || 'Hours/Day',
          currentLoad: Number(wc.current_load) || 0,
          availability: Number(wc.availability) || 0,
          status: wc.status || 'Active',
          operators: Number(wc.operators_required) || 0,
          efficiency: Number(wc.efficiency_percent) || 0,
          utilizationRate: Number(wc.utilization_rate) || 0,
          avgCycleTime: Number(wc.avg_cycle_time) || 0,
          downtime: Number(wc.downtime_hours) || 0,
          shiftsPerDay: Number(wc.shifts_per_day) || 0,
          workingHours: Number(wc.working_hours_per_day) || 0,
          lastMaintenance: wc.last_maintenance_date || '',
          nextMaintenance: wc.next_maintenance_date || '',
          costPerHour: Number(wc.cost_per_hour) || 0,
        })));
      } else {
        notify?.('error', response.error || 'Failed to load work centers');
      }
    } catch (error) {
      console.error('Error loading work centers:', error);
      notify?.('error', 'Failed to load work centers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkCenters();
  }, [state.user?.tenant_id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
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

  const getStatusBadge = (status: string) => {
    const styles = {
      Active: 'bg-green-100 text-green-800',
      Maintenance: 'bg-yellow-100 text-yellow-800',
      Breakdown: 'bg-red-100 text-red-800',
      Inactive: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <Power className="h-4 w-4 text-green-600" />;
      case 'Maintenance':
        return <Settings className="h-4 w-4 text-yellow-600" />;
      case 'Breakdown':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'Inactive':
        return <PowerOff className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-green-600';
    if (utilization >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Filter work centers
  const filteredWorkCenters = workCenters.filter((wc) => {
    const matchesSearch =
      wc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wc.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wc.status === statusFilter;
    const matchesType = typeFilter === 'all' || wc.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate summary
  const summary = {
    total: workCenters.length,
    active: workCenters.filter((w) => w.status === 'Active').length,
    maintenance: workCenters.filter((w) => w.status === 'Maintenance').length,
    breakdown: workCenters.filter((w) => w.status === 'Breakdown').length,
    avgEfficiency:
      workCenters.reduce((sum, w) => sum + w.efficiency, 0) / workCenters.length,
    avgUtilization:
      workCenters.reduce((sum, w) => sum + w.utilizationRate, 0) / workCenters.length,
    totalOperators: workCenters.reduce((sum, w) => sum + w.operators, 0),
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
          <h1 className="text-2xl font-bold text-gray-900">Work Centers</h1>
          <p className="text-gray-500">Manage production facilities and track performance</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert('Analytics coming soon')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button onClick={() => alert('Export coming soon')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button onClick={() => alert('Add Work Center coming soon')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add Work Center
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <Factory className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-xl font-bold text-blue-900">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <Power className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Active</p>
              <p className="text-xl font-bold text-green-900">{summary.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">Maintenance</p>
              <p className="text-xl font-bold text-yellow-900">{summary.maintenance}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Breakdown</p>
              <p className="text-xl font-bold text-red-900">{summary.breakdown}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Avg Efficiency</p>
              <p className="text-xl font-bold text-purple-900">{summary.avgEfficiency.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-600 font-medium">Avg Utilization</p>
              <p className="text-xl font-bold text-indigo-900">{summary.avgUtilization.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600 font-medium">Operators</p>
              <p className="text-xl font-bold text-orange-900">{summary.totalOperators}</p>
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
                placeholder="Search by code, name, or location..."
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
              <option value="Machine">Machine</option>
              <option value="Manual">Manual</option>
              <option value="Assembly">Assembly</option>
              <option value="Inspection">Inspection</option>
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
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Breakdown">Breakdown</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Centers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWorkCenters.map((wc) => (
          <div key={wc.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Factory className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{wc.name}</h3>
                  <p className="text-sm text-gray-500">{wc.code} • {wc.type}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(wc.status)}`}>
                {getStatusIcon(wc.status)}
                {wc.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{wc.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Capacity</p>
                  <p className="text-lg font-bold text-gray-900">{wc.capacity} hrs</p>
                  <p className="text-xs text-gray-500">{wc.shiftsPerDay} shifts/day</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Current Load</p>
                  <p className="text-lg font-bold text-gray-900">{wc.currentLoad} hrs</p>
                  <p className="text-xs text-gray-500">{((wc.currentLoad / wc.capacity) * 100).toFixed(0)}% loaded</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className={`font-bold ${getEfficiencyColor(wc.efficiency)}`}>{wc.efficiency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${wc.efficiency >= 90 ? 'bg-green-500' : wc.efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${wc.efficiency}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Utilization:</span>
                  <span className={`font-bold ${getUtilizationColor(wc.utilizationRate)}`}>{wc.utilizationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${wc.utilizationRate >= 80 ? 'bg-green-500' : wc.utilizationRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${wc.utilizationRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Operators</p>
                  <p className="text-sm font-semibold text-gray-900">{wc.operators}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Cycle</p>
                  <p className="text-sm font-semibold text-gray-900">{wc.avgCycleTime} min</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Downtime</p>
                  <p className="text-sm font-semibold text-red-600">{wc.downtime} hrs</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Cost/Hour</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(wc.costPerHour)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Next Maintenance</p>
                  <p className="font-semibold text-gray-900">{formatDate(wc.nextMaintenance)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button onClick={() => alert('Edit coming soon')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button onClick={() => alert('Schedule coming soon')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkCenters;
