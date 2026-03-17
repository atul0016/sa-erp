/**
 * SA ERP - Finance Service
 * Handles all financial operations including journal entries, bank reconciliation, etc.
 */

import { AccountRepository, JournalEntryRepository } from './accountRepository';
import { generateId } from '../../database/repository';
import { Account, JournalEntry } from '../../../shared/types';
import { getDatabase } from '../../database';
import { round, calculateGST, isInterStateTransaction } from '../../utils/helpers';

export class FinanceService {
  private accountRepo: AccountRepository;
  private journalRepo: JournalEntryRepository;

  constructor() {
    this.accountRepo = new AccountRepository();
    this.journalRepo = new JournalEntryRepository();
  }

  // ==================== Chart of Accounts ====================

  /**
   * Get chart of accounts
   */
  getChartOfAccounts(tenantId: string): Account[] {
    return this.accountRepo.getChartOfAccounts(tenantId);
  }

  /**
   * Create new account
   */
  createAccount(tenantId: string, data: Partial<Account>): Account {
    const account: Partial<Account> = {
      id: generateId(),
      tenant_id: tenantId,
      ...data,
      is_active: true,
      is_system: false
    };
    
    return this.accountRepo.create(account);
  }

  /**
   * Update account
   */
  updateAccount(id: string, tenantId: string, data: Partial<Account>): Account | undefined {
    return this.accountRepo.update(id, data, tenantId);
  }

  /**
   * Get account balance
   */
  getAccountBalance(tenantId: string, accountId: string, asOfDate?: string): number {
    return this.accountRepo.getBalance(tenantId, accountId, asOfDate);
  }

  /**
   * Get trial balance
   */
  getTrialBalance(tenantId: string, asOfDate?: string) {
    return this.accountRepo.getTrialBalance(tenantId, asOfDate);
  }

  // ==================== Journal Entries ====================

  /**
   * Create journal entry
   */
  createJournalEntry(
    tenantId: string,
    data: {
      date: string;
      narration: string;
      reference?: string;
      reference_type?: string;
      reference_id?: string;
      lines: Array<{
        account_id: string;
        account_code?: string;
        account_name?: string;
        debit?: number;
        credit?: number;
        debit_amount?: number;
        credit_amount?: number;
        narration?: string;
        description?: string;
        cost_center_id?: string;
      }>;
    },
    createdBy: string
  ): JournalEntry {
    const entryNumber = this.journalRepo.getNextEntryNumber(tenantId);
    const reference = data.reference || (
      data.reference_type && data.reference_id
        ? `${data.reference_type}:${data.reference_id}`
        : undefined
    );

    const lines = data.lines.map(line => {
      const account = this.accountRepo.findById(line.account_id, tenantId);
      if (!account) {
        throw new Error(`Account not found: ${line.account_id}`);
      }

      const debit = line.debit ?? line.debit_amount ?? 0;
      const credit = line.credit ?? line.credit_amount ?? 0;

      return {
        account_id: line.account_id,
        account_code: line.account_code ?? account.code,
        account_name: line.account_name ?? account.name,
        description: line.description ?? line.narration,
        debit,
        credit,
        base_debit: debit,
        base_credit: credit,
        cost_center_id: line.cost_center_id
      };
    });
    
    return this.journalRepo.createWithLines(
      {
        tenant_id: tenantId,
        voucher_number: entryNumber,
        journal_type: 'general',
        date: data.date,
        reference,
        narration: data.narration,
        total_debit: 0, // Will be calculated
        total_credit: 0,
        is_posted: 0,
        created_by: createdBy
      },
      lines
    );
  }

  /**
   * Post journal entry
   */
  postJournalEntry(id: string, tenantId: string): boolean {
    return this.journalRepo.post(id, tenantId);
  }

  /**
   * Get journal entry with lines
   */
  getJournalEntry(id: string, tenantId: string) {
    return this.journalRepo.getWithLines(id, tenantId);
  }

  /**
   * Get account ledger
   */
  getAccountLedger(tenantId: string, accountId: string, fromDate: string, toDate: string) {
    return this.journalRepo.getLedger(tenantId, accountId, fromDate, toDate);
  }

  // ==================== Financial Reports ====================

  /**
   * Generate Profit & Loss Statement
   */
  getProfitAndLoss(tenantId: string, fromDate: string, toDate: string) {
    const db = getDatabase();
    
    // Income
    const income = db.prepare(`
      SELECT a.code, a.name, COALESCE(SUM(jel.credit_amount) - SUM(jel.debit_amount), 0) as amount
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
        AND je.status = 'posted' AND je.date BETWEEN ? AND ?
      WHERE a.tenant_id = ? AND a.account_type = 'income' AND a.is_active = 1
      GROUP BY a.id
      ORDER BY a.code
    `).all(fromDate, toDate, tenantId);
    
    // Expenses
    const expenses = db.prepare(`
      SELECT a.code, a.name, COALESCE(SUM(jel.debit_amount) - SUM(jel.credit_amount), 0) as amount
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
        AND je.status = 'posted' AND je.date BETWEEN ? AND ?
      WHERE a.tenant_id = ? AND a.account_type = 'expense' AND a.is_active = 1
      GROUP BY a.id
      ORDER BY a.code
    `).all(fromDate, toDate, tenantId);
    
    const totalIncome = (income as Array<{ amount: number }>).reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = (expenses as Array<{ amount: number }>).reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    
    return {
      period: { from: fromDate, to: toDate },
      income,
      totalIncome,
      expenses,
      totalExpenses,
      netProfit
    };
  }

  /**
   * Generate Balance Sheet
   */
  getBalanceSheet(tenantId: string, asOfDate: string) {
    const db = getDatabase();
    
    const getAccountsByType = (type: string) => db.prepare(`
      SELECT a.code, a.name, a.account_sub_type,
        CASE 
          WHEN a.account_type IN ('asset', 'expense') 
          THEN COALESCE(SUM(jel.debit_amount) - SUM(jel.credit_amount), 0)
          ELSE COALESCE(SUM(jel.credit_amount) - SUM(jel.debit_amount), 0)
        END as balance
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
        AND je.status = 'posted' AND je.date <= ?
      WHERE a.tenant_id = ? AND a.account_type = ? AND a.is_active = 1
      GROUP BY a.id
      HAVING balance != 0
      ORDER BY a.code
    `).all(asOfDate, tenantId, type);
    
    const assets = getAccountsByType('asset');
    const liabilities = getAccountsByType('liability');
    const equity = getAccountsByType('equity');
    
    const totalAssets = (assets as Array<{ balance: number }>).reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = (liabilities as Array<{ balance: number }>).reduce((sum, l) => sum + l.balance, 0);
    const totalEquity = (equity as Array<{ balance: number }>).reduce((sum, e) => sum + e.balance, 0);
    
    return {
      asOfDate,
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };
  }

  // ==================== Auto Journal Entries ====================

  /**
   * Create journal entry for sales invoice
   */
  createSalesInvoiceEntry(
    tenantId: string,
    invoice: {
      id: string;
      invoice_number: string;
      date: string;
      customer_id: string;
      total_amount: number;
      cgst_amount: number;
      sgst_amount: number;
      igst_amount: number;
    },
    createdBy: string
  ): JournalEntry {
    const accounts = {
      receivable: this.accountRepo.findByCode(tenantId, '1130'), // Accounts Receivable
      sales: this.accountRepo.findByCode(tenantId, '4110'), // Sales
      cgst: this.accountRepo.findByCode(tenantId, '2131'), // CGST Payable
      sgst: this.accountRepo.findByCode(tenantId, '2132'), // SGST Payable
      igst: this.accountRepo.findByCode(tenantId, '2133') // IGST Payable
    };
    
    const lines: Array<{
      account_id: string;
      debit_amount: number;
      credit_amount: number;
      narration?: string;
    }> = [];
    
    // Debit Accounts Receivable
    const totalWithGst = invoice.total_amount + invoice.cgst_amount + invoice.sgst_amount + invoice.igst_amount;
    lines.push({
      account_id: accounts.receivable!.id,
      debit_amount: round(totalWithGst),
      credit_amount: 0,
      narration: `Invoice ${invoice.invoice_number}`
    });
    
    // Credit Sales
    lines.push({
      account_id: accounts.sales!.id,
      debit_amount: 0,
      credit_amount: round(invoice.total_amount),
      narration: `Sales - Invoice ${invoice.invoice_number}`
    });
    
    // Credit GST accounts
    if (invoice.cgst_amount > 0) {
      lines.push({
        account_id: accounts.cgst!.id,
        debit_amount: 0,
        credit_amount: round(invoice.cgst_amount)
      });
    }
    if (invoice.sgst_amount > 0) {
      lines.push({
        account_id: accounts.sgst!.id,
        debit_amount: 0,
        credit_amount: round(invoice.sgst_amount)
      });
    }
    if (invoice.igst_amount > 0) {
      lines.push({
        account_id: accounts.igst!.id,
        debit_amount: 0,
        credit_amount: round(invoice.igst_amount)
      });
    }
    
    return this.createJournalEntry(
      tenantId,
      {
        date: invoice.date,
        narration: `Sales Invoice - ${invoice.invoice_number}`,
        reference_type: 'sales_invoice',
        reference_id: invoice.id,
        lines
      },
      createdBy
    );
  }

  /**
   * Create journal entry for customer receipt
   */
  createCustomerReceiptEntry(
    tenantId: string,
    receipt: {
      id: string;
      receipt_number: string;
      date: string;
      customer_id: string;
      amount: number;
      bank_account_id: string;
    },
    createdBy: string
  ): JournalEntry {
    const receivableAccount = this.accountRepo.findByCode(tenantId, '1130');
    
    return this.createJournalEntry(
      tenantId,
      {
        date: receipt.date,
        narration: `Customer Receipt - ${receipt.receipt_number}`,
        reference_type: 'customer_receipt',
        reference_id: receipt.id,
        lines: [
          {
            account_id: receipt.bank_account_id,
            debit_amount: round(receipt.amount),
            credit_amount: 0,
            narration: `Receipt ${receipt.receipt_number}`
          },
          {
            account_id: receivableAccount!.id,
            debit_amount: 0,
            credit_amount: round(receipt.amount),
            narration: `Receipt ${receipt.receipt_number}`
          }
        ]
      },
      createdBy
    );
  }

  /**
   * Create journal entry for purchase invoice
   */
  createPurchaseInvoiceEntry(
    tenantId: string,
    invoice: {
      id: string;
      invoice_number: string;
      date: string;
      vendor_id: string;
      total_amount: number;
      cgst_amount: number;
      sgst_amount: number;
      igst_amount: number;
    },
    createdBy: string
  ): JournalEntry {
    const accounts = {
      payable: this.accountRepo.findByCode(tenantId, '2110'), // Accounts Payable
      purchase: this.accountRepo.findByCode(tenantId, '5110'), // Material Consumed
      cgstInput: this.accountRepo.findByCode(tenantId, '1170'), // GST Input Credit
    };
    
    const totalGst = invoice.cgst_amount + invoice.sgst_amount + invoice.igst_amount;
    
    return this.createJournalEntry(
      tenantId,
      {
        date: invoice.date,
        narration: `Purchase Invoice - ${invoice.invoice_number}`,
        reference_type: 'purchase_invoice',
        reference_id: invoice.id,
        lines: [
          {
            account_id: accounts.purchase!.id,
            debit_amount: round(invoice.total_amount),
            credit_amount: 0,
            narration: `Purchase - Invoice ${invoice.invoice_number}`
          },
          {
            account_id: accounts.cgstInput!.id,
            debit_amount: round(totalGst),
            credit_amount: 0,
            narration: `GST Input Credit - Invoice ${invoice.invoice_number}`
          },
          {
            account_id: accounts.payable!.id,
            debit_amount: 0,
            credit_amount: round(invoice.total_amount + totalGst),
            narration: `Invoice ${invoice.invoice_number}`
          }
        ]
      },
      createdBy
    );
  }
}

// Export singleton instance (lazy initialization)
let _financeService: FinanceService | null = null;
export const getFinanceService = (): FinanceService => {
  if (!_financeService) {
    _financeService = new FinanceService();
  }
  return _financeService;
};

// For backward compatibility - use getFinanceService() instead
export { getFinanceService as financeService };

