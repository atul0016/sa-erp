/**
 * SA ERP - HRM & Payroll Service
 * 
 * Implements HR and Payroll operations:
 * - Employee Management
 * - Attendance & Leave
 * - Salary Structure & Processing
 * - PF/ESI/Professional Tax
 * - TDS & Form 16
 * - Tax Declarations
 */

import { getDatabase } from '../../database';
import { generateId, generateDocNumber } from '../../database/repository';

// Indian tax calculation constants
const PF_EMPLOYEE_RATE = 0.12; // 12% of basic
const PF_EMPLOYER_RATE = 0.12; // 12% of basic (split: 3.67% EPF + 8.33% EPS)
const ESI_EMPLOYEE_RATE = 0.0075; // 0.75%
const ESI_EMPLOYER_RATE = 0.0325; // 3.25%
const ESI_CEILING = 21000; // Monthly ceiling for ESI applicability
const PF_CEILING = 15000; // Monthly ceiling for PF calculation

// Professional tax by state (simplified - Maharashtra rates)
const PROFESSIONAL_TAX_SLABS = [
  { min: 0, max: 7500, tax: 0 },
  { min: 7501, max: 10000, tax: 175 },
  { min: 10001, max: Infinity, tax: 200 },
  // February has higher PT in Maharashtra
];

// Income tax slabs for new regime (FY 2024-25)
const TAX_SLABS_NEW_REGIME = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 700000, rate: 0.05 },
  { min: 700001, max: 1000000, rate: 0.10 },
  { min: 1000001, max: 1200000, rate: 0.15 },
  { min: 1200001, max: 1500000, rate: 0.20 },
  { min: 1500001, max: Infinity, rate: 0.30 },
];

// Income tax slabs for old regime
const TAX_SLABS_OLD_REGIME = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 0.05 },
  { min: 500001, max: 1000000, rate: 0.20 },
  { min: 1000001, max: Infinity, rate: 0.30 },
];

class HRMService {
  private db() {
    return getDatabase();
  }

  // ==================== EMPLOYEE MANAGEMENT ====================

  createEmployee(tenantId: string, data: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    dateOfJoining: string;
    departmentId: string;
    designationId: string;
    reportingManagerId?: string;
    employmentType: 'permanent' | 'contract' | 'intern' | 'consultant';
    pan?: string;
    aadhar?: string;
    bankAccountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    pfNumber?: string;
    esiNumber?: string;
    uanNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }): unknown {
    const empId = generateId();

    this.db().prepare(`
      INSERT INTO employees (
        id, tenant_id, employee_code, first_name, last_name, email, phone,
        date_of_birth, gender, date_of_joining, department_id, designation_id,
        reporting_manager_id, employment_type, pan, aadhar, bank_account_number,
        bank_name, ifsc_code, pf_number, esi_number, uan_number, address, city,
        state, pincode, emergency_contact_name, emergency_contact_phone, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active'
      )
    `).run(
      empId, tenantId, data.employeeCode, data.firstName, data.lastName, data.email,
      data.phone || null, data.dateOfBirth, data.gender, data.dateOfJoining,
      data.departmentId, data.designationId, data.reportingManagerId || null,
      data.employmentType, data.pan || null, data.aadhar || null,
      data.bankAccountNumber || null, data.bankName || null, data.ifscCode || null,
      data.pfNumber || null, data.esiNumber || null, data.uanNumber || null,
      data.address || null, data.city || null, data.state || null, data.pincode || null,
      data.emergencyContactName || null, data.emergencyContactPhone || null
    );

    return this.getEmployee(empId, tenantId);
  }

  getEmployee(id: string, tenantId: string): unknown {
    return this.db().prepare(`
      SELECT e.*, d.name as department_name, des.name as designation_name,
             m.first_name || ' ' || m.last_name as reporting_manager_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN designations des ON des.id = e.designation_id
      LEFT JOIN employees m ON m.id = e.reporting_manager_id
      WHERE e.id = ? AND e.tenant_id = ?
    `).get(id, tenantId);
  }

  getEmployees(tenantId: string, filters?: {
    departmentId?: string;
    status?: string;
  }): unknown[] {
    let sql = `
      SELECT e.*, d.name as department_name, des.name as designation_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN designations des ON des.id = e.designation_id
      WHERE e.tenant_id = ?
    `;
    const params: unknown[] = [tenantId];

    if (filters?.departmentId) {
      sql += ' AND e.department_id = ?';
      params.push(filters.departmentId);
    }

    if (filters?.status) {
      sql += ' AND e.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY e.first_name, e.last_name';

    return this.db().prepare(sql).all(...params);
  }

  updateEmployee(id: string, tenantId: string, data: Record<string, unknown>): unknown {
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'department_id', 'designation_id',
      'reporting_manager_id', 'employment_type', 'pan', 'aadhar', 'bank_account_number',
      'bank_name', 'ifsc_code', 'pf_number', 'esi_number', 'uan_number', 'address',
      'city', 'state', 'pincode', 'status'
    ];

    const updates = Object.entries(data)
      .filter(([key]) => allowedFields.includes(key))
      .map(([key]) => `${key} = ?`);

    if (updates.length === 0) return null;

    const values = Object.entries(data)
      .filter(([key]) => allowedFields.includes(key))
      .map(([, value]) => value);

    this.db().prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`)
      .run(...values, id, tenantId);

    return this.getEmployee(id, tenantId);
  }

  // ==================== SALARY STRUCTURE ====================

  createSalaryStructure(tenantId: string, data: {
    employeeId: string;
    effectiveFrom: string;
    basicSalary: number;
    hra: number;
    conveyanceAllowance: number;
    specialAllowance: number;
    medicalAllowance: number;
    otherAllowances?: number;
    pfApplicable: boolean;
    esiApplicable: boolean;
    ptApplicable: boolean;
    taxRegime: 'old' | 'new';
  }): unknown {
    const ssId = generateId();
    const ctc = data.basicSalary + data.hra + data.conveyanceAllowance +
                data.specialAllowance + data.medicalAllowance + (data.otherAllowances || 0);

    // Deactivate previous structure
    this.db().prepare(`
      UPDATE salary_structures SET is_active = 0 
      WHERE employee_id = ? AND tenant_id = ? AND is_active = 1
    `).run(data.employeeId, tenantId);

    this.db().prepare(`
      INSERT INTO salary_structures (
        id, tenant_id, employee_id, effective_from, basic_salary, hra,
        conveyance_allowance, special_allowance, medical_allowance,
        other_allowances, gross_salary, pf_applicable, esi_applicable,
        pt_applicable, tax_regime, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      ssId, tenantId, data.employeeId, data.effectiveFrom, data.basicSalary,
      data.hra, data.conveyanceAllowance, data.specialAllowance, data.medicalAllowance,
      data.otherAllowances || 0, ctc, data.pfApplicable ? 1 : 0,
      data.esiApplicable ? 1 : 0, data.ptApplicable ? 1 : 0, data.taxRegime
    );

    return this.db().prepare('SELECT * FROM salary_structures WHERE id = ?').get(ssId);
  }

  getSalaryStructure(employeeId: string, tenantId: string): unknown {
    return this.db().prepare(`
      SELECT * FROM salary_structures 
      WHERE employee_id = ? AND tenant_id = ? AND is_active = 1
    `).get(employeeId, tenantId);
  }

  // ==================== ATTENDANCE ====================

  recordAttendance(tenantId: string, data: {
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday' | 'weekly_off';
    leaveId?: string;
    overtimeHours?: number;
    notes?: string;
  }): unknown {
    const attId = generateId();

    // Calculate work hours
    let workHours = 0;
    if (data.checkIn && data.checkOut) {
      const checkIn = new Date(`2000-01-01 ${data.checkIn}`);
      const checkOut = new Date(`2000-01-01 ${data.checkOut}`);
      workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    }

    this.db().prepare(`
      INSERT INTO attendance (
        id, tenant_id, employee_id, date, check_in, check_out,
        status, work_hours, overtime_hours, leave_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tenant_id, employee_id, date) DO UPDATE SET
        check_in = excluded.check_in,
        check_out = excluded.check_out,
        status = excluded.status,
        work_hours = excluded.work_hours,
        overtime_hours = excluded.overtime_hours,
        leave_id = excluded.leave_id,
        notes = excluded.notes
    `).run(
      attId, tenantId, data.employeeId, data.date, data.checkIn || null,
      data.checkOut || null, data.status, workHours, data.overtimeHours || 0,
      data.leaveId || null, data.notes || null
    );

    return this.db().prepare(`
      SELECT * FROM attendance WHERE tenant_id = ? AND employee_id = ? AND date = ?
    `).get(tenantId, data.employeeId, data.date);
  }

  getAttendanceReport(tenantId: string, employeeId: string, month: string): unknown {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];

    const attendance = this.db().prepare(`
      SELECT * FROM attendance
      WHERE tenant_id = ? AND employee_id = ? AND date BETWEEN ? AND ?
      ORDER BY date
    `).all(tenantId, employeeId, startDate, endDate);

    const summary = this.db().prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_days,
        COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave_days,
        COUNT(CASE WHEN status = 'holiday' THEN 1 END) as holidays,
        COUNT(CASE WHEN status = 'weekly_off' THEN 1 END) as weekly_offs,
        COALESCE(SUM(work_hours), 0) as total_work_hours,
        COALESCE(SUM(overtime_hours), 0) as total_overtime_hours
      FROM attendance
      WHERE tenant_id = ? AND employee_id = ? AND date BETWEEN ? AND ?
    `).get(tenantId, employeeId, startDate, endDate);

    return { attendance, summary };
  }

  // ==================== LEAVE MANAGEMENT ====================

  applyLeave(tenantId: string, data: {
    employeeId: string;
    leaveType: 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity' | 'compensatory' | 'unpaid';
    fromDate: string;
    toDate: string;
    reason: string;
    isHalfDay?: boolean;
  }, userId: string): unknown {
    const leaveId = generateId();

    // Calculate leave days
    const from = new Date(data.fromDate);
    const to = new Date(data.toDate);
    let leaveDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (data.isHalfDay) leaveDays = 0.5;

    this.db().prepare(`
      INSERT INTO leaves (
        id, tenant_id, employee_id, leave_type, from_date, to_date,
        leave_days, is_half_day, reason, status, applied_by, applied_on
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
    `).run(
      leaveId, tenantId, data.employeeId, data.leaveType, data.fromDate,
      data.toDate, leaveDays, data.isHalfDay ? 1 : 0, data.reason, userId
    );

    return this.db().prepare('SELECT * FROM leaves WHERE id = ?').get(leaveId);
  }

  approveLeave(id: string, tenantId: string, approverId: string, approved: boolean, remarks?: string): boolean {
    return this.db().transaction(() => {
      const leave = this.db().prepare(`
        SELECT * FROM leaves WHERE id = ? AND tenant_id = ? AND status = 'pending'
      `).get(id, tenantId) as {
        employee_id: string;
        from_date: string;
        to_date: string;
        leave_days: number;
        leave_type: string;
      } | undefined;

      if (!leave) return false;

      const status = approved ? 'approved' : 'rejected';
      
      this.db().prepare(`
        UPDATE leaves SET status = ?, approved_by = ?, approved_on = datetime('now'), remarks = ?
        WHERE id = ? AND tenant_id = ?
      `).run(status, approverId, remarks || null, id, tenantId);

      // If approved, mark attendance as leave
      if (approved) {
        const from = new Date(leave.from_date);
        const to = new Date(leave.to_date);
        
        for (let d = from; d <= to; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          this.recordAttendance(tenantId, {
            employeeId: leave.employee_id,
            date: dateStr,
            status: 'leave',
            leaveId: id
          });
        }

        // Deduct from leave balance
        this.db().prepare(`
          UPDATE leave_balances 
          SET balance = balance - ?, used = used + ?
          WHERE tenant_id = ? AND employee_id = ? AND leave_type = ? AND year = strftime('%Y', 'now')
        `).run(leave.leave_days, leave.leave_days, tenantId, leave.employee_id, leave.leave_type);
      }

      return true;
    })();
  }

  getLeaveBalance(tenantId: string, employeeId: string, year?: string): unknown[] {
    const yr = year || new Date().getFullYear().toString();
    return this.db().prepare(`
      SELECT * FROM leave_balances 
      WHERE tenant_id = ? AND employee_id = ? AND year = ?
    `).all(tenantId, employeeId, yr);
  }

  // ==================== PAYROLL PROCESSING ====================

  processPayroll(tenantId: string, month: string, userId: string): unknown {
    const [year, monthNum] = month.split('-');
    const payrollId = generateId();
    const payrollCount = this.db().prepare(
      'SELECT COUNT(*) as count FROM payroll WHERE tenant_id = ?'
    ).get(tenantId) as { count: number };
    const docNumber = generateDocNumber('PR', payrollCount.count + 1);
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();

    return this.db().transaction(() => {
      // Create payroll header
      this.db().prepare(`
        INSERT INTO payroll (
          id, tenant_id, document_number, month, year, status, processed_by, processed_on
        ) VALUES (?, ?, ?, ?, ?, 'draft', ?, datetime('now'))
      `).run(payrollId, tenantId, docNumber, monthNum, year, userId);

      // Get all active employees with salary structure
      const employees = this.db().prepare(`
        SELECT e.*, ss.* 
        FROM employees e
        JOIN salary_structures ss ON ss.employee_id = e.id AND ss.is_active = 1
        WHERE e.tenant_id = ? AND e.status = 'active'
      `).all(tenantId) as Array<{
        id: string;
        employee_code: string;
        first_name: string;
        last_name: string;
        basic_salary: number;
        hra: number;
        conveyance_allowance: number;
        special_allowance: number;
        medical_allowance: number;
        other_allowances: number;
        gross_salary: number;
        pf_applicable: number;
        esi_applicable: number;
        pt_applicable: number;
        tax_regime: 'old' | 'new';
      }>;

      const payslips: Array<{
        employeeId: string;
        employeeCode: string;
        employeeName: string;
        grossEarnings: number;
        totalDeductions: number;
        netPay: number;
      }> = [];

      for (const emp of employees) {
        // Get attendance summary
        const attendance = this.getAttendanceReport(tenantId, emp.id, month) as {
          summary: {
            present_days: number;
            half_days: number;
            leave_days: number;
            absent_days: number;
          }
        };
        
        const workingDays = attendance.summary.present_days + 
                          (attendance.summary.half_days * 0.5) + 
                          attendance.summary.leave_days;
        const lop = attendance.summary.absent_days;
        const effectiveDays = workingDays;

        // Calculate proportional salary
        const factor = effectiveDays / daysInMonth;
        const basic = Math.round(emp.basic_salary * factor);
        const hra = Math.round(emp.hra * factor);
        const conveyance = Math.round(emp.conveyance_allowance * factor);
        const special = Math.round(emp.special_allowance * factor);
        const medical = Math.round(emp.medical_allowance * factor);
        const otherAllowances = Math.round(emp.other_allowances * factor);

        const grossEarnings = basic + hra + conveyance + special + medical + otherAllowances;
        const lopDeduction = lop > 0 ? Math.round((emp.gross_salary / daysInMonth) * lop) : 0;

        // Calculate statutory deductions
        let pfEmployee = 0, pfEmployer = 0;
        if (emp.pf_applicable) {
          const pfBase = Math.min(basic, PF_CEILING);
          pfEmployee = Math.round(pfBase * PF_EMPLOYEE_RATE);
          pfEmployer = Math.round(pfBase * PF_EMPLOYER_RATE);
        }

        let esiEmployee = 0, esiEmployer = 0;
        if (emp.esi_applicable && grossEarnings <= ESI_CEILING) {
          esiEmployee = Math.round(grossEarnings * ESI_EMPLOYEE_RATE);
          esiEmployer = Math.round(grossEarnings * ESI_EMPLOYER_RATE);
        }

        let professionalTax = 0;
        if (emp.pt_applicable) {
          for (const slab of PROFESSIONAL_TAX_SLABS) {
            if (grossEarnings >= slab.min && grossEarnings <= slab.max) {
              professionalTax = slab.tax;
              break;
            }
          }
        }

        // Calculate TDS
        const tds = this.calculateMonthlyTDS(tenantId, emp.id, grossEarnings * 12, emp.tax_regime);

        const totalDeductions = pfEmployee + esiEmployee + professionalTax + tds + lopDeduction;
        const netPay = grossEarnings - totalDeductions;

        // Create payslip
        const payslipId = generateId();
        this.db().prepare(`
          INSERT INTO payslips (
            id, payroll_id, tenant_id, employee_id, month, year,
            basic_salary, hra, conveyance_allowance, special_allowance,
            medical_allowance, other_allowances, gross_earnings, working_days,
            lop_days, lop_deduction, pf_employee, pf_employer, esi_employee,
            esi_employer, professional_tax, tds, total_deductions, net_pay, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processed')
        `).run(
          payslipId, payrollId, tenantId, emp.id, monthNum, year,
          basic, hra, conveyance, special, medical, otherAllowances, grossEarnings,
          workingDays, lop, lopDeduction, pfEmployee, pfEmployer, esiEmployee,
          esiEmployer, professionalTax, tds, totalDeductions, netPay
        );

        payslips.push({
          employeeId: emp.id,
          employeeCode: emp.employee_code,
          employeeName: `${emp.first_name} ${emp.last_name}`,
          grossEarnings,
          totalDeductions,
          netPay
        });
      }

      // Update payroll status
      this.db().prepare(`UPDATE payroll SET status = 'processed' WHERE id = ?`).run(payrollId);

      return {
        payrollId,
        month,
        employeeCount: payslips.length,
        totalGross: payslips.reduce((sum, p) => sum + p.grossEarnings, 0),
        totalDeductions: payslips.reduce((sum, p) => sum + p.totalDeductions, 0),
        totalNet: payslips.reduce((sum, p) => sum + p.netPay, 0),
        payslips
      };
    })();
  }

  private calculateMonthlyTDS(tenantId: string, employeeId: string, annualIncome: number, regime: 'old' | 'new'): number {
    // Get tax declarations
    const declarations = this.db().prepare(`
      SELECT * FROM tax_declarations 
      WHERE tenant_id = ? AND employee_id = ? AND fiscal_year = ?
    `).get(tenantId, employeeId, this.getCurrentFiscalYear()) as {
      section_80c: number;
      section_80d: number;
      section_80g: number;
      hra_exemption: number;
      other_exemptions: number;
    } | undefined;

    let taxableIncome = annualIncome;

    if (regime === 'old' && declarations) {
      // Apply deductions for old regime
      taxableIncome -= Math.min(declarations.section_80c || 0, 150000); // 80C limit
      taxableIncome -= Math.min(declarations.section_80d || 0, 75000); // 80D limit
      taxableIncome -= declarations.section_80g || 0;
      taxableIncome -= declarations.hra_exemption || 0;
      taxableIncome -= declarations.other_exemptions || 0;
      taxableIncome -= 50000; // Standard deduction
    } else if (regime === 'new') {
      taxableIncome -= 75000; // Standard deduction for new regime (FY 2024-25)
    }

    taxableIncome = Math.max(0, taxableIncome);

    // Calculate tax based on regime
    const slabs = regime === 'new' ? TAX_SLABS_NEW_REGIME : TAX_SLABS_OLD_REGIME;
    let annualTax = 0;
    let remainingIncome = taxableIncome;

    for (const slab of slabs) {
      if (remainingIncome <= 0) break;
      
      const taxableInSlab = Math.min(remainingIncome, slab.max - slab.min + 1);
      if (remainingIncome > slab.min) {
        annualTax += Math.max(0, Math.min(taxableInSlab, remainingIncome - slab.min + 1)) * slab.rate;
        remainingIncome -= (slab.max - slab.min + 1);
      }
    }

    // Add surcharge and cess
    if (taxableIncome > 5000000) {
      annualTax *= 1.10; // 10% surcharge
    }
    annualTax *= 1.04; // 4% Health & Education Cess

    // Return monthly TDS
    return Math.round(annualTax / 12);
  }

  private getCurrentFiscalYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  getPayslip(employeeId: string, tenantId: string, month: string): unknown {
    const [year, monthNum] = month.split('-');
    return this.db().prepare(`
      SELECT ps.*, e.first_name, e.last_name, e.employee_code,
             e.pan, e.bank_account_number, e.bank_name, e.ifsc_code
      FROM payslips ps
      JOIN employees e ON e.id = ps.employee_id
      WHERE ps.employee_id = ? AND ps.tenant_id = ? AND ps.month = ? AND ps.year = ?
    `).get(employeeId, tenantId, monthNum, year);
  }

  // ==================== TAX DECLARATIONS ====================

  submitTaxDeclaration(tenantId: string, data: {
    employeeId: string;
    fiscalYear: string;
    section80c?: {
      ppf?: number;
      elss?: number;
      lifeInsurance?: number;
      homeLoanPrincipal?: number;
      tuitionFees?: number;
      other?: number;
    };
    section80d?: {
      selfHealthInsurance?: number;
      parentsHealthInsurance?: number;
      preventiveHealthCheckup?: number;
    };
    section80g?: number;
    section24?: number; // Home loan interest
    hraExemption?: number;
    ltaExemption?: number;
    otherExemptions?: number;
    taxRegimePreference: 'old' | 'new';
  }): unknown {
    const declId = generateId();

    const section80c = data.section80c
      ? (data.section80c.ppf || 0) + (data.section80c.elss || 0) +
        (data.section80c.lifeInsurance || 0) + (data.section80c.homeLoanPrincipal || 0) +
        (data.section80c.tuitionFees || 0) + (data.section80c.other || 0)
      : 0;

    const section80d = data.section80d
      ? (data.section80d.selfHealthInsurance || 0) + (data.section80d.parentsHealthInsurance || 0) +
        (data.section80d.preventiveHealthCheckup || 0)
      : 0;

    // Upsert declaration
    this.db().prepare(`
      INSERT INTO tax_declarations (
        id, tenant_id, employee_id, fiscal_year, section_80c, section_80d,
        section_80g, section_24, hra_exemption, lta_exemption, other_exemptions,
        tax_regime_preference, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
      ON CONFLICT(tenant_id, employee_id, fiscal_year) DO UPDATE SET
        section_80c = excluded.section_80c,
        section_80d = excluded.section_80d,
        section_80g = excluded.section_80g,
        section_24 = excluded.section_24,
        hra_exemption = excluded.hra_exemption,
        lta_exemption = excluded.lta_exemption,
        other_exemptions = excluded.other_exemptions,
        tax_regime_preference = excluded.tax_regime_preference,
        status = 'submitted'
    `).run(
      declId, tenantId, data.employeeId, data.fiscalYear,
      Math.min(section80c, 150000), // Cap at 1.5L
      Math.min(section80d, 75000), // Cap at 75K
      data.section80g || 0,
      Math.min(data.section24 || 0, 200000), // Cap at 2L
      data.hraExemption || 0,
      data.ltaExemption || 0,
      data.otherExemptions || 0,
      data.taxRegimePreference
    );

    return this.db().prepare(`
      SELECT * FROM tax_declarations WHERE tenant_id = ? AND employee_id = ? AND fiscal_year = ?
    `).get(tenantId, data.employeeId, data.fiscalYear);
  }

  // ==================== FORM 16 ====================

  generateForm16(tenantId: string, employeeId: string, fiscalYear: string): unknown {
    const [startYear] = fiscalYear.split('-');
    const fromMonth = `${startYear}-04`;
    const toMonth = `${parseInt(startYear) + 1}-03`;

    // Get all payslips for the fiscal year
    const payslips = this.db().prepare(`
      SELECT * FROM payslips 
      WHERE tenant_id = ? AND employee_id = ?
        AND ((year = ? AND month >= '04') OR (year = ? AND month <= '03'))
      ORDER BY year, month
    `).all(tenantId, employeeId, startYear, String(parseInt(startYear) + 1)) as Array<{
      basic_salary: number;
      hra: number;
      conveyance_allowance: number;
      special_allowance: number;
      medical_allowance: number;
      other_allowances: number;
      gross_earnings: number;
      pf_employee: number;
      professional_tax: number;
      tds: number;
    }>;

    const employee = this.getEmployee(employeeId, tenantId) as {
      first_name: string;
      last_name: string;
      pan: string;
      employee_code: string;
    };

    const declarations = this.db().prepare(`
      SELECT * FROM tax_declarations WHERE tenant_id = ? AND employee_id = ? AND fiscal_year = ?
    `).get(tenantId, employeeId, fiscalYear);

    // Aggregate totals
    const totals = payslips.reduce((acc, p) => ({
      gross: acc.gross + p.gross_earnings,
      basic: acc.basic + p.basic_salary,
      hra: acc.hra + p.hra,
      pf: acc.pf + p.pf_employee,
      pt: acc.pt + p.professional_tax,
      tds: acc.tds + p.tds
    }), { gross: 0, basic: 0, hra: 0, pf: 0, pt: 0, tds: 0 });

    return {
      employeeName: `${employee.first_name} ${employee.last_name}`,
      employeeCode: employee.employee_code,
      pan: employee.pan,
      fiscalYear,
      partA: {
        grossSalary: totals.gross,
        standardDeduction: 50000,
        entertainmentAllowance: 0,
        professionalTax: totals.pt,
        incomeChargeableUnderSalary: totals.gross - 50000 - totals.pt
      },
      partB: {
        section80C: declarations ? (declarations as { section_80c: number }).section_80c : 0,
        section80D: declarations ? (declarations as { section_80d: number }).section_80d : 0,
        section80G: declarations ? (declarations as { section_80g: number }).section_80g : 0,
        section24: declarations ? (declarations as { section_24: number }).section_24 : 0,
        totalDeductions: declarations ? (
          (declarations as { section_80c: number }).section_80c +
          (declarations as { section_80d: number }).section_80d +
          (declarations as { section_80g: number }).section_80g +
          (declarations as { section_24: number }).section_24
        ) : 0
      },
      taxComputation: {
        totalIncome: totals.gross,
        totalDeductions: totals.pf,
        taxableIncome: totals.gross - totals.pf - 50000,
        taxPayable: totals.tds * 12, // Approximate
        tdsDeducted: totals.tds,
        taxRefundOrDue: 0
      }
    };
  }

  // ==================== PF/ESI REPORTS ====================

  getPFReport(tenantId: string, month: string): unknown {
    const [year, monthNum] = month.split('-');
    
    return this.db().prepare(`
      SELECT 
        e.employee_code, e.first_name, e.last_name, e.pf_number, e.uan_number,
        ps.basic_salary, ps.pf_employee, ps.pf_employer,
        (ps.pf_employer * 0.3058) as eps_contribution,
        (ps.pf_employer * 0.6942) as epf_contribution
      FROM payslips ps
      JOIN employees e ON e.id = ps.employee_id
      WHERE ps.tenant_id = ? AND ps.month = ? AND ps.year = ? AND ps.pf_employee > 0
      ORDER BY e.employee_code
    `).all(tenantId, monthNum, year);
  }

  getESIReport(tenantId: string, month: string): unknown {
    const [year, monthNum] = month.split('-');
    
    return this.db().prepare(`
      SELECT 
        e.employee_code, e.first_name, e.last_name, e.esi_number,
        ps.gross_earnings, ps.esi_employee, ps.esi_employer,
        (ps.esi_employee + ps.esi_employer) as total_esi
      FROM payslips ps
      JOIN employees e ON e.id = ps.employee_id
      WHERE ps.tenant_id = ? AND ps.month = ? AND ps.year = ? AND ps.esi_employee > 0
      ORDER BY e.employee_code
    `).all(tenantId, monthNum, year);
  }

  getLeaves(tenantId: string, filters?: { employeeId?: string; status?: string; fromDate?: string; toDate?: string }): unknown[] {
    let query = `
      SELECT 
        l.*, 
        e.employee_code, 
        e.first_name || ' ' || e.last_name as employee_name,
        d.name as department,
        approver.first_name || ' ' || approver.last_name as approved_by_name
      FROM leaves l
      JOIN employees e ON e.id = l.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employees approver ON approver.id = l.approved_by
      WHERE l.tenant_id = ?
    `;
    const params: any[] = [tenantId];

    if (filters?.employeeId) {
      query += ' AND l.employee_id = ?';
      params.push(filters.employeeId);
    }
    if (filters?.status) {
      query += ' AND l.status = ?';
      params.push(filters.status);
    }
    if (filters?.fromDate) {
      query += ' AND l.from_date >= ?';
      params.push(filters.fromDate);
    }
    if (filters?.toDate) {
      query += ' AND l.to_date <= ?';
      params.push(filters.toDate);
    }

    query += ' ORDER BY l.applied_on DESC';
    
    return this.db().prepare(query).all(...params);
  }
}

export const hrmService = new HRMService();

