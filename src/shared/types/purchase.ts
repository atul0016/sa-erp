/**
 * SA ERP - Purchase Types
 * Procurement & Accounts Payable
 */

// ==================== VENDOR / SUPPLIER ====================

export interface Vendor {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  trade_name?: string;
  vendor_type: 'regular' | 'job_worker' | 'transporter' | 'service_provider';
  
  // GST Details
  gstin?: string;
  gst_registration_type: 'regular' | 'composition' | 'unregistered' | 'overseas';
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
  credit_limit?: number;
  currency: string;
  price_list_id?: string;
  
  // Bank details for payments
  bank_accounts?: Array<{
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    branch: string;
    is_default: boolean;
  }>;
  
  // GL Account mapping
  payable_account_id: string;
  expense_account_id?: string;
  advance_account_id?: string;
  
  // Rating
  rating?: number;
  delivery_rating?: number;
  quality_rating?: number;
  
  // TDS
  tds_applicable: boolean;
  tds_section?: string;
  tds_rate?: number;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== PURCHASE REQUEST ====================

export interface PurchaseRequest {
  id: string;
  tenant_id: string;
  request_number: string;
  date: string;
  required_date: string;
  
  requested_by: string;
  department?: string;
  
  lines: PurchaseRequestLine[];
  
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted';
  
  remarks?: string;
  approved_by?: string;
  approved_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequestLine {
  id: string;
  request_id: string;
  line_number: number;
  item_id: string;
  description: string;
  quantity: number;
  uom_id: string;
  estimated_price?: number;
  required_date: string;
  suggested_vendor_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'ordered';
}

// ==================== REQUEST FOR QUOTATION ====================

export interface RFQ {
  id: string;
  tenant_id: string;
  rfq_number: string;
  date: string;
  valid_until: string;
  
  purchase_request_id?: string;
  
  vendor_ids: string[]; // Multiple vendors
  
  lines: RFQLine[];
  
  terms_and_conditions?: string;
  
  status: 'draft' | 'sent' | 'received' | 'closed';
  
  created_by: string;
  created_at: string;
}

export interface RFQLine {
  id: string;
  rfq_id: string;
  line_number: number;
  item_id: string;
  description: string;
  quantity: number;
  uom_id: string;
  target_price?: number;
  specifications?: string;
}

export interface VendorQuotation {
  id: string;
  tenant_id: string;
  quotation_number: string;
  rfq_id: string;
  vendor_id: string;
  date: string;
  valid_until: string;
  
  lines: VendorQuotationLine[];
  
  total_amount: number;
  currency: string;
  payment_terms?: string;
  delivery_terms?: string;
  
  status: 'received' | 'under_review' | 'accepted' | 'rejected';
  
  created_at: string;
}

export interface VendorQuotationLine {
  id: string;
  quotation_id: string;
  rfq_line_id: string;
  item_id: string;
  quantity: number;
  uom_id: string;
  unit_price: number;
  discount_percent?: number;
  tax_amount: number;
  total: number;
  lead_time_days?: number;
  remarks?: string;
}

// ==================== PURCHASE ORDER ====================

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  order_number: string;
  date: string;
  expected_date: string;
  
  vendor_id: string;
  vendor_name: string;
  vendor_gstin?: string;
  
  vendor_quotation_id?: string;
  
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
  };
  
  lines: PurchaseOrderLine[];
  
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
  
  // Terms
  payment_terms?: string;
  delivery_terms?: string;
  warranty_terms?: string;
  
  notes?: string;
  internal_notes?: string;
  
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'acknowledged' | 'partial' | 'completed' | 'cancelled';
  
  approved_by?: string;
  approved_at?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderLine {
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
  
  received_qty: number;
  pending_qty: number;
  billed_qty: number;
  
  warehouse_id: string;
  expected_date?: string;
  
  status: 'pending' | 'partial' | 'received' | 'cancelled';
}

// ==================== GOODS RECEIPT NOTE (GRN) ====================

export interface GoodsReceiptNote {
  id: string;
  tenant_id: string;
  grn_number: string;
  date: string;
  
  vendor_id: string;
  vendor_name: string;
  
  purchase_order_id?: string;
  purchase_order_number?: string;
  
  // Vendor document reference
  vendor_invoice_number?: string;
  vendor_invoice_date?: string;
  delivery_note_number?: string;
  
  warehouse_id: string;
  
  lines: GRNLine[];
  
  status: 'draft' | 'pending_qc' | 'qc_passed' | 'qc_failed' | 'partial_accept' | 'completed';
  
  remarks?: string;
  
  received_by: string;
  created_at: string;
  updated_at: string;
}

export interface GRNLine {
  id: string;
  grn_id: string;
  line_number: number;
  
  po_line_id?: string;
  item_id: string;
  item_code: string;
  item_name: string;
  
  ordered_qty: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  
  uom_id: string;
  
  // Tracking
  batch_number?: string;
  serial_numbers?: string[];
  manufacturing_date?: string;
  expiry_date?: string;
  
  // Costing
  unit_cost: number;
  landing_cost?: number; // Including freight, etc.
  total_cost: number;
  
  location_id: string;
  
  // QC
  qc_status?: 'pending' | 'passed' | 'failed' | 'partial';
  qc_remarks?: string;
  qc_by?: string;
  qc_at?: string;
  
  stock_move_id?: string;
}

// ==================== PURCHASE INVOICE ====================

export interface PurchaseInvoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  
  vendor_id: string;
  vendor_name: string;
  vendor_gstin?: string;
  vendor_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
  };
  
  // References
  purchase_order_id?: string;
  grn_id?: string;
  vendor_invoice_number: string;
  vendor_invoice_date: string;
  
  // Supply type for GST
  supply_type: 'b2b' | 'b2c' | 'sez' | 'import' | 'nil_rated' | 'exempt';
  reverse_charge: boolean;
  
  lines: PurchaseInvoiceLine[];
  
  // Totals
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  
  // TDS
  tds_applicable: boolean;
  tds_section?: string;
  tds_rate?: number;
  tds_amount: number;
  
  // TCS
  tcs_applicable: boolean;
  tcs_rate?: number;
  tcs_amount: number;
  
  round_off: number;
  total_amount: number;
  
  currency: string;
  exchange_rate: number;
  base_total_amount: number;
  
  // Payment
  payment_terms_days: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  
  // ITC
  itc_eligible: boolean;
  itc_claimed: boolean;
  
  notes?: string;
  
  status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'cancelled';
  
  // Three-way match
  three_way_match_status?: 'pending' | 'matched' | 'variance';
  
  journal_entry_id?: string;
  
  approved_by?: string;
  approved_at?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseInvoiceLine {
  id: string;
  invoice_id: string;
  line_number: number;
  
  grn_line_id?: string;
  po_line_id?: string;
  
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
  
  expense_account_id: string;
  cost_center_id?: string;
  
  // ITC eligibility per line
  itc_eligible: boolean;
  itc_category?: 'input' | 'input_service' | 'capital_goods';
}

// ==================== PURCHASE RETURN / DEBIT NOTE ====================

export interface PurchaseReturn {
  id: string;
  tenant_id: string;
  return_number: string;
  date: string;
  
  vendor_id: string;
  vendor_name: string;
  
  purchase_invoice_id: string;
  purchase_invoice_number: string;
  
  reason: string;
  
  lines: PurchaseReturnLine[];
  
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  
  status: 'draft' | 'approved' | 'posted' | 'cancelled';
  
  journal_entry_id?: string;
  stock_move_id?: string;
  
  created_by: string;
  created_at: string;
}

export interface PurchaseReturnLine {
  id: string;
  return_id: string;
  line_number: number;
  invoice_line_id: string;
  item_id: string;
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

// ==================== PAYMENT TO VENDOR ====================

export interface VendorPayment {
  id: string;
  tenant_id: string;
  payment_number: string;
  date: string;
  
  vendor_id: string;
  vendor_name: string;
  
  payment_mode: 'cash' | 'cheque' | 'neft' | 'rtgs' | 'upi' | 'dd' | 'lc';
  
  bank_account_id?: string;
  cheque_number?: string;
  cheque_date?: string;
  transaction_reference?: string;
  
  amount: number;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  
  // TDS deduction
  tds_amount: number;
  net_amount: number;
  
  // Allocation
  allocations: PaymentAllocation[];
  unallocated_amount: number;
  
  narration?: string;
  
  status: 'draft' | 'approved' | 'posted' | 'bounced' | 'cancelled';
  
  journal_entry_id?: string;
  
  created_by: string;
  created_at: string;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string;
  invoice_number: string;
  invoice_amount: number;
  allocated_amount: number;
  tds_amount: number;
}

// ==================== VENDOR ADVANCE ====================

export interface VendorAdvance {
  id: string;
  tenant_id: string;
  advance_number: string;
  date: string;
  
  vendor_id: string;
  purchase_order_id?: string;
  
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

