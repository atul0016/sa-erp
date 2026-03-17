/**
 * SA ERP - Base Repository
 * Generic repository pattern for database operations
 */

import Database from 'better-sqlite3';
import { getDatabase } from './index';

export interface QueryOptions {
  where?: Record<string, unknown>;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export abstract class BaseRepository<T> {
  protected tableName: string;
  protected db: Database.Database;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = getDatabase();
  }

  /**
   * Find a record by ID
   */
  findById(id: string, tenantId?: string): T | undefined {
    let sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const params: unknown[] = [id];

    if (tenantId) {
      sql += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  /**
   * Find all records with optional filtering
   */
  findAll(tenantId?: string, options: QueryOptions = {}): T[] {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (tenantId) {
      conditions.push('tenant_id = ?');
      params.push(tenantId);
    }

    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (value !== undefined && value !== null) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.order || 'ASC'}`;
    }

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);

      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return this.db.prepare(sql).all(...params) as T[];
  }

  /**
   * Find records with pagination
   */
  findPaginated(
    tenantId: string,
    page: number = 1,
    pageSize: number = 20,
    options: QueryOptions = {}
  ): PaginatedResult<T> {
    const offset = (page - 1) * pageSize;

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE tenant_id = ?`;
    const countParams: unknown[] = [tenantId];

    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (value !== undefined && value !== null) {
          countSql += ` AND ${key} = ?`;
          countParams.push(value);
        }
      }
    }

    const countResult = this.db.prepare(countSql).get(...countParams) as { total: number };
    const total = countResult.total;

    // Get data
    const data = this.findAll(tenantId, {
      ...options,
      limit: pageSize,
      offset
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * Find one record by conditions
   */
  findOne(tenantId: string, where: Record<string, unknown>): T | undefined {
    const results = this.findAll(tenantId, { where, limit: 1 });
    return results[0];
  }

  /**
   * Create a new record
   */
  create(data: Partial<T>): T {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    this.db.prepare(sql).run(...values);
    
    // Return the created record
    return this.findById((data as Record<string, unknown>).id as string) as T;
  }

  /**
   * Update a record by ID
   */
  update(id: string, data: Partial<T>, tenantId?: string): T | undefined {
    const entries = Object.entries(data).filter(([key]) => key !== 'id' && key !== 'tenant_id');
    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    let sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const params = [...values, id];

    if (tenantId) {
      sql += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    this.db.prepare(sql).run(...params);

    return this.findById(id, tenantId);
  }

  /**
   * Delete a record by ID (soft delete if has is_active column)
   */
  delete(id: string, tenantId?: string, softDelete: boolean = true): boolean {
    let sql: string;
    const params: unknown[] = [id];

    if (softDelete) {
      sql = `UPDATE ${this.tableName} SET is_active = 0 WHERE id = ?`;
    } else {
      sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    }

    if (tenantId) {
      sql += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    const result = this.db.prepare(sql).run(...params);
    return result.changes > 0;
  }

  /**
   * Check if a record exists
   */
  exists(id: string, tenantId?: string): boolean {
    let sql = `SELECT 1 FROM ${this.tableName} WHERE id = ?`;
    const params: unknown[] = [id];

    if (tenantId) {
      sql += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    const result = this.db.prepare(sql).get(...params);
    return !!result;
  }

  /**
   * Count records
   */
  count(tenantId: string, where?: Record<string, unknown>): number {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tenant_id = ?`;
    const params: unknown[] = [tenantId];

    if (where) {
      for (const [key, value] of Object.entries(where)) {
        if (value !== undefined && value !== null) {
          sql += ` AND ${key} = ?`;
          params.push(value);
        }
      }
    }

    const result = this.db.prepare(sql).get(...params) as { count: number };
    return result.count;
  }

  /**
   * Execute raw SQL query
   */
  protected query<R>(sql: string, params: unknown[] = []): R[] {
    return this.db.prepare(sql).all(...params) as R[];
  }

  /**
   * Execute raw SQL statement
   */
  protected execute(sql: string, params: unknown[] = []): Database.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  /**
   * Run operations in a transaction
   */
  protected transaction<R>(fn: () => R): R {
    return this.db.transaction(fn)();
  }
}

/**
 * Generate UUID v4
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate document number with prefix
 */
export function generateDocNumber(prefix: string, sequence: number, width: number = 6): string {
  const paddedNum = sequence.toString().padStart(width, '0');
  return `${prefix}${paddedNum}`;
}

/**
 * Get current fiscal year based on date
 */
export function getCurrentFiscalYear(date: Date = new Date()): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // Indian fiscal year starts April 1
  if (month >= 3) { // April onwards
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

