/**
 * SA ERP - Manufacturing Types
 * Production, MRP, Shop Floor Control
 */

// ==================== BILL OF MATERIALS (BOM) ====================

export type BOMType = 'standard' | 'phantom' | 'subcontracting';

export interface BillOfMaterials {
  id: string;
  tenant_id: string;
  bom_number: string;
  name: string;
  bom_type: BOMType;
  
  // Finished goods
  item_id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  uom_id: string;
  
  // Alternate BOMs
  is_default: boolean;
  is_active: boolean;
  
  // Versioning
  version: number;
  effective_from?: string;
  effective_to?: string;
  
  // Components
  components: BOMComponent[];
  
  // Operations/Routing
  operations: BOMOperation[];
  
  // Costing
  material_cost: number;
  operation_cost: number;
  overhead_cost: number;
  total_cost: number;
  
  // Scrap
  scrap_percent?: number;
  
  remarks?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BOMComponent {
  id: string;
  bom_id: string;
  line_number: number;
  
  component_item_id: string;
  component_item_code: string;
  component_item_name: string;
  
  quantity: number;
  uom_id: string;
  
  // Per unit of FG
  qty_per_unit: number;
  
  // Scrap/Wastage
  scrap_percent?: number;
  
  // Substitute
  is_substitute: boolean;
  substitute_for?: string;
  
  // Warehouse for consumption
  warehouse_id?: string;
  
  // Cost
  unit_cost?: number;
  total_cost?: number;
  
  // For phantom BOMs
  has_sub_bom: boolean;
  sub_bom_id?: string;
  
  remarks?: string;
}

export interface BOMOperation {
  id: string;
  bom_id: string;
  operation_number: number;
  
  work_center_id: string;
  work_center_name: string;
  
  operation_name: string;
  description?: string;
  
  // Time
  setup_time: number; // minutes
  run_time: number; // minutes per unit
  
  // For batch production
  batch_size?: number;
  
  // Subcontracting
  is_subcontracted: boolean;
  subcontractor_id?: string;
  
  // Cost
  operation_cost: number;
  
  // Quality
  qc_required: boolean;
  qc_parameters?: string[];
}

// ==================== WORK CENTERS ====================

export interface WorkCenter {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  
  work_center_type: 'machine' | 'labor' | 'both';
  
  // Location
  warehouse_id?: string;
  department?: string;
  
  // Capacity
  capacity: number;
  capacity_uom: 'units_per_hour' | 'hours_per_day';
  available_hours_per_day: number;
  efficiency_percent: number;
  
  // Costing
  hourly_rate: number;
  setup_rate?: number;
  overhead_rate?: number;
  
  // Maintenance
  last_maintenance?: string;
  next_maintenance?: string;
  
  is_active: boolean;
  created_at: string;
}

// ==================== PRODUCTION ORDER ====================

export type ProductionOrderStatus = 
  | 'draft'
  | 'planned'
  | 'released'
  | 'in_progress'
  | 'completed'
  | 'closed'
  | 'cancelled';

export interface ProductionOrder {
  id: string;
  tenant_id: string;
  order_number: string;
  
  // Source
  source_type?: 'manual' | 'sales_order' | 'mrp';
  source_id?: string;
  
  // What to produce
  item_id: string;
  item_code: string;
  item_name: string;
  bom_id: string;
  bom_version: number;
  
  planned_qty: number;
  completed_qty: number;
  scrapped_qty: number;
  uom_id: string;
  
  // When
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  
  // Where
  warehouse_id: string;
  wip_location_id: string;
  fg_location_id: string;
  
  // Cost
  planned_material_cost: number;
  planned_operation_cost: number;
  planned_overhead_cost: number;
  planned_total_cost: number;
  
  actual_material_cost: number;
  actual_operation_cost: number;
  actual_overhead_cost: number;
  actual_total_cost: number;
  
  variance: number;
  
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: ProductionOrderStatus;
  
  // Components
  components: ProductionOrderComponent[];
  
  // Operations
  operations: ProductionOrderOperation[];
  
  // Quality
  qc_status?: 'pending' | 'passed' | 'failed' | 'partial';
  
  remarks?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionOrderComponent {
  id: string;
  production_order_id: string;
  line_number: number;
  
  bom_component_id?: string;
  
  item_id: string;
  item_code: string;
  item_name: string;
  
  required_qty: number;
  issued_qty: number;
  consumed_qty: number;
  returned_qty: number;
  uom_id: string;
  
  warehouse_id: string;
  
  // Batch/Serial
  batch_id?: string;
  serial_numbers?: string[];
  
  // Cost
  unit_cost: number;
  total_cost: number;
  
  status: 'pending' | 'partial_issued' | 'issued' | 'consumed';
}

export interface ProductionOrderOperation {
  id: string;
  production_order_id: string;
  operation_number: number;
  
  bom_operation_id?: string;
  
  work_center_id: string;
  work_center_name: string;
  operation_name: string;
  
  // Time
  planned_setup_time: number;
  planned_run_time: number;
  actual_setup_time: number;
  actual_run_time: number;
  
  // Quantity
  planned_qty: number;
  completed_qty: number;
  rejected_qty: number;
  
  // Operators
  operators?: Array<{
    employee_id: string;
    name: string;
    hours_worked: number;
  }>;
  
  // Cost
  planned_cost: number;
  actual_cost: number;
  
  // Subcontracting
  is_subcontracted: boolean;
  subcontractor_id?: string;
  job_work_challan_id?: string;
  
  // Schedule
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  
  // QC
  qc_required: boolean;
  qc_status?: 'pending' | 'passed' | 'failed';
  qc_remarks?: string;
  
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

// ==================== MATERIAL ISSUE ====================

export interface MaterialIssue {
  id: string;
  tenant_id: string;
  issue_number: string;
  date: string;
  
  production_order_id: string;
  production_order_number: string;
  
  warehouse_id: string;
  
  lines: MaterialIssueLine[];
  
  status: 'draft' | 'issued' | 'cancelled';
  
  issued_by: string;
  created_at: string;
}

export interface MaterialIssueLine {
  id: string;
  issue_id: string;
  line_number: number;
  
  po_component_id: string;
  item_id: string;
  item_code: string;
  item_name: string;
  
  required_qty: number;
  issued_qty: number;
  uom_id: string;
  
  from_location_id: string;
  batch_id?: string;
  serial_numbers?: string[];
  
  unit_cost: number;
  total_cost: number;
  
  stock_move_id?: string;
}

// ==================== PRODUCTION ENTRY / JOB CARD ====================

export interface ProductionEntry {
  id: string;
  tenant_id: string;
  entry_number: string;
  date: string;
  
  production_order_id: string;
  operation_id: string;
  work_center_id: string;
  
  // Shift
  shift?: string;
  
  // Operator
  employee_id?: string;
  employee_name?: string;
  
  // Time
  start_time: string;
  end_time: string;
  setup_time: number;
  run_time: number;
  downtime: number;
  downtime_reason?: string;
  
  // Quantity
  good_qty: number;
  rejected_qty: number;
  rework_qty: number;
  
  // QC
  qc_done: boolean;
  qc_parameters?: Record<string, unknown>;
  
  remarks?: string;
  
  created_by: string;
  created_at: string;
}

// ==================== FINISHED GOODS RECEIPT ====================

export interface FGReceipt {
  id: string;
  tenant_id: string;
  receipt_number: string;
  date: string;
  
  production_order_id: string;
  production_order_number: string;
  
  item_id: string;
  item_code: string;
  item_name: string;
  
  quantity: number;
  uom_id: string;
  
  // Batch/Serial
  batch_number?: string;
  serial_numbers?: string[];
  manufacturing_date: string;
  expiry_date?: string;
  
  // Location
  warehouse_id: string;
  location_id: string;
  
  // Costing
  unit_cost: number;
  total_cost: number;
  
  // QC
  qc_status: 'pending' | 'passed' | 'failed';
  qc_by?: string;
  qc_at?: string;
  
  stock_move_id?: string;
  
  status: 'draft' | 'completed';
  
  created_by: string;
  created_at: string;
}

// ==================== MRP (MATERIAL REQUIREMENTS PLANNING) ====================

export interface MRPRun {
  id: string;
  tenant_id: string;
  run_number: string;
  run_date: string;
  
  // Parameters
  planning_horizon_days: number;
  from_date: string;
  to_date: string;
  
  // Filters
  item_ids?: string[];
  item_category_ids?: string[];
  warehouse_ids?: string[];
  
  // Options
  include_safety_stock: boolean;
  include_pending_orders: boolean;
  include_forecasts: boolean;
  
  // Results
  suggestions: MRPSuggestion[];
  
  status: 'draft' | 'running' | 'completed' | 'error';
  
  run_by: string;
  created_at: string;
  completed_at?: string;
}

export interface MRPSuggestion {
  id: string;
  mrp_run_id: string;
  
  item_id: string;
  item_code: string;
  item_name: string;
  
  suggestion_type: 'purchase_request' | 'production_order' | 'transfer';
  
  // Demand
  gross_requirement: number;
  scheduled_receipts: number;
  available_inventory: number;
  safety_stock: number;
  net_requirement: number;
  
  // Recommendation
  suggested_qty: number;
  suggested_date: string;
  
  // Source
  demand_source?: {
    type: 'sales_order' | 'production_order' | 'forecast' | 'safety_stock';
    id?: string;
    number?: string;
  };
  
  // Action taken
  action_taken?: 'accepted' | 'modified' | 'rejected';
  action_document_id?: string;
  action_document_number?: string;
  action_by?: string;
  action_at?: string;
}

// ==================== SUBCONTRACTING / JOB WORK ====================

export interface JobWorkChallan {
  id: string;
  tenant_id: string;
  challan_number: string;
  date: string;
  
  job_worker_id: string;
  job_worker_name: string;
  job_worker_gstin?: string;
  
  production_order_id?: string;
  operation_id?: string;
  
  // What is being sent
  items: JobWorkChallanItem[];
  
  // GST Section 143 compliance
  expected_return_date: string;
  extended_date?: string;
  
  status: 'draft' | 'sent' | 'partial_received' | 'completed' | 'cancelled';
  
  // E-Way Bill
  eway_bill_number?: string;
  
  // Transport
  vehicle_number?: string;
  transporter_name?: string;
  
  remarks?: string;
  
  stock_move_out_id?: string;
  
  created_by: string;
  created_at: string;
}

export interface JobWorkChallanItem {
  id: string;
  challan_id: string;
  line_number: number;
  
  item_id: string;
  item_code: string;
  item_name: string;
  hsn_code: string;
  
  sent_qty: number;
  uom_id: string;
  
  // Batch/Serial
  batch_number?: string;
  serial_numbers?: string[];
  
  // Expected output
  expected_output_item_id?: string;
  expected_output_qty?: number;
  expected_loss_percent?: number;
  
  // Actuals (filled on receipt)
  received_qty: number;
  scrap_qty: number;
  
  status: 'pending' | 'partial' | 'received';
}

export interface JobWorkReceipt {
  id: string;
  tenant_id: string;
  receipt_number: string;
  date: string;
  
  challan_id: string;
  challan_number: string;
  job_worker_id: string;
  job_worker_name: string;
  
  items: JobWorkReceiptItem[];
  
  // Processing charges
  processing_charges: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_charges: number;
  
  // Vendor invoice reference
  vendor_invoice_number?: string;
  vendor_invoice_date?: string;
  
  stock_move_in_id?: string;
  
  status: 'draft' | 'completed';
  
  created_by: string;
  created_at: string;
}

export interface JobWorkReceiptItem {
  id: string;
  receipt_id: string;
  line_number: number;
  
  challan_item_id: string;
  
  // Input item
  input_item_id: string;
  input_item_name: string;
  
  // Output item (could be same or different)
  output_item_id: string;
  output_item_code: string;
  output_item_name: string;
  
  sent_qty: number;
  received_qty: number;
  scrap_qty: number;
  uom_id: string;
  
  // Batch
  batch_number?: string;
  
  // QC
  qc_status?: 'pending' | 'passed' | 'failed';
}

// ==================== QUALITY CONTROL ====================

export type QCStage = 'incoming' | 'in_process' | 'final' | 'outgoing';

export interface QCInspection {
  id: string;
  tenant_id: string;
  inspection_number: string;
  date: string;
  
  qc_stage: QCStage;
  
  // Reference
  reference_type: 'grn' | 'production_order' | 'delivery_note' | 'job_work_receipt';
  reference_id: string;
  reference_number: string;
  
  item_id: string;
  item_code: string;
  item_name: string;
  
  // Quantities
  lot_qty: number;
  sample_qty: number;
  
  batch_number?: string;
  
  // Parameters
  parameters: QCParameter[];
  
  // AQL if applicable
  aql_level?: string;
  accept_qty?: number;
  reject_qty?: number;
  
  // Result
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'partial_accept';
  passed_qty: number;
  rejected_qty: number;
  
  disposition?: 'accept' | 'reject' | 'rework' | 'scrap' | 'use_as_is';
  
  inspector_id: string;
  inspector_name: string;
  inspected_at?: string;
  
  remarks?: string;
  
  created_at: string;
}

export interface QCParameter {
  id: string;
  inspection_id: string;
  
  parameter_name: string;
  specification: string;
  
  // Tolerance
  min_value?: number;
  max_value?: number;
  target_value?: number;
  uom?: string;
  
  // Result
  actual_value?: number;
  actual_text?: string;
  
  result: 'pass' | 'fail' | 'not_tested';
  
  remarks?: string;
}

// ==================== PRODUCTION PLANNING ====================

export interface ProductionSchedule {
  id: string;
  tenant_id: string;
  schedule_number: string;
  name: string;
  
  from_date: string;
  to_date: string;
  
  work_center_id?: string;
  
  entries: ProductionScheduleEntry[];
  
  status: 'draft' | 'published' | 'in_progress' | 'completed';
  
  created_by: string;
  created_at: string;
}

export interface ProductionScheduleEntry {
  id: string;
  schedule_id: string;
  
  production_order_id: string;
  production_order_number: string;
  operation_id: string;
  
  work_center_id: string;
  
  item_id: string;
  item_name: string;
  
  quantity: number;
  
  scheduled_start: string;
  scheduled_end: string;
  
  actual_start?: string;
  actual_end?: string;
  
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
}

