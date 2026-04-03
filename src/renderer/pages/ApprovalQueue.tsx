import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context';
import { usePermissions } from '../hooks/usePermissions';
import { Card, Badge, Button, Modal, EmptyState } from '../components/common';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface ApprovalRequest {
  id: string;
  document_type: string;
  document_number: string;
  document_id: number;
  requested_by: string;
  requested_at: string;
  amount: number;
  description: string;
  required_roles: string[];
  status: 'pending' | 'approved' | 'rejected';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  module: string;
  link: string;
  actioned_by?: string;
  actioned_at?: string;
  comments?: string;
}

const ApprovalQueue: React.FC = () => {
  const { state } = useApp();
  const { isAdmin, isCEO, userRoles } = usePermissions();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionComments, setActionComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, [state.user?.tenant_id]);

  const loadApprovals = async () => {
    if (!state.user?.tenant_id) return;
    setLoading(true);
    try {
      const response = await window.electronAPI.approvals.getAllApprovals(state.user.tenant_id);
      if (response.success && response.data) {
        setApprovals(response.data);
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const canApprove = (approval: ApprovalRequest): boolean => {
    if (isAdmin || isCEO) return true;
    return approval.required_roles.some(role => userRoles.includes(role));
  };

  const handleAction = async () => {
    if (!selectedApproval || !state.user?.tenant_id) return;
    setProcessing(true);
    try {
      const approverName = `${state.user.first_name} ${state.user.last_name}`.trim() || state.user.username;
      if (actionType === 'approve') {
        await window.electronAPI.approvals.approveRequest(
          state.user.tenant_id,
          selectedApproval.id,
          approverName,
          actionComments
        );
      } else {
        await window.electronAPI.approvals.rejectRequest(
          state.user.tenant_id,
          selectedApproval.id,
          approverName,
          actionComments
        );
      }
      await loadApprovals();
      setShowActionModal(false);
      setActionComments('');
      setSelectedApproval(null);
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setProcessing(false);
    }
  };

  const pendingApprovals = useMemo(
    () => approvals.filter(a => a.status === 'pending'),
    [approvals]
  );

  const historyApprovals = useMemo(
    () => approvals.filter(a => a.status !== 'pending'),
    [approvals]
  );

  const displayList = activeTab === 'pending' ? pendingApprovals : historyApprovals;

  const filteredList = useMemo(() => {
    return displayList.filter(a => {
      const matchesModule = filterModule === 'all' || a.module === filterModule;
      const matchesPriority = filterPriority === 'all' || a.priority === filterPriority;
      return matchesModule && matchesPriority;
    });
  }, [displayList, filterModule, filterPriority]);

  const modules = Array.from(new Set(approvals.map(a => a.module)));

  const stats = useMemo(() => ({
    total: pendingApprovals.length,
    urgent: pendingApprovals.filter(a => a.priority === 'urgent').length,
    high: pendingApprovals.filter(a => a.priority === 'high').length,
    totalValue: pendingApprovals.reduce((s, a) => s + a.amount, 0),
  }), [pendingApprovals]);

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'primary' | 'default' => {
    const map: Record<string, 'error' | 'warning' | 'primary' | 'default'> = {
      urgent: 'error',
      high: 'warning',
      medium: 'primary',
      low: 'default',
    };
    return map[priority] || 'default';
  };

  const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
    const map: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
    };
    return map[status] || 'default';
  };

  const getModuleColor = (module: string) => {
    const map: Record<string, string> = {
      purchase: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      finance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      hrm: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      manufacturing: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    };
    return map[module] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const formatCurrency = (amount: number) =>
    amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—';

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShieldCheckIcon className="h-7 w-7 text-primary-600" />
            Approval Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve pending requests across all modules
          </p>
        </div>
        <Button onClick={loadApprovals} variant="secondary" className="flex items-center gap-2">
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
              <ClockIcon className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-danger-100 dark:bg-danger-900/30 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-danger-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-600">{stats.urgent}</p>
              <p className="text-xs text-gray-500">Urgent</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-600">{stats.high}</p>
              <p className="text-xs text-gray-500">High Priority</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <CurrencyRupeeIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalValue > 100000
                  ? `₹${(stats.totalValue / 100000).toFixed(1)}L`
                  : formatCurrency(stats.totalValue)}
              </p>
              <p className="text-xs text-gray-500">Pending Value</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-surface-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-surface-600 text-primary-700 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Pending ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-surface-600 text-primary-700 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            History ({historyApprovals.length})
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="text-sm border border-gray-200 dark:border-surface-600 rounded-lg px-3 py-1.5 bg-white dark:bg-surface-700 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Modules</option>
            {modules.map(m => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-sm border border-gray-200 dark:border-surface-600 rounded-lg px-3 py-1.5 bg-white dark:bg-surface-700 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Approval List */}
      {filteredList.length === 0 ? (
        <EmptyState
          title={activeTab === 'pending' ? 'No pending approvals' : 'No approval history'}
          description={
            activeTab === 'pending'
              ? 'All caught up! There are no items awaiting your approval.'
              : 'No approval actions have been taken yet.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredList.map((approval) => (
            <Card
              key={approval.id}
              className={`p-4 hover:shadow-md transition-shadow border-l-4 ${
                approval.priority === 'urgent'
                  ? 'border-l-danger-500'
                  : approval.priority === 'high'
                  ? 'border-l-warning-500'
                  : approval.priority === 'medium'
                  ? 'border-l-primary-500'
                  : 'border-l-gray-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getModuleColor(approval.module)}`}>
                      {approval.module.toUpperCase()}
                    </span>
                    <Badge variant={getPriorityColor(approval.priority)}>
                      {approval.priority.toUpperCase()}
                    </Badge>
                    {approval.status !== 'pending' && (
                      <Badge variant={getStatusColor(approval.status)}>
                        {approval.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {approval.document_type}
                    </span>
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 dark:bg-surface-700 px-1.5 py-0.5 rounded">
                      {approval.document_number}
                    </span>
                    {approval.amount > 0 && (
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {formatCurrency(approval.amount)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {approval.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <UserCircleIcon className="h-3.5 w-3.5" />
                      {approval.requested_by}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {timeAgo(approval.requested_at)}
                    </span>
                    {approval.actioned_by && (
                      <span className="flex items-center gap-1">
                        <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
                        {approval.actioned_by}
                      </span>
                    )}
                  </div>

                  {approval.comments && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs">
                      <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 italic">
                        "{approval.comments}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                {approval.status === 'pending' && canApprove(approval) && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedApproval(approval);
                        setActionType('approve');
                        setActionComments('');
                        setShowActionModal(true);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedApproval(approval);
                        setActionType('reject');
                        setActionComments('');
                        setShowActionModal(true);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Request`}
      >
        {selectedApproval && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-surface-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Document</span>
                <span className="text-sm font-medium">{selectedApproval.document_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Number</span>
                <span className="text-sm font-mono">{selectedApproval.document_number}</span>
              </div>
              {selectedApproval.amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-bold">{formatCurrency(selectedApproval.amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Requested By</span>
                <span className="text-sm">{selectedApproval.requested_by}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedApproval.description}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comments {actionType === 'reject' && <span className="text-danger-500">*</span>}
              </label>
              <textarea
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                rows={3}
                placeholder={actionType === 'approve' ? 'Optional comments...' : 'Reason for rejection (required)...'}
                className="w-full border border-gray-200 dark:border-surface-600 rounded-lg px-3 py-2 text-sm
                  bg-white dark:bg-surface-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant={actionType === 'approve' ? 'primary' : 'danger'}
                onClick={handleAction}
                disabled={processing || (actionType === 'reject' && !actionComments.trim())}
                className="flex-1"
              >
                {processing ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
              <Button variant="secondary" onClick={() => setShowActionModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalQueue;
export { ApprovalQueue };
