import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToExcel } from '../../utils/exportHelpers';
import { useApp } from '../../context';

interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  available: number;
  icon: React.ReactNode;
  color: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  remarks?: string;
}

const LeaveManagement: React.FC = () => {
  const { state, notify } = useApp();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-31');

  const loadLeaveData = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await window.electronAPI.hrm.getLeaves(state.user.tenant_id, {
        fromDate: dateFrom,
        toDate: dateTo,
      });

      if (response.success && response.data) {
        const transformedRequests: LeaveRequest[] = response.data.map((leave: any) => ({
          id: leave.id,
          employeeId: leave.employee_id,
          employeeName: leave.employee_name,
          department: leave.department || 'N/A',
          leaveType: leave.leave_type,
          fromDate: leave.from_date,
          toDate: leave.to_date,
          days: leave.leave_days,
          reason: leave.reason,
          status: leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
          appliedOn: leave.applied_on,
          approvedBy: leave.approved_by_name,
          approvedOn: leave.approved_on,
          remarks: leave.remarks,
        }));
        setLeaveRequests(transformedRequests);
      } else {
        notify('error', response.error || 'Failed to load leave requests');
      }
    } catch (err) {
      console.error('Error loading leaves:', err);
      setError('Failed to load leave data');
      notify('error', 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveData();
  }, [state.user?.tenant_id, dateFrom, dateTo]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        textBold: 'text-blue-900',
        progress: 'bg-blue-500',
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-600',
        textBold: 'text-red-900',
        progress: 'bg-red-500',
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600',
        textBold: 'text-green-900',
        progress: 'bg-green-500',
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
        textBold: 'text-purple-900',
        progress: 'bg-purple-500',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Filter leave requests
  const filteredRequests = leaveRequests.filter((req) => {
    const matchesSearch =
      req.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesType = typeFilter === 'all' || req.leaveType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate summary
  const summary = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === 'Pending').length,
    approved: leaveRequests.filter((r) => r.status === 'Approved').length,
    rejected: leaveRequests.filter((r) => r.status === 'Rejected').length,
  };

  // Handler functions
  const handleApproveLeave = (requestId: string) => {
    if (confirm('Approve this leave request?')) {
      setLeaveRequests(
        leaveRequests.map((req) =>
          req.id === requestId
            ? { ...req, status: 'Approved', approvedBy: 'Manager', approvedOn: new Date().toISOString().split('T')[0] }
            : req
        )
      );
      alert('Leave request approved');
    }
  };

  const handleRejectLeave = (requestId: string) => {
    const remarks = prompt('Enter rejection remarks:');
    if (remarks) {
      setLeaveRequests(
        leaveRequests.map((req) =>
          req.id === requestId ? { ...req, status: 'Rejected', remarks, approvedBy: 'Manager', approvedOn: new Date().toISOString().split('T')[0] } : req
        )
      );
      alert('Leave request rejected');
    }
  };

  const handleExport = () => {
    const exportData = filteredRequests.map((req) => ({
      Employee_ID: req.employeeId,
      Employee_Name: req.employeeName,
      Department: req.department,
      Leave_Type: req.leaveType,
      From_Date: req.fromDate,
      To_Date: req.toDate,
      Days: req.days,
      Status: req.status,
      Applied_On: req.appliedOn,
    }));
    exportToExcel(exportData, 'Leave_Requests');
  };

  const handleApplyLeave = () => {
    alert('Leave application form will open here');
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
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500">Manage employee leave requests and balances</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </button>
          <button 
            onClick={handleApplyLeave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Apply Leave
          </button>
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {leaveBalance.map((balance) => {
          const colors = getColorClasses(balance.color);
          const usagePercent = (balance.used / balance.total) * 100;
          return (
            <div
              key={balance.type}
              className={`${colors.bg} p-4 rounded-xl border ${colors.border}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={colors.text}>{balance.icon}</div>
                <div>
                  <p className={`text-sm ${colors.text} font-medium`}>{balance.type}</p>
                  <p className={`text-xs ${colors.text}`}>Total: {balance.total} days</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500">Used</p>
                  <p className={`text-lg font-bold ${colors.textBold}`}>{balance.used}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Available</p>
                  <p className={`text-lg font-bold ${colors.textBold}`}>{balance.available}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${colors.progress}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">{usagePercent.toFixed(0)}% used</p>
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Requests</p>
              <p className="text-xl font-bold text-blue-900">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-xl font-bold text-yellow-900">{summary.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Approved</p>
              <p className="text-xl font-bold text-green-900">{summary.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Rejected</p>
              <p className="text-xl font-bold text-red-900">{summary.rejected}</p>
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
                placeholder="Search employee, ID, department..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Leave Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
              <option value="Work From Home">Work From Home</option>
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
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Employee</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Leave Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">From - To</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Days</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Reason</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{request.employeeName}</div>
                    <div className="text-xs text-gray-500">
                      {request.employeeId} • {request.department}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{request.leaveType}</div>
                    <div className="text-xs text-gray-500">Applied: {formatDate(request.appliedOn)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">{formatDate(request.fromDate)}</div>
                    <div className="text-xs text-gray-500">to {formatDate(request.toDate)}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                      {request.days}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={request.reason}>
                      {request.reason}
                    </div>
                    {request.remarks && (
                      <div className="text-xs text-gray-500 max-w-xs truncate" title={request.remarks}>
                        {request.remarks}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(request.status)}`}
                    >
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                    {request.approvedBy && (
                      <div className="text-xs text-gray-500 mt-1">by {request.approvedBy}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => alert(`View details for ${request.employeeName}'s leave request`)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors" 
                        title="View"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      {request.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveLeave(request.id)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors" 
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleRejectLeave(request.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors" 
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
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
  );
};

export default LeaveManagement;
