/**
 * Bank Reconciliation Service
 * 
 * Per The ERP Architect's Handbook:
 * - Auto-match algorithm with fuzzy matching
 * - Statement import from multiple formats
 * - Rule-based matching
 * - Manual reconciliation support
 */

import { v4 as uuidv4 } from 'uuid';
import type { Database } from 'better-sqlite3';

export interface BankStatementEntry {
  id: string;
  import_id: string;
  tenant_id: string;
  bank_account_id: string;
  transaction_date: string;
  value_date?: string;
  reference_number?: string;
  description: string;
  transaction_type: 'debit' | 'credit';
  amount: number;
  balance?: number;
  cheque_number?: string;
  party_name?: string;
  utr_number?: string;
  match_confidence: number;
  matched_type?: string;
  matched_id?: string;
  reconciliation_status: 'unmatched' | 'matched' | 'reconciled' | 'excluded';
}

export interface MatchCandidate {
  type: 'customer_receipt' | 'vendor_payment' | 'journal_entry' | 'expense';
  id: string;
  reference_number: string;
  date: string;
  amount: number;
  party_name?: string;
  confidence: number;
  match_reasons: string[];
}

export interface ReconciliationSummary {
  total_book_entries: number;
  total_bank_entries: number;
  matched_entries: number;
  unmatched_book: number;
  unmatched_bank: number;
  opening_balance_book: number;
  opening_balance_bank: number;
  closing_balance_book: number;
  closing_balance_bank: number;
  difference: number;
}

/**
 * Import bank statement
 */
export function importBankStatement(
  db: Database,
  tenantId: string,
  bankAccountId: string,
  entries: Array<{
    transactionDate: string;
    valueDate?: string;
    referenceNumber?: string;
    description: string;
    transactionType: 'debit' | 'credit';
    amount: number;
    balance?: number;
    chequeNumber?: string;
    partyName?: string;
    utrNumber?: string;
  }>,
  importedBy: string,
  fileName: string,
  fileFormat: string
): { importId: string; entriesImported: number } {
  if (entries.length === 0) {
    throw new Error('No entries to import');
  }

  // Sort entries by date
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  );

  const statementFrom = sortedEntries[0].transactionDate;
  const statementTo = sortedEntries[sortedEntries.length - 1].transactionDate;
  const openingBalance = sortedEntries[0].balance 
    ? sortedEntries[0].balance - (sortedEntries[0].transactionType === 'credit' ? sortedEntries[0].amount : -sortedEntries[0].amount)
    : 0;
  const closingBalance = sortedEntries[sortedEntries.length - 1].balance || 0;
  
  const totalDebits = sortedEntries.filter(e => e.transactionType === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredits = sortedEntries.filter(e => e.transactionType === 'credit').reduce((s, e) => s + e.amount, 0);

  const importId = uuidv4();

  db.prepare(`
    INSERT INTO bank_statement_imports (
      id, tenant_id, bank_account_id, import_date, file_name, file_format,
      statement_from, statement_to, opening_balance, closing_balance,
      total_entries, total_debits, total_credits, imported_by, status
    ) VALUES (?, ?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'imported')
  `).run(
    importId, tenantId, bankAccountId, fileName, fileFormat,
    statementFrom, statementTo, openingBalance, closingBalance,
    entries.length, totalDebits, totalCredits, importedBy
  );

  // Insert entries
  const insertStmt = db.prepare(`
    INSERT INTO bank_statement_entries (
      id, import_id, tenant_id, bank_account_id, transaction_date, value_date,
      reference_number, description, transaction_type, amount, balance,
      cheque_number, party_name, utr_number, reconciliation_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unmatched')
  `);

  for (const entry of sortedEntries) {
    insertStmt.run(
      uuidv4(), importId, tenantId, bankAccountId,
      entry.transactionDate, entry.valueDate, entry.referenceNumber,
      entry.description, entry.transactionType, entry.amount, entry.balance,
      entry.chequeNumber, entry.partyName, entry.utrNumber
    );
  }

  return { importId, entriesImported: entries.length };
}

/**
 * Auto-match bank statement entries with book entries
 */
export function autoMatchEntries(
  db: Database,
  tenantId: string,
  bankAccountId: string,
  importId?: string
): { matched: number; unmatched: number } {
  // Get unmatched bank entries
  let query = `
    SELECT * FROM bank_statement_entries
    WHERE tenant_id = ? AND bank_account_id = ? AND reconciliation_status = 'unmatched'
  `;
  const params: any[] = [tenantId, bankAccountId];

  if (importId) {
    query += ' AND import_id = ?';
    params.push(importId);
  }

  const bankEntries = db.prepare(query).all(...params) as BankStatementEntry[];

  // Get matching rules
  const rules = db.prepare(`
    SELECT * FROM bank_match_rules
    WHERE tenant_id = ? AND is_active = 1
    ORDER BY priority DESC
  `).all(tenantId) as any[];

  let matched = 0;
  let unmatched = 0;

  for (const entry of bankEntries) {
    const candidates = findMatchCandidates(db, tenantId, bankAccountId, entry, rules);
    
    if (candidates.length > 0) {
      // Take the best match
      const bestMatch = candidates[0];
      
      if (bestMatch.confidence >= 0.8) {
        // Auto-match
        db.prepare(`
          UPDATE bank_statement_entries SET
            match_confidence = ?,
            matched_type = ?,
            matched_id = ?,
            matched_at = datetime('now'),
            reconciliation_status = 'matched'
          WHERE id = ?
        `).run(bestMatch.confidence, bestMatch.type, bestMatch.id, entry.id);
        matched++;
      } else {
        // Store suggestion but don't auto-match
        db.prepare(`
          UPDATE bank_statement_entries SET
            match_confidence = ?,
            matched_type = ?,
            matched_id = ?
          WHERE id = ?
        `).run(bestMatch.confidence, bestMatch.type, bestMatch.id, entry.id);
        unmatched++;
      }
    } else {
      unmatched++;
    }
  }

  return { matched, unmatched };
}

/**
 * Find matching candidates for a bank entry
 */
function findMatchCandidates(
  db: Database,
  tenantId: string,
  bankAccountId: string,
  entry: BankStatementEntry,
  rules: any[]
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  const dateRange = 7; // Days to look around

  // Calculate date range
  const entryDate = new Date(entry.transaction_date);
  const fromDate = new Date(entryDate);
  fromDate.setDate(fromDate.getDate() - dateRange);
  const toDate = new Date(entryDate);
  toDate.setDate(toDate.getDate() + dateRange);

  if (entry.transaction_type === 'credit') {
    // Look for customer receipts
    const receipts = db.prepare(`
      SELECT cr.*, c.name as customer_name
      FROM customer_receipts cr
      JOIN customers c ON cr.customer_id = c.id
      WHERE cr.tenant_id = ? AND cr.bank_account_id = ?
      AND cr.date BETWEEN ? AND ?
      AND NOT EXISTS (
        SELECT 1 FROM bank_statement_entries bse
        WHERE bse.matched_id = cr.id AND bse.matched_type = 'customer_receipt'
        AND bse.reconciliation_status IN ('matched', 'reconciled')
      )
    `).all(
      tenantId, bankAccountId,
      fromDate.toISOString().split('T')[0],
      toDate.toISOString().split('T')[0]
    ) as any[];

    for (const receipt of receipts) {
      const confidence = calculateMatchConfidence(entry, receipt, rules);
      if (confidence > 0) {
        candidates.push({
          type: 'customer_receipt',
          id: receipt.id,
          reference_number: receipt.receipt_number,
          date: receipt.date,
          amount: receipt.amount,
          party_name: receipt.customer_name,
          confidence,
          match_reasons: getMatchReasons(entry, receipt),
        });
      }
    }
  } else {
    // Look for vendor payments
    const payments = db.prepare(`
      SELECT vp.*, v.name as vendor_name
      FROM vendor_payments vp
      JOIN vendors v ON vp.vendor_id = v.id
      WHERE vp.tenant_id = ? AND vp.bank_account_id = ?
      AND vp.date BETWEEN ? AND ?
      AND NOT EXISTS (
        SELECT 1 FROM bank_statement_entries bse
        WHERE bse.matched_id = vp.id AND bse.matched_type = 'vendor_payment'
        AND bse.reconciliation_status IN ('matched', 'reconciled')
      )
    `).all(
      tenantId, bankAccountId,
      fromDate.toISOString().split('T')[0],
      toDate.toISOString().split('T')[0]
    ) as any[];

    for (const payment of payments) {
      const confidence = calculateMatchConfidence(entry, payment, rules);
      if (confidence > 0) {
        candidates.push({
          type: 'vendor_payment',
          id: payment.id,
          reference_number: payment.payment_number,
          date: payment.date,
          amount: payment.amount,
          party_name: payment.vendor_name,
          confidence,
          match_reasons: getMatchReasons(entry, payment),
        });
      }
    }
  }

  // Sort by confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  return candidates;
}

/**
 * Calculate match confidence
 */
function calculateMatchConfidence(
  bankEntry: BankStatementEntry,
  bookEntry: any,
  rules: any[]
): number {
  let confidence = 0;
  const reasons: string[] = [];

  // Amount match
  const amountDiff = Math.abs(bankEntry.amount - bookEntry.amount);
  const amountTolerance = 0.01; // 1 paisa tolerance
  
  if (amountDiff <= amountTolerance) {
    confidence += 0.4; // 40% weight for exact amount match
    reasons.push('Exact amount match');
  } else if (amountDiff <= 1) {
    confidence += 0.3; // 30% for close match
    reasons.push('Amount within ₹1');
  } else {
    return 0; // Amount must match at least approximately
  }

  // Date match
  const bankDate = new Date(bankEntry.transaction_date);
  const bookDate = new Date(bookEntry.date);
  const daysDiff = Math.abs((bankDate.getTime() - bookDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    confidence += 0.2;
    reasons.push('Same date');
  } else if (daysDiff <= 1) {
    confidence += 0.15;
    reasons.push('Within 1 day');
  } else if (daysDiff <= 3) {
    confidence += 0.1;
    reasons.push('Within 3 days');
  }

  // Reference number match
  if (bankEntry.reference_number && bookEntry.reference_number) {
    const bankRef = bankEntry.reference_number.toLowerCase().replace(/\s/g, '');
    const bookRef = bookEntry.reference_number.toLowerCase().replace(/\s/g, '');
    
    if (bankRef === bookRef) {
      confidence += 0.2;
      reasons.push('Reference number match');
    } else if (bankRef.includes(bookRef) || bookRef.includes(bankRef)) {
      confidence += 0.1;
      reasons.push('Partial reference match');
    }
  }

  // UTR match
  if (bankEntry.utr_number && bookEntry.utr_number) {
    if (bankEntry.utr_number === bookEntry.utr_number) {
      confidence += 0.15;
      reasons.push('UTR match');
    }
  }

  // Cheque number match
  if (bankEntry.cheque_number && bookEntry.cheque_number) {
    if (bankEntry.cheque_number === bookEntry.cheque_number) {
      confidence += 0.15;
      reasons.push('Cheque number match');
    }
  }

  // Party name match (fuzzy)
  if (bankEntry.party_name && bookEntry.customer_name || bookEntry.vendor_name) {
    const bankParty = (bankEntry.party_name || '').toLowerCase();
    const bookParty = ((bookEntry.customer_name || bookEntry.vendor_name) || '').toLowerCase();
    
    if (bankParty && bookParty) {
      const similarity = calculateStringSimilarity(bankParty, bookParty);
      if (similarity > 0.7) {
        confidence += 0.1 * similarity;
        reasons.push('Party name match');
      }
    }
  }

  // Apply rule-based boosts
  for (const rule of rules) {
    if (matchesRule(bankEntry, rule)) {
      confidence += rule.confidence_boost || 0;
    }
  }

  return Math.min(confidence, 1);
}

/**
 * Get match reasons for display
 */
function getMatchReasons(bankEntry: BankStatementEntry, bookEntry: any): string[] {
  const reasons: string[] = [];
  
  if (Math.abs(bankEntry.amount - bookEntry.amount) <= 0.01) {
    reasons.push('Exact amount match');
  }
  
  const bankDate = new Date(bankEntry.transaction_date);
  const bookDate = new Date(bookEntry.date);
  const daysDiff = Math.abs((bankDate.getTime() - bookDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) reasons.push('Same date');
  else if (daysDiff <= 1) reasons.push('Date within 1 day');
  
  return reasons;
}

/**
 * Check if entry matches a rule
 */
function matchesRule(entry: BankStatementEntry, rule: any): boolean {
  if (rule.description_contains) {
    const keywords = rule.description_contains.split(',').map((k: string) => k.trim().toLowerCase());
    const description = entry.description.toLowerCase();
    if (!keywords.some((k: string) => description.includes(k))) {
      return false;
    }
  }

  if (rule.min_amount && entry.amount < rule.min_amount) return false;
  if (rule.max_amount && entry.amount > rule.max_amount) return false;

  return true;
}

/**
 * Calculate string similarity (Levenshtein-based)
 */
function calculateStringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Manual match/unmatch
 */
export function manualMatch(
  db: Database,
  bankEntryId: string,
  matchType: string,
  matchId: string,
  matchedBy: string
): void {
  db.prepare(`
    UPDATE bank_statement_entries SET
      match_confidence = 1.0,
      matched_type = ?,
      matched_id = ?,
      matched_at = datetime('now'),
      matched_by = ?,
      is_manually_matched = 1,
      reconciliation_status = 'matched'
    WHERE id = ?
  `).run(matchType, matchId, matchedBy, bankEntryId);
}

export function unmatch(db: Database, bankEntryId: string): void {
  db.prepare(`
    UPDATE bank_statement_entries SET
      match_confidence = 0,
      matched_type = NULL,
      matched_id = NULL,
      matched_at = NULL,
      matched_by = NULL,
      is_manually_matched = 0,
      reconciliation_status = 'unmatched'
    WHERE id = ?
  `).run(bankEntryId);
}

/**
 * Reconcile entries
 */
export function reconcileEntries(
  db: Database,
  bankEntryIds: string[],
  reconciledBy: string
): void {
  const placeholders = bankEntryIds.map(() => '?').join(',');
  
  db.prepare(`
    UPDATE bank_statement_entries SET
      reconciliation_status = 'reconciled',
      reconciled_at = datetime('now'),
      reconciled_by = ?
    WHERE id IN (${placeholders}) AND reconciliation_status = 'matched'
  `).run(reconciledBy, ...bankEntryIds);
}

/**
 * Get reconciliation summary
 */
export function getReconciliationSummary(
  db: Database,
  tenantId: string,
  bankAccountId: string,
  fromDate: string,
  toDate: string
): ReconciliationSummary {
  // Get bank entries
  const bankStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN reconciliation_status IN ('matched', 'reconciled') THEN 1 ELSE 0 END) as matched,
      SUM(CASE WHEN reconciliation_status = 'unmatched' THEN 1 ELSE 0 END) as unmatched
    FROM bank_statement_entries
    WHERE tenant_id = ? AND bank_account_id = ?
    AND transaction_date BETWEEN ? AND ?
  `).get(tenantId, bankAccountId, fromDate, toDate) as any;

  // Get book entries (customer receipts + vendor payments)
  const bookReceiptsCount = db.prepare(`
    SELECT COUNT(*) as count FROM customer_receipts
    WHERE tenant_id = ? AND bank_account_id = ?
    AND date BETWEEN ? AND ?
  `).get(tenantId, bankAccountId, fromDate, toDate) as { count: number };

  const bookPaymentsCount = db.prepare(`
    SELECT COUNT(*) as count FROM vendor_payments
    WHERE tenant_id = ? AND bank_account_id = ?
    AND date BETWEEN ? AND ?
  `).get(tenantId, bankAccountId, fromDate, toDate) as { count: number };

  // Get balances
  const bankAccount = db.prepare(`
    SELECT opening_balance, current_balance FROM bank_accounts WHERE id = ?
  `).get(bankAccountId) as any;

  return {
    total_book_entries: bookReceiptsCount.count + bookPaymentsCount.count,
    total_bank_entries: bankStats.total,
    matched_entries: bankStats.matched,
    unmatched_book: (bookReceiptsCount.count + bookPaymentsCount.count) - bankStats.matched,
    unmatched_bank: bankStats.unmatched,
    opening_balance_book: bankAccount?.opening_balance || 0,
    opening_balance_bank: 0, // From statement
    closing_balance_book: bankAccount?.current_balance || 0,
    closing_balance_bank: 0, // From statement
    difference: 0, // Calculate difference
  };
}

export default {
  importBankStatement,
  autoMatchEntries,
  manualMatch,
  unmatch,
  reconcileEntries,
  getReconciliationSummary,
};
