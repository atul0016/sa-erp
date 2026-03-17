/**
 * SA ERP - HR & Payroll Types
 * Human Capital Management with Indian Statutory Compliance
 */

// ==================== EMPLOYEE ====================

export type EmploymentType = 'permanent' | 'contract' | 'trainee' | 'consultant' | 'intern';
export type EmployeeStatus = 'active' | 'inactive' | 'on_notice' | 'terminated' | 'absconded';

export interface Employee {
  id: string;
  tenant_id: string;
  employee_code: string;
  
  // Personal
  first_name: string;
  middle_name?: string;
  last_name: string;
  display_name: string;
  
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  nationality: string;
  
  // Contact
  personal_email?: string;
  work_email: string;
  mobile: string;
  alternate_mobile?: string;
  
  // Current Address
  current_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  
  // Permanent Address
  permanent_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  
  // Identity
  pan: string;
  aadhaar?: string;
  passport_number?: string;
  passport_expiry?: string;
  
  // Bank
  bank_account_number: string;
  bank_name: string;
  ifsc_code: string;
  bank_branch: string;
  
  // Employment
  employment_type: EmploymentType;
  date_of_joining: string;
  probation_end_date?: string;
  confirmation_date?: string;
  date_of_exit?: string;
  exit_reason?: string;
  
  department_id: string;
  designation_id: string;
  reporting_to?: string;
  location_id?: string;
  cost_center_id?: string;
  
  // Statutory
  pf_number?: string;
  uan?: string;
  esi_number?: string;
  is_pf_applicable: boolean;
  is_esi_applicable: boolean;
  pf_contribution_type: 'basic' | 'restricted' | 'not_applicable';
  
  // Tax
  tax_regime: 'old' | 'new';
  
  // Leave
  leave_policy_id?: string;
  
  // Photo
  photo_url?: string;
  
  status: EmployeeStatus;
  
  // Custom attributes
  attributes?: Record<string, unknown>;
  
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  parent_id?: string;
  head_id?: string;
  cost_center_id?: string;
  is_active: boolean;
}

export interface Designation {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  level?: number;
  is_active: boolean;
}

export interface EmployeeLocation {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  professional_tax_state: string;
  is_active: boolean;
}

// ==================== SALARY STRUCTURE ====================

export interface SalaryStructure {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  
  // Applicability
  employment_types?: EmploymentType[];
  department_ids?: string[];
  
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
  
  // CTC calculation
  is_ctc_based: boolean;
  
  is_active: boolean;
  effective_from: string;
  
  created_at: string;
}

export type ComponentType = 'earning' | 'deduction';
export type CalculationType = 'fixed' | 'percent_of_basic' | 'percent_of_ctc' | 'percent_of_gross' | 'formula';

export interface SalaryComponent {
  id: string;
  code: string;
  name: string;
  component_type: ComponentType;
  calculation_type: CalculationType;
  
  // If percent
  percent?: number;
  base_component?: string;
  
  // If formula
  formula?: string;
  
  // For fixed
  default_amount?: number;
  
  // Caps
  min_amount?: number;
  max_amount?: number;
  
  // Statutory
  is_statutory: boolean;
  statutory_type?: 'pf' | 'esi' | 'pt' | 'lwf' | 'tds';
  
  // Taxability
  is_taxable: boolean;
  tax_exemption_limit?: number;
  tax_exemption_type?: string;
  
  // Prorata
  is_prorated: boolean;
  
  // Display
  display_order: number;
  show_in_payslip: boolean;
  
  is_active: boolean;
}

// ==================== EMPLOYEE SALARY ====================

export interface EmployeeSalary {
  id: string;
  tenant_id: string;
  employee_id: string;
  salary_structure_id: string;
  
  effective_from: string;
  effective_to?: string;
  
  ctc_annual?: number;
  ctc_monthly?: number;
  
  components: EmployeeSalaryComponent[];
  
  gross_monthly: number;
  net_monthly: number;
  
  is_current: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface EmployeeSalaryComponent {
  id: string;
  employee_salary_id: string;
  component_id: string;
  component_code: string;
  component_name: string;
  component_type: ComponentType;
  
  monthly_amount: number;
  annual_amount: number;
}

// ==================== ATTENDANCE ====================

export interface AttendanceRecord {
  id: string;
  tenant_id: string;
  employee_id: string;
  date: string;
  
  // Raw punches
  punches: AttendancePunch[];
  
  // Calculated
  first_in?: string;
  last_out?: string;
  total_hours: number;
  
  // Status
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday' | 'week_off' | 'on_duty';
  
  // Leave reference
  leave_application_id?: string;
  
  // Regularization
  is_regularized: boolean;
  regularization_reason?: string;
  regularized_by?: string;
  
  // Overtime
  overtime_hours: number;
  overtime_approved: boolean;
  
  shift_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface AttendancePunch {
  id: string;
  attendance_id: string;
  punch_time: string;
  punch_type: 'in' | 'out';
  source: 'biometric' | 'mobile' | 'web' | 'manual';
  device_id?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Shift {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  
  start_time: string;
  end_time: string;
  
  grace_in_minutes: number;
  grace_out_minutes: number;
  
  half_day_hours: number;
  full_day_hours: number;
  
  overtime_threshold_hours?: number;
  
  is_night_shift: boolean;
  is_default: boolean;
  is_active: boolean;
}

// ==================== LEAVE MANAGEMENT ====================

export interface LeaveType {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  
  // Allocation
  annual_quota: number;
  max_accumulation?: number;
  carry_forward_limit?: number;
  encashment_allowed: boolean;
  
  // Rules
  min_days_per_application: number;
  max_days_per_application: number;
  requires_attachment: boolean;
  advance_days_required: number;
  
  // Applicability
  applicable_gender?: 'male' | 'female' | 'all';
  applicable_after_months?: number;
  
  // Pay
  is_paid: boolean;
  
  is_active: boolean;
}

export interface LeaveBalance {
  id: string;
  tenant_id: string;
  employee_id: string;
  leave_type_id: string;
  fiscal_year_id: string;
  
  opening_balance: number;
  accrued: number;
  availed: number;
  adjusted: number;
  lapsed: number;
  encashed: number;
  closing_balance: number;
  
  updated_at: string;
}

export interface LeaveApplication {
  id: string;
  tenant_id: string;
  employee_id: string;
  leave_type_id: string;
  
  from_date: string;
  to_date: string;
  
  from_session: 'full_day' | 'first_half' | 'second_half';
  to_session: 'full_day' | 'first_half' | 'second_half';
  
  total_days: number;
  
  reason: string;
  attachment_url?: string;
  
  // Approval
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  
  created_at: string;
  updated_at: string;
}

// ==================== PAYROLL ====================

export interface PayrollPeriod {
  id: string;
  tenant_id: string;
  name: string;
  
  from_date: string;
  to_date: string;
  payment_date: string;
  
  status: 'open' | 'processing' | 'processed' | 'paid' | 'closed';
  
  processed_at?: string;
  processed_by?: string;
  
  created_at: string;
}

export interface PayrollRun {
  id: string;
  tenant_id: string;
  payroll_period_id: string;
  
  run_number: string;
  run_date: string;
  
  // Filters
  department_ids?: string[];
  location_ids?: string[];
  employee_ids?: string[];
  
  // Summary
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_employer_contribution: number;
  
  status: 'draft' | 'processing' | 'processed' | 'approved' | 'paid' | 'cancelled';
  
  processed_by: string;
  processed_at: string;
  approved_by?: string;
  approved_at?: string;
  
  created_at: string;
}

export interface Payslip {
  id: string;
  tenant_id: string;
  payroll_run_id: string;
  payroll_period_id: string;
  employee_id: string;
  
  employee_code: string;
  employee_name: string;
  department: string;
  designation: string;
  
  // Attendance
  total_days: number;
  working_days: number;
  days_present: number;
  days_absent: number;
  days_leave: number;
  days_holiday: number;
  lop_days: number;
  
  // Earnings
  earnings: PayslipComponent[];
  total_earnings: number;
  
  // Deductions
  deductions: PayslipComponent[];
  total_deductions: number;
  
  // Statutory
  pf_employee: number;
  pf_employer: number;
  esi_employee: number;
  esi_employer: number;
  professional_tax: number;
  lwf_employee: number;
  lwf_employer: number;
  tds: number;
  
  // Summary
  gross_salary: number;
  net_salary: number;
  
  // Arrears
  arrears_amount: number;
  arrears_details?: string;
  
  // Reimbursements
  reimbursements_amount: number;
  
  // Payment
  payment_mode: 'bank_transfer' | 'cheque' | 'cash';
  bank_account?: string;
  transaction_reference?: string;
  
  status: 'draft' | 'processed' | 'approved' | 'paid';
  
  created_at: string;
}

export interface PayslipComponent {
  component_id: string;
  component_code: string;
  component_name: string;
  component_type: ComponentType;
  amount: number;
  is_statutory: boolean;
}

// ==================== STATUTORY REPORTS ====================

export interface PFReturn {
  id: string;
  tenant_id: string;
  period: string; // YYYY-MM
  
  establishment_id: string;
  establishment_name: string;
  
  entries: PFReturnEntry[];
  
  total_pf_wages: number;
  total_pf_contribution: number;
  total_eps_contribution: number;
  total_edli_contribution: number;
  total_admin_charges: number;
  
  // ECR file
  ecr_file_path?: string;
  ecr_generated_at?: string;
  
  // Challan
  challan_number?: string;
  challan_date?: string;
  payment_date?: string;
  
  status: 'draft' | 'generated' | 'paid';
  
  created_at: string;
}

export interface PFReturnEntry {
  id: string;
  pf_return_id: string;
  employee_id: string;
  
  uan: string;
  member_id: string;
  member_name: string;
  
  pf_wages: number;
  eps_wages: number;
  edli_wages: number;
  
  pf_contribution: number;
  eps_contribution: number;
  pf_arrears: number;
  
  refund_of_advances?: number;
  
  ncpf_days: number;
}

export interface ESIReturn {
  id: string;
  tenant_id: string;
  contribution_period: string; // e.g., "Oct 2025 to Mar 2026"
  
  employer_code: string;
  
  entries: ESIReturnEntry[];
  
  total_gross_wages: number;
  total_esi_wages: number;
  total_employee_contribution: number;
  total_employer_contribution: number;
  
  challan_number?: string;
  payment_date?: string;
  
  status: 'draft' | 'generated' | 'paid';
  
  created_at: string;
}

export interface ESIReturnEntry {
  id: string;
  esi_return_id: string;
  employee_id: string;
  
  ip_number: string;
  ip_name: string;
  
  days_worked: number;
  gross_wages: number;
  esi_wages: number;
  
  employee_contribution: number;
  employer_contribution: number;
  
  reason_for_zero_contribution?: string;
}

export interface Form16 {
  id: string;
  tenant_id: string;
  fiscal_year: string;
  employee_id: string;
  
  // Part A - Certificate from employer
  tan: string;
  employer_name: string;
  employer_address: string;
  
  employee_name: string;
  employee_pan: string;
  
  // Quarter-wise tax deducted
  quarters: Array<{
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    receipt_numbers: string;
    tax_deposited: number;
    date_of_deposit: string;
  }>;
  
  total_tax_deducted: number;
  total_tax_deposited: number;
  
  // Part B - Salary details
  gross_salary: number;
  exemptions: number;
  net_salary: number;
  
  // Deductions
  standard_deduction: number;
  professional_tax: number;
  section_80c: number;
  section_80d: number;
  other_deductions: number;
  
  taxable_income: number;
  tax_on_income: number;
  surcharge: number;
  cess: number;
  total_tax_payable: number;
  relief_under_89?: number;
  net_tax_payable: number;
  
  generated_at: string;
  generated_by: string;
}

// ==================== TAX DECLARATION ====================

export interface TaxDeclaration {
  id: string;
  tenant_id: string;
  employee_id: string;
  fiscal_year_id: string;
  
  tax_regime: 'old' | 'new';
  
  // Section 80C
  section_80c: {
    ppf?: number;
    elss?: number;
    life_insurance?: number;
    nsc?: number;
    tuition_fees?: number;
    home_loan_principal?: number;
    fixed_deposit?: number;
    others?: number;
    total: number;
  };
  
  // Section 80D - Medical
  section_80d: {
    self_premium?: number;
    parents_premium?: number;
    preventive_checkup?: number;
    total: number;
  };
  
  // Other deductions
  hra_exemption?: number;
  lta_exemption?: number;
  home_loan_interest?: number;
  section_80e?: number; // Education loan
  section_80g?: number; // Donations
  nps_80ccd_1b?: number;
  other_deductions?: number;
  
  total_deductions: number;
  
  // Income from other sources
  other_income?: number;
  previous_employer_income?: number;
  previous_employer_tds?: number;
  
  status: 'draft' | 'submitted' | 'verified' | 'locked';
  
  submitted_at?: string;
  verified_by?: string;
  verified_at?: string;
  
  created_at: string;
  updated_at: string;
}

// ==================== LOAN & ADVANCE ====================

export interface EmployeeLoan {
  id: string;
  tenant_id: string;
  employee_id: string;
  
  loan_type: 'salary_advance' | 'personal_loan' | 'emergency_loan';
  
  loan_number: string;
  loan_date: string;
  
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  
  emi_amount: number;
  emi_start_date: string;
  
  total_repaid: number;
  outstanding_balance: number;
  
  // Deduction from salary
  deduct_from_salary: boolean;
  salary_component_id?: string;
  
  status: 'pending' | 'approved' | 'disbursed' | 'repaying' | 'closed' | 'cancelled';
  
  disbursed_via?: 'bank_transfer' | 'cheque' | 'cash';
  disbursement_reference?: string;
  disbursed_at?: string;
  
  approved_by?: string;
  approved_at?: string;
  
  remarks?: string;
  
  repayments: LoanRepayment[];
  
  created_at: string;
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  
  repayment_date: string;
  amount: number;
  principal: number;
  interest: number;
  
  source: 'salary_deduction' | 'manual_payment';
  payslip_id?: string;
  
  remarks?: string;
  
  created_at: string;
}

// ==================== EXPENSE & REIMBURSEMENT ====================

export interface ExpenseClaim {
  id: string;
  tenant_id: string;
  employee_id: string;
  
  claim_number: string;
  claim_date: string;
  
  expense_type: 'travel' | 'medical' | 'communication' | 'office_supplies' | 'other';
  
  items: ExpenseClaimItem[];
  
  total_amount: number;
  approved_amount: number;
  
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  
  paid_in_payroll_id?: string;
  paid_at?: string;
  
  created_at: string;
}

export interface ExpenseClaimItem {
  id: string;
  claim_id: string;
  
  date: string;
  description: string;
  amount: number;
  approved_amount?: number;
  
  attachment_url?: string;
  
  remarks?: string;
}

