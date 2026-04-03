import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Home,
  Heart,
  GraduationCap,
  Shield,
  RefreshCw,
  Upload,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface TaxComponent {
  component: string;
  declared: number;
  proofSubmitted: boolean;
  proofAmount: number;
  approved: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Under Review';
  icon: React.ReactNode;
  color: string;
}

interface TaxDeclaration {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  financialYear: string;
  regime: 'Old' | 'New';
  submittedOn: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  totalDeclared: number;
  totalApproved: number;
  totalTaxSavings: number;
  components: TaxComponent[];
  remarks?: string;
}

const TaxDeclarations: React.FC = () => {
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadDeclarations = async () => {
      try {
        const result = await (window as any).electronAPI.hrm.getTaxDeclarations();
        if (result?.success) setDeclarations(result.data);
      } catch (error) {
        console.error('Failed to load tax declarations:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDeclarations();
  }, []);

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
      Draft: 'bg-gray-100 text-gray-800',
      Submitted: 'bg-blue-100 text-blue-800',
      'Under Review': 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Under Review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Submitted':
        return <Upload className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Filter declarations
  const filteredDeclarations = declarations.filter((dec) => {
    const matchesSearch =
      dec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dec.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dec.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary
  const summary = {
    total: declarations.length,
    submitted: declarations.filter((d) => d.status === 'Submitted' || d.status === 'Under Review').length,
    approved: declarations.filter((d) => d.status === 'Approved').length,
    pending: declarations.filter((d) => d.status === 'Draft').length,
    totalSavings: declarations.reduce((sum, d) => sum + d.totalTaxSavings, 0),
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
          <h1 className="text-2xl font-bold text-gray-900">Tax Declarations</h1>
          <p className="text-gray-500">Manage employee tax declarations and proofs (80C, HRA, etc.)</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            New Declaration
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-xl font-bold text-blue-900">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">Submitted</p>
              <p className="text-xl font-bold text-yellow-900">{summary.submitted}</p>
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
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Pending</p>
              <p className="text-xl font-bold text-red-900">{summary.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Savings</p>
              <p className="text-xl font-bold text-purple-900">{formatCurrency(summary.totalSavings)}</p>
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
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Declarations Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredDeclarations.map((dec) => (
          <div key={dec.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{dec.employeeName}</h3>
                  <p className="text-sm text-gray-500">
                    {dec.employeeId} • {dec.department}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${getStatusBadge(dec.status)}`}
                >
                  {getStatusIcon(dec.status)}
                  {dec.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">FY: {dec.financialYear}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Tax Regime</p>
                <p className="text-lg font-bold text-gray-900">{dec.regime}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600">Total Declared</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(dec.totalDeclared)}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600">Total Approved</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(dec.totalApproved)}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-purple-600">Tax Savings</p>
                <p className="text-lg font-bold text-purple-900">{formatCurrency(dec.totalTaxSavings)}</p>
              </div>
            </div>

            {dec.components.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Tax Components:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dec.components.map((comp, idx) => {
                    const colors = getColorClasses(comp.color);
                    return (
                      <div key={idx} className={`${colors.bg} p-3 rounded-lg border ${colors.border}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={colors.text}>{comp.icon}</div>
                            <p className="text-sm font-medium text-gray-900">{comp.component}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(comp.status)}`}>
                            {comp.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Declared</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(comp.declared)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Approved</p>
                            <p className="font-semibold text-green-700">{formatCurrency(comp.approved)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          {comp.proofSubmitted ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Proof submitted: {formatCurrency(comp.proofAmount)}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-3 w-3" />
                              Proof pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dec.remarks && (
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <p className="text-xs text-gray-500 mb-1">Remarks:</p>
                <p className="text-sm text-gray-900">{dec.remarks}</p>
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <FileText className="h-4 w-4" />
                View Details
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Upload className="h-4 w-4" />
                Upload Proofs
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaxDeclarations;
