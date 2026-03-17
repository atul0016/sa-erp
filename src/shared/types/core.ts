/**
 * SA ERP - Core Type Definitions
 * Multi-tenant, Double-Entry Architecture
 */

// ==================== CORE SYSTEM TYPES ====================

export interface Tenant {
  id: string;
  code: string;
  name: string;
  gstin: string;
  pan: string;
  cin?: string;
  tan?: string;
  address: Address;
  contact: ContactInfo;
  settings: TenantSettings;
  logo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  fiscal_year_start: string; // MM-DD format
  default_currency: string;
  decimal_places: number;
  date_format: string;
  time_zone: string;
  gst_registration_type: 'regular' | 'composition' | 'unregistered';
  auto_number_series: AutoNumberSeries;
}

export interface AutoNumberSeries {
  sales_invoice: string;
  purchase_invoice: string;
  payment_voucher: string;
  receipt_voucher: string;
  journal_voucher: string;
  delivery_note: string;
  purchase_order: string;
  sales_order: string;
  production_order: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  country: string;
}

export interface ContactInfo {
  phone: string;
  mobile?: string;
  email: string;
  website?: string;
}

// ==================== USER & SECURITY TYPES ====================

export interface User {
  id: string;
  tenant_id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  roles: string[];
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  module: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'void' | 'export';
  conditions?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  timestamp: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export interface Session {
  id: string;
  user_id: string;
  tenant_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

