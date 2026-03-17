/**
 * SA ERP - Account Repository
 */

import { BaseRepository, generateId } from '../../database/repository';
import { Account, JournalEntry, JournalEntryLine } from '../../../shared/types';

type JournalEntryCreateInput = {
  tenant_id: string;
  voucher_number: string;
  journal_type: JournalEntry['journal_type'];
  date: string;
  reference?: string;
  narration?: string;
  total_debit?: number;
  total_credit?: number;
  is_posted?: number;
  created_by: string;
};

type JournalEntryLineCreateInput = {
  account_id: string;
  account_code: string;
  account_name: string;
  description?: string;
  debit: number;
  credit: number;
  base_debit?: number;
  base_credit?: number;
  cost_center_id?: string;
  party_type?: 'customer' | 'vendor';
  party_id?: string;
  tax_code?: string;
};

export class AccountRepository extends BaseRepository<Account> {
  constructor() {
    super('accounts');
  }

  /**
   * Find account by code
   */
  findByCode(tenantId: string, code: string): Account | undefined {
    return this.query<Account>(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = ? AND code = ? AND is_active = 1`,
      [tenantId, code]
    )[0];
  }

  /**
   * Get chart of accounts as tree
   */
  getChartOfAccounts(tenantId: string): Account[] {
    return this.query<Account>(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = ? AND is_active = 1 ORDER BY code`,
      [tenantId]
    );
  }

  /**
   * Get accounts by type
   */
  getByType(tenantId: string, accountType: string): Account[] {
    return this.query<Account>(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = ? AND account_type = ? AND is_active = 1 ORDER BY code`,
      [tenantId, accountType]
    );
  }

  /**
   * Get account balance
   */
  getBalance(tenantId: string, accountId: string, asOfDate?: string): number {
    const dateFilter = asOfDate ? `AND je.date <= '${asOfDate}'` : '';
    
    const result = this.query<{ balance: number }>(
      `SELECT COALESCE(SUM(jel.debit) - SUM(jel.credit), 0) as balance
       FROM journal_entry_lines jel
       JOIN journal_entries je ON je.id = jel.journal_entry_id
       WHERE jel.account_id = ? 
       AND je.tenant_id = ?
       AND je.is_posted = 1
       ${dateFilter}`,
      [accountId, tenantId]
    );
    
    return result[0]?.balance || 0;
  }

  /**
   * Get trial balance
   */
  getTrialBalance(tenantId: string, asOfDate?: string): Array<Account & { debit: number; credit: number }> {
    const dateFilter = asOfDate ? `AND je.date <= '${asOfDate}'` : '';
    
    return this.query(
      `SELECT 
        a.*,
        COALESCE(SUM(jel.debit), 0) as debit,
        COALESCE(SUM(jel.credit), 0) as credit
       FROM accounts a
       LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
       LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_posted = 1 ${dateFilter}
       WHERE a.tenant_id = ? AND a.is_active = 1
       GROUP BY a.id
       HAVING debit > 0 OR credit > 0
       ORDER BY a.code`,
      [tenantId]
    );
  }
}

export class JournalEntryRepository extends BaseRepository<JournalEntry> {
  constructor() {
    super('journal_entries');
  }

  /**
   * Create journal entry with lines (double-entry)
   */
  createWithLines(
    entry: JournalEntryCreateInput,
    lines: JournalEntryLineCreateInput[]
  ): JournalEntry {
    return this.transaction(() => {
      const entryId = generateId();
      
      // Validate double-entry (debits = credits)
      const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Journal entry not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
      }
      
      // Insert journal entry
      this.execute(
        `INSERT INTO journal_entries (
          id, tenant_id, voucher_number, journal_type, date, reference,
          narration, total_debit, total_credit, is_posted, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entryId,
          entry.tenant_id,
          entry.voucher_number,
          entry.journal_type,
          entry.date,
          entry.reference || null,
          entry.narration,
          totalDebit,
          totalCredit,
          entry.is_posted || 0,
          entry.created_by
        ]
      );
      
      // Insert lines
      let lineNumber = 1;
      for (const line of lines) {
        this.execute(
          `INSERT INTO journal_entry_lines (
            id, journal_entry_id, line_number, account_id, account_code, account_name,
            description, debit, credit, base_debit, base_credit,
            cost_center_id, party_type, party_id, tax_code, reconciled
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            generateId(),
            entryId,
            lineNumber,
            line.account_id,
            line.account_code,
            line.account_name,
            line.description || null,
            line.debit,
            line.credit,
            line.base_debit ?? line.debit,
            line.base_credit ?? line.credit,
            line.cost_center_id || null,
            line.party_type || null,
            line.party_id || null,
            line.tax_code || null
          ]
        );
        lineNumber += 1;
      }
      
      return this.findById(entryId, entry.tenant_id) as JournalEntry;
    });
  }

  /**
   * Get journal entry with lines
   */
  getWithLines(id: string, tenantId: string): JournalEntry & { lines: JournalEntryLine[] } | undefined {
    const entry = this.findById(id, tenantId);
    if (!entry) return undefined;
    
    const lines = this.query<JournalEntryLine>(
      `SELECT jel.*, a.code as account_code, a.name as account_name
       FROM journal_entry_lines jel
       JOIN accounts a ON a.id = jel.account_id
       WHERE jel.journal_entry_id = ?`,
      [id]
    );
    
    return { ...entry, lines };
  }

  /**
   * Post journal entry
   */
  post(id: string, tenantId: string): boolean {
    const result = this.execute(
      `UPDATE journal_entries SET is_posted = 1, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );
    return result.changes > 0;
  }

  /**
   * Get next entry number
   */
  getNextEntryNumber(tenantId: string, prefix: string = 'JV'): string {
    const result = this.query<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(voucher_number, ${prefix.length + 1}) AS INTEGER)) as max_num
       FROM journal_entries 
       WHERE tenant_id = ? AND voucher_number LIKE ?`,
      [tenantId, `${prefix}%`]
    );
    
    const nextNum = (result[0]?.max_num || 0) + 1;
    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
  }

  /**
   * Get ledger entries for an account
   */
  getLedger(
    tenantId: string,
    accountId: string,
    fromDate: string,
    toDate: string
  ): Array<{
    date: string;
    entry_number: string;
    narration: string;
    debit: number;
    credit: number;
    balance: number;
  }> {
    // Get opening balance
    const openingResult = this.query<{ balance: number }>(
      `SELECT COALESCE(SUM(jel.debit) - SUM(jel.credit), 0) as balance
       FROM journal_entry_lines jel
       JOIN journal_entries je ON je.id = jel.journal_entry_id
       WHERE jel.account_id = ? AND je.tenant_id = ? AND je.is_posted = 1 AND je.date < ?`,
      [accountId, tenantId, fromDate]
    );
    
    let runningBalance = openingResult[0]?.balance || 0;
    
    // Get entries in date range
    const entries = this.query<{
      date: string;
      entry_number: string;
      narration: string;
      debit: number;
      credit: number;
    }>(
      `SELECT 
        je.date,
        je.voucher_number as entry_number,
        COALESCE(jel.description, je.narration) as narration,
        jel.debit as debit,
        jel.credit as credit
       FROM journal_entry_lines jel
       JOIN journal_entries je ON je.id = jel.journal_entry_id
       WHERE jel.account_id = ? AND je.tenant_id = ? AND je.is_posted = 1
       AND je.date BETWEEN ? AND ?
       ORDER BY je.date, je.voucher_number`,
      [accountId, tenantId, fromDate, toDate]
    );
    
    // Calculate running balance
    const result = entries.map(entry => {
      runningBalance += entry.debit - entry.credit;
      return { ...entry, balance: runningBalance };
    });
    
    return result;
  }
}

