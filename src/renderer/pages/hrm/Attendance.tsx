import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  UserCheck,
  UserX,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';
import { useApp } from '../../context';

interface Employee {
  id: string;
  empCode: string;
  name: string;
  department: string;
  designation: string;
  shift: string;
  photo?: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Holiday' | 'Week Off';
  leaveType?: 'CL' | 'EL' | 'SL' | 'LWP' | 'CO';
  inTime?: string;
  outTime?: string;
  totalHours?: number;
  overtime?: number;
  lateBy?: number;
  earlyBy?: number;
  shift: string;
  remarks?: string;
}

interface DailySummary {
  date: string;
  present: number;
  absent: number;
  halfDay: number;
  onLeave: number;
  holiday: number;
  weekOff: number;
  lateComers: number;
  earlyLeavers: number;
}

const Attendance: React.FC = () => {
  const { state, notify } = useApp();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEmployees();
  }, [state.user?.tenant_id]);

  useEffect(() => {
    if (state.user?.tenant_id) {
      loadAttendance();
    }
  }, [currentDate, state.user?.tenant_id]);

  const loadEmployees = async () => {
    if (!state.user?.tenant_id) return;
    
    try {
      const response = await window.electronAPI.hrm.getEmployees(state.user.tenant_id);
      
      if (response.success && response.data) {
        setEmployees(response.data.map((emp: any) => ({
          id: String(emp.id),
          empCode: emp.employee_code || '',
          name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department || '',
          designation: emp.designation || '',
          shift: emp.shift || 'General',
          photo: emp.photo_url,
        })));
      } else {
        notify?.('error', response.error || 'Failed to load employees');
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadAttendance = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const month = currentDate.toISOString().substring(0, 7); // YYYY-MM format
      
      // Load attendance for all employees for the month
      const attendancePromises = employees.map(emp => 
        window.electronAPI.hrm.getAttendanceReport(state.user.tenant_id!, emp.id, month)
      );
      
      const responses = await Promise.all(attendancePromises);
      
      const allAttendance: AttendanceRecord[] = [];
      responses.forEach((response, index) => {
        if (response.success && response.data) {
          const empAttendance = response.data
            .filter((att: any) => att.date === currentDate.toISOString().split('T')[0])
            .map((att: any) => ({
              id: String(att.id),
              employeeId: employees[index].id,
              date: att.date,
              status: att.status,
              leaveType: att.leave_type,
              inTime: att.in_time,
              outTime: att.out_time,
              totalHours: Number(att.total_hours) || 0,
              overtime: Number(att.overtime_hours) || 0,
              lateBy: Number(att.late_minutes) || 0,
              earlyBy: Number(att.early_leave_minutes) || 0,
              shift: att.shift || 'General',
              remarks: att.remarks,
            }));
          allAttendance.push(...empAttendance);
        }
      });
      
      setAttendance(allAttendance);
    } catch (error) {
      console.error('Error loading attendance:', error);
      notify?.('error', 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const mockEmployees: Employee[] = [
      { id: 'E001', empCode: 'EMP-001', name: 'Rajesh Kumar', department: 'Production', designation: 'Supervisor', shift: 'Day Shift' },
      { id: 'E002', empCode: 'EMP-002', name: 'Priya Sharma', department: 'Accounts', designation: 'Accountant', shift: 'General' },
      { id: 'E003', empCode: 'EMP-003', name: 'Amit Patel', department: 'Production', designation: 'Operator', shift: 'Day Shift' },
      { id: 'E004', empCode: 'EMP-004', name: 'Sunita Verma', department: 'HR', designation: 'HR Executive', shift: 'General' },
      { id: 'E005', empCode: 'EMP-005', name: 'Vikram Singh', department: 'Sales', designation: 'Sales Executive', shift: 'General' },
      { id: 'E006', empCode: 'EMP-006', name: 'Meera Joshi', department: 'Production', designation: 'Operator', shift: 'Night Shift' },
      { id: 'E007', empCode: 'EMP-007', name: 'Rahul Gupta', department: 'Stores', designation: 'Store Keeper', shift: 'Day Shift' },
      { id: 'E008', empCode: 'EMP-008', name: 'Anita Das', department: 'Quality', designation: 'QC Inspector', shift: 'Day Shift' },
    ];

    const mockAttendance: AttendanceRecord[] = mockEmployees.map((emp) => ({
      id: `ATT-${emp.id}-${currentDate.toISOString().split('T')[0]}`,
      employeeId: emp.id,
      date: currentDate.toISOString().split('T')[0],
      status: ['Present', 'Present', 'Present', 'Half Day', 'Leave', 'Present', 'Absent', 'Present'][
        mockEmployees.indexOf(emp)
      ] as AttendanceRecord['status'],
      leaveType: emp.id === 'E005' ? 'CL' : undefined,
      inTime: emp.id !== 'E005' && emp.id !== 'E007' ? '09:00' : undefined,
      outTime: emp.id !== 'E005' && emp.id !== 'E007' ? '18:00' : undefined,
      totalHours: emp.id !== 'E005' && emp.id !== 'E007' ? 9 : 0,
      overtime: emp.id === 'E003' ? 2 : 0,
      lateBy: emp.id === 'E006' ? 15 : 0,
      earlyBy: emp.id === 'E004' ? 30 : 0,
      shift: emp.shift,
      remarks: emp.id === 'E004' ? 'Left early - Personal work' : undefined,
    }));

    setTimeout(() => {
      setEmployees(mockEmployees);
      setAttendance(mockAttendance);
      setLoading(false);
    }, 500);
  }, [currentDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    return time;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = searchQuery === '' || 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.empCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === 'all' || emp.department === selectedDepartment;
    const matchesShift = selectedShift === 'all' || emp.shift === selectedShift;
    return matchesSearch && matchesDept && matchesShift;
  });

  // Get attendance for filtered employees
  const filteredAttendance = attendance.filter((att) =>
    filteredEmployees.some((emp) => emp.id === att.employeeId)
  );

  // Calculate daily summary
  const dailySummary: DailySummary = {
    date: currentDate.toISOString().split('T')[0],
    present: filteredAttendance.filter((a) => a.status === 'Present').length,
    absent: filteredAttendance.filter((a) => a.status === 'Absent').length,
    halfDay: filteredAttendance.filter((a) => a.status === 'Half Day').length,
    onLeave: filteredAttendance.filter((a) => a.status === 'Leave').length,
    holiday: filteredAttendance.filter((a) => a.status === 'Holiday').length,
    weekOff: filteredAttendance.filter((a) => a.status === 'Week Off').length,
    lateComers: filteredAttendance.filter((a) => (a.lateBy || 0) > 0).length,
    earlyLeavers: filteredAttendance.filter((a) => (a.earlyBy || 0) > 0).length,
  };

  // Get unique departments and shifts
  const departments = ['all', ...new Set(employees.map((emp) => emp.department))];
  const shifts = ['all', ...new Set(employees.map((emp) => emp.shift))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Half Day':
        return 'bg-amber-100 text-amber-800';
      case 'Leave':
        return 'bg-blue-100 text-blue-800';
      case 'Holiday':
        return 'bg-purple-100 text-purple-800';
      case 'Week Off':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case 'Day Shift':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'Night Shift':
        return <Moon className="h-4 w-4 text-indigo-500" />;
      default:
        return <Coffee className="h-4 w-4 text-gray-500" />;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500">Track employee attendance, overtime, and leave</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Import Biometric
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <ClipboardList className="h-4 w-4" />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{formatDate(currentDate)}</div>
              <div className="text-sm text-gray-500">
                {currentDate.toDateString() === new Date().toDateString() ? 'Today' : ''}
              </div>
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-lg text-sm ${
                  viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-lg text-sm ${
                  viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Monthly View
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-medium">Present</p>
              <p className="text-2xl font-bold text-green-900">{dailySummary.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <UserX className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-xs text-red-600 font-medium">Absent</p>
              <p className="text-2xl font-bold text-red-900">{dailySummary.absent}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-xs text-amber-600 font-medium">Half Day</p>
              <p className="text-2xl font-bold text-amber-900">{dailySummary.halfDay}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600 font-medium">On Leave</p>
              <p className="text-2xl font-bold text-blue-900">{dailySummary.onLeave}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-xs text-purple-600 font-medium">Holiday</p>
              <p className="text-2xl font-bold text-purple-900">{dailySummary.holiday}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Week Off</p>
              <p className="text-2xl font-bold text-gray-900">{dailySummary.weekOff}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-xs text-orange-600 font-medium">Late</p>
              <p className="text-2xl font-bold text-orange-900">{dailySummary.lateComers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="text-xs text-indigo-600 font-medium">Early Out</p>
              <p className="text-2xl font-bold text-indigo-900">{dailySummary.earlyLeavers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Search Employee</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or Employee Code..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Departments</option>
              {departments.filter((d) => d !== 'all').map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Shifts</option>
              {shifts.filter((s) => s !== 'all').map((shift) => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Employee</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Department</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Shift</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">In Time</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Out Time</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Hours</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">OT</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Late/Early</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => {
                const att = attendance.find((a) => a.employeeId === employee.id);
                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {employee.name.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-xs text-gray-500">{employee.empCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">{employee.department}</div>
                      <div className="text-xs text-gray-500">{employee.designation}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getShiftIcon(employee.shift)}
                        <span className="text-sm text-gray-600">{employee.shift}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(att?.status || 'Absent')}`}>
                        {att?.status || 'Absent'}
                        {att?.leaveType && ` (${att.leaveType})`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {formatTime(att?.inTime)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {formatTime(att?.outTime)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {att?.totalHours ? `${att.totalHours}h` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(att?.overtime || 0) > 0 ? (
                        <span className="text-sm font-medium text-green-600">+{att?.overtime}h</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(att?.lateBy || 0) > 0 ? (
                        <span className="text-xs text-red-600">Late {att?.lateBy}m</span>
                      ) : (att?.earlyBy || 0) > 0 ? (
                        <span className="text-xs text-orange-600">Early {att?.earlyBy}m</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {att?.remarks || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Department-wise Summary</h3>
          <div className="space-y-3">
            {departments.filter((d) => d !== 'all').map((dept) => {
              const deptEmployees = employees.filter((e) => e.department === dept);
              const deptAttendance = attendance.filter((a) =>
                deptEmployees.some((e) => e.id === a.employeeId)
              );
              const present = deptAttendance.filter((a) => a.status === 'Present').length;
              const total = deptEmployees.length;
              const percentage = total > 0 ? (present / total) * 100 : 0;

              return (
                <div key={dept} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-600">{dept}</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right w-24">
                    <span className="text-sm font-medium text-gray-900">
                      {present}/{total}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Leave Status Today</h3>
          <div className="space-y-3">
            {employees
              .filter((emp) => {
                const att = attendance.find((a) => a.employeeId === emp.id);
                return att?.status === 'Leave' || att?.status === 'Absent';
              })
              .map((emp) => {
                const att = attendance.find((a) => a.employeeId === emp.id);
                return (
                  <div key={emp.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {emp.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.department}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(att?.status || 'Absent')}`}>
                      {att?.status} {att?.leaveType && `(${att.leaveType})`}
                    </span>
                  </div>
                );
              })}
            {employees.filter((emp) => {
              const att = attendance.find((a) => a.employeeId === emp.id);
              return att?.status === 'Leave' || att?.status === 'Absent';
            }).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No employees on leave/absent</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
