import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, UserIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card, Badge, Modal, Table } from '@components/common';
import { useApp } from '../../context';

interface Employee {
  id: number;
  employee_code: string;
  employee_name: string;
  designation: string;
  department: string;
  date_of_joining: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  pan: string;
  uan: string;
  esic_no: string;
  bank_account: string;
  bank_ifsc: string;
  basic_salary: number;
  hra: number;
  other_allowances: number;
  gross_salary: number;
  status: 'Active' | 'Inactive' | 'Resigned';
  reporting_manager: string;
}

const Employees: React.FC = () => {
  const { state } = useApp();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [state.user?.tenant_id]);

  const loadEmployees = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.hrm.getEmployees(state.user.tenant_id);
      
      if (response.success && response.data) {
        setEmployees(response.data.map((e: any) => ({
          id: e.id,
          employee_code: e.employee_code,
          employee_name: e.employee_name,
          designation: e.designation || '',
          department: e.department || '',
          date_of_joining: e.date_of_joining,
          date_of_birth: e.date_of_birth,
          gender: e.gender,
          phone: e.phone || '',
          email: e.email || '',
          pan: e.pan || '',
          uan: e.uan || '',
          esic_no: e.esic_no || '',
          bank_account: e.bank_account || '',
          bank_ifsc: e.bank_ifsc || '',
          basic_salary: Number(e.basic_salary) || 0,
          hra: Number(e.hra) || 0,
          other_allowances: Number(e.other_allowances) || 0,
          gross_salary: Number(e.gross_salary) || 0,
          status: e.is_active === false ? 'Inactive' : 'Active',
          reporting_manager: e.reporting_manager || '',
        })));
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      filterDepartment === 'all' || employee.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const stats = {
    totalEmployees: employees.length,
    active: employees.filter((e) => e.status === 'Active').length,
    resigned: employees.filter((e) => e.status === 'Resigned').length,
    totalSalary: employees
      .filter((e) => e.status === 'Active')
      .reduce((sum, e) => sum + e.gross_salary, 0),
  };

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const columns = [
    { key: 'employee_code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' },
    { key: 'contact', label: 'Contact' },
    { key: 'joining_date', label: 'Date of Joining' },
    { key: 'salary', label: 'Gross Salary' },
    { key: 'status', label: 'Status' },
  ];

  const renderRow = (employee: Employee) => ({
    employee_code: <span className="font-mono text-sm">{employee.employee_code}</span>,
    name: (
      <div>
        <div className="font-medium text-gray-900">{employee.employee_name}</div>
        <div className="text-sm text-gray-500">{employee.reporting_manager}</div>
      </div>
    ),
    designation: employee.designation,
    department: (
      <Badge variant="primary">
        {employee.department}
      </Badge>
    ),
    contact: (
      <div className="text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <PhoneIcon className="h-4 w-4" />
          {employee.phone}
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <EnvelopeIcon className="h-4 w-4" />
          {employee.email}
        </div>
      </div>
    ),
    joining_date: new Date(employee.date_of_joining).toLocaleDateString('en-IN'),
    salary: (
      <span className="font-medium">₹{employee.gross_salary.toLocaleString('en-IN')}</span>
    ),
    status: (
      <Badge
        variant={
          employee.status === 'Active'
            ? 'success'
            : employee.status === 'Resigned'
            ? 'error'
            : 'default'
        }
      >
        {employee.status}
      </Badge>
    ),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage employee master data</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-gray-600 truncate">Total Employees</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 truncate">Active</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 truncate">Resigned</div>
          <div className="text-2xl font-bold text-red-600">{stats.resigned}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 truncate">Total Monthly Salary</div>
          <div className="text-2xl font-bold text-purple-600">
            ₹{stats.totalSalary.toLocaleString('en-IN')}
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
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Employees Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredEmployees}
          renderRow={renderRow}
          onRowClick={(employee) => setSelectedEmployee(employee)}
          loading={loading}
        />
      </Card>

      {/* Add Employee Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Employee"
          size="large"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Employee Code" required />
              <Input label="Employee Name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Designation" required />
              <select className="px-4 py-2 border rounded-lg">
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Date of Joining" type="date" required />
              <Input label="Date of Birth" type="date" required />
              <select className="px-4 py-2 border rounded-lg">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" type="tel" required />
              <Input label="Email" type="email" required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="PAN" />
              <Input label="UAN" />
              <Input label="ESIC No" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bank Account" />
              <Input label="Bank IFSC" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Basic Salary" type="number" required />
              <Input label="HRA" type="number" />
              <Input label="Other Allowances" type="number" />
              <Input label="Gross Salary" type="number" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reporting Manager
              </label>
              <select className="w-full px-4 py-2 border rounded-lg">
                <option value="">Select Manager</option>
                <option value="Admin User">Admin User</option>
                <option value="Rajesh Kumar">Rajesh Kumar</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button>Save Employee</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Employees;
