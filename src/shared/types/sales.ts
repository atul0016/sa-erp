/**
 * SA ERP - Sales Types
 * Sales, CRM & Accounts Receivable
 */

// ==================== CUSTOMER ====================

export interface Customer {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  trade_name?: string;
  customer_type: 'retail' | 'wholesale' | 'distributor' | 'corporate' | 'government';
  customer_group_id?: string;
  
  // GST Details
  gstin?: string;
  gst_registration_type: 'regular' | 'composition' | 'unregistered' | 'overseas' | 'uin_holder' | 'special_economic_zone';
  pan?: string;
  
  // Address
  billing_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
    country: string;
  };
  shipping_addresses?: Array<{
    id: string;
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
    country: string;
    gstin?: string;
    is_default: boolean;
  }>;
  
  // Contact
  contact_person?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  
  // Terms
  payment_terms_days: number;
  credit_limit: number;
  credit_days: number;
  currency: string;
  price_list_id?: string;
  
  // GL Account mapping
  receivable_account_id: string;
  revenue_account_id?: string;
  advance_account_id?: string;
  
  // TCS
  tcs_applicable: boolean;
  tcs_category?: string;
  
  // Sales person / Territory
  sales_person_id?: string;
  territory_id?: string;
  
  // Loyalty
  loyalty_points?: number;
  loyalty_tier?: string;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerGroup {
  id: string;
  tenant_id: string;
  name: string;
  discount_percent?: number;
  price_list_id?: string;
  is_active: boolean;
}

export interface Territory {
  id: string;
  tenant_id: string;
  name: string;
  parent_id?: string;
  manager_id?: string;
  is_active: boolean;
}

// ==================== PRICE LISTS ====================

export interface PriceList {
  id: string;
  tenant_id: string;
  name: string;
  currency: string;
  price_type: 'selling' | 'buying';
  is_default: boolean;
  valid_from?: string;
  valid_to?: string;
  is_active: boolean;
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  item_id: string;
  uom_id: string;
  min_qty?: number;
  price: number;
  discount_percent?: number;
  valid_from?: string;
  valid_to?: string;
}

// ==================== LEAD & OPPORTUNITY (CRM) ====================

export type LeadSource = 'website' | 'referral' | 'cold_call' | 'trade_show' | 'advertisement' | 'social_media' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost';
export type OpportunityStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface Lead {
  id: string;
  tenant_id: string;
  lead_number: string;
  
  // Contact
  company_name?: string;
  contact_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  
  // Address
  city?: string;
  state?: string;
  
  // Lead info
  source: LeadSource;
  status: LeadStatus;
  industry?: string;
  annual_revenue?: number;
  employee_count?: number;
  
  // Assignment
  assigned_to?: string;
  
  // Scoring
  lead_score?: number;
  
  // Follow-up
  next_follow_up?: string;
  
  notes?: string;
  
  // Conversion
  converted_customer_id?: string;
  converted_at?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  tenant_id: string;
  opportunity_number: string;
  name: string;
  
  customer_id?: string;
  lead_id?: string;
  
  stage: OpportunityStage;
  probability: number;
  expected_revenue: number;
  expected_close_date?: string;
  
  // Products
  items?: Array<{
    item_id: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  
  assigned_to?: string;
  
  competitors?: string[];
  
  won_reason?: string;
  lost_reason?: string;
  
  notes?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ==================== QUOTATION ====================

export interface Quotation {
  id: string;
  tenant_id: string;
  quotation_number: string;
  date: string;
  valid_until: string;
  revision_number: number;
  
  customer_id?: string;
  customer_name: string;
  customer_gstin?: string;
  opportunity_id?: string;
  
  billing_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
  };
  
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
  };
  
  lines: QuotationLine[];
  
  // Totals
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  round_off: number;
  total_amount: number;
  
  currency: string;
  
  // Terms
  payment_terms?: string;
  delivery_terms?: string;
  warranty_terms?: string;
  
  terms_and_conditions?: string;
  notes?: string;
  
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  
  converted_to_order_id?: string;
  
  assigned_to?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationLine {
  id: string;
  quotation_id: string;
  line_number: number;
  item_id: string;
  item_code: string;
  item_name: string;
  description?: string;
  hsn_code: string;
  
  quantity: number;
  uom_id: string;
  unit_price: number;
  
  discount_percent: number;
  discount_amount: number;
  
  taxable_amount: number;
  gst_rate: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  
  total: number;
}

// ==================== SALES ORDER ====================

export interface SalesOrder {
  id: string;
  tenant_id: string;
  order_number: string;
  date: string;
  delivery_date: string;
  
  customer_id: string;
  customer_name: string;
  customer_gstin?: string;
  
  quotation_id?: string;
  customer_po_number?: string;
  customer_po_date?: string;
  
  billing_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
  };
  
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
    gstin?: string;
  };
  
  lines: SalesOrderLine[];
  
  // Totals
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  tcs_amount: number;
  round_off: number;
  total_amount: number;
  
  currency: string;
  exchange_rate: number;
  
  // Credit check
  credit_limit_check_passed: boolean;
  credit_override_by?: string;
  
  // Terms
  payment_terms?: string;
  delivery_terms?: string;
  
  notes?: string;
  internal_notes?: string;
  
  status: 'draft' | 'confirmed' | 'processing' | 'partial_delivered' | 'delivered' | 'invoiced' | 'cancelled';
  
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Fulfillment
  warehouse_id?: string;
  
  sales_person_id?: string;
  
  approved_by?: string;
  approved_at?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderLine {
  id: string;
  order_id: string;
  line_number: number;
  item_id: string;
  item_code: string;
  item_name: string;
  description?: string;
  hsn_code: string;
  
  quantity: number;
  uom_id: string;
  unit_price: number;
  
  discount_percent: number;
  discount_amount: number;
  
  taxable_amount: number;
  gst_rate: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  
  total: number;
  
  // Fulfillment tracking
  delivered_qty: number;
  pending_qty: number;
  invoiced_qty: number;
  
  warehouse_id: string;
  promised_date?: string;
  
  status: 'pending' | 'partial' | 'delivered' | 'invoiced' | 'cancelled';
}

// ==================== DELIVERY NOTE ====================

export interface DeliveryNote {
  id: string;
  tenant_id: string;
  delivery_number: string;
  date: string;
  
  customer_id: string;
  customer_name: string;
  
  sales_order_id?: string;
  sales_order_number?: string;
  
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
  };
  
  // Transport
  transporter_id?: string;
  transporter_name?: string;
  vehicle_number?: string;
  lr_number?: string;
  lr_date?: string;
  
  // E-Way Bill
  eway_bill_number?: string;
  eway_bill_date?: string;
  eway_bill_valid_until?: string;
  
  warehouse_id: string;
  
  lines: DeliveryNoteLine[];
  
  status: 'draft' | 'packed' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';
  
  delivered_at?: string;
  received_by?: string;
  
  remarks?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryNoteLine {
  id: string;
  delivery_id: string;
  line_number: number;
  
  so_line_id?: string;
  item_id: string;
  item_code: string;
  item_name: string;
  
  ordered_qty: number;
  delivered_qty: number;
  
  uom_id: string;
  
  // Tracking
  batch_number?: string;
  serial_numbers?: string[];
  
  location_id: string;
  
  stock_move_id?: string;
}

// ==================== SALES INVOICE ====================

export interface SalesInvoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  
  customer_id: string;
  customer_name: string;
  customer_gstin?: string;
  customer_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
  };
  
  // Ship to (for GST place of supply)
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
    gstin?: string;
  };
  
  // References
  sales_order_id?: string;
  delivery_note_id?: string;
  customer_po_number?: string;
  
  // GST Classification
  supply_type: 'b2b' | 'b2c_large' | 'b2c_small' | 'sez_with_payment' | 'sez_without_payment' | 'export_with_payment' | 'export_without_payment' | 'nil_rated' | 'exempt';
  place_of_supply: string; // State code
  reverse_charge: boolean;
  
  // E-Invoice
  irn?: string;
  irn_date?: string;
  ack_number?: string;
  ack_date?: string;
  signed_invoice?: string;
  signed_qr_code?: string;
  e_invoice_status?: 'pending' | 'generated' | 'cancelled';
  
  lines: SalesInvoiceLine[];
  
  // Totals
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  
  // TCS (for high value B2C)
  tcs_applicable: boolean;
  tcs_rate?: number;
  tcs_amount: number;
  
  round_off: number;
  total_amount: number;
  total_in_words: string;
  
  currency: string;
  exchange_rate: number;
  base_total_amount: number;
  
  // Payment
  payment_terms_days: number;
  received_amount: number;
  balance_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  
  // Bank for payment
  bank_details?: {
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    branch: string;
  };
  
  notes?: string;
  terms_and_conditions?: string;
  
  status: 'draft' | 'posted' | 'cancelled';
  
  journal_entry_id?: string;
  
  sales_person_id?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SalesInvoiceLine {
  id: string;
  invoice_id: string;
  line_number: number;
  
  dn_line_id?: string;
  so_line_id?: string;
  
  item_id: string;
  item_code: string;
  item_name: string;
  description?: string;
  hsn_code: string;
  
  quantity: number;
  uom_id: string;
  unit_price: number;
  
  discount_percent: number;
  discount_amount: number;
  
  taxable_amount: number;
  gst_rate: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  
  total: number;
  
  revenue_account_id: string;
  cost_center_id?: string;
}

// ==================== CREDIT NOTE (SALES RETURN) ====================

export interface CreditNote {
  id: string;
  tenant_id: string;
  credit_note_number: string;
  date: string;
  
  customer_id: string;
  customer_name: string;
  customer_gstin?: string;
  
  // Original invoice
  original_invoice_id: string;
  original_invoice_number: string;
  original_invoice_date: string;
  
  reason: 'return' | 'discount' | 'correction' | 'other';
  reason_description?: string;
  
  // E-Invoice for credit note
  irn?: string;
  irn_date?: string;
  
  lines: CreditNoteLine[];
  
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
  
  status: 'draft' | 'posted' | 'applied' | 'cancelled';
  
  journal_entry_id?: string;
  stock_move_id?: string;
  
  created_by: string;
  created_at: string;
}

export interface CreditNoteLine {
  id: string;
  credit_note_id: string;
  line_number: number;
  
  original_invoice_line_id?: string;
  
  item_id: string;
  item_code: string;
  item_name: string;
  hsn_code: string;
  
  quantity: number;
  uom_id: string;
  unit_price: number;
  
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  
  total: number;
  
  reason?: string;
}

// ==================== CUSTOMER RECEIPT ====================

export interface CustomerReceipt {
  id: string;
  tenant_id: string;
  receipt_number: string;
  date: string;
  
  customer_id: string;
  customer_name: string;
  
  payment_mode: 'cash' | 'cheque' | 'neft' | 'rtgs' | 'upi' | 'card' | 'dd';
  
  bank_account_id?: string;
  cheque_number?: string;
  cheque_date?: string;
  transaction_reference?: string;
  
  amount: number;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  
  // Allocation
  allocations: ReceiptAllocation[];
  unallocated_amount: number;
  
  // TDS deducted by customer
  tds_deducted: number;
  tds_certificate_number?: string;
  
  narration?: string;
  
  status: 'draft' | 'posted' | 'bounced' | 'cancelled';
  
  journal_entry_id?: string;
  
  created_by: string;
  created_at: string;
}

export interface ReceiptAllocation {
  id: string;
  receipt_id: string;
  invoice_id: string;
  invoice_number: string;
  invoice_amount: number;
  allocated_amount: number;
  tds_amount: number;
}

// ==================== CUSTOMER ADVANCE ====================

export interface CustomerAdvance {
  id: string;
  tenant_id: string;
  advance_number: string;
  date: string;
  
  customer_id: string;
  sales_order_id?: string;
  
  amount: number;
  utilized_amount: number;
  balance_amount: number;
  
  payment_mode: string;
  bank_account_id?: string;
  reference?: string;
  
  status: 'active' | 'utilized' | 'refunded';
  
  journal_entry_id?: string;
  
  created_at: string;
}

