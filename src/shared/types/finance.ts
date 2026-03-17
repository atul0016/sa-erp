/**
 * SA ERP - Financial Types
 * Double-Entry Accounting Schema
 */

// ==================== CHART OF ACCOUNTS ====================

export type AccountType = 
  | 'asset' 
  | 'liability' 
  | 'equity' 
  | 'income' 
  | 'expense';

export type AccountSubType =
  | 'bank'
  | 'cash'
  | 'accounts_receivable'
  | 'inventory'
  | 'fixed_asset'
  | 'accumulated_depreciation'
  | 'other_current_asset'
  | 'accounts_payable'
  | 'credit_card'
  | 'current_liability'
  | 'long_term_liability'
  | 'equity'
  | 'retained_earnings'
  | 'sales_income'
  | 'other_income'
  | 'cost_of_goods_sold'
  | 'operating_expense'
  | 'other_expense';

export interface Account {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  account_type: AccountType;
  account_sub_type: AccountSubType;
  parent_id?: string;
  description?: string;
  currency: string;
  is_system: boolean;
  is_active: boolean;
  is_reconcilable: boolean;
  opening_balance: number;
  opening_balance_date?: string;
  cost_center_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CostCenter {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  parent_id?: string;
  is_active: boolean;
}

// ==================== JOURNAL ENTRIES (DOUBLE-ENTRY) ====================

export type JournalType =
  | 'general'
  | 'sales'
  | 'purchase'
  | 'cash_receipt'
  | 'cash_payment'
  | 'bank_receipt'
  | 'bank_payment'
  | 'contra'
  | 'credit_note'
  | 'debit_note'
  | 'depreciation'
  | 'opening';

export interface JournalEntry {
  id: string;
  tenant_id: string;
  voucher_number: string;
  journal_type: JournalType;
  date: string;
  reference?: string;
  narration?: string;
  source_document?: {
    type: 'invoice' | 'payment' | 'receipt' | 'order' | 'adjustment';
    id: string;
    number: string;
  };
  total_debit: number;
  total_credit: number;
  currency: string;
  exchange_rate: number;
  is_posted: boolean;
  is_reversed: boolean;
  reversed_by?: string;
  lines: JournalEntryLine[];
  attachments?: Attachment[];
  created_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  line_number: number;
  account_id: string;
  account_code: string;
  account_name: string;
  description?: string;
  debit: number;
  credit: number;
  base_debit: number;
  base_credit: number;
  cost_center_id?: string;
  party_type?: 'customer' | 'vendor';
  party_id?: string;
  tax_code?: string;
  reconciled: boolean;
  reconciliation_id?: string;
}

export interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

// ==================== FISCAL PERIODS ====================

export interface FiscalYear {
  id: string;
  tenant_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  periods: FiscalPeriod[];
  created_at: string;
}

export interface FiscalPeriod {
  id: string;
  fiscal_year_id: string;
  name: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  is_adjustment: boolean;
}

// ==================== CURRENCY & EXCHANGE ====================

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_base: boolean;
}

export interface ExchangeRate {
  id: string;
  tenant_id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  source: 'manual' | 'api';
}

// ==================== BANK & RECONCILIATION ====================

export interface BankAccount {
  id: string;
  tenant_id: string;
  account_id: string; // GL Account
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string;
  account_type: 'savings' | 'current' | 'cc' | 'od';
  currency: string;
  is_active: boolean;
}

export interface BankStatement {
  id: string;
  tenant_id: string;
  bank_account_id: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  lines: BankStatementLine[];
  is_reconciled: boolean;
  imported_at: string;
}

export interface BankStatementLine {
  id: string;
  statement_id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  reconciliation_status: 'unmatched' | 'matched' | 'reconciled';
  matched_journal_line_id?: string;
}

export interface BankReconciliation {
  id: string;
  tenant_id: string;
  bank_account_id: string;
  statement_date: string;
  statement_balance: number;
  book_balance: number;
  reconciled_balance: number;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

// ==================== BUDGETS ====================

export interface Budget {
  id: string;
  tenant_id: string;
  name: string;
  fiscal_year_id: string;
  status: 'draft' | 'approved' | 'active' | 'closed';
  lines: BudgetLine[];
  created_at: string;
  approved_at?: string;
}

export interface BudgetLine {
  id: string;
  budget_id: string;
  account_id: string;
  cost_center_id?: string;
  period_id: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
}

