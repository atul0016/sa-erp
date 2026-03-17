/**
 * SA ERP - Type Index
 * Export all types from a single entry point
 */

// Core types
export * from './core';

// Financial types
export * from './finance';

// Inventory types
export * from './inventory';

// Purchase types
export * from './purchase';

// Sales types
export * from './sales';

// Manufacturing types
export * from './manufacturing';

// HRM types
export * from './hrm';

// GST types
export * from './gst';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: Record<string, unknown>;
}

export interface SearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  dateFrom?: string;
  dateTo?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  data?: Record<string, unknown>;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface AmountSummary {
  subtotal: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  roundOff: number;
  total: number;
}

