/**
 * SA ERP - GST & Statutory Compliance Types
 * E-Invoice, E-Way Bill, GSTR Returns
 */

// ==================== GST CONFIGURATION ====================

export interface GSTSettings {
  id: string;
  tenant_id: string;
  
  gstin: string;
  legal_name: string;
  trade_name?: string;
  
  registration_type: 'regular' | 'composition' | 'unregistered' | 'casual' | 'nri' | 'sez';
  
  // API credentials (encrypted)
  gsp_provider: 'cleartax' | 'mastersindia' | 'cygnet' | 'vayana' | 'custom';
  api_username?: string;
  api_password_encrypted?: string;
  api_client_id?: string;
  api_client_secret_encrypted?: string;
  
  // E-Invoice
  e_invoice_enabled: boolean;
  e_invoice_applicable_from?: string;
  irp_credentials?: {
    username: string;
    password_encrypted: string;
  };
  
  // E-Way Bill
  eway_bill_enabled: boolean;
  eway_bill_applicable_from?: string;
  eway_bill_credentials?: {
    username: string;
    password_encrypted: string;
  };
  
  // Auto settings
  auto_generate_e_invoice: boolean;
  auto_generate_eway_bill: boolean;
  eway_bill_threshold: number; // Default 50000
  
  created_at: string;
  updated_at: string;
}

// ==================== HSN / SAC MASTER ====================

export interface HSNCode {
  id: string;
  code: string;
  description: string;
  chapter: string;
  gst_rate: number;
  cess_rate?: number;
  effective_from: string;
  effective_to?: string;
  is_service: boolean;
}

// ==================== GST RATES ====================

export interface GSTRate {
  id: string;
  tenant_id: string;
  name: string;
  
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate?: number;
  
  hsn_codes?: string[];
  
  is_default: boolean;
  is_active: boolean;
}

// ==================== E-INVOICE ====================

export type EInvoiceStatus = 
  | 'pending'
  | 'generated'
  | 'cancelled'
  | 'error';

export interface EInvoice {
  id: string;
  tenant_id: string;
  
  // Reference
  invoice_type: 'sales' | 'credit_note' | 'debit_note';
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  
  // Seller
  seller_gstin: string;
  seller_legal_name: string;
  seller_trade_name?: string;
  seller_address: {
    building?: string;
    floor?: string;
    street?: string;
    location: string;
    district: string;
    state_code: string;
    pincode: string;
  };
  
  // Buyer
  buyer_gstin?: string;
  buyer_legal_name: string;
  buyer_trade_name?: string;
  buyer_pos: string; // Place of supply state code
  buyer_address: {
    building?: string;
    floor?: string;
    street?: string;
    location: string;
    district: string;
    state_code: string;
    pincode: string;
  };
  
  // Ship to (if different)
  ship_to_gstin?: string;
  ship_to_legal_name?: string;
  ship_to_address?: {
    building?: string;
    floor?: string;
    street?: string;
    location: string;
    district: string;
    state_code: string;
    pincode: string;
  };
  
  // Document details
  document_type: 'INV' | 'CRN' | 'DBN';
  supply_type: 'B2B' | 'B2C' | 'SEZWP' | 'SEZWOP' | 'EXPWP' | 'EXPWOP' | 'DEXP';
  reverse_charge: boolean;
  
  // Values
  total_assessable_value: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_cess: number;
  total_invoice_value: number;
  
  // Items
  items: EInvoiceItem[];
  
  // IRP Response
  irn?: string;
  irn_date?: string;
  ack_number?: string;
  ack_date?: string;
  signed_invoice?: string;
  signed_qr_code?: string;
  
  // Cancellation
  cancel_reason?: string;
  cancel_remark?: string;
  cancelled_at?: string;
  
  // Errors
  error_code?: string;
  error_message?: string;
  
  status: EInvoiceStatus;
  
  // API tracking
  request_payload?: string;
  response_payload?: string;
  
  generated_by?: string;
  generated_at?: string;
  created_at: string;
}

export interface EInvoiceItem {
  sl_no: number;
  product_description: string;
  is_service: boolean;
  hsn_code: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  other_charges?: number;
  assessable_value: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_rate?: number;
  cess_amount: number;
  total_item_value: number;
}

// ==================== E-WAY BILL ====================

export type EwayBillStatus = 
  | 'pending'
  | 'generated'
  | 'cancelled'
  | 'extended'
  | 'updated'
  | 'error';

export interface EwayBill {
  id: string;
  tenant_id: string;
  
  // Reference
  reference_type: 'sales_invoice' | 'delivery_note' | 'purchase_invoice' | 'job_work_challan' | 'transfer';
  reference_id: string;
  reference_number: string;
  
  // Document
  document_type: 'invoice' | 'bill' | 'challan' | 'credit_note' | 'others';
  document_number: string;
  document_date: string;
  
  // Transaction
  supply_type: 'outward' | 'inward';
  sub_supply_type: 'supply' | 'export' | 'job_work' | 'skd_ckd' | 'recipient_not_known' | 'line_sales' | 'sales_return' | 'exhibition' | 'others';
  
  // From
  from_gstin: string;
  from_trade_name: string;
  from_address: string;
  from_place: string;
  from_pincode: string;
  from_state_code: string;
  
  // To
  to_gstin?: string;
  to_trade_name: string;
  to_address: string;
  to_place: string;
  to_pincode: string;
  to_state_code: string;
  
  // Transport
  transporter_id?: string;
  transporter_name?: string;
  transport_mode: 'road' | 'rail' | 'air' | 'ship';
  transport_doc_number?: string;
  transport_doc_date?: string;
  vehicle_number?: string;
  vehicle_type?: 'regular' | 'over_dimensional_cargo';
  distance_km: number;
  
  // Values
  total_value: number;
  hsn_code: string;
  cgst_value: number;
  sgst_value: number;
  igst_value: number;
  cess_value: number;
  total_invoice_value: number;
  
  // Items
  items: EwayBillItem[];
  
  // Response
  eway_bill_number?: string;
  eway_bill_date?: string;
  valid_from?: string;
  valid_until?: string;
  
  // Extensions
  extensions?: Array<{
    extended_date: string;
    from_place: string;
    from_state: string;
    remaining_distance: number;
    new_valid_until: string;
    reason: string;
    remarks?: string;
  }>;
  
  // Vehicle updates
  vehicle_updates?: Array<{
    updated_date: string;
    vehicle_number: string;
    transport_mode: string;
    reason: string;
    remarks?: string;
  }>;
  
  // Cancellation
  cancel_reason?: string;
  cancel_remark?: string;
  cancelled_at?: string;
  
  // Errors
  error_code?: string;
  error_message?: string;
  
  status: EwayBillStatus;
  
  // API tracking
  request_payload?: string;
  response_payload?: string;
  
  generated_by?: string;
  generated_at?: string;
  created_at: string;
}

export interface EwayBillItem {
  sl_no: number;
  product_name: string;
  product_description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate?: number;
  taxable_amount: number;
}

// ==================== GSTR-1 (OUTWARD SUPPLIES) ====================

export interface GSTR1 {
  id: string;
  tenant_id: string;
  
  return_period: string; // MMYYYY format
  gstin: string;
  
  // B2B Invoices
  b2b_invoices: GSTR1_B2B[];
  
  // B2C Large (interstate > 2.5L)
  b2cl_invoices: GSTR1_B2CL[];
  
  // B2C Small (aggregated)
  b2cs_summary: GSTR1_B2CS[];
  
  // Credit/Debit Notes
  cdn: GSTR1_CDN[];
  
  // Exports
  exports: GSTR1_EXP[];
  
  // Nil rated, exempt, non-GST
  nil_rated: GSTR1_NIL[];
  
  // HSN Summary
  hsn_summary: GSTR1_HSN[];
  
  // Document summary
  doc_summary: GSTR1_DOC[];
  
  // Totals
  total_taxable_value: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_cess: number;
  
  status: 'draft' | 'prepared' | 'filed' | 'accepted';
  
  filed_arn?: string;
  filed_at?: string;
  
  prepared_by: string;
  prepared_at: string;
}

export interface GSTR1_B2B {
  buyer_gstin: string;
  buyer_name: string;
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  pos: string; // Place of supply
  reverse_charge: boolean;
  invoice_type: 'regular' | 'sez_with_payment' | 'sez_without_payment' | 'deemed_export';
  e_commerce_gstin?: string;
  items: Array<{
    rate: number;
    taxable_value: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
  }>;
}

export interface GSTR1_B2CL {
  pos: string;
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  items: Array<{
    rate: number;
    taxable_value: number;
    igst: number;
    cess: number;
  }>;
}

export interface GSTR1_B2CS {
  pos: string;
  supply_type: 'intra' | 'inter';
  rate: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  e_commerce_gstin?: string;
}

export interface GSTR1_CDN {
  buyer_gstin?: string;
  buyer_name?: string;
  note_type: 'credit' | 'debit';
  note_number: string;
  note_date: string;
  original_invoice_number: string;
  original_invoice_date: string;
  reason: string;
  pos?: string;
  pre_gst: boolean;
  items: Array<{
    rate: number;
    taxable_value: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
  }>;
}

export interface GSTR1_EXP {
  export_type: 'with_payment' | 'without_payment';
  invoice_number: string;
  invoice_date: string;
  port_code?: string;
  shipping_bill_number?: string;
  shipping_bill_date?: string;
  items: Array<{
    rate: number;
    taxable_value: number;
    igst: number;
    cess: number;
  }>;
}

export interface GSTR1_NIL {
  supply_type: 'intra' | 'inter';
  nil_rated_amount: number;
  exempt_amount: number;
  non_gst_amount: number;
}

export interface GSTR1_HSN {
  hsn_code: string;
  description: string;
  uqc: string; // Unit quantity code
  total_quantity: number;
  total_value: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
}

export interface GSTR1_DOC {
  doc_type: 'invoices' | 'delivery_challans' | 'credit_notes' | 'debit_notes' | 'receipt_vouchers';
  from_number: string;
  to_number: string;
  total_issued: number;
  total_cancelled: number;
  net_issued: number;
}

// ==================== GSTR-2A/2B (ITC) ====================

export interface GSTR2A_Import {
  id: string;
  tenant_id: string;
  return_period: string;
  gstin: string;
  
  imported_at: string;
  
  b2b_invoices: Array<{
    supplier_gstin: string;
    supplier_name: string;
    invoice_number: string;
    invoice_date: string;
    invoice_value: number;
    pos: string;
    reverse_charge: boolean;
    invoice_type: string;
    items: Array<{
      rate: number;
      taxable_value: number;
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
    }>;
    // Reconciliation
    matched_invoice_id?: string;
    match_status: 'matched' | 'unmatched' | 'mismatch' | 'not_in_books';
    mismatch_details?: string;
  }>;
  
  cdn: Array<{
    supplier_gstin: string;
    note_type: 'credit' | 'debit';
    note_number: string;
    note_date: string;
    original_invoice_number?: string;
    items: Array<{
      rate: number;
      taxable_value: number;
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
    }>;
  }>;
}

export interface ITCReconciliation {
  id: string;
  tenant_id: string;
  return_period: string;
  
  // Books summary
  books_itc_cgst: number;
  books_itc_sgst: number;
  books_itc_igst: number;
  books_itc_cess: number;
  
  // 2A/2B summary
  portal_itc_cgst: number;
  portal_itc_sgst: number;
  portal_itc_igst: number;
  portal_itc_cess: number;
  
  // Variance
  variance_cgst: number;
  variance_sgst: number;
  variance_igst: number;
  variance_cess: number;
  
  // Details
  matched_count: number;
  unmatched_in_books_count: number;
  unmatched_in_portal_count: number;
  mismatch_count: number;
  
  reconciled_by: string;
  reconciled_at: string;
}

// ==================== TDS ====================

export interface TDSSection {
  id: string;
  section: string; // e.g., "194C", "194J"
  description: string;
  individual_rate: number;
  company_rate: number;
  threshold: number;
  is_active: boolean;
}

export interface TDSDeduction {
  id: string;
  tenant_id: string;
  
  deductee_type: 'vendor' | 'customer' | 'employee' | 'other';
  deductee_id: string;
  deductee_name: string;
  deductee_pan: string;
  
  section: string;
  
  // Transaction reference
  reference_type: 'purchase_invoice' | 'payment' | 'salary';
  reference_id: string;
  reference_number: string;
  reference_date: string;
  
  gross_amount: number;
  tds_rate: number;
  tds_amount: number;
  surcharge?: number;
  cess?: number;
  total_tds: number;
  
  // Challan
  challan_number?: string;
  challan_date?: string;
  bsr_code?: string;
  
  // Certificate
  certificate_number?: string;
  certificate_issued: boolean;
  
  status: 'pending' | 'deposited' | 'filed';
  
  fiscal_year: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  
  created_at: string;
}

export interface TDSReturn {
  id: string;
  tenant_id: string;
  
  form_type: '24Q' | '26Q' | '27Q' | '27EQ';
  fiscal_year: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  
  tan: string;
  deductor_name: string;
  
  entries: TDSDeduction[];
  
  total_tds_deducted: number;
  total_tds_deposited: number;
  
  // Filing
  provisional_receipt_number?: string;
  filed_at?: string;
  
  status: 'draft' | 'generated' | 'filed';
  
  prepared_by: string;
  created_at: string;
}

// ==================== TCS ====================

export interface TCSDeduction {
  id: string;
  tenant_id: string;
  
  collector_type: 'customer';
  collector_id: string;
  collector_name: string;
  collector_pan: string;
  
  section: string; // e.g., "206C(1H)"
  
  reference_type: 'sales_invoice' | 'receipt';
  reference_id: string;
  reference_number: string;
  reference_date: string;
  
  sale_amount: number;
  tcs_rate: number;
  tcs_amount: number;
  
  challan_number?: string;
  challan_date?: string;
  
  status: 'pending' | 'deposited' | 'filed';
  
  fiscal_year: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  
  created_at: string;
}

