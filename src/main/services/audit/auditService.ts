/**
 * Audit Service - MCA Compliant Cryptographically Chained Audit Trail
 * 
 * Per Companies Act 2013 and The ERP Architect's Handbook:
 * - Immutable audit trail with no UPDATE/DELETE capability
 * - Cryptographic hash chaining for tamper detection
 * - Sequence number for gap detection
 * - Periodic verification capability
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from 'better-sqlite3';

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  sequence_number: number;
  user_id: string;
  user_name: string;
  timestamp: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  previous_hash: string | null;
  current_hash: string;
  fiscal_year_id?: string;
  module?: string;
  criticality: 'low' | 'normal' | 'high' | 'critical';
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export interface AuditContext {
  tenantId: string;
  userId: string;
  userName: string;
  fiscalYearId?: string;
  module?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface VerificationResult {
  isValid: boolean;
  recordsVerified: number;
  firstInvalidSequence?: number;
  errorMessage?: string;
}

/**
 * Determines criticality based on table and action
 */
function determineCriticality(
  tableName: string,
  action: string
): 'low' | 'normal' | 'high' | 'critical' {
  // Critical: Financial transactions, tax compliance
  const criticalTables = [
    'journal_entries',
    'journal_entry_lines',
    'sales_invoices',
    'purchase_invoices',
    'e_invoices',
    'eway_bills',
    'tds_transactions',
    'tds_challans',
    'gstr2b_entries',
  ];

  // High: Master data, inventory movements
  const highTables = [
    'accounts',
    'customers',
    'vendors',
    'items',
    'stock_moves',
    'stock_valuations',
    'bank_accounts',
    'payslips',
  ];

  // Low: Configuration, lookup tables
  const lowTables = [
    'auto_number_series',
    'hsn_codes',
    'picking_strategies',
    'shifts',
    'loyalty_programs',
  ];

  if (criticalTables.includes(tableName)) {
    return 'critical';
  }
  if (highTables.includes(tableName)) {
    return 'high';
  }
  if (lowTables.includes(tableName)) {
    return 'low';
  }

  // Delete operations are always high criticality
  if (action === 'DELETE') {
    return 'high';
  }

  return 'normal';
}

/**
 * Computes SHA-256 hash for audit chain integrity
 */
function computeHash(
  sequenceNumber: number,
  tableName: string,
  recordId: string,
  action: string,
  oldValues: string | null,
  newValues: string | null,
  previousHash: string | null,
  timestamp: string
): string {
  const dataToHash = [
    sequenceNumber.toString(),
    tableName,
    recordId,
    action,
    oldValues || '',
    newValues || '',
    previousHash || '',
    timestamp,
  ].join('|');

  return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

/**
 * Creates an audit log entry with cryptographic chaining
 */
export function createAuditLog(
  db: Database,
  context: AuditContext,
  tableName: string,
  recordId: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  oldValues: Record<string, any> | null,
  newValues: Record<string, any> | null
): AuditLogEntry {
  // Get the last audit log entry for this tenant to get previous hash
  const lastEntry = db.prepare(`
    SELECT sequence_number, current_hash 
    FROM audit_logs 
    WHERE tenant_id = ? 
    ORDER BY sequence_number DESC 
    LIMIT 1
  `).get(context.tenantId) as { sequence_number: number; current_hash: string } | undefined;

  const sequenceNumber = lastEntry ? lastEntry.sequence_number + 1 : 1;
  const previousHash = lastEntry ? lastEntry.current_hash : null;
  const timestamp = new Date().toISOString();

  const oldValuesJson = oldValues ? JSON.stringify(oldValues) : null;
  const newValuesJson = newValues ? JSON.stringify(newValues) : null;

  // Compute cryptographic hash
  const currentHash = computeHash(
    sequenceNumber,
    tableName,
    recordId,
    action,
    oldValuesJson,
    newValuesJson,
    previousHash,
    timestamp
  );

  const criticality = determineCriticality(tableName, action);

  const auditEntry: AuditLogEntry = {
    id: uuidv4(),
    tenant_id: context.tenantId,
    sequence_number: sequenceNumber,
    user_id: context.userId,
    user_name: context.userName,
    timestamp,
    table_name: tableName,
    record_id: recordId,
    action,
    old_values: oldValues,
    new_values: newValues,
    previous_hash: previousHash,
    current_hash: currentHash,
    fiscal_year_id: context.fiscalYearId,
    module: context.module,
    criticality,
    ip_address: context.ipAddress,
    user_agent: context.userAgent,
    session_id: context.sessionId,
  };

  // Insert audit log (APPEND ONLY - no updates allowed)
  db.prepare(`
    INSERT INTO audit_logs (
      id, tenant_id, sequence_number, user_id, user_name, timestamp,
      table_name, record_id, action, old_values, new_values,
      previous_hash, current_hash, fiscal_year_id, module, criticality,
      ip_address, user_agent, session_id
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `).run(
    auditEntry.id,
    auditEntry.tenant_id,
    auditEntry.sequence_number,
    auditEntry.user_id,
    auditEntry.user_name,
    auditEntry.timestamp,
    auditEntry.table_name,
    auditEntry.record_id,
    auditEntry.action,
    oldValuesJson,
    newValuesJson,
    auditEntry.previous_hash,
    auditEntry.current_hash,
    auditEntry.fiscal_year_id,
    auditEntry.module,
    auditEntry.criticality,
    auditEntry.ip_address,
    auditEntry.user_agent,
    auditEntry.session_id
  );

  return auditEntry;
}

/**
 * Verifies the integrity of the audit chain
 * Checks for:
 * 1. Sequence gaps
 * 2. Hash chain integrity
 */
export function verifyAuditChain(
  db: Database,
  tenantId: string,
  fromSequence?: number,
  toSequence?: number
): VerificationResult {
  // Get audit entries in sequence order
  let query = `
    SELECT 
      sequence_number, table_name, record_id, action,
      old_values, new_values, previous_hash, current_hash, timestamp
    FROM audit_logs
    WHERE tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (fromSequence !== undefined) {
    query += ' AND sequence_number >= ?';
    params.push(fromSequence);
  }
  if (toSequence !== undefined) {
    query += ' AND sequence_number <= ?';
    params.push(toSequence);
  }

  query += ' ORDER BY sequence_number ASC';

  const entries = db.prepare(query).all(...params) as Array<{
    sequence_number: number;
    table_name: string;
    record_id: string;
    action: string;
    old_values: string | null;
    new_values: string | null;
    previous_hash: string | null;
    current_hash: string;
    timestamp: string;
  }>;

  if (entries.length === 0) {
    return { isValid: true, recordsVerified: 0 };
  }

  let expectedSequence = fromSequence || 1;
  let previousHash: string | null = null;

  // If starting from middle, get the previous hash
  if (fromSequence && fromSequence > 1) {
    const prevEntry = db.prepare(`
      SELECT current_hash 
      FROM audit_logs 
      WHERE tenant_id = ? AND sequence_number = ?
    `).get(tenantId, fromSequence - 1) as { current_hash: string } | undefined;

    if (prevEntry) {
      previousHash = prevEntry.current_hash;
    }
  }

  for (const entry of entries) {
    // Check sequence continuity
    if (entry.sequence_number !== expectedSequence) {
      return {
        isValid: false,
        recordsVerified: expectedSequence - (fromSequence || 1),
        firstInvalidSequence: expectedSequence,
        errorMessage: `Sequence gap detected: expected ${expectedSequence}, found ${entry.sequence_number}`,
      };
    }

    // Verify previous hash matches
    if (entry.previous_hash !== previousHash) {
      return {
        isValid: false,
        recordsVerified: expectedSequence - (fromSequence || 1),
        firstInvalidSequence: entry.sequence_number,
        errorMessage: `Previous hash mismatch at sequence ${entry.sequence_number}`,
      };
    }

    // Recompute hash and verify
    const computedHash = computeHash(
      entry.sequence_number,
      entry.table_name,
      entry.record_id,
      entry.action,
      entry.old_values,
      entry.new_values,
      entry.previous_hash,
      entry.timestamp
    );

    if (computedHash !== entry.current_hash) {
      return {
        isValid: false,
        recordsVerified: expectedSequence - (fromSequence || 1),
        firstInvalidSequence: entry.sequence_number,
        errorMessage: `Hash verification failed at sequence ${entry.sequence_number}: data may have been tampered`,
      };
    }

    previousHash = entry.current_hash;
    expectedSequence++;
  }

  // Record verification result
  const verificationId = uuidv4();
  const verificationHash = crypto
    .createHash('sha256')
    .update(`${tenantId}|${fromSequence || 1}|${toSequence || entries[entries.length - 1].sequence_number}|${entries.length}|valid`)
    .digest('hex');

  db.prepare(`
    INSERT INTO audit_chain_verifications (
      id, tenant_id, verified_at, from_sequence, to_sequence,
      records_verified, is_valid, verification_hash
    ) VALUES (?, ?, datetime('now'), ?, ?, ?, 1, ?)
  `).run(
    verificationId,
    tenantId,
    fromSequence || 1,
    toSequence || entries[entries.length - 1].sequence_number,
    entries.length,
    verificationHash
  );

  return {
    isValid: true,
    recordsVerified: entries.length,
  };
}

/**
 * Gets audit trail for a specific record
 */
export function getRecordAuditTrail(
  db: Database,
  tenantId: string,
  tableName: string,
  recordId: string
): AuditLogEntry[] {
  const entries = db.prepare(`
    SELECT * FROM audit_logs
    WHERE tenant_id = ? AND table_name = ? AND record_id = ?
    ORDER BY sequence_number ASC
  `).all(tenantId, tableName, recordId) as any[];

  return entries.map(entry => ({
    ...entry,
    old_values: entry.old_values ? JSON.parse(entry.old_values) : null,
    new_values: entry.new_values ? JSON.parse(entry.new_values) : null,
  }));
}

/**
 * Gets audit logs with filters
 */
export function getAuditLogs(
  db: Database,
  tenantId: string,
  filters: {
    fromDate?: string;
    toDate?: string;
    tableName?: string;
    action?: string;
    userId?: string;
    module?: string;
    criticality?: string;
    limit?: number;
    offset?: number;
  }
): { entries: AuditLogEntry[]; total: number } {
  let query = `SELECT * FROM audit_logs WHERE tenant_id = ?`;
  let countQuery = `SELECT COUNT(*) as count FROM audit_logs WHERE tenant_id = ?`;
  const params: any[] = [tenantId];

  if (filters.fromDate) {
    query += ' AND timestamp >= ?';
    countQuery += ' AND timestamp >= ?';
    params.push(filters.fromDate);
  }
  if (filters.toDate) {
    query += ' AND timestamp <= ?';
    countQuery += ' AND timestamp <= ?';
    params.push(filters.toDate);
  }
  if (filters.tableName) {
    query += ' AND table_name = ?';
    countQuery += ' AND table_name = ?';
    params.push(filters.tableName);
  }
  if (filters.action) {
    query += ' AND action = ?';
    countQuery += ' AND action = ?';
    params.push(filters.action);
  }
  if (filters.userId) {
    query += ' AND user_id = ?';
    countQuery += ' AND user_id = ?';
    params.push(filters.userId);
  }
  if (filters.module) {
    query += ' AND module = ?';
    countQuery += ' AND module = ?';
    params.push(filters.module);
  }
  if (filters.criticality) {
    query += ' AND criticality = ?';
    countQuery += ' AND criticality = ?';
    params.push(filters.criticality);
  }

  const { count } = db.prepare(countQuery).get(...params) as { count: number };

  query += ' ORDER BY sequence_number DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  if (filters.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  const entries = db.prepare(query).all(...params) as any[];

  return {
    entries: entries.map(entry => ({
      ...entry,
      old_values: entry.old_values ? JSON.parse(entry.old_values) : null,
      new_values: entry.new_values ? JSON.parse(entry.new_values) : null,
    })),
    total: count,
  };
}

/**
 * Higher-order function to wrap database operations with audit logging
 */
export function withAudit<T>(
  db: Database,
  context: AuditContext,
  operation: () => { tableName: string; recordId: string; action: 'INSERT' | 'UPDATE' | 'DELETE'; oldValues?: Record<string, any>; newValues?: Record<string, any>; result: T }
): T {
  const { tableName, recordId, action, oldValues, newValues, result } = operation();
  
  createAuditLog(
    db,
    context,
    tableName,
    recordId,
    action,
    oldValues || null,
    newValues || null
  );

  return result;
}

export default {
  createAuditLog,
  verifyAuditChain,
  getRecordAuditTrail,
  getAuditLogs,
  withAudit,
};
