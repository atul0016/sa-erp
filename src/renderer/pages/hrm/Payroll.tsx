import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, CalendarIcon, BanknotesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card, Badge, Modal, Table } from '@components/common';
import { useApp } from '../../context';

declare global {
  interface Window {
    api: {
      hrm: {
        getPayrolls: (tenantId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

interface Payroll {
  id: number;
  payroll_period: string;
  employee_code: string;
  employee_name: string;
  department: string;
  designation: string;
  basic_salary: number;
  hra: number;
  other_allowances: number;
  gross_salary: number;
  pf_employee: number;
  pf_employer: number;
  esic_employee: number;
  esic_employer: number;
  professional_tax: number;
  tds: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  payment_date: string | null;
  payment_mode: string | null;
  status: 'Draft' | 'Submitted' | 'Paid';
}

const Payroll: React.FC = () => {
  const { state } = useApp();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadPayrolls();
  }, [state.user?.tenant_id]);

  const loadPayrolls = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.hrm.getPayrolls(state.user.tenant_id);
      
      if (response.success && response.data) {
        setPayrolls(response.data.map((p: any) => ({
          id: p.id,
          payroll_period: p.payroll_period,
          employee_code: p.employee_code,
          employee_name: p.employee_name,
          department: p.department || '',
          designation: p.designation || '',
          basic_salary: Number(p.basic_salary) || 0,
          hra: Number(p.hra) || 0,
          other_allowances: Number(p.other_allowances) || 0,
          gross_salary: Number(p.gross_salary) || 0,
          pf_employee: Number(p.pf_employee) || 0,
          pf_employer: Number(p.pf_employer) || 0,
          esic_employee: Number(p.esic_employee) || 0,
          esic_employer: Number(p.esic_employer) || 0,
          professional_tax: Number(p.professional_tax) || 0,
          tds: Number(p.tds) || 0,
          other_deductions: Number(p.other_deductions) || 0,
          total_deductions: Number(p.total_deductions) || 0,
          net_salary: Number(p.net_salary) || 0,
          payment_date: p.payment_date,
          payment_mode: p.payment_mode,
          status: p.status,
        })));
      }
    } catch (error) {
      console.error('Error loading payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayrolls = payrolls.filter((payroll) => {
    const matchesSearch =
      payroll.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = filterPeriod === 'all' || payroll.payroll_period === filterPeriod;
    return matchesSearch && matchesPeriod;
  });

  const periods = Array.from(new Set(payrolls.map((p) => p.payroll_period))).sort().reverse();

  const currentPeriodPayrolls = payrolls.filter((p) => p.payroll_period === periods[0]);
  const stats = {
    totalEmployees: currentPeriodPayrolls.length,
    totalGross: currentPeriodPayrolls.reduce((sum, p) => sum + p.gross_salary, 0),
    totalDeductions: currentPeriodPayrolls.reduce((sum, p) => sum + p.total_deductions, 0),
    totalNet: currentPeriodPayrolls.reduce((sum, p) => sum + p.net_salary, 0),
    paid: currentPeriodPayrolls.filter((p) => p.status === 'Paid').length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
      Draft: 'default',
      Submitted: 'primary',
      Paid: 'success',
    };
    return colors[status] || 'default';
  };

  const columns = [
    { key: 'employee', label: 'Employee' },
    { key: 'department', label: 'Department' },
    { key: 'period', label: 'Period' },
    { key: 'gross_salary', label: 'Gross Salary' },
    { key: 'deductions', label: 'Deductions' },
    { key: 'net_salary', label: 'Net Salary' },
    { key: 'payment', label: 'Payment' },
    { key: 'status', label: 'Status' },
  ];

  const renderRow = (payroll: Payroll) => ({
    employee: (
      <div>
        <div className="font-medium text-gray-900">{payroll.employee_name}</div>
        <div className="text-sm text-gray-500 font-mono">{payroll.employee_code}</div>
      </div>
    ),
    department: (
      <div>
        <div className="text-sm">{payroll.department}</div>
        <div className="text-xs text-gray-500">{payroll.designation}</div>
      </div>
    ),
    period: (
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-gray-400" />
        <span className="font-mono text-sm">{payroll.payroll_period}</span>
      </div>
    ),
    gross_salary: (
      <span className="font-medium">₹{payroll.gross_salary.toLocaleString('en-IN')}</span>
    ),
    deductions: (
      <div className="text-sm">
        <div className="text-red-600 font-medium">
          -₹{payroll.total_deductions.toLocaleString('en-IN')}
        </div>
        <div className="text-xs text-gray-500">
          PF: ₹{payroll.pf_employee.toLocaleString('en-IN')} + TDS: ₹
          {payroll.tds.toLocaleString('en-IN')}
        </div>
      </div>
    ),
    net_salary: (
      <span className="font-bold text-green-600">
        ₹{payroll.net_salary.toLocaleString('en-IN')}
      </span>
    ),
    payment: payroll.payment_date ? (
      <div className="text-sm">
        <div className="text-gray-900">
          {new Date(payroll.payment_date).toLocaleDateString('en-IN')}
        </div>
        <div className="text-xs text-gray-500">{payroll.payment_mode}</div>
      </div>
    ) : (
      <span className="text-gray-400">Not Paid</span>
    ),
    status: <Badge variant={getStatusColor(payroll.status)}>{payroll.status}</Badge>,
  });

  const handleRowClick = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600">
            Manage employee payroll for {periods[0] || 'current period'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Generate Payslips
          </Button>
          <Button>
            <BanknotesIcon className="h-5 w-5 mr-2" />
            Process Payment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Total Employees</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Gross Salary</div>
          <div className="text-2xl font-bold text-blue-600">
            ₹{(stats.totalGross / 100000).toFixed(2)}L
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Deductions</div>
          <div className="text-2xl font-bold text-red-600">
            ₹{(stats.totalDeductions / 100000).toFixed(2)}L
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Net Payable</div>
          <div className="text-2xl font-bold text-green-600">
            ₹{(stats.totalNet / 100000).toFixed(2)}L
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Paid</div>
          <div className="text-2xl font-bold text-purple-600">
            {stats.paid}/{stats.totalEmployees}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Periods</option>
            {periods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Payroll Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredPayrolls}
          renderRow={renderRow}
          onRowClick={handleRowClick}
          loading={loading}
        />
      </Card>

      {/* Payroll Detail Modal */}
      {showDetailModal && selectedPayroll && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Payroll - ${selectedPayroll.employee_name} (${selectedPayroll.payroll_period})`}
          size="large"
        >
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Employee</label>
                <div className="font-medium">{selectedPayroll.employee_name}</div>
                <div className="text-sm text-gray-500">{selectedPayroll.employee_code}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Department</label>
                <div className="font-medium">{selectedPayroll.department}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Designation</label>
                <div className="font-medium">{selectedPayroll.designation}</div>
              </div>
            </div>

            {/* Earnings */}
            <div>
              <h3 className="font-medium mb-3 text-green-700">Earnings</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-sm">Basic Salary</td>
                      <td className="px-4 py-2 text-sm text-right font-medium">
                        ₹{selectedPayroll.basic_salary.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm">HRA</td>
                      <td className="px-4 py-2 text-sm text-right">
                        ₹{selectedPayroll.hra.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-sm">Other Allowances</td>
                      <td className="px-4 py-2 text-sm text-right">
                        ₹{selectedPayroll.other_allowances.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="px-4 py-3 text-sm">Gross Salary</td>
                      <td className="px-4 py-3 text-sm text-right text-green-700">
                        ₹{selectedPayroll.gross_salary.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="font-medium mb-3 text-red-700">Deductions</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-sm">PF (Employee Contribution)</td>
                      <td className="px-4 py-2 text-sm text-right">
                        ₹{selectedPayroll.pf_employee.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm">ESIC (Employee Contribution)</td>
                      <td className="px-4 py-2 text-sm text-right">
                        ₹{selectedPayroll.esic_employee.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-sm">Professional Tax</td>
                      <td className="px-4 py-2 text-sm text-right">
                        ₹{selectedPayroll.professional_tax.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm">TDS</td>
                      <td className="px-4 py-2 text-sm text-right">
                        ₹{selectedPayroll.tds.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-sm">Other Deductions</td>
                      <td className="px-4 py-2 text-sm text-right">
                        ₹{selectedPayroll.other_deductions.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="px-4 py-3 text-sm">Total Deductions</td>
                      <td className="px-4 py-3 text-sm text-right text-red-700">
                        ₹{selectedPayroll.total_deductions.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Employer Contribution */}
            <div>
              <h3 className="font-medium mb-3 text-blue-700">Employer Contribution</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-sm">PF (Employer Contribution)</td>
                      <td className="px-4 py-2 text-sm text-right">
                        ₹{selectedPayroll.pf_employer.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm">ESIC (Employer Contribution)</td>
                      <td className="px-4 py-2 text-sm text-right">
                        ₹{selectedPayroll.esic_employer.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Salary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Net Salary Payable:</span>
                <span className="text-green-600">
                  ₹{selectedPayroll.net_salary.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Info */}
            {selectedPayroll.payment_date && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <BanknotesIcon className="h-5 w-5" />
                  <span className="font-medium">
                    Paid on {new Date(selectedPayroll.payment_date).toLocaleDateString('en-IN')}{' '}
                    via {selectedPayroll.payment_mode}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Download Payslip
                </Button>
                {selectedPayroll.status !== 'Paid' && (
                  <Button>
                    <BanknotesIcon className="h-5 w-5 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Payroll;
